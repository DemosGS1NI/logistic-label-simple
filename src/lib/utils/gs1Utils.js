// src/lib/utils/gs1Utils.js
/**
 * A comprehensive utility library for GS1 standards
 * Contains functions for validation, formatting, and generation of GS1 identifiers
 */

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
      // Multiply by 3 for even positions (0-based index, odd positions in 1-based)
      // Multiply by 1 for odd positions (0-based index, even positions in 1-based)
      const multiplier = index % 2 === 0 ? 3 : 1;
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
   * Generate a valid SSCC (Serial Shipping Container Code)
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
    
    // Pad to 6 digits
    return scaledWeight.toString().padStart(6, '0');
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
      const multiplier = (index % 2 === 0) ? 3 : 1;
      sum += digit * multiplier;
    });
    
    // Calculate the check digit
    return (10 - (sum % 10)) % 10;
  }
  
  /**
   * Create a GS1 DataMatrix from data elements
   * 
   * @param {Object} dataElements - Object with GS1 Application Identifiers and values
   * @returns {string} - GS1 DataMatrix string
   */
  export function createGS1DataMatrix(dataElements) {
    // Initialize with FNC1 for GS1 compliance
    let dataMatrix = '';
    const keys = Object.keys(dataElements);
    
    keys.forEach((ai, index) => {
      // Skip if value is undefined or null
      if (dataElements[ai] === undefined || dataElements[ai] === null) return;
      
      // Add the Application Identifier
      dataMatrix += `(${ai})`;
      
      // Add the value
      dataMatrix += dataElements[ai];
      
      // Add FNC1 separator only if this is a variable-length AI and not the last element
      if (index < keys.length - 1 && isVariableLengthAI(ai)) {
        dataMatrix += '<GS>'; // Group Separator (ASCII 29)
      }
    });
    
    return dataMatrix;
  }
  
  /**
   * Check if an Application Identifier is variable length
   * 
   * @param {string} ai - Application Identifier
   * @returns {boolean} - True if variable length
   */
  export function isVariableLengthAI(ai) {
    // List of variable-length AIs according to GS1 standards
    const variableLengthAIs = [
      '00', '01', '02', '10', '11', '12', '13', '15', '17', '20', 
      '21', '22', '30', '37', '90', '91', '92', '93', '94', '95', 
      '96', '97', '98', '99'
    ];
    
    return variableLengthAIs.includes(ai);
  }
  
  /**
   * Generate a GS1-128 application string for a specific AI
   * 
   * @param {string} ai - Application Identifier
   * @param {string} value - Value for the AI
   * @returns {string} - Formatted GS1-128 string
   */
  export function formatGS1ApplicationString(ai, value) {
    return `(${ai})${value}`;
  }
  
  /**
   * Create a GS1-128 barcode string with multiple application identifiers
   * 
   * @param {Object} data - Object with key-value pairs for GS1 data elements
   * @returns {string} - GS1-128 barcode string
   */
  export function createGS1BarcodeString(data) {
    let gs1String = '';
    
    // Process each data element
    for (const [key, value] of Object.entries(data)) {
      // Skip if value is undefined or null
      if (value === undefined || value === null) continue;
      
      // Convert AI to uppercase and handle common AIs
      const ai = key.toUpperCase();
      
      // Add AI and data to the string based on GS1 specifications
      switch (ai) {
        case 'SSCC':
          gs1String += `(00)${value}`;
          break;
        case 'GTIN':
          gs1String += `(01)${value}`;
          break;
        case 'CONTENT_GTIN':
          gs1String += `(02)${value}`;
          break;
        case 'BATCH_LOT':
          gs1String += `(10)${value}`;
          break;
        case 'PROD_DATE':
          // Format date as YYMMDD
          gs1String += `(11)${formatGS1Date(value)}`;
          break;
        case 'EXP_DATE':
          // Format date as YYMMDD
          gs1String += `(17)${formatGS1Date(value)}`;
          break;
        case 'QTY':
          // Ensure quantity is padded with leading zeros to 6 digits
          gs1String += `(37)${value.toString().padStart(6, '0')}`;
          break;
        case 'WEIGHT_KG':
          // Format weight with 3 decimal places (AI 3103)
          gs1String += `(3103)${formatGS1Weight(value, 3)}`;
          break;
        case 'WEIGHT_LB':
          // Format weight with 1 decimal place (AI 3201)
          gs1String += `(3201)${formatGS1Weight(value, 1)}`;
          break;
        default:
          // If it's a custom AI (like a numeric key), use it directly
          if (/^\d+$/.test(ai)) {
            gs1String += `(${ai})${value}`;
          } else {
            console.warn(`Unknown GS1 AI: ${ai}`);
          }
      }
      
      // Add separator for variable length AIs
      if (isVariableLengthAI(ai)) {
        gs1String += '<GS>'; // Group Separator
      }
    }
    
    // Remove trailing separator if exists
    if (gs1String.endsWith('<GS>')) {
      gs1String = gs1String.slice(0, -4);
    }
    
    return gs1String;
  }
  
  /**
   * Validate SSCC (Serial Shipping Container Code)
   * 
   * @param {string} sscc - SSCC to validate
   * @returns {boolean} - True if valid
   */
  export function validateSSCC(sscc) {
    // Check if it's a string and has exactly 18 digits
    if (typeof sscc !== 'string' || !/^\d{18}$/.test(sscc)) {
      return false;
    }
    
    // Check the check digit using the GS1 algorithm
    const digits = sscc.slice(0, 17).split('').map(d => parseInt(d));
    const checkDigit = parseInt(sscc.charAt(17));
    
    let sum = 0;
    digits.forEach((digit, index) => {
      // Multiply by 3 for even positions and by 1 for odd positions
      const multiplier = index % 2 === 0 ? 3 : 1;
      sum += digit * multiplier;
    });
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    
    return calculatedCheckDigit === checkDigit;
  }
  
  // Export all functions as a default object
  export default {
    validateGTIN,
    validateLotNumber,
    validateSSCC,
    generateSSCC,
    formatGS1Date,
    formatGS1Weight,
    calculateGS1CheckDigit,
    createGS1DataMatrix,
    isVariableLengthAI,
    formatGS1ApplicationString,
    createGS1BarcodeString
  };