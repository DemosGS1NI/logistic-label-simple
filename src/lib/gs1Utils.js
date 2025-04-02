// src/lib/utils/gs1Utils.js

/**
 * Generate a valid SSCC (Serial Shipping Container Code)
 * Following GS1 standards for logistics labels
 * 
 * @param {string} companyPrefix - GS1 Company Prefix (default: random 7-digit number)
 * @param {number} extensionDigit - Extension digit (0-9)
 * @returns {string} - Generated SSCC
 */
export function generateSSCC(companyPrefix = null, extensionDigit = null) {
  // If no company prefix is provided, generate a random 7-digit number
  const prefix = companyPrefix || Math.floor(1000000 + Math.random() * 9000000).toString();
  
  // Extension digit (0-9)
  const extension = extensionDigit !== null ? extensionDigit.toString() : Math.floor(Math.random() * 10).toString();
  
  // Serial reference (random digits to fill the remaining space)
  const serialLength = 17 - prefix.length - 1; // Total 18 digits - prefix - extension
  let serialReference = '';
  for (let i = 0; i < serialLength; i++) {
    serialReference += Math.floor(Math.random() * 10).toString();
  }
  
  // Combine to get SSCC without check digit
  const ssccWithoutCheck = extension + prefix + serialReference;
  
  // Calculate check digit
  const checkDigit = calculateGS1CheckDigit(ssccWithoutCheck);
  
  // Return the complete SSCC
  return ssccWithoutCheck + checkDigit;
}

/**
 * Calculate the check digit for a GS1 number
 * 
 * @param {string} digits - Digits to calculate check digit for
 * @returns {number} - Check digit
 */
export function calculateGS1CheckDigit(digits) {
  if (typeof digits !== 'string' || !/^\d+$/.test(digits)) {
    throw new Error('Input must be a string of digits');
  }
  
  const digitsArray = digits.split('').map(d => parseInt(d));
  let sum = 0;
  
  digitsArray.forEach((digit, index) => {
    // For GS1 check digit calculation, alternating multipliers of 3 and 1 are used
    // Starting with 3 for the rightmost digit (reverse order from typical presentation)
    // Since we're processing left-to-right, we need to adjust the pattern
    const multiplier = (index % 2 === 0) ? 3 : 1; // Alternating multipliers
    sum += digit * multiplier;
  });
  
  // Calculate the check digit
  return (10 - (sum % 10)) % 10;
}

/**
 * Validate a GTIN (Global Trade Item Number)
 * 
 * @param {string} gtin - GTIN to validate (14 digits)
 * @returns {boolean} - True if valid
 */
export function validateGTIN(gtin) {
  // Check if it's a string and has exactly 14 digits
  if (typeof gtin !== 'string' || !/^\d{14}$/.test(gtin)) {
    return false;
  }
  
  // Check the check digit using the GS1 algorithm
  const digits = gtin.split('').map(d => parseInt(d));
  const checkDigit = digits.pop(); // Remove and save the check digit
  
  // Calculate the check digit
  let sum = 0;
  digits.forEach((digit, index) => {
    // Multiply by 3 for odd positions (0-based index, even positions in 1-based)
    // Multiply by 1 for even positions (0-based index, odd positions in 1-based)
    const multiplier = index % 2 === 0 ? 1 : 3;
    sum += digit * multiplier;
  });
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  return calculatedCheckDigit === checkDigit;
}

/**
 * Validate a lot number according to GS1 standards
 * 
 * @param {string} lotNumber - Lot number to validate
 * @returns {boolean} - True if valid
 */
export function validateLotNumber(lotNumber) {
  // GS1 standards allow 1-20 alphanumeric characters for lot numbers
  return typeof lotNumber === 'string' && 
         lotNumber.length >= 1 && 
         lotNumber.length <= 20 && 
         /^[A-Za-z0-9]+$/.test(lotNumber);
}

/**
 * Format a date for GS1 standards (YYMMDD)
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} - Date formatted as YYMMDD
 */
export function formatGS1Date(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  // Format as YYMMDD per GS1 standards
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

/**
 * Format a weight value for GS1 with specified decimal places
 * For Application Identifiers 310n - 316n
 * 
 * @param {number|string} weight - Weight value
 * @param {number} decimalPlaces - Number of decimal places (0-6)
 * @returns {string} - Formatted weight (6 digits)
 */
export function formatGS1Weight(weight, decimalPlaces = 0) {
  if (weight === undefined || weight === null) return '000000';
  
  const numWeight = parseFloat(weight);
  
  // Check if the weight is valid
  if (isNaN(numWeight)) return '000000';
  
  // Multiply by 10^decimalPlaces to get an integer with implied decimal point
  const scaledWeight = Math.round(numWeight * Math.pow(10, decimalPlaces));
  
  // Pad to 6 digits per GS1 standards
  return scaledWeight.toString().padStart(6, '0');
}

export default {
  generateSSCC,
  calculateGS1CheckDigit,
  validateGTIN,
  validateLotNumber,
  formatGS1Date,
  formatGS1Weight
};