<!-- src/lib/components/Labels/LabelPreview.svelte -->
<script>
    import { onMount } from 'svelte';
    
    // Props
    export let labelData = null;
    export let previewUrl = null;
    
    // State
    let isLoading = false;
    let error = null;
    let gs1Info = null;
    
    // Watch for changes in labelData
    $: if (labelData && !previewUrl) {
      generatePreview();
      updateGS1Info();
    }
    
    // Generate a preview of the label
    async function generatePreview() {
      if (!labelData) return;
      
      isLoading = true;
      error = null;
      
      try {
        // Call the API to generate a preview
        const response = await fetch('/api/pdf/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(labelData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate preview');
        }
        
        // Get the preview URL
        const data = await response.json();
        previewUrl = data.previewUrl;
      } catch (err) {
        console.error('Preview generation error:', err);
        error = err.message || 'Error generating preview';
      } finally {
        isLoading = false;
      }
    }
    
    // Update GS1 information display
    function updateGS1Info() {
      if (!labelData) return;
      
      try {
        // Format production date for GS1
        const prodDate = new Date(labelData.production_date);
        const gs1Date = prodDate.getFullYear().toString().slice(-2) + 
                       (prodDate.getMonth() + 1).toString().padStart(2, '0') + 
                       prodDate.getDate().toString().padStart(2, '0');
        
        // Format weight with one decimal place
        const weight = parseFloat(labelData.weight_pounds || 0).toFixed(1);
        
        gs1Info = {
          gtin: {
            ai: '01',
            value: labelData.gtin || '',
            description: 'Global Trade Item Number'
          },
          lot: {
            ai: '10',
            value: labelData.lot_number || '',
            description: 'Batch/Lot Number'
          },
          prodDate: {
            ai: '11',
            value: gs1Date,
            description: 'Production Date (YYMMDD)'
          },
          qty: {
            ai: '37',
            value: labelData.quantity ? labelData.quantity.toString().padStart(6, '0') : '000000',
            description: 'Count of Trade Items'
          },
          weight: {
            ai: '3201',
            value: weight.replace('.', ''),
            description: 'Weight in Pounds (1 decimal)'
          },
          sscc: {
            ai: '00',
            value: 'Will be generated upon label creation',
            description: 'Serial Shipping Container Code'
          }
        };
      } catch (err) {
        console.error('Error updating GS1 info:', err);
      }
    }
  </script>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-lg font-bold mb-4">Label Preview</h3>
    
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>Error: {error}</p>
        <button 
          on:click={generatePreview}
          class="mt-2 text-sm text-blue-600 hover:text-blue-500"
        >
          Try again
        </button>
      </div>
    {:else if previewUrl}
      <div class="border border-gray-300 rounded-md overflow-hidden">
        <iframe 
          src={previewUrl} 
          title="Label Preview" 
          class="w-full h-96"
          sandbox="allow-scripts"
        ></iframe>
      </div>
      
      <!-- GS1-128 Information -->
      {#if gs1Info}
        <div class="mt-6">
          <h4 class="text-md font-bold mb-2">GS1-128 Barcode Information</h4>
          <div class="bg-gray-50 p-4 rounded-md">
            <table class="min-w-full text-sm">
              <thead>
                <tr>
                  <th class="text-left py-2">AI</th>
                  <th class="text-left py-2">Value</th>
                  <th class="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each Object.values(gs1Info) as info}
                  <tr>
                    <td class="py-1 pr-4 font-mono">{info.ai}</td>
                    <td class="py-1 pr-4 font-mono">{info.value}</td>
                    <td class="py-1">{info.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
      
      <div class="mt-4 text-sm text-gray-500">
        <p>
          This GS1-128 compliant logistic label follows international standards for shipping and logistics. 
          The label contains three sections:
        </p>
        <ul class="list-disc pl-5 mt-2">
          <li>Top section: Company identification</li>
          <li>Middle section: Human-readable information with Application Identifiers</li>
          <li>Bottom section: GS1-128 barcodes for automated scanning</li>
        </ul>
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