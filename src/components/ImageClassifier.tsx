import { useState, useRef, useCallback, useEffect } from 'react';
import { pipeline } from '@huggingface/transformers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Brain, Zap, Image as ImageIcon, Settings, Edit, Share2, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ModelSelector, AVAILABLE_MODELS } from './ModelSelector';
import { CameraCapture } from './CameraCapture';
import { ImageHistory, HistoryItem } from './ImageHistory';
import { ImageEditor } from './ImageEditor';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedModel, setSelectedModel] = useState('general');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account."
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error signing you out.",
        variant: "destructive"
      });
    }
  };

  async function uploadFile(file) {
  const bucketName = 'classify-my-stuff'; // Your bucket name
  const filePath = `images/${file.name}`; // Path in the bucket

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600', // Optional: Cache control
        upsert: false,        // Prevent overwriting
      });

    if (error) {
      console.error('Error uploading file:', error.message);
      return null;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('✅ File uploaded successfully:', publicData.publicUrl);

    return publicData.publicUrl; // Return the URL
  } catch (err) {
    console.error('An unexpected error occurred during upload:', err.message);
    return null;
  }
}


  const classifyImage = useCallback(async (imageUrl: string, fileName: string = 'uploaded-image') => {
  const startTime = Date.now();
  try {
    setIsLoading(true);
    setLoadingProgress(0);

    // Call your backend Flask server API
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: imageUrl }), // Send the image URL to the backend
    });
    console.log("Response from server:", response);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const model = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const predictions = await response.json();
    const processingTime = (Date.now() - startTime) / 1000;

    // Save results to state
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
      description: `Classified with VGG19 (Server) in ${processingTime.toFixed(1)}s`,
    });
  } catch (error) {
    console.error("Classification error:", error);
    toast({
      title: "Classification Failed",
      description: "Unable to analyze the image. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
    setLoadingProgress(0);
  }
}, [toast]);

  // const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   if (!file.type.startsWith('image/')) {
  //     toast({
  //       title: "Invalid File Type",
  //       description: "Please select an image file (JPG, PNG, etc.)",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     const imageUrl = e.target?.result as string;
  //     setSelectedImage(imageUrl);
  //     setFileName(file.name);
  //     setResults([]);
  //     classifyImage(imageUrl, file.name);
  //   };
  //   reader.readAsDataURL(file);
  // }, [classifyImage, toast]);
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

  // Upload file to Supabase and get public URL
  const publicUrl = await uploadFile(file);
  if (!publicUrl) {
    toast({
      title: "Upload Failed",
      description: "Could not upload the image to the server.",
      variant: "destructive",
    });
    return;
  }

  // Update UI with the uploaded image's URL
  setSelectedImage(publicUrl);
  setFileName(file.name);
  setResults([]);

  // Use the public URL for classification
  classifyImage(publicUrl, file.name);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="w-full min-h-screen relative z-10">
        {/* Header with Logout */}
        <header className="flex justify-between items-center p-6 border-b border-border/20 backdrop-blur-sm bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Classify My Stuff
              </h1>
              <p className="text-xs text-muted-foreground">AI Classification Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.email}</div>
              <div className="text-xs text-muted-foreground">
                {history.length} classifications
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b border-border/20 bg-background/50 backdrop-blur-sm h-16">
            <div className="max-w-4xl mx-auto flex w-full justify-center">
              <TabsTrigger value="analyze" className="px-8 h-12 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="w-5 h-5 mr-2" />
                Classify
              </TabsTrigger>
              <TabsTrigger value="history" className="px-8 h-12 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ImageIcon className="w-5 h-5 mr-2" />
                History
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="analyze" className="min-h-screen">
            <div className="max-w-6xl mx-auto p-8 space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-6 py-12">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary/20 backdrop-blur-sm rounded-full text-primary font-medium border border-primary/20 shadow-lg">
                  <Brain className="w-5 h-5" />
                  AI-Powered Classification
                </div>
                <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Classify My Stuff
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Upload an image and our AI will identify vehicles, objects, food, animals, and everyday items with incredible accuracy
                </p>
              </div>

              {/* Model Selection */}
              <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
                <ModelSelector 
                  selectedModel={selectedModel} 
                  onModelChange={setSelectedModel} 
                />
              </Card>

              {/* Main Upload Area - Large and Centered */}
              <Card className="p-16 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm min-h-[500px] flex flex-col items-center justify-center">
                <div className="text-center space-y-8 max-w-md">
                  <div className="mx-auto w-24 h-24 bg-gradient-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30 shadow-lg">
                    <Upload className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Upload Your Image</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Drop an image here or click to browse
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 w-full">
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-6 h-6 mr-2" />
                      Browse Files
                    </Button>
                    <div className="flex gap-3 justify-center">
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
                <Card className="p-8 bg-card/50 backdrop-blur-sm border border-border/30">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 justify-center">
                      <Zap className="w-6 h-6 text-primary animate-pulse" />
                      <span className="text-lg font-medium">Processing with AI...</span>
                    </div>
                    <Progress value={loadingProgress} className="w-full h-3" />
                    <p className="text-center text-muted-foreground">
                      {loadingProgress}% Complete
                    </p>
                  </div>
                </Card>
              )}

              {/* Results - Image and Classifications */}
              {selectedImage && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Image Preview */}
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/30">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Image Preview</CardTitle>
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
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border/20">
                        <img src={selectedImage} alt="Analysis target" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 text-center">{fileName}</p>
                    </CardContent>
                  </Card>

                  {/* Classification Results */}
                  {results.length > 0 && (
                    <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/30">
                      <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          Classification Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-4">
                          {results.map((result, index) => (
                            <div key={index} className="p-5 rounded-lg bg-gradient-to-r from-card/80 to-card/60 border border-border/50 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold capitalize text-foreground">
                                  {result.label.replace(/_/g, ' ')}
                                </h3>
                                <Badge 
                                  variant={index === 0 ? "default" : "secondary"} 
                                  className="text-sm px-3 py-1"
                                >
                                  {formatScore(result?.score)}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Confidence</span>
                                  <span className="font-medium">{formatScore(result?.score)}</span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="bg-gradient-primary h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${result?.score * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>


          <TabsContent value="history" className="min-h-screen">
            <div className="max-w-6xl mx-auto p-8">
              <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  My Classifications
                </h1>
                <p className="text-lg text-muted-foreground">
                  View and manage your previous analysis results
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 text-center bg-card/60 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-primary">{history.length}</div>
                  <div className="text-sm text-muted-foreground">Total Analyzed</div>
                </Card>
                <Card className="p-4 text-center bg-card/60 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-primary">{history.filter(h => h.isFavorite).length}</div>
                  <div className="text-sm text-muted-foreground">Favorites</div>
                </Card>
                <Card className="p-4 text-center bg-card/60 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-primary">
                    {history.length > 0 ? Math.round((history.reduce((acc, item) => acc + item.results[0]?.score || 0, 0) / history.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </Card>
                <Card className="p-4 text-center bg-card/60 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-primary">
                    {history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Today</div>
                </Card>
              </div>

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
            </div>
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