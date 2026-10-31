import PDFDocument from "pdfkit";

export interface InvoicePdfData {
  number: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  status: string;
  currency: string;
  subtotal: number | string;
  taxTotal: number | string;
  discountTotal: number | string;
  total: number | string;
  amountPaid: number | string;
  notes?: string | null;
  customer: {
    name?: string | null;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    taxNumber?: string | null;
  };
  items: Array<{
    description?: string | null;
    productName?: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: number | string;
    taxRate: number | string;
    lineTotal: number | string;
  }>;
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // Header - Brightloop Software
    doc
      .fillColor("#172554")
      .fontSize(22)
      .text("BRIGHTLOOP SOFTWARE", 50, 45, { bold: true } as any)
      .fontSize(9)
      .fillColor("#64748B")
      .text("Enterprise Subscription Platform", 50, 70)
      .text("100 Innovation Boulevard, Tech Park", 50, 83)
      .text("billing@brightloop.io | +1 (800) 555-LOOP", 50, 96);

    // Invoice Title & Status
    doc
      .fillColor("#172554")
      .fontSize(20)
      .text("INVOICE", 400, 45, { align: "right" })
      .fontSize(10)
      .fillColor("#2563EB")
      .text(`#${data.number}`, 400, 70, { align: "right" })
      .fillColor("#475569")
      .text(`Status: ${data.status}`, 400, 85, { align: "right" });

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke();

    // Bill To & Dates
    const topDetailsY = 135;
    doc
      .fillColor("#64748B")
      .fontSize(9)
      .text("BILLED TO:", 50, topDetailsY)
      .fillColor("#0F172A")
      .fontSize(11)
      .text(data.customer.companyName || data.customer.name || "Valued Customer", 50, topDetailsY + 15)
      .fontSize(9)
      .fillColor("#475569");

    let addressY = topDetailsY + 30;
    if (data.customer.name && data.customer.companyName) {
      doc.text(`Attn: ${data.customer.name}`, 50, addressY);
      addressY += 13;
    }
    if (data.customer.address) {
      doc.text(data.customer.address, 50, addressY);
      addressY += 13;
    }
    if (data.customer.city || data.customer.state || data.customer.postalCode) {
      doc.text(
        `${data.customer.city || ""} ${data.customer.state || ""} ${data.customer.postalCode || ""}`.trim(),
        50,
        addressY
      );
      addressY += 13;
    }
    if (data.customer.taxNumber) {
      doc.text(`Tax ID: ${data.customer.taxNumber}`, 50, addressY);
      addressY += 13;
    }
    if (data.customer.email) {
      doc.text(`Email: ${data.customer.email}`, 50, addressY);
    }

    // Invoice Meta (right column)
    doc
      .fillColor("#64748B")
      .fontSize(9)
      .text("Invoice Date:", 350, topDetailsY)
      .fillColor("#0F172A")
      .text(new Date(data.invoiceDate).toLocaleDateString(), 450, topDetailsY, { align: "right" })
      .fillColor("#64748B")
      .text("Payment Due:", 350, topDetailsY + 18)
      .fillColor("#0F172A")
      .text(new Date(data.dueDate).toLocaleDateString(), 450, topDetailsY + 18, { align: "right" })
      .fillColor("#64748B")
      .text("Currency:", 350, topDetailsY + 36)
      .fillColor("#0F172A")
      .text(data.currency || "USD", 450, topDetailsY + 36, { align: "right" });

    // Table Header
    const tableTop = Math.max(addressY + 30, topDetailsY + 70);
    doc
      .rect(50, tableTop, 500, 22)
      .fill("#F1F5F9");

    doc
      .fillColor("#1E293B")
      .fontSize(9)
      .text("ITEM & DESCRIPTION", 60, tableTop + 6)
      .text("QTY", 320, tableTop + 6, { width: 35, align: "center" })
      .text("UNIT PRICE", 365, tableTop + 6, { width: 60, align: "right" })
      .text("TAX", 435, tableTop + 6, { width: 45, align: "right" })
      .text("TOTAL", 485, tableTop + 6, { width: 55, align: "right" });

    let rowY = tableTop + 28;

    // Items
    for (const item of data.items) {
      const itemDesc = item.description || item.productName || "Product/Service";
      const variantText = item.variantName ? ` (${item.variantName})` : "";

      doc
        .fillColor("#0F172A")
        .fontSize(9)
        .text(`${itemDesc}${variantText}`, 60, rowY, { width: 250 })
        .text(item.quantity.toString(), 320, rowY, { width: 35, align: "center" })
        .text(Number(item.unitPrice).toFixed(2), 365, rowY, { width: 60, align: "right" })
        .text(`${Number(item.taxRate).toFixed(1)}%`, 435, rowY, { width: 45, align: "right" })
        .text(Number(item.lineTotal).toFixed(2), 485, rowY, { width: 55, align: "right" });

      rowY += 22;

      // Page break check
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }
    }

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, rowY)
      .lineTo(550, rowY)
      .stroke();

    // Summary Totals
    const summaryY = rowY + 15;
    const summaryX = 350;

    doc
      .fontSize(9)
      .fillColor("#64748B")
      .text("Subtotal:", summaryX, summaryY)
      .fillColor("#0F172A")
      .text(Number(data.subtotal).toFixed(2), 450, summaryY, { align: "right" });

    doc
      .fillColor("#64748B")
      .text("Tax Total:", summaryX, summaryY + 16)
      .fillColor("#0F172A")
      .text(Number(data.taxTotal).toFixed(2), 450, summaryY + 16, { align: "right" });

    doc
      .fillColor("#64748B")
      .text("Discount Total:", summaryX, summaryY + 32)
      .fillColor("#0F172A")
      .text(`-${Number(data.discountTotal).toFixed(2)}`, 450, summaryY + 32, { align: "right" });

    doc
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .moveTo(summaryX, summaryY + 50)
      .lineTo(550, summaryY + 50)
      .stroke();

    const balanceDue = Math.max(0, Number(data.total) - Number(data.amountPaid));

    doc
      .fontSize(11)
      .fillColor("#172554")
      .text("Total Amount:", summaryX, summaryY + 56, { bold: true } as any)
      .text(`${data.currency || "USD"} ${Number(data.total).toFixed(2)}`, 450, summaryY + 56, { align: "right", bold: true } as any);

    doc
      .fontSize(9)
      .fillColor("#16A34A")
      .text("Amount Paid:", summaryX, summaryY + 76)
      .text(`${Number(data.amountPaid).toFixed(2)}`, 450, summaryY + 76, { align: "right" });

    doc
      .fontSize(10)
      .fillColor(balanceDue > 0 ? "#DC2626" : "#16A34A")
      .text("Balance Due:", summaryX, summaryY + 94, { bold: true } as any)
      .text(`${data.currency || "USD"} ${balanceDue.toFixed(2)}`, 450, summaryY + 94, { align: "right", bold: true } as any);

    // Notes / Payment Instructions
    if (data.notes) {
      doc
        .fillColor("#64748B")
        .fontSize(9)
        .text("NOTES & PAYMENT INSTRUCTIONS:", 50, summaryY + 15)
        .fillColor("#334155")
        .text(data.notes, 50, summaryY + 30, { width: 280 });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("#94A3B8")
      .text(
        "Thank you for choosing Brightloop Software. For billing inquiries, contact billing@brightloop.io.",
        50,
        780,
        { align: "center", width: 500 }
      );

    doc.end();
  });
}

