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
  
  // Document structure - UPDATED PROPORTIONS
  const headerHeight = pageHeight * 0.15; // 15% for company header
  const midHeight = pageHeight * 0.20;    // REDUCED from 35% to 20% for text data
  // This leaves 65% for barcodes (was 50%)
  
  // Draw company header
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
  
  // Header divider line
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight },
    thickness: 1
  });
  
  // Human readable information
  const textY = pageHeight - headerHeight - 20; // Adjusted vertical position
  const lineHeight = 18; // Slightly reduced to make section more compact
  
  // SSCC
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
  
  // Other data fields
  // First column - Lot Number and Production Date
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
  
  // Second column - Quantity and Weight
  // Quantity
  // Quantity
  page.drawText('COUNT:', {
    x: margin + 150, // Reduced from 180
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold
  });

  page.drawText(quantity.toString(), {
    x: margin + 210, // Reduced from 230
    y: textY - lineHeight,
    size: 10,
    font: helvetica
  });

  // Weight - abbreviated and repositioned
  page.drawText('NET WT (lb):', {
    x: margin + 150, // Reduced from 180
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold
  });

  page.drawText(weight.toString(), {
    x: margin + 230, // Reduced from 280
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica
  });
  
  // Middle section divider
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight - midHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight - midHeight },
    thickness: 1
  });
  
  // Generate barcode strings
  const lotDateBarcode = `(10)${lotNumber}(11)${gs1Date}`;
  const quantityBarcode = `(37)${quantity.toString().padStart(6, '0')}(3201)${gs1Weight}`;
  const ssccBarcode = `(00)${sscc}`;
  
  // UPDATED: Barcode section with more space and proper spacing
  const barcodeWidth = pageWidth - (margin * 2);
  const barcodeHeight = 40; // Standard height for barcode
  const barcodeSpacer = 20; // Space between barcodes
  
  // Calculate barcode positions from the bottom up (SSCC at bottom per GS1 standards)
  const availableSpace = pageHeight - headerHeight - midHeight - margin;
  const totalBarcodeSpace = (barcodeHeight * 3) + (barcodeSpacer * 2);
  
  // Start position for bottom barcode (SSCC)
  const bottomBarcodeY = margin;
  
  // Start position for middle barcode (Quantity/Weight)
  const middleBarcodeY = bottomBarcodeY + barcodeHeight + barcodeSpacer;
  
  // Start position for top barcode (Lot/Date)
  const topBarcodeY = middleBarcodeY + barcodeHeight + barcodeSpacer;
  
  // Lot/Date barcode (top)
  page.drawRectangle({
    x: margin,
    y: topBarcodeY,
    width: barcodeWidth,
    height: barcodeHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });
  
  page.drawText(lotDateBarcode, {
    x: margin + 10,
    y: topBarcodeY + 15,
    size: 10,
    font: helvetica
  });
  
  // Quantity/Weight barcode (middle)
  page.drawRectangle({
    x: margin,
    y: middleBarcodeY,
    width: barcodeWidth,
    height: barcodeHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });
  
  page.drawText(quantityBarcode, {
    x: margin + 10,
    y: middleBarcodeY + 15,
    size: 10,
    font: helvetica
  });
  
  // SSCC barcode (bottom barcode as per GS1 standards)
  page.drawRectangle({
    x: margin,
    y: bottomBarcodeY,
    width: barcodeWidth,
    height: barcodeHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });
  
  page.drawText(ssccBarcode, {
    x: margin + 10,
    y: bottomBarcodeY + 15,
    size: 10,
    font: helvetica
  });
  
  // REMOVED footer with label ID
  
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