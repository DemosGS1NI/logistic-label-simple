// src/lib/barcodeGenerator.js
import bwipjs from 'bwip-js';

export async function generateGS1BarcodePNG(data, options = {}) {
  const defaultOptions = {
    bcid: 'gs1-128',
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
    textsize: 10
  };
  
  const barcodeOptions = { ...defaultOptions, ...options, text: data };
  
  return new Promise((resolve, reject) => {
    try {
      bwipjs.toBuffer(barcodeOptions, (err, png) => {
        if (err) {
          console.error('BWIP-JS Error:', err);
          reject(err);
        } else {
          console.log('Barcode PNG generated successfully');
          resolve(png);
        }
      });
    } catch (error) {
      console.error('Barcode generation catch error:', error);
      reject(error);
    }
  });
}