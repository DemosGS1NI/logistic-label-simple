// src/lib/server/pdf/barcodeGenerator.js
import bwipjs from 'bwip-js';

/**
 * Generate a GS1-128 barcode with proper Application Identifiers
 * Following GS1 standards for logistics labels
 * 
 * @param {Object} data - Object containing key-value pairs for GS1 data elements
 * @param {Object} options - Barcode options (scale, height, etc.)
 * @returns {Promise<Buffer>} - PNG image buffer of the barcode
 */
export async function generateGS1Barcode(data, options = {}) {
  // Default options per GS1 standards
  const defaultOptions = {
    bcid: 'gs1-128',       // Barcode type (GS1-128)
    scale: 3,              // 3 pixels per bar
    height: 12,            // Bar height in mm (minimum 31.75mm per GS1)
    includetext: true,     // Show human-readable text
    textxalign: 'center',  // Center the text
    textyoffset: 1,        // Offset text upward for readability
    textsize: 10,          // Text size
    textfont: 'Helvetica', // Text font
    parsefnc: true         // Parse FNC (Function) characters - required for GS1
  };
  
  // Merge provided options with defaults
  const barcodeOptions = { ...defaultOptions, ...options };
  
  // Convert the data object into proper GS1 format string
  let gs1DataString = '';
  
  // Process each data element
  for (const [key, value] of Object.entries(data)) {
    // Skip if value is undefined or null
    if (value === undefined || value === null) continue;
    
    // Convert AI to uppercase and handle common AIs
    const ai = key.toUpperCase();
    
    // Add AI and data to the string based on GS1 specifications
    switch (ai) {
      case 'SSCC':
        gs1DataString += `(00)${value}`;
        break;
      case 'GTIN':
        gs1DataString += `(01)${value}`;
        break;
      case 'CONTENT_GTIN':
        gs1DataString += `(02)${value}`;
        break;
      case 'BATCH_LOT':
        gs1DataString += `(10)${value}`;
        break;
      case 'PROD_DATE':
        // Format date as YYMMDD
        gs1DataString += `(11)${formatDateForGS1(value)}`;
        break;
      case 'EXP_DATE':
        // Format date as YYMMDD
        gs1DataString += `(17)${formatDateForGS1(value)}`;
        break;
      case 'QTY':
        // Ensure quantity is padded with leading zeros to 6 digits
        gs1DataString += `(37)${value.toString().padStart(6, '0')}`;
        break;
      case 'WEIGHT_KG':
        // Format weight with 3 decimal places (AI 3103)
        gs1DataString += `(3103)${formatWeightForGS1(value, 3)}`;
        break;
      case 'WEIGHT_LB':
        // Format weight with 1 decimal place (AI 3201)
        gs1DataString += `(3201)${formatWeightForGS1(value, 1)}`;
        break;
      default:
        // If it's a custom AI (like a numeric key), use it directly
        if (/^\d+$/.test(ai)) {
          gs1DataString += `(${ai})${value}`;
        } else {
          console.warn(`Unknown GS1 AI: ${ai}`);
        }
    }
  }
  
  // Generate the barcode using bwip-js
  try {
    barcodeOptions.text = gs1DataString;
    
    // Generate barcode
    const pngBuffer = await new Promise((resolve, reject) => {
      bwipjs.toBuffer(barcodeOptions, (err, png) => {
        if (err) reject(err);
        else resolve(png);
      });
    });
    
    return pngBuffer;
  } catch (error) {
    console.error('Error generating GS1-128 barcode:', error);
    throw error;
  }
}

/**
 * Format a date for GS1 (YYMMDD format) according to GS1 standards
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export function formatDateForGS1(date) {
  if (!date) return '000000';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return '000000';
  
  // Get last 2 digits of year, month (1-12), and day (1-31)
  const year = dateObj.getFullYear().toString().slice(-2);
  // Add +1 to month and pad with leading zero if needed
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

/**
 * Format a weight value for GS1 with specified decimal places
 * 
 * @param {number|string} weight - Weight value
 * @param {number} decimalPlaces - Number of decimal places
 * @returns {string} - Formatted weight
 */
export function formatWeightForGS1(weight, decimalPlaces = 0) {
  if (weight === undefined || weight === null) return '000000';
  
  const numWeight = parseFloat(weight);
  
  // Check if the weight is valid
  if (isNaN(numWeight)) return '000000';
  
  // Multiply by 10^decimalPlaces to get an integer with implied decimal point
  const scaledWeight = Math.round(numWeight * Math.pow(10, decimalPlaces));
  
  // Pad to 6 digits as required by GS1
  return scaledWeight.toString().padStart(6, '0');
}

/**
 * Generate separate barcodes for different sections of a GS1 label
 * 
 * @param {Object} labelData - Data for the label
 * @returns {Promise<Object>} - Object containing PNG buffers for each barcode section
 */
export async function generateGS1SectionBarcodes(labelData) {
  const { 
    gtin, 
    lot_number, 
    production_date, 
    quantity, 
    weight_pounds, 
    sscc 
  } = labelData;
  
  // 1. GTIN, LOT, DATE barcode
  const contentBarcode = await generateGS1Barcode({
    GTIN: gtin,
    BATCH_LOT: lot_number,
    PROD_DATE: production_date
  }, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  // 2. QUANTITY, WEIGHT barcode
  const quantityBarcode = await generateGS1Barcode({
    QTY: quantity.toString(),
    WEIGHT_LB: weight_pounds.toString()
  }, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  // 3. SSCC barcode
  const ssccBarcode = await generateGS1Barcode({
    SSCC: sscc
  }, {
    scale: 3,
    height: 15, // Make SSCC barcode slightly taller for better scanning
    textsize: 10
  });
  
  return {
    contentBarcode,
    quantityBarcode,
    ssccBarcode
  };
}

export default {
  generateGS1Barcode,
  generateGS1SectionBarcodes,
  formatDateForGS1,
  formatWeightForGS1
};