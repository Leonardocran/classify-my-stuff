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

// Mock classification function (replace with actual AI model call)
async function classifyImage(imageUrl: string): Promise<ClassificationResult[]> {
  console.log('Classifying image:', imageUrl);
  
  // For demo purposes, return mock classifications
  // In production, you would call an actual AI service here
  const mockResults: ClassificationResult[] = [
    { label: "car", score: 0.95 },
    { label: "vehicle", score: 0.89 },
    { label: "automobile", score: 0.84 },
    { label: "sedan", score: 0.76 },
    { label: "transportation", score: 0.68 }
  ];
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockResults;
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