import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Scissors, Download, Loader2 } from 'lucide-react';
import { pipeline, env } from '@huggingface/transformers';
import { toast } from 'sonner';
// import {signUp} from "../../backend/supabase.js"

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

interface BackgroundRemovalProps {
  imageUrl: string;
  onResult: (resultUrl: string) => void;
}

export const BackgroundRemoval = ({ imageUrl, onResult }: BackgroundRemovalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const resizeImageIfNeeded = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
        width = MAX_IMAGE_DIMENSION;
      } else {
        width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
        height = MAX_IMAGE_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      return true;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);
    return false;
  };

  const removeBackground = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('Starting background removal...');
      
      // Load the segmentation model
      const segmenter = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        {
          device: 'webgpu',
          progress_callback: (progressData: any) => {
            if (progressData.status === 'progress') {
              setProgress(Math.round(progressData.progress * 50));
            }
          }
        }
      );

      // Load and process the image
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      // Create canvas and resize if needed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const wasResized = resizeImageIfNeeded(canvas, ctx, image);
      console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setProgress(60);

      // Process with segmentation model
      console.log('Processing with segmentation model...');
      const result = await segmenter(imageData);
      setProgress(80);

      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }

      // Create output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('Could not get output canvas context');

      // Draw original image
      outputCtx.drawImage(canvas, 0, 0);

      // Apply mask to remove background
      const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
      const data = outputImageData.data;

      // Apply inverted mask to alpha channel
      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }

      outputCtx.putImageData(outputImageData, 0, 0);
      setProgress(100);

      // Convert to blob and create URL
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      onResult(url);
      
      toast.success('Background removed successfully!');
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `background-removed-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Image downloaded!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scissors className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Background Removal</h3>
      </div>

      <Button
        onClick={removeBackground}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Scissors className="w-4 h-4 mr-2" />
            Remove Background
          </>
        )}
      </Button>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 50 ? 'Loading AI model...' : 
             progress < 80 ? 'Analyzing image...' : 
             'Removing background...'}
          </p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
            <img
              src={resultUrl}
              alt="Background removed"
              className="w-full h-full object-contain bg-transparent"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
          
          <Button
            onClick={downloadResult}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
        </div>
      )}
    </div>
  );
};