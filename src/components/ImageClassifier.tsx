import { useState, useRef, useCallback } from 'react';
import { pipeline } from '@huggingface/transformers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Brain, Zap, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClassificationResult {
  label: string;
  score: number;
}

const ImageClassifier = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const classifyImage = useCallback(async (imageUrl: string) => {
    try {
      setIsLoading(true);
      setLoadingProgress(0);
      
      // Initialize the classifier with a browser-compatible model
      const classifier = await pipeline(
        'image-classification',
        'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
        {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              setLoadingProgress(Math.round(progress.progress * 100));
            }
          }
        }
      );
      
      if (!modelLoaded) {
        setModelLoaded(true);
        toast({
          title: "Model Loaded Successfully!",
          description: "Ready to classify images with AI precision.",
        });
      }

      // Classify the image
      const predictions = await classifier(imageUrl, { top_k: 5 });
      setResults(predictions as ClassificationResult[]);
      
    } catch (error) {
      console.error('Classification error:', error);
      toast({
        title: "Classification Failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  }, [modelLoaded, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setResults([]);
      classifyImage(imageUrl);
    };
    reader.readAsDataURL(file);
  }, [classifyImage, toast]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const formatScore = (score: number) => `${(score * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-primary-foreground font-medium shadow-glow-primary">
            <Brain className="w-5 h-5" />
            AI Image Classifier
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Classify My Stuff
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload any image and let our AI identify what's in it with incredible accuracy
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <div
            className="text-center space-y-4 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow-primary">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Drop your image here</h3>
              <p className="text-muted-foreground">
                Or click to browse and select an image file
              </p>
            </div>
            <Button variant="outline" className="mt-4">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </Card>

        {/* Loading Progress */}
        {isLoading && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium">
                  {loadingProgress === 0 ? 'Initializing AI Model...' : 'Analyzing Image...'}
                </span>
              </div>
              <Progress value={loadingProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {loadingProgress}% Complete
              </p>
            </div>
          </Card>
        )}

        {/* Image Preview and Results */}
        {selectedImage && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Uploaded Image</h3>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedImage}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>

            {/* Classification Results */}
            {results.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Classification Results</h3>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-accent border"
                    >
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {result.label.replace(/_/g, ' ')}
                        </p>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${result.score * 100}%` }}
                          />
                        </div>
                      </div>
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-gradient-primary border-0 shadow-glow-primary" : ""}
                      >
                        {formatScore(result.score)}
                      </Badge>
                    </div>
                  ))}
                </div>
                {results.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Top Prediction:</strong> {results[0].label.replace(/_/g, ' ')} 
                      with {formatScore(results[0].score)} confidence
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced neural networks trained on millions of images
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Real-time classification with sub-second response times
            </p>
          </Card>
          <Card className="p-6 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Any Image</h3>
            <p className="text-sm text-muted-foreground">
              Supports all common formats: JPG, PNG, WebP, and more
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageClassifier;