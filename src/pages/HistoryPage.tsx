import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  History, 
  Heart, 
  Search, 
  Eye, 
  Share2, 
  Download, 
  Trash2,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const HistoryPage = () => {
  const { history, toggleFavorite, deleteHistoryItem, setSelectedImage, setFileName, setResults } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.results[0]?.label?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'favorites' && item.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const handleViewItem = (item: any) => {
    setSelectedImage(item.imageUrl);
    setFileName(item.fileName);
    setResults(item.results);
    navigate('/results');
  };

  const handleShare = async (item: any) => {
    const shareData = {
      title: 'Classification Results',
      text: `Check out my image classification: ${item.results[0]?.label?.replace(/_/g, ' ')} (${((item.results[0]?.score || 0) * 100).toFixed(1)}%)`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast({
        title: "Copied to clipboard",
        description: "Classification details copied to clipboard."
      });
    }
  };

  const handleDownload = (item: any) => {
    const data = {
      fileName: item.fileName,
      timestamp: item.timestamp,
      results: item.results,
      modelUsed: item.modelUsed,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classification-${item.fileName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center bg-card/60 backdrop-blur-sm border border-border/50">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <History className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">No History Yet</h2>
              <p className="text-muted-foreground mb-6">
                Your image classification history will appear here once you start analyzing images
              </p>
            </div>
            <Button size="lg" onClick={() => navigate('/')}>
              <Eye className="w-5 h-5 mr-2" />
              Start Analyzing
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
          <History className="w-4 h-4" />
          Classification History
        </div>
        <h1 className="text-3xl font-bold">Your Analysis History</h1>
        <p className="text-muted-foreground">
          {history.length} total classifications • {history.filter(h => h.isFavorite).length} favorites
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search by filename or classification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                All
              </Button>
              <Button
                variant={filter === 'favorites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('favorites')}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {filteredHistory.length === 0 ? (
        <Card className="p-12 text-center bg-card/60 backdrop-blur-sm border border-border/50">
          <div className="space-y-4">
            <Search className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-card/60 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.fileName}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handleViewItem(item)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute top-2 right-2 ${item.isFavorite ? 'text-red-500' : 'text-white'} hover:scale-110`}
                  onClick={() => toggleFavorite(item.id)}
                >
                  <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium truncate">{item.fileName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {item.results[0] && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.results[0].label.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-medium text-primary">
                        {((item.results[0].score || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewItem(item)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare(item)}>
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(item)}>
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="p-4 bg-card/60 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.fileName}
                  className="w-16 h-16 object-cover rounded-lg border border-border/30 cursor-pointer"
                  onClick={() => handleViewItem(item)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{item.fileName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {item.results[0] && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              {item.results[0].label.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm font-medium text-primary">
                              {((item.results[0].score || 0) * 100).toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleDateString()} • {item.modelUsed}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.isFavorite ? 'text-red-500' : ''}
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewItem(item)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleShare(item)}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(item)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;