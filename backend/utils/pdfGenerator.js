const PDFDocument = require("pdfkit");

const numberToWords = (num) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convert = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    };

    if (num === 0) return "Zero";
    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);
    let str = convert(whole);
    if (fraction > 0) {
        str += " and " + convert(fraction) + " Paise";
    }
    return str + " Only";
};

const axios = require("axios");
const { getBranding } = require("./branding");

// Helper to draw a header
const drawHeader = async (doc, title) => {
    const branding = await getBranding();
    const primaryColor = "#1e40af"; // Deep Professional Blue
    
    // 1. Top Brand Accent
    doc.fillColor(primaryColor).rect(0, 0, 612, 5).fill();

    const pageWidth = doc.page.width;
    const headerTop = 20;

    // 2. Centered Logo
    if (branding.logoUrl) {
        try {
            if (branding.logoUrl.startsWith('data:image')) {
                const base64Data = branding.logoUrl.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                // Fit bounds: up to 350px wide or 120px tall.
                doc.image(buffer, (pageWidth - 350) / 2, headerTop, { fit: [350, 120], align: 'center' });
            } else {
                const response = await axios.get(branding.logoUrl, { responseType: 'arraybuffer' });
                doc.image(response.data, (pageWidth - 350) / 2, headerTop, { fit: [350, 120], align: 'center' });
            }
        } catch (err) {
            console.error("[PDF LOG] Failed to fetch/parse logo image:", err.message);
        }
    }

    // 3. Centered Branding - Provide bigger padding since logo can take up to 120px height
    const brandingY = branding.logoUrl ? headerTop + 130 : headerTop + 10;
    doc.fillColor("#0f172a")
       .font("Helvetica-Bold")
       .fontSize(22)
       .text(branding.clinicName.toUpperCase(), 0, brandingY, { align: "center" });
       
    doc.fillColor("#64748b")
       .font("Helvetica-Oblique")
       .fontSize(10)
       .text(branding.tagline, 0, brandingY + 25, { align: "center" });
    
    // 4. Centered Details block
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
       .text(branding.address, 100, brandingY + 45, { align: "center", width: 412 })
       .text(`Phone: ${branding.phone} | Email: ${branding.email} | GSTIN: ${branding.gstin}`, 0, brandingY + 58, { align: "center" });

    // 5. Document Separator
    const separatorY = brandingY + 80;
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, separatorY).lineTo(562, separatorY).stroke();

    // 6. Meta Headers (Title, Invoice No, Date) - Full Width below line
    const metaY = separatorY + 15;
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(14).text(title, 50, metaY);
    
    doc.fillColor("#334155").font("Helvetica").fontSize(9);
    doc.text(`Doc No: ${Date.now().toString().slice(-6)}`, 400, metaY, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, metaY + 12, { align: "right" });

    doc.moveDown(4);
};

