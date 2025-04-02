// src/lib/barcodeGenerator.js
import bwipjs from 'bwip-js';

/**
 * Generate a GS1-128 barcode image as a data URL
 * @param {string} data - Data to encode in GS1 format (with AIs in parentheses)
 * @param {Object} options - Optional barcode options
 * @returns {Promise<string>} - Data URL of the barcode image
 */
export async function generateGS1BarcodeDataURL(data, options = {}) {
  const defaultOptions = {
    bcid: 'gs1-128',
    scale: 3,
    height: 15,
    includetext: true,
    textxalign: 'center',
    textsize: 10
  };
  
  const barcodeOptions = { ...defaultOptions, ...options, text: data };
  
  return new Promise((resolve, reject) => {
    try {
      // Use bwipjs's browser-friendly method
      bwipjs.toCanvas('canvas', barcodeOptions, function(err, canvas) {
        if (err) {
          reject(err);
        } else {
          // Convert canvas to data URL
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        }
      });
    } catch (error) {
      console.error('Error generating barcode:', error);
      reject(error);
    }
  });
}