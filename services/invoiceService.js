const PDFDocument = require('pdfkit');

const InvoiceService = {
  async generateInvoice(order, res) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.order_number}.pdf"`);
    doc.pipe(res);

    const primaryColor = '#f97316'; // Tailwind orange-500

    // ─── Header ────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('Son Shayan', 50, 30);

    doc.fontSize(11)
       .font('Helvetica')
       .text('Fresh, Crispy, Delicious Chips', 50, 62)
       .text('sonshayan.com | +94 76 32 44160', 50, 78);

    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('INVOICE', doc.page.width - 130, 40, { align: 'right', width: 80 });

    // ─── Invoice Info ─────────────────────────────────────────
    doc.moveDown(3);
    doc.fillColor('#111827')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Invoice Details', 50, 120);

    doc.moveTo(50, 135).lineTo(doc.page.width - 50, 135).strokeColor('#e5e7eb').stroke();

    const infoY = 145;
    doc.fillColor('#374151').font('Helvetica').fontSize(10);
    doc.text(`Order Number:`, 50, infoY).font('Helvetica-Bold').text(order.order_number, 180, infoY);
    doc.font('Helvetica').text(`Order Date:`, 50, infoY + 18).font('Helvetica-Bold').text(
      new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      180, infoY + 18
    );
    doc.font('Helvetica').text(`Payment Method:`, 50, infoY + 36).font('Helvetica-Bold').text(
      order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      180, infoY + 36
    );
    doc.font('Helvetica').text(`Order Status:`, 50, infoY + 54).font('Helvetica-Bold').text(
      order.order_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      180, infoY + 54
    );

    // ─── Customer Info ────────────────────────────────────────
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11)
       .text('Billed To', 350, 120);
    doc.moveTo(350, 135).lineTo(doc.page.width - 50, 135).strokeColor('#e5e7eb').stroke();

    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10)
       .text(order.customer_name, 350, infoY);
    doc.font('Helvetica').text(order.phone, 350, infoY + 18);
    doc.text(order.address, 350, infoY + 36, { width: 190 });
    if (order.city) doc.text(order.city, 350, infoY + 54);

    // ─── Items Table ──────────────────────────────────────────
    const tableTop = 265;

    // Table header
    doc.rect(50, tableTop, doc.page.width - 100, 28).fill('#f3f4f6');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
    doc.text('#', 58, tableTop + 9);
    doc.text('Product', 80, tableTop + 9);
    doc.text('Qty', 340, tableTop + 9);
    doc.text('Unit Price', 390, tableTop + 9);
    doc.text('Subtotal', 470, tableTop + 9);

    // Table rows
    let y = tableTop + 34;
    (order.items || []).forEach((item, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      doc.rect(50, y - 5, doc.page.width - 100, 24).fill(rowBg);

      doc.fillColor('#374151').font('Helvetica').fontSize(10);
      doc.text(String(index + 1), 58, y);
      doc.text(item.product_name, 80, y, { width: 250, ellipsis: true });
      doc.text(String(item.quantity), 340, y);
      doc.text(`LKR ${parseFloat(item.price).toFixed(2)}`, 386, y);
      doc.text(`LKR ${parseFloat(item.subtotal).toFixed(2)}`, 466, y);

      y += 24;
    });

    // ─── Totals ────────────────────────────────────────────────
    doc.moveTo(50, y + 5).lineTo(doc.page.width - 50, y + 5).strokeColor('#e5e7eb').stroke();
    y += 15;

    const subtotalBeforeDiscount = (order.items || []).reduce((sum, i) => sum + parseFloat(i.subtotal), 0);

    const totalLabelX = 380;
    const totalValueX = 470;

    doc.fillColor('#374151').font('Helvetica').fontSize(10);
    doc.text('Subtotal:', totalLabelX, y).text(`LKR ${subtotalBeforeDiscount.toFixed(2)}`, totalValueX, y);

    if (parseFloat(order.coupon_discount) > 0) {
      y += 18;
      doc.fillColor('#16a34a').text(`Coupon (${order.coupon_code}):`, totalLabelX, y)
         .text(`- LKR ${parseFloat(order.coupon_discount).toFixed(2)}`, totalValueX, y);
    }

    if (parseFloat(order.advance_paid) > 0) {
      y += 18;
      doc.fillColor('#374151').text('Advance Paid:', totalLabelX, y)
         .text(`LKR ${parseFloat(order.advance_paid).toFixed(2)}`, totalValueX, y);
      y += 18;
      doc.text('Balance Due on Delivery:', totalLabelX, y)
         .text(`LKR ${parseFloat(order.remaining_balance).toFixed(2)}`, totalValueX, y);
    }

    y += 22;
    doc.rect(totalLabelX - 10, y - 5, doc.page.width - totalLabelX, 30).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', totalLabelX, y + 4).text(`LKR ${parseFloat(order.total_amount).toFixed(2)}`, totalValueX, y + 4);

    // ─── Footer ───────────────────────────────────────────────
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e5e7eb').stroke();
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9)
       .text('Thank you for shopping with Son Shayan!', 50, footerY + 10, {
         align: 'center',
         width: doc.page.width - 100,
       })
       .text('For questions, contact us at sonshayan26@gmail.com or +94 70 000 0000', 50, footerY + 25, {
         align: 'center',
         width: doc.page.width - 100,
       });

    doc.end();
  },
};

module.exports = InvoiceService;
