import { prisma } from "../../config/database";
import bcrypt from "bcrypt";
import { logAudit } from "../../utils/audit.utils";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      customer: true
    }
  });

  if (!user) throw new Error("User not found");
  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    companyName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxNumber?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true }
  });

  if (!user) throw new Error("User not found");

  const updatedUser = await prisma.$transaction(async (tx) => {
    if (data.name) {
      await tx.user.update({
        where: { id: userId },
        data: { name: data.name }
      });
    }

    if (user.customer) {
      await tx.customer.update({
        where: { id: user.customer.id },
        data: {
          name: data.name || user.customer.name,
          companyName: data.companyName ?? user.customer.companyName,
          phone: data.phone ?? user.customer.phone,
          address: data.address ?? user.customer.address,
          city: data.city ?? user.customer.city,
          state: data.state ?? user.customer.state,
          country: data.country ?? user.customer.country,
          postalCode: data.postalCode ?? user.customer.postalCode,
          taxNumber: data.taxNumber ?? user.customer.taxNumber
        }
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customer: true
      }
    });
  });

  await logAudit({
    userId,
    action: "PROFILE_UPDATED",
    entity: "User",
    entityId: userId
  });

  return updatedUser;
}

export async function changePassword(
  userId: string,
  currentPass: string,
  newPass: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPass, user.password);
  if (!valid) throw new Error("Current password does not match");

  const hashedPassword = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  await logAudit({
    userId,
    action: "PASSWORD_CHANGED",
    entity: "User",
    entityId: userId
  });

  return { success: true, message: "Password updated successfully" };
}

// System Settings (Admin only)
export async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany();
  const map: Record<string, string> = {
    companyName: "Brightloop Software Inc.",
    companyEmail: "billing@brightloop.io",
    companyPhone: "+1 (800) 555-LOOP",
    companyAddress: "100 Innovation Boulevard, Tech Park, Suite 400",
    defaultCurrency: "USD",
    defaultPaymentTerms: "Net 30",
    billingHourUtc: "02:00",
    taxIdentificationNumber: "US-EIN-98-7654321"
  };

  for (const s of settings) {
    map[s.key] = s.value;
  }

  return map;
}

export async function updateSystemSettings(
  settings: Record<string, string>,
  actorId?: string
) {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
  }

  await logAudit({
    userId: actorId,
    action: "SYSTEM_SETTINGS_UPDATED",
    entity: "SystemSetting",
    details: settings
  });

  return getSystemSettings();
}

