import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2, Download } from 'lucide-react';
import { pipeline, env } from '@huggingface/transformers';
import { toast } from 'sonner';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface Detection {
  label: string;
  score: number;
  box: BoundingBox;
}

interface ObjectDetectionProps {
  imageUrl: string;
  onDetection: (detections: Detection[]) => void;
}

export const ObjectDetection = ({ imageUrl, onDetection }: ObjectDetectionProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const detectObjects = async () => {
    if (!imageUrl) return;

    setIsDetecting(true);
    setProgress(0);
    setDetections([]);

    try {
      console.log('Starting object detection...');
      
      // Load the object detection model
      const detector = await pipeline(
        'object-detection',
        'Xenova/yolov9-c_all',
        {
          device: 'webgpu',
          progress_callback: (progressData: any) => {
            if (progressData.status === 'progress') {
              setProgress(Math.round(progressData.progress * 70));
            }
          }
        }
      );

      setProgress(75);

      // Detect objects
      console.log('Running object detection...');
      const results = await detector(imageUrl, {
        threshold: 0.3,
        percentage: true,
      });

      setProgress(90);

      const detectionResults: Detection[] = results.map((result: any) => ({
        label: result.label,
        score: result.score,
        box: result.box
      }));

      setDetections(detectionResults);
      onDetection(detectionResults);
      
      // Draw bounding boxes
      await drawBoundingBoxes(detectionResults);
      
      setProgress(100);
      toast.success(`Detected ${detectionResults.length} objects!`);
    } catch (error) {
      console.error('Error detecting objects:', error);
      toast.error('Failed to detect objects. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const drawBoundingBoxes = async (detections: Detection[]) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load the original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image
    ctx.drawImage(img, 0, 0);

    // Draw bounding boxes
    detections.forEach((detection, index) => {
      const { box, label, score } = detection;
      
      // Convert percentage coordinates to pixel coordinates
      const x = (box.xmin / 100) * canvas.width;
      const y = (box.ymin / 100) * canvas.height;
      const width = ((box.xmax - box.xmin) / 100) * canvas.width;
      const height = ((box.ymax - box.ymin) / 100) * canvas.height;

      // Color for each detection
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      const color = colors[index % colors.length];

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 25, width, 25);

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(
        `${label} (${Math.round(score * 100)}%)`,
        x + 5,
        y - 8
      );
    });

    // Convert canvas to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setProcessedImageUrl(url);
      }
    });
  };

  const downloadResult = () => {
    if (!processedImageUrl) return;
    
    const a = document.createElement('a');
    a.href = processedImageUrl;
    a.download = `object-detection-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Detection result downloaded!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Object Detection</h3>
      </div>

      <Button
        onClick={detectObjects}
        disabled={isDetecting}
        className="w-full"
      >
        {isDetecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Detecting Objects...
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Detect Objects
          </>
        )}
      </Button>

      {isDetecting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 70 ? 'Loading AI model...' : 
             progress < 90 ? 'Analyzing image...' : 
             'Drawing bounding boxes...'}
          </p>
        </div>
      )}

      {detections.length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Detected Objects ({detections.length})</h4>
            <div className="flex flex-wrap gap-2">
              {detections.map((detection, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {detection.label} ({Math.round(detection.score * 100)}%)
                </Badge>
              ))}
            </div>
          </div>

          {processedImageUrl && (
            <div className="space-y-2">
              <div className="aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border">
                <img
                  src={processedImageUrl}
                  alt="Object detection result"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <Button
                onClick={downloadResult}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Detection Result
              </Button>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};