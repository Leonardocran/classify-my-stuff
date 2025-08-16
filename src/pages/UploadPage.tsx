import { useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Brain, Zap } from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';
import { ModelSelector } from '@/components/ModelSelector';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const UploadPage = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    setSelectedImage, 
    setFileName, 
    setResults, 
    classifyImage 
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const uploadFile = async (file: File) => {
    const bucketName = 'classify-my-stuff';
    const filePath = `images/${Date.now()}-${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file:', error.message);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (err) {
      console.error('An unexpected error occurred during upload:', err);
      return null;
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const publicUrl = await uploadFile(file);
    if (!publicUrl) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the image to the server.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(publicUrl);
    setFileName(file.name);
    setResults([]);

    await classifyImage(publicUrl, file.name);
    navigate('/results');
  }, [classifyImage, toast, navigate, setSelectedImage, setFileName, setResults]);

  const handleCameraCapture = useCallback(async (file: File) => {
    const publicUrl = await uploadFile(file);
    if (!publicUrl) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the image to the server.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(publicUrl);
    setFileName(file.name);
    setResults([]);

    await classifyImage(publicUrl, file.name);
    navigate('/results');
  }, [classifyImage, toast, navigate, setSelectedImage, setFileName, setResults]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const event = { target: { files } } as any;
      handleFileUpload(event);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12 animate-fade-in">
        <div className="inline-flex items-center gap-3 px-6 py-3 glass-effect rounded-full text-primary font-medium border border-primary/20 animate-bounce-in">
          <Brain className="w-5 h-5 animate-pulse" />
          AI-Powered Classification Platform
        </div>
        <h1 className="text-5xl font-bold gradient-text animate-slide-up">
          Upload & Classify Anything
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-up">
          Harness the power of advanced AI to identify vehicles, objects, food, animals, and everyday items with incredible accuracy
        </p>
        
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground animate-bounce-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            99.9% Accuracy
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Real-time Processing
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Enterprise Ready
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <Card className="p-8 glass-effect border border-border/50 card-hover animate-scale-in">
        <h3 className="font-semibold text-xl mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary animate-pulse" />
          AI Model Selection
          <div className="ml-auto px-3 py-1 bg-gradient-primary/10 rounded-full text-xs font-medium text-primary border border-primary/20">
            Advanced
          </div>
        </h3>
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={setSelectedModel} 
        />
      </Card>

      {/* Main Upload Area */}
      <Card 
        className="p-16 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-500 glass-effect min-h-[500px] flex flex-col items-center justify-center cursor-pointer card-hover animate-fade-in"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-8 max-w-md">
          <div className="mx-auto w-32 h-32 bg-gradient-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30 shadow-glow-primary animate-float">
            <Upload className="w-16 h-16 text-primary animate-pulse-slow" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold gradient-text animate-slide-up">Drop Your Image Here</h2>
            <p className="text-muted-foreground text-xl mb-8 animate-slide-up">
              Or click to browse your files
            </p>
          </div>

          <div className="space-y-6 w-full animate-bounce-in">
            <Button 
              size="lg" 
              className="w-full h-16 text-xl hover-scale hover-glow shadow-glow-primary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImageIcon className="w-8 h-8 mr-3" />
              Browse Files
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or use camera</span>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <CameraCapture onCapture={handleCameraCapture} />
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Supports JPG, PNG, GIF, WebP • Max 10MB
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>
    </div>
  );
};

export default UploadPage;