exports.generateBillPDF = async (res, bill) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${bill._id}.pdf`);
    doc.pipe(res);

    // Border
    doc.rect(20, 20, 555, 800).strokeColor("#cbd5e1").lineWidth(1).stroke();

    await drawHeader(doc, "TAX INVOICE");

    // Bill To & Meta Section (Info Cards)
    const cardY = doc.y + 10;
    doc.rect(50, cardY, 512, 65).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text("BILL TO (RECIPIENT)", 65, cardY + 12);
    doc.fillColor("#4b5563").font("Helvetica").fontSize(9)
       .text(`Name: ${bill.patientId?.name || 'Cash Customer'}`, 65, cardY + 28)
       .text(`Address: ${bill.patientId?.address || 'N/A'}`, 65, cardY + 42, { width: 280 })
       .text(`Phone: ${bill.patientId?.phone || 'N/A'}`, 380, cardY + 28);

    // Table Header
    const tableTop = cardY + 85;
    doc.rect(50, tableTop, 500, 20).fillColor("#1e293b").fill();
    doc.fillColor("#ffffff").fontSize(8);
    doc.text("S.N.", 55, tableTop + 6);
    doc.text("DESCRIPTION OF GOODS", 85, tableTop + 6);
    doc.text("HSN", 250, tableTop + 6);
    doc.text("QTY", 290, tableTop + 6);
    doc.text("RATE", 330, tableTop + 6);
    doc.text("TAXABLE", 380, tableTop + 6);
    doc.text("GST%", 430, tableTop + 6);
    doc.text("GST AMT", 470, tableTop + 6);
    doc.text("TOTAL", 520, tableTop + 6);

    // Items
    let currentY = tableTop + 25;
    doc.fillColor("#334155").fontSize(8);
    
    bill.items.forEach((item, index) => {
        // Zebra striping
        if (index % 2 !== 0) {
            doc.fillColor("#f1f5f9").rect(50, currentY - 5, 500, 18).fill();
        }
        doc.fillColor("#334155");
        
        const taxableVal = item.price * item.qty;
        const gstAmount = (item.cgst || 0) + (item.sgst || 0);

        doc.text((index + 1).toString(), 55, currentY);
        doc.text(item.name.toUpperCase(), 85, currentY, { width: 160 });
        doc.text("9004", 250, currentY); // Generic HSN for Spectacles
        doc.text(item.qty.toString(), 290, currentY);
        doc.text(item.price.toFixed(2), 330, currentY);
        doc.text(taxableVal.toFixed(2), 380, currentY);
        doc.text(`${item.gstPercent}%`, 430, currentY);
        doc.text(gstAmount.toFixed(2), 470, currentY);
        doc.text(item.total.toFixed(2), 520, currentY);

        currentY += 20;

        // Divider
        doc.strokeColor("#f1f5f9").lineWidth(0.5).moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
    });

    // Totals Section
    const totalsY = Math.max(currentY + 25, 450);
    
    // Left: Amount in words
    doc.rect(50, totalsY, 280, 70).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text("Total Amount (in words):", 60, totalsY + 10);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text(numberToWords(bill.grandTotal), 60, totalsY + 25, { width: 260 });

    // Right: Calculation Section
    const calcX = 350;
    const valueX = 500;
    doc.font("Helvetica").fontSize(9).fillColor("#475569");
    
    doc.text("Total Taxable Value:", calcX, totalsY);
    doc.text(bill.subTotal.toFixed(2), valueX, totalsY, { width: 50, align: "right" });
    
    doc.text(`Add: CGST (${(bill.items[0]?.gstPercent / 2 || 9)}%):`, calcX, totalsY + 15);
    doc.text(bill.cgstTotal.toFixed(2), valueX, totalsY + 15, { width: 50, align: "right" });
    
    doc.text(`Add: SGST (${(bill.items[0]?.gstPercent / 2 || 9)}%):`, calcX, totalsY + 30);
    doc.text(bill.sgstTotal.toFixed(2), valueX, totalsY + 30, { width: 50, align: "right" });

    // Grand Total Box (Branded)
    const gtBoxY = totalsY + 45;
    doc.rect(340, gtBoxY, 215, 30).fillColor("#1e40af").fill();
    
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
    doc.text("GRAND TOTAL:", 350, gtBoxY + 10);
    doc.text(`INR ${bill.grandTotal.toFixed(2)}`, 450, gtBoxY + 10, { width: 100, align: "right" });

    // Terms and Signature
    doc.moveDown(5);
    const footerY = 700;
    doc.fillColor("#475569").fontSize(8)
       .text("TERMS & CONDITIONS:", 50, footerY)
       .text("1. Goods once sold will not be taken back.", 50, footerY + 12)
       .text("2. Subject to Delhi Jurisdiction only.", 50, footerY + 22);

    const branding = await getBranding();
    doc.fillColor("#1e293b").fontSize(10).text(`FOR ${branding.clinicName.toUpperCase()}`, 400, footerY, { align: "center", bold: true });
    doc.moveDown(3);
    doc.fontSize(8).text("(Authorized Signatory)", 400, footerY + 45, { align: "center" });

    doc.fontSize(8).fillColor("#94a3b8").text("This is a computer generated invoice.", 50, 780, { align: "center" });

    doc.end();
};

exports.generatePrescriptionPDF = async (res, prescription) => {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Rx_${prescription._id}.pdf`);
    doc.pipe(res);

    await drawHeader(doc, "OPHTHALMIC PRESCRIPTION (R/x)");

    // Patient & Doctor Info Card
    const cardY = doc.y + 10;
    doc.rect(50, cardY, 512, 60).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
    doc.text("PATIENT INFORMATION", 65, cardY + 12);
    doc.text("CONSULTING DOCTOR", 350, cardY + 12);
    
    doc.fillColor("#4b5563").font("Helvetica").fontSize(9)
       .text(`Name: ${prescription.patient?.name}`, 65, cardY + 28)
       .text(`Age/Sex: ${prescription.patient?.age || '-'} / ${prescription.patient?.gender || '-'}`, 65, cardY + 42)
       .text(`Dr. ${prescription.doctor?.name}`, 350, cardY + 28)
       .text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 350, cardY + 42);

    // Eye Table
    const tableTop = cardY + 80;
    doc.fillColor("#f8fafc").rect(50, tableTop - 5, 500, 20).fill();
    doc.fillColor("#1e293b").text("EYE", 60, tableTop);
    doc.text("SPH", 120, tableTop);
    doc.text("CYL", 180, tableTop);
    doc.text("AXIS", 240, tableTop);
    doc.text("ADD", 300, tableTop);
    doc.text("VISION", 360, tableTop);

    const drawRow = (label, data, y) => {
        doc.text(label, 60, y, { bold: true });
        doc.text(data.sph || "-", 120, y);
        doc.text(data.cyl || "-", 180, y);
        doc.text(data.axis || "-", 240, y);
        doc.text(data.add || "-", 300, y);
        doc.text(data.vision || "-", 360, y);
    };

    drawRow("Right (O.D.)", prescription.rightEye, tableTop + 25);
    drawRow("Left (O.S.)", prescription.leftEye, tableTop + 50);

    doc.moveDown(5);

    // Notes
    doc.fontSize(12).text("Recommendations:", 50, tableTop + 90);
    doc.fontSize(10).fillColor("#475569");
    doc.text(`Lens Suggested: ${prescription.suggestedLens || "Standard"}`, 60, tableTop + 110);
    doc.text(`Clinical Notes: ${prescription.notes || "None"}`, 60, tableTop + 125);
    doc.text(`Advice: ${prescription.recommendations || "N/A"}`, 60, tableTop + 140);

    // Footer Signature
    doc.strokeColor("#000").lineWidth(0.5).moveTo(400, 700).lineTo(550, 700).stroke();
    doc.fontSize(10).text("Ophthalmologist Signature", 410, 710);

    doc.end();
};

