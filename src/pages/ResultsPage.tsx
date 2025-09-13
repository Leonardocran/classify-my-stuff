import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Share2, Download, Edit, Eye, Upload, FileDown, Camera, BarChart3 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF, shareResults, captureElementAsPNG } from '@/utils/exportUtils';

const ResultsPage = () => {
  const { selectedImage, fileName, results, isLoading, loadingProgress, history } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  console.log("Rendering ResultsPage with results:", results);
  const formatScore = (score: number) => `${(score * 100).toFixed(1)}%`;

  const handleShare = async () => {
    const success = await shareResults({
      fileName,
      timestamp: new Date(),
      results,
      imageUrl: selectedImage || undefined
    });

    if (success) {
      toast({
        title: "Shared Successfully",
        description: "Results copied to clipboard or shared!"
      });
    } else {
      toast({
        title: "Share Failed",
        description: "Unable to share results",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    const success = await exportToPDF({
      fileName,
      timestamp: new Date(),
      results,
      imageUrl: selectedImage || undefined
    });

    if (success) {
      toast({
        title: "PDF Downloaded",
        description: "Results exported successfully!"
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF",
        variant: "destructive"
      });
    }
  };

  const handleDownloadImage = async () => {
    const success = await captureElementAsPNG('results-card', `results-${fileName}`);
    
    if (success) {
      toast({
        title: "Image Downloaded",
        description: "Results captured as image!"
      });
    } else {
      toast({
        title: "Capture Failed",
        description: "Unable to capture results",
        variant: "destructive"
      });
    }
  };

  if (!selectedImage && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center bg-card/60 backdrop-blur-sm border border-border/50">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">No Results Yet</h2>
              <p className="text-muted-foreground mb-6">
                Upload an image to see classification results here
              </p>
            </div>
            <Button size="lg" onClick={() => navigate('/')} className="hover-scale hover-glow">
              <Upload className="w-5 h-5 mr-2" />
              Go to Upload
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6 py-8 animate-fade-in">
        <div className="inline-flex items-center gap-3 px-6 py-3 glass-effect rounded-full text-primary font-medium border border-primary/20 animate-bounce-in">
          <Brain className="w-5 h-5 animate-pulse" />
          Classification Complete
        </div>
        <h1 className="text-4xl font-bold gradient-text animate-slide-up">
          AI Analysis Results
        </h1>
        <p className="text-muted-foreground text-lg animate-slide-up">
          {fileName && `Results for: ${fileName}`}
        </p>
        
        {/* Quick Stats */}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground animate-bounce-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {results.length} Classifications
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Top: {results[0] ? formatScore(results[0].confidence) : 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Model: VGG19
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 glass-effect border border-border/30 animate-scale-in">
          <div className="space-y-8">
            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 bg-gradient-primary/20 rounded-full flex items-center justify-center animate-float">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold gradient-text">Processing with AI...</span>
                <p className="text-muted-foreground">Analyzing your image with advanced neural networks</p>
              </div>
            </div>
            <div className="space-y-3">
              <Progress value={loadingProgress} className="w-full h-4 bg-muted/30" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{loadingProgress}% Complete</span>
                <span>VGG19 Model</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Preview */}
        {selectedImage && (
          <Card className="p-8 glass-effect border border-border/50 card-hover animate-scale-in">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Eye className="w-6 h-6 text-primary" />
                Analyzed Image
                <div className="ml-auto px-3 py-1 bg-gradient-primary/10 rounded-full text-xs font-medium text-primary border border-primary/20">
                  Original
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <img 
                  src={selectedImage} 
                  alt="Uploaded for classification" 
                  className="w-full h-auto max-h-96 object-contain rounded-xl border border-border/30 group-hover:scale-105 transition-transform duration-500 shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={handleShare} className="hover-scale">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="hover-scale">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadImage} className="hover-scale">
                  <Camera className="w-4 h-4 mr-2" />
                  Save Image
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classification Results */}
        <div className="space-y-6">
          <Card id="results-card" className="p-8 glass-effect border border-primary/20 shadow-glow-primary animate-scale-in">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Brain className="w-6 h-6 text-primary animate-pulse" />
                Classification Results
                <div className="ml-auto px-3 py-1 bg-gradient-primary/10 rounded-full text-xs font-medium text-primary border border-primary/20">
                  AI-Powered
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-6">
                  {results.slice(0, 5).map((result, index) => (
                    <div key={index} className="space-y-3 p-4 rounded-xl glass-effect border border-border/30 hover-scale">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={index === 0 ? "default" : "secondary"}
                            className={index === 0 ? "bg-gradient-primary text-primary-foreground shadow-glow-primary" : ""}
                          >
                            #{index + 1}
                          </Badge>
                          <span className="font-semibold text-lg capitalize">
                            {result.label.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold gradient-text">
                            {formatScore(result.confidence)}
                          </span>
                          <p className="text-xs text-muted-foreground">Confidence</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Progress 
                          value={result.score * 100} 
                          className="h-3 bg-muted/30"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Match Quality</span>
                          <span>{result.score > 0.8 ? 'Excellent' : result.score > 0.6 ? 'Good' : result.score > 0.4 ? 'Fair' : 'Low'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg">No classification results available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Quick Actions */}
          <Card className="p-8 glass-effect border border-border/50 card-hover animate-scale-in">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 hover-scale hover-glow"
                  onClick={() => navigate('/')}
                >
                  <Upload className="w-6 h-6" />
                  <span>New Analysis</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 hover-scale hover-glow"
                  onClick={() => navigate('/history')}
                >
                  <Eye className="w-6 h-6" />
                  <span>View History</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 hover-scale hover-glow"
                  onClick={() => navigate('/stats')}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>Analytics</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 hover-scale hover-glow"
                  onClick={handleDownloadPDF}
                >
                  <FileDown className="w-6 h-6" />
                  <span>Export PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;