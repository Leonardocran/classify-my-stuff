import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Share2, Download, Edit, Eye, Upload } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const { selectedImage, fileName, results, isLoading, loadingProgress } = useApp();
  const navigate = useNavigate();

  const formatScore = (score: number) => `${(score * 100).toFixed(1)}%`;

  const handleShare = async () => {
    const shareData = {
      title: 'Classification Results',
      text: `Check out my image classification results: ${results.slice(0, 3).map(r => `${r.label} (${formatScore(r.score)})`).join(', ')}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
    }
  };

  const handleDownload = () => {
    const data = {
      fileName,
      timestamp: new Date().toISOString(),
      results,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classification-${fileName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            <Button size="lg" onClick={() => navigate('/')}>
              <Eye className="w-5 h-5 mr-2" />
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
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/15 backdrop-blur-sm rounded-full text-primary font-medium border border-primary/20">
          <Brain className="w-4 h-4" />
          Classification Results
        </div>
        <h1 className="text-3xl font-bold">AI Analysis Complete</h1>
        <p className="text-muted-foreground">
          {fileName && `Results for: ${fileName}`}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 bg-card/50 backdrop-blur-sm border border-border/30 animate-scale-in">
          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-center">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-xl font-medium">Processing with AI...</span>
            </div>
            <Progress value={loadingProgress} className="w-full h-3" />
            <p className="text-center text-muted-foreground">
              {loadingProgress}% Complete
            </p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Preview */}
        {selectedImage && (
          <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Uploaded Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <img 
                  src={selectedImage} 
                  alt="Uploaded for classification" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg border border-border/30 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classification Results */}
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-primary/5 border border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Classification Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.slice(0, 5).map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                          <span className="font-medium capitalize">
                            {result.label.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {formatScore(result.score)}
                        </span>
                      </div>
                      <Progress 
                        value={result.score * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : !isLoading && (
                <p className="text-muted-foreground text-center py-8">
                  No classification results available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
            <CardHeader className="pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Upload className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
                <Button variant="outline" onClick={() => navigate('/history')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View History
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