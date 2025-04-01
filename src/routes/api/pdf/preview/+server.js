// src/routes/api/pdf/preview/+server.js
import { json } from '@sveltejs/kit';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { verifyToken } from '$lib/server/auth/auth';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
import { generateSSCC } from '$lib/utils/gs1Utils';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '$env/dynamic/private';

// Directory to store preview PDFs
const PREVIEW_DIR = env.PREVIEW_STORAGE_PATH || 'storage/preview';

// Ensure the preview directory exists
try {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create preview storage directory:', err);
}

// Clean up old preview files (run every hour)
const PREVIEW_MAX_AGE = 3600000; // 1 hour in milliseconds
setInterval(() => {
  try {
    const files = fs.readdirSync(PREVIEW_DIR);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(PREVIEW_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > PREVIEW_MAX_AGE) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error('Error cleaning up preview files:', err);
  }
}, PREVIEW_MAX_AGE);

export async function POST({ request, cookies, url }) {
  // Apply rate limiting
  const rateLimitResponse = pdfRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Get auth token from cookies
  const token = cookies.get('authToken');
  
  // Verify authentication
  if (!token) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return json({ success: false, message: 'Invalid authentication token' }, { status: 401 });
  }
  
  try {
    // Parse label data from request
    const labelData = await request.json();
    
    // Validate form data
    const validation = validateLabelForm(labelData);
    if (!validation.isValid) {
      return json(
        { 
          success: false, 
          message: 'Invalid label data', 
          errors: validation.errors 
        }, 
        { status: 400 }
      );
    }
    
    // Sanitize form data
    const sanitizedData = sanitizeLabelForm(labelData);
    
    // Generate an SSCC for preview
    const sscc = generateSSCC();
    
    // Get user's company info if available, otherwise use defaults
    const userCompany = user.company_name || 'Your Company Name';
    const userCompanyAddress = user.company_address || 'Company Address, City, Country';
    
    // Prepare complete label data for preview
    const previewLabelData = {
      ...sanitizedData,
      id: 'preview',
      sscc,
      created_at: new Date().toISOString(),
      company_name: userCompany,
      company_address: userCompanyAddress
    };
    
    // Generate PDF with our enhanced GS1-128 implementation
    const pdfBuffer = await generateLogisticLabelPDF(previewLabelData, {
      company_name: userCompany,
      company_address: userCompanyAddress
    });
    
    // Generate a unique filename
    const hash = crypto.createHash('md5').update(JSON.stringify(previewLabelData)).digest('hex');
    const filename = `preview_${hash}.pdf`;
    const pdfPath = path.join(PREVIEW_DIR, filename);
    
    // Save the PDF to disk
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Get base URL from request
    const protocol = url.protocol || 'http:';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}//${host}`;
    
    // Return the preview URL
    return json({ 
      success: true,
      previewUrl: `${baseUrl}/api/pdf/preview/${hash}`
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    
    return json(
      { 
        success: false, 
        message: 'Failed to generate preview. Please try again.' 
      }, 
      { status: 500 }
    );
  }
}

// Endpoint to serve the preview PDF
export async function GET({ params, cookies }) {
  // Get auth token from cookies
  const token = cookies.get('authToken');
  
  // Verify authentication
  if (!token) {
    return new Response('Authentication required', { status: 401 });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return new Response('Invalid authentication token', { status: 401 });
  }
  
  // Get hash from params
  const hash = params.hash;
  
  // Construct the file path
  const filename = `preview_${hash}.pdf`;
  const pdfPath = path.join(PREVIEW_DIR, filename);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    return new Response('Preview not found', { status: 404 });
  }
  
  // Read the file
  const pdfBuffer = fs.readFileSync(pdfPath);
  
  // Return the PDF
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length.toString()
    }
  });
}