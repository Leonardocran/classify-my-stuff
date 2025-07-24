import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Heart, Share2, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  fileName: string;
  timestamp: Date;
  results: Array<{ label: string; score: number }>;
  modelUsed: string;
  isFavorite?: boolean;
}

interface ImageHistoryProps {
  items: HistoryItem[];
  onItemSelect: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export const ImageHistory = ({ items, onItemSelect, onToggleFavorite, onDeleteItem }: ImageHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredItems = items.filter(item => 
    filter === 'all' || (filter === 'favorites' && item.isFavorite)
  );

  const handleShare = async (item: HistoryItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Classification: ${item.fileName}`,
          text: `Top result: ${item.results[0]?.label} (${Math.round(item.results[0]?.score * 100)}% confidence)`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      const text = `AI Classification Result:\n${item.fileName}\nTop result: ${item.results[0]?.label} (${Math.round(item.results[0]?.score * 100)}% confidence)`;
      await navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
    }
  };

  const handleDownload = (item: HistoryItem) => {
    const data = {
      fileName: item.fileName,
      timestamp: item.timestamp,
      modelUsed: item.modelUsed,
      results: item.results
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classification-${item.fileName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results downloaded!');
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <History className="w-4 h-4" />
        History ({items.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Image Analysis History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-auto">
            {/* Filter buttons */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({items.length})
              </Button>
              <Button
                variant={filter === 'favorites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('favorites')}
              >
                Favorites ({items.filter(i => i.isFavorite).length})
              </Button>
            </div>

            {/* History grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <img
                      src={item.imageUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-black/50 hover:bg-black/70"
                        onClick={() => onToggleFavorite(item.id)}
                      >
                        <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="font-medium truncate">{item.fileName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.timestamp.toLocaleDateString()}
                      </p>
                    </div>

                    {item.results.length > 0 && (
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {item.results[0].label}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(item.results[0].score * 100)}% confidence
                        </div>
                      </div>
                    )}

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedItem(item);
                          onItemSelect(item);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleShare(item)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No {filter === 'favorites' ? 'favorite ' : ''}images found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};