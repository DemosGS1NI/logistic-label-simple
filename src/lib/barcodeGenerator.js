// src/lib/barcodeGenerator.js
import bwipjs from 'bwip-js';

/**
 * Generate a GS1-128 barcode as SVG
 * @param {string} data - Data to encode in GS1 format (with AIs in parentheses)
 * @param {Object} options - Optional barcode options
 * @returns {Promise<string>} - SVG string
 */
export async function generateGS1BarcodeAsSVG(data, options = {}) {
  const defaultOptions = {
    bcid: 'gs1-128',
    scale: 2,
    height: 10,
    includetext: true,
    textxalign: 'center',
    textsize: 10
  };
  
  const barcodeOptions = { ...defaultOptions, ...options, text: data };
  
  return new Promise((resolve, reject) => {
    try {
      // Use BWIP-JS to generate SVG
      let svg = bwipjs.toSVG(barcodeOptions);
      resolve(svg);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a GS1-128 barcode as PNG buffer
 * @param {string} data - Data to encode in GS1 format (with AIs in parentheses)
 * @param {Object} options - Optional barcode options
 * @returns {Promise<Buffer>} - PNG buffer
 */
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
    bwipjs.toBuffer(barcodeOptions, (err, png) => {
      if (err) reject(err);
      else resolve(png);
    });
  });
}