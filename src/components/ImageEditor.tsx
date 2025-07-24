import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Canvas as FabricCanvas, Circle, Rect, FabricText, FabricImage } from 'fabric';
import { 
  Edit3, 
  Palette, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Minus, 
  RotateCw, 
  Download, 
  Undo2, 
  Redo2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

export const ImageEditor = ({ imageUrl, isOpen, onClose, onSave }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'rectangle' | 'circle' | 'text'>('select');
  const [brushSize, setBrushSize] = useState([5]);
  const [color, setColor] = useState('#ff0000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    // Load the image
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(800 / img.width, 600 / img.height);
        canvas.setDimensions({ width: img.width * scale, height: img.height * scale });
        canvas.backgroundColor = '#ffffff';
        
        // Create fabric image and add as background
        const fabricImg = new FabricImage(img, {
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = fabricImg;
        canvas.renderAll();
      };
      img.src = imageUrl;
    }

    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = brushSize[0];

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setHistory([initialState]);
    setHistoryIndex(0);

    // Listen for canvas changes
    canvas.on('path:created', () => saveState(canvas));
    canvas.on('object:added', () => saveState(canvas));
    canvas.on('object:removed', () => saveState(canvas));

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [isOpen, imageUrl]);

  // Update canvas settings when tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = color;
      fabricCanvas.freeDrawingBrush.width = brushSize[0];
    }
  }, [activeTool, color, brushSize, fabricCanvas]);

  const saveState = (canvas: FabricCanvas) => {
    const currentState = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0 && fabricCanvas) {
      const prevIndex = historyIndex - 1;
      fabricCanvas.loadFromJSON(history[prevIndex], () => {
        fabricCanvas.renderAll();
        setHistoryIndex(prevIndex);
      });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && fabricCanvas) {
      const nextIndex = historyIndex + 1;
      fabricCanvas.loadFromJSON(history[nextIndex], () => {
        fabricCanvas.renderAll();
        setHistoryIndex(nextIndex);
      });
    }
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: color,
      width: 100,
      height: 100,
      stroke: color,
      strokeWidth: 2,
    });
    fabricCanvas.add(rect);
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: 'transparent',
      radius: 50,
      stroke: color,
      strokeWidth: 2,
    });
    fabricCanvas.add(circle);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    
    const text = new FabricText('Edit me', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: color,
    });
    fabricCanvas.add(text);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    saveState(fabricCanvas);
  };

  const rotateCanvas = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      obj.rotate(obj.angle + 90);
    });
    fabricCanvas.renderAll();
    saveState(fabricCanvas);
  };

  const downloadImage = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    
    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded!');
  };

  const saveAndClose = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    
    onSave(dataURL);
    onClose();
    toast.success('Edits saved!');
  };

  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#000000', '#ffffff', '#808080', '#ffa500', '#800080', '#008000'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Image Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Toolbar */}
          <div className="w-48 space-y-4 border-r pr-4">
            {/* Tools */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('select')}
                >
                  Select
                </Button>
                <Button
                  variant={activeTool === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('draw')}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === 'rectangle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTool('rectangle');
                    addRectangle();
                  }}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTool('circle');
                    addCircle();
                  }}
                >
                  <CircleIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTool('text');
                    addText();
                  }}
                  className="col-span-2"
                >
                  <Type className="w-4 h-4 mr-1" />
                  Text
                </Button>
              </div>
            </div>

            {/* Brush size */}
            {activeTool === 'draw' && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Brush Size</h4>
                <Slider
                  value={brushSize}
                  onValueChange={setBrushSize}
                  max={50}
                  min={1}
                  step={1}
                />
                <Badge variant="secondary">{brushSize[0]}px</Badge>
              </div>
            )}

            {/* Colors */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Colors</h4>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((clr) => (
                  <button
                    key={clr}
                    className={`w-8 h-8 rounded border-2 ${
                      color === clr ? 'border-primary' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: clr }}
                    onClick={() => setColor(clr)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 rounded border"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Actions</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateCanvas}
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 mr-1" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
              <canvas ref={canvasRef} className="border rounded shadow-lg" />
            </div>
            
            {/* Bottom actions */}
            <div className="flex gap-2 mt-4">
              <Button onClick={downloadImage} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={saveAndClose} className="ml-auto">
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};