<script>
    import { onMount } from 'svelte';
    import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
    
    // Form fields
    let gtin = '';
    let gtinError = '';
    let lotNumber = '';
    let productionDate = new Date().toISOString().split('T')[0]; // Today's date
    let quantity = '';
    let weight = '';
    
    // Form state
    let isGenerating = false;
    let error = null;
    let success = null;
    
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
          const multiplier = i % 2 === 0 ? 3 : 1;
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
      
      // Format dates for display
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
      };
      
      // Draw header section (company info)
      page.drawText('Logistics Label', {
        x: margin,
        y: pageHeight - margin - 15,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      // Draw horizontal line below header
      page.drawLine({
        start: { x: margin, y: pageHeight - 50 },
        end: { x: pageWidth - margin, y: pageHeight - 50 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      // Draw label content (GTIN, lot number, etc.)
      const contentStartY = pageHeight - 70;
      const lineHeight = 20;
      
      // GTIN
      page.drawText('GTIN:', {
        x: margin,
        y: contentStartY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(gtin, {
        x: 80,
        y: contentStartY,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Lot Number
      page.drawText('Lot Number:', {
        x: margin,
        y: contentStartY - lineHeight,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(lotNumber, {
        x: 80,
        y: contentStartY - lineHeight,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Production Date
      page.drawText('Production Date:', {
        x: margin,
        y: contentStartY - lineHeight * 2,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(formatDate(productionDate), {
        x: 120,
        y: contentStartY - lineHeight * 2,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Quantity
      page.drawText('Quantity:', {
        x: margin,
        y: contentStartY - lineHeight * 3,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(quantity.toString(), {
        x: 80,
        y: contentStartY - lineHeight * 3,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Weight
      page.drawText('Weight (lbs):', {
        x: margin,
        y: contentStartY - lineHeight * 4,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(weight.toString(), {
        x: 100,
        y: contentStartY - lineHeight * 4,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Add barcode placeholder (in a real app, you'd generate actual barcodes)
      page.drawRectangle({
        x: margin,
        y: contentStartY - lineHeight * 6,
        width: pageWidth - (margin * 2),
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      page.drawText('GS1-128 Barcode (Placeholder)', {
        x: 70,
        y: contentStartY - lineHeight * 6 + 40,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0)
      });
      
      // Draw footer with timestamp
      const currentDate = new Date().toLocaleString();
      page.drawText(`Generated: ${currentDate}`, {
        x: margin,
        y: margin,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
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
        link.download = `logistics_label_${gtin}_${lotNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        success = 'PDF generated successfully!';
      } catch (err) {
        console.error('Error generating PDF:', err);
        error = 'Error generating PDF. Please try again.';
      } finally {
        isGenerating = false;
      }
    }
  </script>
  
  <svelte:head>
    <title>Logistics Label Generator</title>
  </svelte:head>
  
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6 text-center">Logistics Label Generator</h1>
    
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- GTIN Field -->
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
          
          <!-- Lot Number Field -->
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
          
          <!-- Production Date Field -->
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
  
          <!-- Quantity Field -->
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
              max="99999999"
              required
            />
            <p class="mt-1 text-xs text-gray-500">
              Enter the number of items (positive integer)
            </p>
          </div>
          
          <!-- Weight Field -->
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
        </div>
        
        <div class="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {#if isGenerating}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            {:else}
              Generate PDF Label
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>