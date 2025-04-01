<script>
    import { onMount } from 'svelte';
    import { generateSSCC } from '$lib/utils/gs1Utils';
    import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
    
    // Form fields
    let gtin = '';
    let gtinError = '';
    let lotNumber = '';
    let productionDate = new Date().toISOString().split('T')[0]; // Today's date
    let quantity = '';
    let weight = '';
    let companyName = 'Your Company Name';
    let companyAddress = 'Your Company Address';
    
    // Form state
    let isGenerating = false;
    let error = null;
    let success = null;
    let previewImage = null;
    
    // Validate GTIN input while typing
    function validateGtinInput() {
      // Clear error if empty (for required validation)
      if (gtin.length === 0) {
        gtinError = '';
        return;
      }
      
      // Check if input contains only digits
      if (!/^\d*$/.test(gtin)) {
        gtinError = 'GTIN must contain only digits (0-9)';
        // Automatically remove non-digits
        gtin = gtin.replace(/\D/g, '');
        return;
      }
      
      // Check if we have the right number of digits
      if (gtin.length < 14) {
        gtinError = `GTIN must be 14 digits (${14 - gtin.length} more needed)`;
        return;
      }
      
      // Validate check digit if we have all 14 digits
      if (gtin.length === 14) {
        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 13; i++) {
          const digit = parseInt(gtin.charAt(i), 10);
          // Apply different multiplier based on position (3 for even positions, 1 for odd)
          const multiplier = i % 2 === 0 ? 1 : 3;
          sum += digit * multiplier;
        }
        
        // Calculate expected check digit
        const expectedCheckDigit = (10 - (sum % 10)) % 10;
        const actualCheckDigit = parseInt(gtin.charAt(13), 10);
        
        if (expectedCheckDigit !== actualCheckDigit) {
          gtinError = `Invalid check digit. Expected: ${expectedCheckDigit}`;
        } else {
          gtinError = ''; // Valid GTIN!
        }
      }
    }
    
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
    
    // Generate a PDF with the logistics label
    async function generateLogisticLabelPDF() {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a new page (4x6 inches - standard logistics label size)
      const page = pdfDoc.addPage([4 * 72, 6 * 72]); // 72 points per inch
      
      // Get fonts
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Set margins
      const margin = 18; // 0.25 inch margin
      const pageWidth = 4 * 72;
      const pageHeight = 6 * 72;
      
      // Generate SSCC for this label
      const sscc = generateSSCC();
      
      // Format dates for display
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
      };
      
      // Format date for GS1
      const gs1Date = formatDateForGS1(productionDate);
      
      // Calculate sections
      const headerHeight = pageHeight * 0.15; // Top 15%
      const midHeight = pageHeight * 0.35;    // Middle 35%
      const barcodeHeight = pageHeight * 0.5; // Bottom 50%
      
      // ---- TOP SECTION: COMPANY INFO ----
      
      // Company name
      page.drawText(companyName, {
        x: margin,
        y: pageHeight - margin - 15,
        size: 15,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      // Company address
      page.drawText(companyAddress, {
        x: margin,
        y: pageHeight - margin - 35,
        size: 9,
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
      
      page.drawText(lotNumber, {
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
      
      page.drawText(`${formatDate(productionDate)} (${gs1Date})`, {
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
      
      page.drawText(`${weight} lb`, {
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
      
      // ---- BOTTOM SECTION: BARCODES (Placeholder) ----
      
      // In a real implementation, this would use the bwip-js library to generate 
      // proper GS1-128 barcodes. Since we're simplifying, we'll just draw boxes
      
      // 1. GTIN + LOT + PROD DATE Barcode
      const barcode1Y = pageHeight - headerHeight - midHeight - 40;
      page.drawRectangle({
        x: margin,
        y: barcode1Y - 20,
        width: pageWidth - (margin * 2),
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText('(01)' + gtin + '(10)' + lotNumber + '(11)' + gs1Date, {
        x: margin + 10,
        y: barcode1Y - 10,
        size: 8,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // 2. QUANTITY + WEIGHT Barcode
      const barcode2Y = barcode1Y - 60;
      page.drawRectangle({
        x: margin,
        y: barcode2Y - 20,
        width: pageWidth - (margin * 2),
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      // Format weight with 1 decimal place for GS1-3201
      const formattedWeight = parseFloat(weight).toFixed(1).replace('.', '');
      page.drawText('(37)' + quantity.padStart(6, '0') + '(3201)' + formattedWeight.padStart(6, '0'), {
        x: margin + 10,
        y: barcode2Y - 10,
        size: 8,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // 3. SSCC Barcode
      const barcode3Y = barcode2Y - 60;
      page.drawRectangle({
        x: margin,
        y: barcode3Y - 20,
        width: pageWidth - (margin * 2),
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText('(00)' + sscc, {
        x: margin + 10,
        y: barcode3Y - 10,
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
      
      // Convert to base64 for preview
      const base64 = await arrayBufferToBase64(pdfBytes);
      previewImage = `data:application/pdf;base64,${base64}`;
      
      return pdfBytes;
    }
    
    // Convert ArrayBuffer to base64 for preview
    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }
    
    // Handle form submission
    async function handleSubmit() {
      // Validate GTIN first
      validateGtinInput();
      if (gtinError) {
        return; // Don't submit if there's an error
      }
      
      isGenerating = true;
      error = null;
      success = null;
      
      try {
        // Generate the PDF
        const pdfBytes = await generateLogisticLabelPDF();
        
        // Create a Blob from the PDF bytes
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `gs1_label_${gtin}_${lotNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
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
  
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6 text-center">GS1-128 Logistic Label Generator</h1>
    
    <div class="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-6">
      <h3 class="font-bold">About GS1-128 Logistic Labels</h3>
      <p class="mt-1">
        GS1-128 is a global standard for logistics labels that uses Application Identifiers (AIs) 
        to encode data in barcodes. These labels follow a specific structure with three sections: 
        company information at the top, human-readable data in the middle, and barcodes at the bottom.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Label Form -->
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
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div>
            <label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              bind:value={companyName}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label for="companyAddress" class="block text-sm font-medium text-gray-700 mb-1">
              Company Address
            </label>
            <input
              type="text"
              id="companyAddress"
              bind:value={companyAddress}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label for="gtin" class="block text-sm font-medium text-gray-700 mb-1">
              GTIN (14 digits)
            </label>
            <input
              type="text"
              id="gtin"
              bind:value={gtin}
              on:input={() => validateGtinInput()}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00123456789012"
              maxlength="14" 
              required
            />
            {#if gtinError}
              <p class="mt-1 text-sm text-red-600">{gtinError}</p>
            {/if}
            <p class="mt-1 text-xs text-gray-500">
              Enter the 14-digit Global Trade Item Number
            </p>
          </div>
          
          <div>
            <label for="lotNumber" class="block text-sm font-medium text-gray-700 mb-1">
              Lot Number
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
            <p class="mt-1 text-xs text-gray-500">
              Enter the batch or lot number (alphanumeric, max 20 chars)
            </p>
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
            <p class="mt-1 text-xs text-gray-500">
              Enter the production or manufacturing date
            </p>
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
            <p class="mt-1 text-xs text-gray-500">
              Enter the number of items (positive integer)
            </p>
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
            <p class="mt-1 text-xs text-gray-500">
              Enter the weight in pounds (up to 1 decimal place)
            </p>
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
      
      <!-- Label Preview -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-lg font-bold mb-4">Label Preview</h3>
        
        {#if isGenerating}
          <div class="flex justify-center items-center h-64 bg-gray-50 border border-gray-200 rounded-md">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        {:else if previewImage}
          <div class="border border-gray-300 rounded-md overflow-hidden">
            <iframe 
              src={previewImage} 
              title="Label Preview" 
              class="w-full h-96"
            ></iframe>
          </div>
          
          <div class="mt-4 text-sm text-gray-500">
            <p>
              This GS1-128 compliant logistic label follows international standards for shipping and logistics. 
              The label contains:
            </p>
            <ul class="list-disc pl-5 mt-2">
              <li>Company identification information</li>
              <li>Human-readable data with GS1 Application Identifiers</li>
              <li>Placeholder for GS1-128 barcodes (represented with rectangles)</li>
            </ul>
            <p class="mt-2">
              The downloaded PDF will not have actual scannable barcodes. In a production environment, 
              you would use the bwip-js library to generate real GS1-128 barcodes.
            </p>
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-2 text-gray-500">Fill out the form to see a preview of your GS1-128 label</p>
          </div>
        {/if}
      </div>
    </div>
  </div>