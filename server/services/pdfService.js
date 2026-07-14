const PDFDocument = require('pdfkit');

/**
 * Generates a PDF buffer for a prescription.
 * @param {Object} data - Prescription details (patient, doctor, medicines, diagnosis, etc.)
 * @returns {Promise<Buffer>}
 */
const generatePrescriptionPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- Header Design ---
      doc.fillColor('#0d9488')
         .fontSize(22)
         .text('HMS DIGITAL PRESCRIPTION', { align: 'center' });
      doc.fontSize(10)
         .fillColor('#666666')
         .text('HMS Healthcare Center | 123 Health Ave, New York', { align: 'center' })
         .moveDown(2);

      // Divider line
      doc.moveTo(50, doc.y)
         .lineTo(562, doc.y)
         .strokeColor('#e5e7eb')
         .stroke()
         .moveDown(1);

      // --- Patient & Doctor Info ---
      doc.fontSize(12).fillColor('#1f2937');
      
      const startY = doc.y;
      
      // Left Column: Patient
      doc.text('PATIENT DETAILS:', 50, startY, { underline: true });
      doc.moveDown(0.5);
      doc.text(`Name: ${data.patientName}`);
      doc.text(`Age/DOB: ${data.patientDOB || 'N/A'}`);
      doc.text(`Gender: ${data.patientGender || 'N/A'}`);
      doc.text(`Blood Group: ${data.patientBloodGroup || 'N/A'}`);

      // Right Column: Doctor (X coordinate: 350)
      doc.text('DOCTOR DETAILS:', 350, startY, { underline: true });
      doc.moveDown(0.5);
      doc.text(`Name: ${data.doctorName}`, 350);
      doc.text(`Specialization: ${data.doctorSpecialization || 'N/A'}`, 350);
      doc.text(`License No: ${data.doctorLicense || 'N/A'}`, 350);
      doc.text(`Date: ${data.date}`, 350);

      doc.moveDown(2);

      // Divider line
      doc.moveTo(50, doc.y)
         .lineTo(562, doc.y)
         .strokeColor('#e5e7eb')
         .stroke()
         .moveDown(1);

      // --- Clinical Details ---
      doc.fontSize(12).fillColor('#1f2937');
      doc.text(`Diagnosis:`, 50, doc.y, { bold: true });
      doc.fontSize(10).fillColor('#4b5563');
      doc.text(data.diagnosis || 'No diagnosis provided');
      doc.moveDown(1);

      if (data.symptoms && data.symptoms.length > 0) {
        doc.fontSize(12).fillColor('#1f2937').text(`Symptoms:`, 50, doc.y, { bold: true });
        doc.fontSize(10).fillColor('#4b5563');
        doc.text(data.symptoms.join(', '));
        doc.moveDown(1);
      }

      // --- Medicines Table ---
      doc.fontSize(12).fillColor('#0d9488').text('PRESCRIBED MEDICINES:', 50, doc.y, { bold: true }).moveDown(0.5);
      
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#1f2937');

      // Table Headers
      doc.text('Medicine Name', 50, tableTop, { width: 150, bold: true });
      doc.text('Dosage', 200, tableTop, { width: 80, bold: true });
      doc.text('Frequency', 290, tableTop, { width: 100, bold: true });
      doc.text('Duration', 400, tableTop, { width: 80, bold: true });
      doc.text('Instructions', 490, tableTop, { width: 100, bold: true });

      doc.moveTo(50, tableTop + 15)
         .lineTo(562, tableTop + 15)
         .strokeColor('#0d9488')
         .stroke();

      let currentY = tableTop + 20;

      data.medicines.forEach((med) => {
        // Check if page overflow
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.fontSize(9).fillColor('#4b5563');
        doc.text(med.name, 50, currentY, { width: 140 });
        doc.text(med.dosage, 200, currentY, { width: 80 });
        doc.text(med.frequency, 290, currentY, { width: 100 });
        doc.text(med.duration, 400, currentY, { width: 80 });
        doc.text(med.instructions || '', 490, currentY, { width: 100 });

        currentY += 25;
      });

      doc.moveTo(50, currentY)
         .lineTo(562, currentY)
         .strokeColor('#e5e7eb')
         .stroke()
         .moveDown(2);

      // --- Advice & Follow Up ---
      currentY += 15;
      if (data.advice) {
        doc.fontSize(11).fillColor('#1f2937').text('General Advice:', 50, currentY, { bold: true });
        doc.fontSize(9).fillColor('#4b5563').text(data.advice, 50, currentY + 15);
        currentY += 45;
      }

      if (data.followUpDate) {
        doc.fontSize(10).fillColor('#1f2937').text(`Follow-up Date: ${data.followUpDate}`, 50, currentY);
      }

      // --- Doctor Signature (Bottom Right) ---
      const sigY = 680;
      doc.moveTo(380, sigY)
         .lineTo(530, sigY)
         .strokeColor('#9ca3af')
         .stroke();
      
      doc.fontSize(9).fillColor('#666666')
         .text('Authorized Digital Signature', 380, sigY + 5, { align: 'center', width: 150 });

      if (data.doctorSignatureSnapshot) {
        // If snapshot is available, we write it in clean handwriting font or embed if it's base64/image
        doc.fontSize(14).font('Courier-Oblique').fillColor('#1e40af')
           .text(data.doctorName, 380, sigY - 20, { align: 'center', width: 150 });
      } else {
        doc.fontSize(14).font('Courier-Oblique').fillColor('#1e40af')
           .text(data.doctorName, 380, sigY - 20, { align: 'center', width: 150 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePrescriptionPDF,
};
