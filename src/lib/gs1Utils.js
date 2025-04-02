// src/lib/gs1Utils.js
export function generateSSCC(companyPrefix = null, extensionDigit = null) {
  // Your existing SSCC generation logic looks good
  const prefix = companyPrefix || Math.floor(1000000 + Math.random() * 9000000).toString();
  const extension = extensionDigit !== null ? extensionDigit.toString() : Math.floor(Math.random() * 10).toString();
  
  const serialLength = 17 - prefix.length - 1;
  let serialReference = '';
  for (let i = 0; i < serialLength; i++) {
    serialReference += Math.floor(Math.random() * 10).toString();
  }
  
  const ssccWithoutCheck = extension + prefix + serialReference;
  const checkDigit = calculateGS1CheckDigit(ssccWithoutCheck);
  
  return ssccWithoutCheck + checkDigit;
}

export function calculateGS1CheckDigit(digits) {
  // Your existing check digit calculation is good
  if (typeof digits !== 'string' || !/^\d+$/.test(digits)) {
    throw new Error('Input must be a string of digits');
  }
  
  const digitsArray = digits.split('').map(d => parseInt(d));
  let sum = 0;
  
  digitsArray.forEach((digit, index) => {
    const multiplier = (index % 2 === 0) ? 3 : 1;
    sum += digit * multiplier;
  });
  
  return (10 - (sum % 10)) % 10;
}

export function formatGS1Date(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

export function formatGS1Weight(weight, decimalPlaces = 0) {
  if (weight === undefined || weight === null) return '000000';
  
  const numWeight = parseFloat(weight);
  
  if (isNaN(numWeight)) return '000000';
  
  const scaledWeight = Math.round(numWeight * Math.pow(10, decimalPlaces));
  
  return scaledWeight.toString().padStart(6, '0');
}