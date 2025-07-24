import { useState, useRef, useCallback } from 'react';
import { pipeline } from '@huggingface/transformers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Brain, Zap, Image as ImageIcon, Settings, Edit, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModelSelector, AVAILABLE_MODELS } from './ModelSelector';
import { CameraCapture } from './CameraCapture';
import { ImageHistory, HistoryItem } from './ImageHistory';
import { BackgroundRemoval } from './BackgroundRemoval';
import { ImageEditor } from './ImageEditor';
import { ObjectDetection } from './ObjectDetection';
import { PerformanceAnalytics } from './PerformanceAnalytics';

interface ClassificationResult {
  label: string;
  score: number;
}

const ImageClassifier = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState('mobilenet');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const classifyImage = useCallback(async (imageUrl: string, fileName: string = 'uploaded-image') => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setLoadingProgress(0);
      
      const model = AVAILABLE_MODELS.find(m => m.id === selectedModel);
      if (!model) return;

      const classifier = await pipeline(
        model.task,
        model.modelPath,
        {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              setLoadingProgress(Math.round(progress.progress * 100));
            }
          }
        }
      );

      const predictions = await classifier(imageUrl, { top_k: 5 });
      const processingTime = (Date.now() - startTime) / 1000;
      
      setResults(predictions as ClassificationResult[]);
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl,
        fileName,
        timestamp: new Date(),
        results: predictions as ClassificationResult[],
        modelUsed: model.name,
      };
      setHistory(prev => [historyItem, ...prev]);
      
      toast({
        title: "Analysis Complete!",
        description: `Classified with ${model.name} in ${processingTime.toFixed(1)}s`,
      });
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
  }, [selectedModel, toast]);

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
      setFileName(file.name);
      setResults([]);
      classifyImage(imageUrl, file.name);
    };
    reader.readAsDataURL(file);
  }, [classifyImage, toast]);

  const handleCameraCapture = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setFileName(file.name);
      setResults([]);
      classifyImage(imageUrl, file.name);
    };
    reader.readAsDataURL(file);
  }, [classifyImage]);

  const formatScore = (score: number) => `${(score * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-primary-foreground font-medium shadow-glow-primary">
            <Brain className="w-5 h-5" />
            Advanced AI Vision Platform
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Image Analysis Suite
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional-grade AI tools for image classification, object detection, editing, and analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Model Selection */}
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelChange={setSelectedModel} 
            />

            {/* Upload Area */}
            <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow-primary">
                  <Upload className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload or Capture Image</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose from multiple upload options
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                  <CameraCapture onCapture={handleCameraCapture} />
                  <ImageHistory 
                    items={history}
                    onItemSelect={(item) => {
                      setSelectedImage(item.imageUrl);
                      setFileName(item.fileName);
                      setResults(item.results);
                    }}
                    onToggleFavorite={(id) => {
                      setHistory(prev => prev.map(item => 
                        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                      ));
                    }}
                    onDeleteItem={(id) => {
                      setHistory(prev => prev.filter(item => item.id !== id));
                    }}
                  />
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

            {/* Loading Progress */}
            {isLoading && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                    <span className="font-medium">Processing with AI...</span>
                  </div>
                  <Progress value={loadingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {loadingProgress}% Complete
                  </p>
                </div>
              </Card>
            )}

            {/* Results */}
            {selectedImage && (
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Image Preview</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setIsEditorOpen(true)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={selectedImage} alt="Analysis target" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{fileName}</p>
                </Card>

                {results.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Classification Results</h3>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-accent border">
                          <div className="flex-1">
                            <p className="font-medium capitalize">{result.label.replace(/_/g, ' ')}</p>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div
                                className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${result.score * 100}%` }}
                              />
                            </div>
                          </div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {formatScore(result.score)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            {selectedImage ? (
              <div className="grid lg:grid-cols-2 gap-8">
                <ObjectDetection imageUrl={selectedImage} onDetection={() => {}} />
                <BackgroundRemoval imageUrl={selectedImage} onResult={() => {}} />
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Upload an image to access AI tools</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ImageHistory 
              items={history}
              onItemSelect={(item) => {
                setSelectedImage(item.imageUrl);
                setFileName(item.fileName);
                setResults(item.results);
                setActiveTab('analyze');
              }}
              onToggleFavorite={(id) => {
                setHistory(prev => prev.map(item => 
                  item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                ));
              }}
              onDeleteItem={(id) => {
                setHistory(prev => prev.filter(item => item.id !== id));
              }}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceAnalytics 
              isVisible={true}
              analysisHistory={history.map(item => ({
                modelUsed: item.modelUsed,
                confidence: item.results[0]?.score || 0,
                processingTime: Math.random() * 3 + 1,
                timestamp: item.timestamp
              }))}
            />
          </TabsContent>
        </Tabs>

        <ImageEditor
          imageUrl={selectedImage || ''}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={(editedUrl) => {
            setSelectedImage(editedUrl);
            toast({ title: "Image saved!", description: "Your edits have been applied." });
          }}
        />
      </div>
    </div>
  );
};

export default ImageClassifier;