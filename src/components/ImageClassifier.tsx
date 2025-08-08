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
    <div className="min-h-screen bg-gradient-colorful p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-rainbow rounded-full text-primary-foreground font-medium shadow-glow-rainbow animate-fade-in">
            <Brain className="w-5 h-5" />
            Advanced AI Vision Platform
          </div>
          <h1 className="text-5xl font-bold bg-gradient-rainbow bg-clip-text text-transparent animate-scale-in">
            Classify-my-Stuff
          </h1>
          <p className="text-lg text-foreground/80 backdrop-blur-sm bg-card/20 rounded-lg p-4 border border-border/30">
            Professional-grade AI tools for image classification, object detection, editing, and analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="analyze" className="data-[state=active]:bg-gradient-rainbow data-[state=active]:text-primary-foreground">Analyze</TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-gradient-rainbow data-[state=active]:text-primary-foreground">AI Tools</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-rainbow data-[state=active]:text-primary-foreground">History</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-rainbow data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Model Selection */}
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelChange={setSelectedModel} 
            />

            {/* Upload Area */}
            <Card className="p-8 border-2 border-dashed border-border/30 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm shadow-glow-colorful">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-rainbow rounded-full flex items-center justify-center shadow-glow-rainbow animate-pulse">
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
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/30">
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
                <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/30">
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
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/30">
                    <h3 className="text-lg font-semibold mb-4">Classification Results</h3>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-accent border border-border/30 backdrop-blur-sm">
                          <div className="flex-1">
                            <p className="font-medium capitalize text-foreground">{result.label.replace(/_/g, ' ')}</p>
                            <div className="w-full bg-muted/50 rounded-full h-2 mt-2">
                              <div
                                className="bg-gradient-rainbow h-2 rounded-full transition-all duration-500"
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
              <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border border-border/30">
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