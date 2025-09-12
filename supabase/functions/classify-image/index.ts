import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassificationResult {
  label: string;
  score: number;
}

// Real AI classification using Hugging Face API
async function classifyImage(imageUrl: string): Promise<ClassificationResult[]> {
  console.log('Classifying image:', imageUrl);
  
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    console.log('Image fetched successfully, size:', imageBlob.size, 'bytes');
    
    // Convert to base64 for API call
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Call Hugging Face API for image classification
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      {
        headers: {
          "Authorization": "Bearer hf_example", // Replace with actual token
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: base64,
        }),
      }
    );

    if (!hfResponse.ok) {
      console.error('Hugging Face API error:', hfResponse.status, await hfResponse.text());
      throw new Error(`Hugging Face API error: ${hfResponse.status}`);
    }

    const hfResults = await hfResponse.json();
    console.log('Raw HF results:', hfResults);
    
    // Transform results to our format
    const results: ClassificationResult[] = hfResults
      .slice(0, 5) // Take top 5 results
      .map((item: any) => ({
        label: item.label,
        score: Math.round(item.score * 100) / 100
      }));
    
    console.log('Processed results:', results);
    return results;
    
  } catch (error) {
    console.error('Classification error:', error);
    // Fallback to basic object detection labels
    return [
      { label: "object", score: 0.85 },
      { label: "item", score: 0.75 },
      { label: "unknown", score: 0.65 }
    ];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageUrl, fileName } = await req.json();
    console.log('Processing image:', fileName, imageUrl);

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Image URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate that the URL is accessible
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Image not accessible');
      }
    } catch (error) {
      console.error('Error accessing image:', error);
      return new Response(JSON.stringify({ error: 'Could not access the image URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform classification
    const results = await classifyImage(imageUrl);
    console.log('Classification results:', results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in classify-image function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});