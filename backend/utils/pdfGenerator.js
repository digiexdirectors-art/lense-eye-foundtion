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
const drawHeaderInternal = (doc, branding, logoBuffer, title, customDate, pageWidth) => {
    const primaryColor = "#1e40af"; 
    const bgColor = "#e0f2fe"; 
    
    // 1. Full Light Blue Background for Header area
    doc.fillColor(bgColor).rect(0, 0, pageWidth, 100).fill();
    doc.fillColor(primaryColor).rect(0, 0, pageWidth, 5).fill();

    const headerTop = 20;
    let textLeftOffset = 40;

    // 2. Logo on the LEFT
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, 40, headerTop, { fit: [150, 80], align: 'left' });
            textLeftOffset = 200;
        } catch (err) {
            console.error("[PDF LOG] Failed to draw logo image:", err.message);
        }
    }

    // 3. Clinic Name on the LEFT
    doc.fillColor(primaryColor)
       .font("Helvetica-Bold")
       .fontSize(18)
       .text(branding.clinicName.toUpperCase(), textLeftOffset, headerTop + 10, { width: 250 });
       
    doc.fillColor("#475569")
       .font("Helvetica-Bold")
       .fontSize(10)
       .text(title.toUpperCase(), textLeftOffset, headerTop + 40, { width: 250 });

    if (title.toUpperCase() === "CLINICAL PRESCRIPTION") {
        doc.fillColor(primaryColor)
           .font("Helvetica-Bold")
           .fontSize(11.5)
           .text("EYE CARE HOSPITAL", textLeftOffset, headerTop + 54, { width: 250 });
    }

    // 4. Contact Details on the RIGHT
    const rightMargin = pageWidth - 40;
    doc.fillColor(primaryColor)
       .font("Helvetica-Bold")
       .fontSize(9.5)
       .text("For Appointment:", 0, headerTop - 5, { align: "right", width: rightMargin })
       .text(branding.appointmentHours || "Mon-Sat: 9:00AM - 6:00 PM", 0, headerTop + 5, { align: "right", width: rightMargin });

    let addrY = headerTop + 16;
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(10.5);
    if (branding.address) {
        branding.address.split('\n').forEach(line => {
            doc.text(line.toUpperCase(), 0, addrY, { align: "right", width: rightMargin });
            addrY += 12;
        });
    }
    
    doc.font("Helvetica")
       .fontSize(9)
       .text(`Tel: ${branding.phone || '-'}`, 0, addrY + 2, { align: "right", width: rightMargin })
       .text(`Email: ${branding.email || '-'}`, 0, addrY + 11, { align: "right", width: rightMargin });

    doc.fillColor(primaryColor)
       .font("Helvetica-Bold")
       .fontSize(10)
       .text(`GSTIN: ${branding.gstin || '-'}`, 0, addrY + 22, { align: "right", width: rightMargin })
       .text(`Mob: ${branding.mobile || '+91 9733035399'}`, 0, addrY + 32, { align: "right", width: rightMargin });

    // Border line below header
    doc.strokeColor(primaryColor).lineWidth(3).moveTo(0, 100).lineTo(pageWidth, 100).stroke();

    // 6. Meta Headers (Doc No, Date)
    const metaY = 110;
    doc.fillColor("#334155").font("Helvetica").fontSize(8);
    doc.text(`Doc No: ${Date.now().toString().slice(-6)}`, pageWidth - 200, metaY, { align: "right", width: 160 });
    const displayDate = customDate ? new Date(customDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    doc.text(`Date: ${displayDate}`, pageWidth - 200, metaY + 10, { align: "right", width: 160 });

    doc.y = 140; 
};

