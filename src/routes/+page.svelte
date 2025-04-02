<!-- src/routes/+page.svelte -->
<script>
  import { generateSSCC } from '$lib/gs1Utils';
  import { generateAndDownloadLabel } from '$lib/pdfGenerator';
  
  // Form fields
  let companyName = 'FINCA EL SOCORRO';
  let companyAddress = 'KM 27.5 Carretera al Crucero';
  let lotNumber = '';
  let productionDate = new Date().toISOString().split('T')[0]; // Today's date
  let quantity = '';
  let weight = '';
  
  // Generate SSCC
  let sscc = generateSSCC();
  
  // Form state
  let isGenerating = false;
  let error = null;
  let success = null;
  
  // Handle form submission
  async function handleSubmit() {
    isGenerating = true;
    error = null;
    success = null;
    
    try {
      // Prepare data for label generation
      const labelData = {
        companyName,
        companyAddress,
        sscc,
        lotNumber,
        productionDate,
        quantity: parseInt(quantity),
        weight: parseFloat(weight)
      };
      
      // Generate and download the label
      await generateAndDownloadLabel(labelData);
      
      // Generate a new SSCC for the next label
      sscc = generateSSCC();
      
      success = 'GS1-128 label generated successfully!';
    } catch (err) {
      console.error('Error generating label:', err);
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
      <p class="text-xs mt-1">Serial Shipping Container Code for your logistic unit</p>
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