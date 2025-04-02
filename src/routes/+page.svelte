<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { generateSSCC } from '$lib/gs1Utils';
  import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
  
  // Form fields
  let lotNumber = '';
  let productionDate = new Date().toISOString().split('T')[0]; // Today's date
  let quantity = '';
  let weight = '';
  
  // Fixed values
  const companyName = 'FINCA EL SOCORRO';
  const companyAddress = 'KM 27.5 Carretera al Crucero';
  
  // Generate SSCC upfront
  let sscc = generateSSCC();
  
  // Form state
  let isGenerating = false;
  let error = null;
  let success = null;
  
  // Format a date for GS1 (YYMMDD format)
  function formatDateForGS1(date) {
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
  
  // Convert ArrayBuffer to base64 for download
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  // Generate a PDF with the logistics label
  async function handleSubmit() {
    isGenerating = true;
    error = null;
    success = null;
    
    try {
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
      
      // Format dates
      const formattedProductionDate = new Date(productionDate).toLocaleDateString();
      const gs1ProductionDate = formatDateForGS1(productionDate);
      
      // Calculate sections
      const headerHeight = pageHeight * 0.15; // Top 15%
      const midHeight = pageHeight * 0.35;    // Middle 35%
      const barcodeHeight = pageHeight * 0.5; // Bottom 50%
      
      // ---- TOP SECTION: COMPANY INFO ----
      
      // Company name
      page.drawText(companyName, {
        x: margin,
        y: pageHeight - margin - 15,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      // Company address
      page.drawText(companyAddress, {
        x: margin,
        y: pageHeight - margin - 35,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
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
      
      // SSCC first (at the top of this section)
      page.drawText('SSCC:', {
        x: textXLeft,
        y: textY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(sscc, {
        x: textXLeft + 50,
        y: textY,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Left column - below SSCC
      // Production date with AI label
      page.drawText('PROD DATE:', {
        x: textXLeft,
        y: textY - lineHeight,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(`${formattedProductionDate} (${gs1ProductionDate})`, {
        x: textXLeft + 80,
        y: textY - lineHeight,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Weight with AI label
      page.drawText('NET WEIGHT (lb):', {
        x: textXLeft,
        y: textY - lineHeight * 2,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(`${weight}`, {
        x: textXLeft + 100,
        y: textY - lineHeight * 2,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Right column
      // Quantity with AI label
      page.drawText('COUNT:', {
        x: textXRight,
        y: textY - lineHeight,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(quantity.toString(), {
        x: textXRight + 60,
        y: textY - lineHeight,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Lot number with AI label
      page.drawText('BATCH/LOT:', {
        x: textXRight,
        y: textY - lineHeight * 2,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(lotNumber, {
        x: textXRight + 80,
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
      
      // ---- BOTTOM SECTION: BARCODES (Placeholder) ----
      
      // Create placeholder barcodes
      // 1. SSCC Barcode (most important, should be at bottom per GS1 standards)
      const ssccY = pageHeight - headerHeight - midHeight - 50;
      page.drawRectangle({
        x: margin,
        y: ssccY - 30,
        width: pageWidth - (margin * 2),
        height: 40,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText(`(00)${sscc}`, {
        x: margin + 10,
        y: ssccY - 15,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // 2. Lot & Date Barcode 
      const lot_dateY = ssccY - 50;
      page.drawRectangle({
        x: margin,
        y: lot_dateY - 20,
        width: pageWidth - (margin * 2),
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText(`(10)${lotNumber}(11)${gs1ProductionDate}`, {
        x: margin + 10,
        y: lot_dateY - 10,
        size: 8,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // 3. Quantity & Weight Barcode
      const qtyWeightY = lot_dateY - 40;
      page.drawRectangle({
        x: margin,
        y: qtyWeightY - 20,
        width: pageWidth - (margin * 2),
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText(`(37)${quantity.padStart(6, '0')}(3201)${(parseFloat(weight)*10).toFixed(0).padStart(6, '0')}`, {
        x: margin + 10,
        y: qtyWeightY - 10,
        size: 8,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Add label ID and creation date at the bottom
      page.drawText(`SSCC: ${sscc} | Created: ${new Date().toLocaleString()}`, {
        x: margin,
        y: margin / 2,
        size: 7,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a Blob from the PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `gs1_label_${lotNumber}_${formatDateForGS1(productionDate)}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Generate a new SSCC for the next label
      sscc = generateSSCC();
      
      success = 'GS1-128 label generated successfully!';
    } catch (err) {
      console.error('Error generating PDF:', err);
      error = 'Error generating label. Please try again.';
    } finally {
      isGenerating = false;
    }
  }
</script>

<svelte:head>
  <title>GS1-128 Logistic Label Generator</title>
</svelte:head>

<div class="max-w-xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6 text-center">GS1-128 Logistic Label Generator</h1>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    {#if error}
      <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        {error}
      </div>
    {/if}
    
    {#if success}
      <div class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
        {success}
      </div>
    {/if}
    
    <div class="mb-6 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
      <h3 class="font-bold">SSCC:</h3>
      <p class="font-mono text-lg">{sscc}</p>
      <p class="text-xs mt-1">This Serial Shipping Container Code will be used to identify your logistic unit</p>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <div>
        <label for="lotNumber" class="block text-sm font-medium text-gray-700 mb-1">
          Lot Number / Batch Number
        </label>
        <input
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="LOT123ABC"
          maxlength="20"
          required
        />
      </div>
      
      <div>
        <label for="productionDate" class="block text-sm font-medium text-gray-700 mb-1">
          Production Date
        </label>
        <input
          type="date"
          id="productionDate"
          bind:value={productionDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          bind:value={quantity}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1000"
          min="1"
          max="999999"
          required
        />
      </div>
      
      <div>
        <label for="weight" class="block text-sm font-medium text-gray-700 mb-1">
          Weight (lbs)
        </label>
        <input
          type="number"
          id="weight"
          bind:value={weight}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="100.5"
          min="0.1"
          max="9999.9"
          step="0.1"
          required
        />
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isGenerating}
          class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {#if isGenerating}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Label...
          {:else}
            Generate GS1-128 Label
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>