const drawHeader = async (doc, title, customDate = null) => {
    const branding = await getBranding();
    const pageWidth = doc.page.width;
    let logoBuffer = null;

    if (branding.logoUrl) {
        try {
            if (branding.logoUrl.startsWith('data:image')) {
                const base64Data = branding.logoUrl.split(',')[1];
                logoBuffer = Buffer.from(base64Data, 'base64');
            } else {
                const response = await axios.get(branding.logoUrl, { responseType: 'arraybuffer' });
                logoBuffer = response.data;
            }
        } catch (err) {
            console.error("[PDF LOG] Failed to fetch logo:", err.message);
        }
    }

    // Initial page header
    drawHeaderInternal(doc, branding, logoBuffer, title, customDate, pageWidth);

    // Repeat on every new page
    doc.on('pageAdded', () => {
        drawHeaderInternal(doc, branding, logoBuffer, title, customDate, pageWidth);
    });
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
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Build filename: patientName-doctorName-appointmentDateTime-appointmentId
    const patientName = (prescription.patient?.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const doctorName = (prescription.doctor?.name || 'Doctor').replace(/[^a-zA-Z0-9]/g, '_');
    const apptDate = prescription.appointment?.appointmentDate 
      ? new Date(prescription.appointment.appointmentDate).toISOString().replace(/[:.]/g, '-').slice(0, 19)
      : new Date(prescription.prescriptionDate || prescription.createdAt).toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const apptTimeSlot = prescription.appointment?.timeSlot ? `_${prescription.appointment.timeSlot.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
    const apptId = prescription.appointment?._id || prescription._id;
    const pdfFilename = `${patientName}-${doctorName}-${apptDate}${apptTimeSlot}-${apptId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${pdfFilename}`);
    doc.pipe(res);

    await drawHeader(doc, "CLINICAL PRESCRIPTION", prescription.prescriptionDate || prescription.createdAt);

    // Doctor info handling
    const doctor = prescription.doctor;
    const docName = doctor?.name ? (doctor.name.toLowerCase().match(/^dr\.?\s+/) ? doctor.name : `Dr. ${doctor.name}`) : '';

    // 3-Column Patient & Doctor Info Section
    const cardY = doc.y + 10;
    doc.rect(40, cardY, 520, 70).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    
    doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8);
    
    // Column 1
    doc.text("MRD NO:", 50, cardY + 12);
    doc.text("MOBILE NO:", 50, cardY + 30);
    doc.text("DOCTOR:", 50, cardY + 48);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
    doc.text(prescription.patient?.mrdNumber || "-", 110, cardY + 12);
    doc.text(prescription.patient?.phone || "-", 110, cardY + 30);
    doc.text(docName, 110, cardY + 48);

    // Column 2
    doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8);
    doc.text("PATIENT NAME:", 220, cardY + 12);
    doc.text("DATE:", 220, cardY + 30);
    doc.text("PURPOSE:", 220, cardY + 48);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
    doc.text(prescription.patient?.name || "-", 300, cardY + 12);
    const pDate = prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString('en-IN') : "-";
    doc.text(pDate, 300, cardY + 30);
    doc.text(prescription.patient?.purpose || "-", 300, cardY + 48);

    // Column 3
    doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8);
    doc.text("ADDRESS:", 390, cardY + 12);
    doc.text("REFD. BY:", 390, cardY + 30);
    doc.text("AGE/SEX:", 390, cardY + 48);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
    doc.text(prescription.patient?.address || "-", 450, cardY + 12, { width: 100 });
    doc.text(prescription.patient?.refdBy || prescription.patient?.regdBy || "-", 450, cardY + 30);
    doc.text(`${prescription.patient?.age || "-"} / ${prescription.patient?.gender || "-"}`, 450, cardY + 48);

    let currentY = cardY + 80;

    // History section
    if (prescription.chiefComplaints || prescription.generalHealth || prescription.pastHistory) {
        doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("General History", 50, currentY);
        currentY += 15;
        doc.fillColor("#334155").font("Helvetica").fontSize(9);
        if (prescription.chiefComplaints) { doc.text(`Chief Complaints: ${prescription.chiefComplaints}`, 50, currentY); currentY += 12; }
        if (prescription.generalHealth) { doc.text(`General Health: ${prescription.generalHealth}`, 50, currentY); currentY += 12; }
        if (prescription.pastHistory) { doc.text(`Past History: ${prescription.pastHistory}`, 50, currentY); currentY += 12; }
        currentY += 10;
    }

    // Eye Table
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("Examination", 50, currentY);
    currentY += 15;
    const tableTop = currentY;
    
    doc.fillColor("#f1f5f9").rect(50, tableTop - 5, 510, 20).fill();
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);
    doc.text("EYE", 55, tableTop);
    doc.text("PGVN", 150, tableTop);
    doc.text("BCVN", 250, tableTop);
    doc.text("PHVN", 350, tableTop);
    doc.text("NCT", 450, tableTop);

    const drawRow = (label, data, y) => {
        doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9).text(label, 55, y);
        doc.fillColor("#4b5563").font("Helvetica");
        doc.text(data?.pgvn || "-", 150, y);
        doc.text(data?.bcvn || "-", 250, y);
        doc.text(data?.phvn || "-", 350, y);
        doc.text(data?.nct || "-", 450, y);
    };

    drawRow("Right (O.D.)", prescription.rightEye, tableTop + 25);
    drawRow("Left (O.S.)", prescription.leftEye, tableTop + 45);

    currentY = tableTop + 70;

    // OPD tests
    if (prescription.optTest && (prescription.optTest.leftEye || prescription.optTest.rightEye)) {
        doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text("OPD Test", 50, currentY);
        currentY += 15;
        doc.fillColor("#4b5563").font("Helvetica").fontSize(8);
        doc.text(`Right Eye - ACD: ${prescription.optTest.rightEye?.acd || '-'} | Pupillary Reaction: ${prescription.optTest.rightEye?.pupillaryReaction || '-'} | EOM: ${prescription.optTest.rightEye?.eom || '-'}`, 50, currentY);
        currentY += 12;
        doc.text(`Left Eye - ACD: ${prescription.optTest.leftEye?.acd || '-'} | Pupillary Reaction: ${prescription.optTest.leftEye?.pupillaryReaction || '-'} | EOM: ${prescription.optTest.leftEye?.eom || '-'}`, 50, currentY);
        currentY += 20;
    }

    // Spectacle Prescription Table
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("Spectacle Prescription", 50, currentY);
    currentY += 15;
    const spectTableTop = currentY;
    doc.fillColor("#f1f5f9").rect(50, spectTableTop - 5, 510, 20).fill();
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);
    doc.text("EYE", 55, spectTableTop);
    doc.text("SPH", 150, spectTableTop);
    doc.text("CYL", 250, spectTableTop);
    doc.text("AXIS", 350, spectTableTop);
    doc.text("V/A", 450, spectTableTop);

    const drawSpectRow = (label, data, y) => {
        doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9).text(label, 55, y);
        doc.fillColor("#4b5563").font("Helvetica");
        doc.text(data?.sph || "-", 150, y);
        doc.text(data?.cyl || "-", 250, y);
        doc.text(data?.axis || "-", 350, y);
        doc.text(data?.va || "-", 450, y);
    };
    drawSpectRow("Right (O.D.)", prescription.spectaclePrescription?.rightEye, spectTableTop + 25);
    drawSpectRow("Left (O.S.)", prescription.spectaclePrescription?.leftEye, spectTableTop + 45);
    currentY = spectTableTop + 70;

    // Examination Finding
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("Examination Finding", 50, currentY);
    currentY += 15;
    doc.fillColor("#4b5563").font("Helvetica").fontSize(8);
    doc.text(`Right Eye - Anterior Segment: ${prescription.examinationFinding?.rightEye?.anteriorSegment || '-'} | Posterior Segment: ${prescription.examinationFinding?.rightEye?.posteriorSegment || '-'}`, 50, currentY);
    currentY += 12;
    doc.text(`Left Eye - Anterior Segment: ${prescription.examinationFinding?.leftEye?.anteriorSegment || '-'} | Posterior Segment: ${prescription.examinationFinding?.leftEye?.posteriorSegment || '-'}`, 50, currentY);
    currentY += 20;

    if (prescription.diagnosis) {
        doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("Diagnosis:", 50, currentY);
        doc.fillColor("#000000").font("Helvetica").fontSize(10).text(prescription.diagnosis, 110, currentY);
        currentY += 20;
    }

    if (prescription.medications && prescription.medications.length > 0) {
        // Handle both old string format and new { name, description } format
        const hasMedContent = prescription.medications.some(m => {
            if (typeof m === 'string') return m.trim().length > 0;
            return (m.name && m.name.trim().length > 0);
        });
        
        if (hasMedContent) {
            doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(12).text("Rx Medications", 50, currentY);
            currentY += 18;
            
            // Table header for medications
            doc.fillColor("#f1f5f9").rect(50, currentY - 5, 510, 18).fill();
            doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(8);
            doc.text("S.N.", 55, currentY);
            doc.text("MEDICATION", 80, currentY);
            doc.text("DESCRIPTION", 300, currentY);
            currentY += 20;
            
            doc.font("Helvetica").fontSize(9);
            prescription.medications.forEach((med, idx) => {
                const medName = typeof med === 'string' ? med : (med.name || '');
                const medDesc = typeof med === 'string' ? '' : (med.description || '');
                
                if (medName.trim()) {
                    // Zebra striping
                    if (idx % 2 === 0) {
                        doc.fillColor("#f8fafc").rect(50, currentY - 4, 510, 16).fill();
                    }
                    doc.fillColor("#334155");
                    doc.text(`${idx + 1}.`, 55, currentY);
                    doc.font("Helvetica-Bold").text(medName, 80, currentY, { width: 210 });
                    doc.font("Helvetica").fillColor("#475569").text(medDesc || '-', 300, currentY, { width: 250 });
                    currentY += 18;
                }
            });
            currentY += 10;
        }
    }

    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text("Recommendations & Notes", 50, currentY);
    currentY += 15;
    doc.fillColor("#475569").font("Helvetica").fontSize(9);
    doc.text(`Suggested Lens: ${prescription.suggestedLens || "N/A"}`, 60, currentY); currentY += 12;
    if (prescription.comments) { doc.text(`Comments: ${prescription.comments}`, 60, currentY); currentY += 12; }
    if (prescription.nextReviewDate) { 
        doc.text(`Next Review: ${new Date(prescription.nextReviewDate).toLocaleDateString()} - ${prescription.nextReviewNote || ''}`, 60, currentY); 
        currentY += 12; 
    }

    // Footer Signature
    doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(350, 720).lineTo(550, 720).stroke();
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(10).text(docName, 350, 730, { width: 200, align: "center" });
    if (doctor?.registrationNumber) {
        doc.fillColor("#64748b").font("Helvetica").fontSize(8).text(`Regd. Number: ${doctor.registrationNumber}`, 350, 745, { width: 200, align: "center" });
    } else {
        doc.fillColor("#64748b").font("Helvetica").fontSize(8).text("Ophthalmologist Signature", 350, 745, { width: 200, align: "center" });
    }

    doc.end();
};

exports.generatePurchasePDF = async (res, purchase) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Purchase_${purchase.invoiceNumber}.pdf`);
    doc.pipe(res);

    await drawHeader(doc, "VENDOR PURCHASE INVOICE", purchase.createdAt);

    // Vendor Info Card
    const cardY = doc.y + 10;
    doc.rect(50, cardY, 512, 60).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
    doc.text("VENDOR INFORMATION", 65, cardY + 12);
    doc.text("INVOICE DETAILS", 350, cardY + 12);
    
    doc.fillColor("#4b5563").font("Helvetica").fontSize(9)
       .text(`Name: ${purchase.vendorName}`, 65, cardY + 28)
       .text(`GSTIN: ${purchase.vendorGST || 'N/A'}`, 65, cardY + 42)
       .text(`Inv No: ${purchase.invoiceNumber}`, 350, cardY + 28)
       .text(`Date: ${new Date(purchase.createdAt).toLocaleDateString()}`, 350, cardY + 42);

    // Table Header
    const tableTop = cardY + 80;
    doc.rect(50, tableTop, 500, 20).fillColor("#1e293b").fill();
    doc.fillColor("#ffffff").fontSize(8);
    doc.text("S.N.", 55, tableTop + 6);
    doc.text("ITEM DESCRIPTION", 85, tableTop + 6);
    doc.text("QTY", 290, tableTop + 6);
    doc.text("RATE", 350, tableTop + 6);
    doc.text("GST%", 420, tableTop + 6);
    doc.text("TOTAL", 490, tableTop + 6);

    // Items
    let currentY = tableTop + 25;
    doc.fillColor("#334155").fontSize(8);
    
    purchase.items.forEach((item, index) => {
        if (index % 2 !== 0) {
            doc.fillColor("#f1f5f9").rect(50, currentY - 5, 500, 18).fill();
        }
        doc.fillColor("#334155");
        
        doc.text((index + 1).toString(), 55, currentY);
        doc.text(item.name.toUpperCase(), 85, currentY, { width: 190 });
        doc.text(item.qty.toString(), 290, currentY);
        doc.text(item.purchasePrice.toFixed(2), 350, currentY);
        doc.text(`${item.gstPercent}%`, 420, currentY);
        doc.text((item.purchasePrice * item.qty * (1 + item.gstPercent/100)).toFixed(2), 490, currentY);

        currentY += 20;
    });

    // Totals
    const totalsY = Math.max(currentY + 20, 500);
    doc.rect(340, totalsY, 215, 60).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").stroke();
    
    doc.fillColor("#475569").fontSize(9);
    doc.text("Subtotal:", 350, totalsY + 10);
    doc.text(`INR ${purchase.subTotal.toFixed(2)}`, 450, totalsY + 10, { width: 100, align: "right" });
    
    doc.text("GST Total:", 350, totalsY + 25);
    doc.text(`INR ${(purchase.cgstTotal + purchase.sgstTotal).toFixed(2)}`, 450, totalsY + 25, { width: 100, align: "right" });
    
    doc.fillColor("#1e40af").font("Helvetica-Bold").text("GRAND TOTAL:", 350, totalsY + 42);
    doc.text(`INR ${purchase.grandTotal.toFixed(2)}`, 450, totalsY + 42, { width: 100, align: "right" });

    doc.end();
};

exports.generateTabularReportPDF = async (res, title, headers, rows, subtitle = "") => {
    const doc = new PDFDocument({ margin: 30, layout: "landscape" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Report_${Date.now()}.pdf`);
    doc.pipe(res);

    await drawHeader(doc, title);

    if (subtitle) {
        doc.fontSize(10).fillColor("#64748b").font("Helvetica-Oblique").text(subtitle, 40, doc.y + 5);
    }

    doc.moveDown(1);
    
    // Table Setup
    const tableTop = doc.y + 15;
    const availableWidth = doc.page.width - 60;
    const colWidth = availableWidth / headers.length;
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

exports.generateRegistrationBillPDF = async (res, bill) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const branding = await getBranding();

    // Build filename
    const patientName = (bill.patient?.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const receiptNoClean = bill.receiptNo.replace(/[^a-zA-Z0-9]/g, '-');
    const pdfFilename = `RegBill-${patientName}-${receiptNoClean}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${pdfFilename}`);
    doc.pipe(res);

    // Border
    doc.rect(20, 20, 555, 800).strokeColor("#cbd5e1").lineWidth(1).stroke();

    await drawHeader(doc, "BILL OF SUPPLY", bill.createdAt);

    const pageWidth = doc.page.width;

    // 1. Patient & Bill Info Section ( Branded Card)
    const bodyY = 150;
    doc.rect(40, bodyY - 10, 520, 85).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(10);
    
    // Left Column
    doc.fillColor("#64748b").fontSize(8).text("PATIENT NAME:", 55, bodyY);
    doc.fillColor("#111827").fontSize(10).text(bill.patient?.name?.toUpperCase() || "-", 150, bodyY);

    doc.fillColor("#64748b").fontSize(8).text("MRD NO:", 55, bodyY + 20);
    doc.fillColor("#111827").fontSize(10).text(bill.patient?.mrdNumber || "-", 150, bodyY + 20);

    doc.fillColor("#64748b").fontSize(8).text("ADDRESS:", 55, bodyY + 40);
    doc.fillColor("#111827").fontSize(9).text(bill.patient?.address || "-", 150, bodyY + 40, { width: 220 });

    doc.fillColor("#64748b").fontSize(8).text("DOCTOR NAME:", 55, bodyY + 60);
    doc.fillColor("#111827").fontSize(10).text(bill.doctor?.name ? `DR. ${bill.doctor.name.toUpperCase()}` : "-", 150, bodyY + 60);

    // Right Column
    const rightLabelX = 380;
    const rightValueX = 460;
    doc.fillColor("#64748b").fontSize(8).text("DATE:", rightLabelX, bodyY);
    doc.fillColor("#111827").fontSize(10).text(new Date(bill.createdAt).toLocaleDateString('en-IN'), rightValueX, bodyY);

    doc.fillColor("#64748b").fontSize(8).text("RECEIPT NO:", rightLabelX, bodyY + 20);
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(10).text(bill.receiptNo, rightValueX, bodyY + 20);

    // 2. Billing Table
    const tableTop = bodyY + 110;
    doc.rect(40, tableTop, 520, 22).fillColor("#1e293b").fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("PARTICULARS / DESCRIPTION", 60, tableTop + 7);
    doc.text("AMOUNT (INR)", 450, tableTop + 7, { width: 100, align: "right" });

    // Item Row
    doc.fillColor("#334155").font("Helvetica").fontSize(10).text("Patient Registration & Consultation Charges", 60, tableTop + 40);
    doc.font("Helvetica-Bold").text(bill.amount.toFixed(2), 450, tableTop + 40, { width: 100, align: "right" });

    // Divider
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, tableTop + 70).lineTo(560, tableTop + 70).stroke();

    // 3. Totals section
    const totalY = tableTop + 85;
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(11).text("TOTAL PAYABLE:", 350, totalY);
    doc.text(`INR ${bill.amount.toFixed(2)}`, 450, totalY, { width: 100, align: "right" });

    // Amount in words Card
    doc.rect(40, totalY + 30, 520, 40).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text("Amount in words:", 50, totalY + 40);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text(numberToWords(bill.amount), 50, totalY + 52, { width: 500 });

    // Payment Mode
    doc.fillColor("#475569").font("Helvetica-Bold").fontSize(9).text(`Payment Mode: ${bill.paymentMode.toUpperCase()}`, 40, totalY + 90);

    // 4. Footer & Signature
    const footerY = 650;
    doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(350, footerY + 50).lineTo(550, footerY + 50).stroke();
    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(10).text(`FOR ${branding.clinicName.toUpperCase()}`, 350, footerY + 60, { width: 200, align: "center" });
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text("(Authorized Signatory)", 350, footerY + 75, { width: 200, align: "center" });

    doc.fontSize(8).fillColor("#94a3b8").text("This is a computer generated receipt and does not require a physical signature.", 40, 780, { align: "center" });

    doc.end();
};
