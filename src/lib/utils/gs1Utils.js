// src/lib/utils/gs1Utils.js

/**
 * Validate a GTIN (Global Trade Item Number)
 * 
 * @param {string} gtin - GTIN to validate
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
      const multiplier = index % 2 === 0 ? 3 : 1;
      sum += digit * multiplier;
    });
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    
    return calculatedCheckDigit === checkDigit;
  }
  
  /**
   * Validate a lot number
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
   * Generate a valid SSCC (Serial Shipping Container Code)
   * 
   * @param {string} companyPrefix - GS1 Company Prefix (default: random 7-digit number)
   * @returns {string} - Generated SSCC
   */
  export function generateSSCC(companyPrefix = null) {
    // If no company prefix is provided, generate a random 7-digit number
    const prefix = companyPrefix || Math.floor(1000000 + Math.random() * 9000000).toString();
    
    // Extension digit (0-9)
    const extensionDigit = Math.floor(Math.random() * 10).toString();
    
    // Serial reference (random digits to fill the remaining space)
    const serialLength = 17 - prefix.length - 1; // Total 18 digits - prefix - extension
    let serialReference = '';
    for (let i = 0; i < serialLength; i++) {
      serialReference += Math.floor(Math.random() * 10).toString();
    }
    
    // Combine to get SSCC without check digit
    const ssccWithoutCheck = extensionDigit + prefix + serialReference;
    
    // Calculate check digit
    const digits = ssccWithoutCheck.split('').map(d => parseInt(d));
    let sum = 0;
    digits.forEach((digit, index) => {
      // Multiply by 3 for odd positions and by 1 for even positions (in reverse)
      const multiplier = index % 2 === 0 ? 3 : 1;
      sum += digit * multiplier;
    });
    
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Return the complete SSCC
    return ssccWithoutCheck + checkDigit;
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
    
    // Format as YYMMDD
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    return `${year}${month}${day}`;
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
      // Apply alternating multipliers (3,1,3,1,...)
      const multiplier = (index % 2 === 0) ? 3 : 1;
      sum += digit * multiplier;
    });
    
    // Calculate the check digit
    return (10 - (sum % 10)) % 10;
  }
  
  export default {
    validateGTIN,
    validateLotNumber,
    generateSSCC,
    formatGS1Date,
    calculateGS1CheckDigit
  };