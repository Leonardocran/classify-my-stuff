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
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/15 backdrop-blur-sm rounded-full text-primary font-medium border border-primary/20">
          <Brain className="w-4 h-4" />
          AI-Powered Classification
        </div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Upload & Classify
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Upload an image to identify vehicles, objects, food, animals, and everyday items with AI
        </p>
      </div>

      {/* Model Selection */}
      <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          AI Model Selection
        </h3>
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={setSelectedModel} 
        />
      </Card>

      {/* Main Upload Area */}
      <Card 
        className="p-16 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm min-h-[500px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:scale-[1.02]"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-8 max-w-md">
          <div className="mx-auto w-24 h-24 bg-gradient-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30 shadow-lg animate-pulse">
            <Upload className="w-12 h-12 text-primary" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-3">Drop Your Image Here</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Or click to browse your files
            </p>
          </div>

          <div className="space-y-4 w-full">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg hover-scale"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImageIcon className="w-6 h-6 mr-3" />
              Browse Files
            </Button>
            
            <div className="flex gap-3 justify-center">
              <CameraCapture onCapture={handleCameraCapture} />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Supports JPG, PNG, GIF, WebP • Max 10MB
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