exports.generateTabularReportPDF = async (res, title, headers, rows, subtitle = "") => {
    const doc = new PDFDocument({ margin: 30, layout: "landscape" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    const branding = await getBranding();
    const primaryColor = "#1e40af";
    const pageWidth = 792;
    const headerTop = 20;

    doc.fillColor(primaryColor).rect(0, 0, 792, 5).fill();

    // 1. Centered Logo
    if (branding.logoUrl) {
        try {
            if (branding.logoUrl.startsWith('data:image')) {
                const base64Data = branding.logoUrl.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                doc.image(buffer, (pageWidth - 350) / 2, headerTop, { fit: [350, 120], align: 'center' });
            } else {
                const response = await axios.get(branding.logoUrl, { responseType: 'arraybuffer' });
                doc.image(response.data, (pageWidth - 350) / 2, headerTop, { fit: [350, 120], align: 'center' });
            }
        } catch (err) {
            console.error("[PDF LOG] Failed to fetch/parse logo image:", err.message);
        }
    }

    const brandingY = branding.logoUrl ? headerTop + 130 : headerTop + 5;

    // 2. Headings
    doc.fillColor("#0f172a")
       .font("Helvetica-Bold")
       .fontSize(20)
       .text(branding.clinicName.toUpperCase(), 0, brandingY, { align: "center" });

    doc.fillColor("#64748b")
       .font("Helvetica-Oblique")
       .fontSize(10)
       .text(branding.tagline, 0, brandingY + 22, { align: "center" });

    // 3. Address and Contacts
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
       .text(branding.address, 196, brandingY + 38, { align: "center", width: 400 }) 
       .text(`Phone: ${branding.phone} | Email: ${branding.email} | GSTIN: ${branding.gstin}`, 0, brandingY + 50, { align: "center" });

    let currentOffsetY = brandingY + 70;

    // 4. Report Title
    doc.fillColor("#1e40af")
       .font("Helvetica-Bold")
       .fontSize(12)
       .text(title.toUpperCase(), 0, currentOffsetY, { align: "center" });

    if (subtitle) {
        currentOffsetY += 15;
        doc.fontSize(9).fillColor("#94a3b8").font("Helvetica").text(subtitle, 0, currentOffsetY, { align: "center" });
    }

    currentOffsetY += 20;
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(30, currentOffsetY).lineTo(762, currentOffsetY).stroke();
    
    // Table Setup
    const tableTop = currentOffsetY + 15;
    const colWidth = 730 / headers.length;
    let currentY = tableTop;

    // Table Header
    doc.fillColor("#f1f5f9").rect(30, currentY - 5, 750, 20).fill();
    doc.fillColor("#1e293b").fontSize(9);
    headers.forEach((h, i) => {
        doc.text(h.toUpperCase(), 35 + (i * colWidth), currentY, { width: colWidth - 5, bold: true });
    });

    currentY += 25;
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(30, currentY - 5).lineTo(780, currentY - 5).stroke();

    // Rows
    rows.forEach((row, rowIndex) => {
        if (currentY > 500) { // Page break check
            doc.addPage({ margin: 30, layout: "landscape" });
            currentY = 50;
            // Redraw header on new page
            doc.fillColor("#f1f5f9").rect(30, currentY - 5, 750, 20).fill();
            doc.fillColor("#1e293b").fontSize(9);
            headers.forEach((h, i) => {
                doc.text(h.toUpperCase(), 35 + (i * colWidth), currentY, { width: colWidth - 5, bold: true });
            });
            currentY += 25;
        }

        // Zebra striping
        if (rowIndex % 2 === 0) {
            doc.fillColor("#f8fafc").rect(30, currentY - 5, 750, 18).fill();
        }

        doc.fillColor("#475569").fontSize(8);
        row.forEach((cell, i) => {
            doc.text(cell?.toString() || "-", 35 + (i * colWidth), currentY, { width: colWidth - 5 });
        });

        currentY += 18;
    });

    doc.fontSize(8).fillColor("#94a3b8").text(`Generated on: ${new Date().toLocaleString()}`, 30, 570, { align: "right" });

    doc.end();
};
