import { Router, Response } from "express";
import { prisma } from "../../config/database";
import { authenticate, AuthRequest } from "../../middleware/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response.utils";

const router = Router();
router.use(authenticate);

// Get current user's notifications
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user!.userId },
          { role: req.user!.role }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    sendSuccess(res, notifications);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Mark notification as read
router.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    sendSuccess(res, updated);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

// Mark all as read
router.post("/read-all", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: req.user!.userId },
          { role: req.user!.role }
        ]
      },
      data: { isRead: true }
    });
    sendSuccess(res, null, "All notifications marked as read");
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

export default router;

