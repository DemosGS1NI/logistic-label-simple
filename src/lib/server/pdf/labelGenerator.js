// src/lib/server/pdf/labelGenerator.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateGS1Barcode, formatDateForGS1 } from './barcodeGenerator';

/**
 * Generate a 4x6 inch logistic label PDF following GS1-128 standards
 * 
 * @param {Object} labelData - Label data to include on the label
 * @param {Object} options - Additional options for the label
 * @returns {Promise<Buffer>} - PDF document as buffer
 */
export async function generateLogisticLabelPDF(labelData, options = {}) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Set the page size to 4x6 inches (converted to points: 1 inch = 72 points)
  const pageWidth = 4 * 72;
  const pageHeight = 6 * 72;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Get fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Set margins
  const margin = 18; // 0.25 inch margin
  
  // Extract label data
  const { 
    gtin, 
    lot_number, 
    production_date, 
    quantity, 
    weight_pounds, 
    sscc,
    id = 'TEMP',
    created_at = new Date().toISOString(),
    company_name = options.company_name || 'COMPANY NAME',
    company_address = options.company_address || 'Company Address, City, Country'
  } = labelData;
  
  // Format dates
  const formattedProductionDate = new Date(production_date).toLocaleDateString();
  const gs1ProductionDate = formatDateForGS1(production_date);
  
  // Calculate sections
  const headerHeight = pageHeight * 0.15; // Top 15%
  const midHeight = pageHeight * 0.35;    // Middle 35%
  const barcodeHeight = pageHeight * 0.5; // Bottom 50%
  
  // ---- TOP SECTION: COMPANY INFO ----
  
  // Company name
  page.drawText(company_name, {
    x: margin,
    y: pageHeight - margin - 15,
    size: 15,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  // Company address (optional)
  if (company_address) {
    page.drawText(company_address, {
      x: margin,
      y: pageHeight - margin - 35,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0)
    });
  }
  
  // Label type indicator
  page.drawText('GS1-128 LOGISTIC LABEL', {
    x: pageWidth - margin - 140,
    y: pageHeight - margin - 15,
    size: 9,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  // Draw horizontal line below header
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // ---- MIDDLE SECTION: HUMAN-READABLE INFO ----
  
  const textY = pageHeight - headerHeight - 20;
  const textXLeft = margin;
  const textXRight = pageWidth / 2 + 10;
  const lineHeight = 20;
  
  // Left column
  // GTIN with AI label
  page.drawText('(01) GTIN:', {
    x: textXLeft,
    y: textY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(gtin, {
    x: textXLeft + 70,
    y: textY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Lot number with AI label
  page.drawText('(10) LOT:', {
    x: textXLeft,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(lot_number, {
    x: textXLeft + 70,
    y: textY - lineHeight,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Production date with AI label
  page.drawText('(11) PROD DATE:', {
    x: textXLeft,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`${formattedProductionDate} (${gs1ProductionDate})`, {
    x: textXLeft + 90,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Right column
  // Quantity with AI label
  page.drawText('(37) QUANTITY:', {
    x: textXRight,
    y: textY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(quantity.toString(), {
    x: textXRight + 90,
    y: textY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Weight with AI label
  page.drawText('(3201) WEIGHT:', {
    x: textXRight,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`${weight_pounds} lb`, {
    x: textXRight + 90,
    y: textY - lineHeight,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // SSCC with AI label
  page.drawText('(00) SSCC:', {
    x: textXRight,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(sscc, {
    x: textXRight + 90,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Draw horizontal line below middle section
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight - midHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight - midHeight },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // ---- BOTTOM SECTION: BARCODES ----
  
  // 1. CONTENT BARCODE (GTIN & LOT & DATE)
  // Combine GTIN, lot number, and production date
  const contentData = {
    GTIN: gtin,
    BATCH_LOT: lot_number,
    PROD_DATE: production_date
  };
  
  const contentBarcode = await generateGS1Barcode(contentData, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  const contentImage = await pdfDoc.embedPng(contentBarcode);
  const contentDims = contentImage.scale(0.7); // Scale to fit
  
  page.drawImage(contentImage, {
    x: (pageWidth - contentDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - contentDims.height - 20,
    width: contentDims.width,
    height: contentDims.height
  });
  
  // 2. QUANTITY & WEIGHT BARCODE
  const quantityData = {
    QTY: quantity.toString(),
    WEIGHT_LB: weight_pounds.toString()
  };
  
  const quantityBarcode = await generateGS1Barcode(quantityData, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  const quantityImage = await pdfDoc.embedPng(quantityBarcode);
  const quantityDims = quantityImage.scale(0.7); // Scale to fit
  
  page.drawImage(quantityImage, {
    x: (pageWidth - quantityDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - contentDims.height - quantityDims.height - 40,
    width: quantityDims.width,
    height: quantityDims.height
  });
  
  // 3. SSCC BARCODE (always at the bottom as per GS1 standards)
  const ssccData = { SSCC: sscc };
  const ssccBarcode = await generateGS1Barcode(ssccData, {
    scale: 3,
    height: 15, // Make SSCC barcode slightly taller for better scanning
    textsize: 12
  });
  
  const ssccImage = await pdfDoc.embedPng(ssccBarcode);
  const ssccDims = ssccImage.scale(0.7); // Scale to fit
  
  page.drawImage(ssccImage, {
    x: (pageWidth - ssccDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - contentDims.height - quantityDims.height - ssccDims.height - 60,
    width: ssccDims.width,
    height: ssccDims.height
  });
  
  // Add label ID and creation date at the bottom
  page.drawText(`ID: ${id} | Created: ${new Date(created_at).toLocaleString()}`, {
    x: margin,
    y: margin / 2,
    size: 7,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Generate PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a PDF with multiple logistic labels
 * 
 * @param {Array} labelDataArray - Array of label data objects
 * @param {Object} options - Additional options
 * @returns {Promise<Buffer>} - PDF document as buffer
 */
export async function generateMultipleLogisticLabels(labelDataArray, options = {}) {
  if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
    throw new Error('No label data provided');
  }
  
  // Create a document with all labels
  const pdfDoc = await PDFDocument.create();
  
  // Add each label as a separate page
  for (const labelData of labelDataArray) {
    // Generate individual label
    const labelPdfBytes = await generateLogisticLabelPDF(labelData, options);
    const labelPdf = await PDFDocument.load(labelPdfBytes);
    
    // Copy pages from label PDF to main document
    const [labelPage] = await pdfDoc.copyPages(labelPdf, [0]);
    pdfDoc.addPage(labelPage);
  }
  
  // Generate final PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export default {
  generateLogisticLabelPDF,
  generateMultipleLogisticLabels
};