// src/lib/pdfGenerator.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatGS1Date, formatGS1Weight } from './gs1Utils';
import { generateGS1BarcodeAsSVG } from './barcodeGenerator';

/**
 * Generate a GS1-128 logistics label PDF
 * @param {Object} data - Label data
 * @returns {Promise<Uint8Array>} - PDF binary data
 */
export async function generateGS1LabelPDF(data) {
  const {
    companyName,
    companyAddress,
    sscc,
    lotNumber,
    productionDate,
    quantity,
    weight
  } = data;
  
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Set page size to 4x6 inches (standard label size)
  const pageWidth = 4 * 72;
  const pageHeight = 6 * 72;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Get fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Set margins
  const margin = 18;
  
  // Format dates
  const formattedDate = new Date(productionDate).toLocaleDateString();
  const gs1Date = formatGS1Date(productionDate);
  
  // Format weight for GS1 (with 1 decimal place)
  const gs1Weight = formatGS1Weight(weight, 1);
  
  // Barcode generation preparation
  const lotDateBarcode = `(10)${lotNumber}(11)${gs1Date}`;
  const quantityBarcode = `(37)${quantity.toString().padStart(6, '0')}(3201)${gs1Weight}`;
  const ssccBarcode = `(00)${sscc}`;
  
  // Barcode and HRI dimensions
  const barcodeWidth = pageWidth - (margin * 2);
  const barcodeHeight = 40;
  const hriHeight = 15;
  const barcodeSpacer = 10;
  
  // Vertical positioning (bottom-up, with SSCC at bottom)
  const ssccBarcodeY = margin;
  const ssccHRIY = ssccBarcodeY + barcodeHeight;
  
  const quantityBarcodeY = ssccHRIY + hriHeight + barcodeSpacer;
  const quantityHRIY = quantityBarcodeY + barcodeHeight;
  
  const lotDateBarcodeY = quantityHRIY + hriHeight + barcodeSpacer;
  const lotDateHRIY = lotDateBarcodeY + barcodeHeight;
  
  // Company header (top of the label)
  page.drawText(companyName, {
    x: margin,
    y: pageHeight - margin - 15,
    size: 16,
    font: helveticaBold
  });
  
  page.drawText(companyAddress, {
    x: margin,
    y: pageHeight - margin - 35,
    size: 10,
    font: helvetica
  });
  
  // Divider line
  page.drawLine({
    start: { x: margin, y: pageHeight - 60 },
    end: { x: pageWidth - margin, y: pageHeight - 60 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Text information section
  const textY = pageHeight - 80;
  const lineHeight = 18;
  
  page.drawText('SSCC:', {
    x: margin,
    y: textY,
    size: 12,
    font: helveticaBold
  });
  
  page.drawText(sscc, {
    x: margin + 50,
    y: textY,
    size: 12,
    font: helvetica
  });
  
  // Lot Number
  page.drawText('BATCH/LOT:', {
    x: margin,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold
  });
  
  page.drawText(lotNumber, {
    x: margin + 80,
    y: textY - lineHeight,
    size: 10,
    font: helvetica
  });
  
  // Production Date
  page.drawText('PROD DATE:', {
    x: margin,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold
  });
  
  page.drawText(`${formattedDate}`, {
    x: margin + 80,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica
  });
  
  // Quantity
  page.drawText('COUNT:', {
    x: margin + 200,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold
  });
  
  page.drawText(quantity.toString(), {
    x: margin + 250,
    y: textY - lineHeight,
    size: 10,
    font: helvetica
  });
  
  // Weight
  page.drawText('NET WT (lb):', {
    x: margin + 200,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold
  });
  
  page.drawText(weight.toString(), {
    x: margin + 270,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica
  });
  
  // Divider before barcodes
  page.drawLine({
    start: { x: margin, y: lotDateBarcodeY + barcodeSpacer },
    end: { x: pageWidth - margin, y: lotDateBarcodeY + barcodeSpacer },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // TODO: Implement actual barcode generation and embedding
  // This will require modifications to embed SVG or PNG barcodes
  // Placeholder for barcode generation logic
  page.drawText('Barcode Generation Pending', {
    x: margin,
    y: lotDateBarcodeY,
    size: 10,
    font: helvetica
  });
  
  // Add HRI text placeholders
  page.drawText(lotDateBarcode, {
    x: margin,
    y: lotDateHRIY,
    size: 8,
    font: helvetica
  });
  
  page.drawText(quantityBarcode, {
    x: margin,
    y: quantityHRIY,
    size: 8,
    font: helvetica
  });
  
  page.drawText(ssccBarcode, {
    x: margin,
    y: ssccHRIY,
    size: 8,
    font: helvetica
  });
  
  // Generate PDF
  return await pdfDoc.save();
}

/**
 * Generate and trigger download of a GS1 label PDF
 * @param {Object} data - Label data
 * @returns {Promise<void>}
 */
export async function generateAndDownloadLabel(data) {
  try {
    const pdfBytes = await generateGS1LabelPDF(data);
    
    // Create Blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `gs1_label_${data.lotNumber}_${formatGS1Date(data.productionDate)}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}