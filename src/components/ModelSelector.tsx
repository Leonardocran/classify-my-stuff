import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, Scissors, Camera } from "lucide-react";

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  modelPath: string;
  task: 'image-classification' | 'object-detection' | 'image-segmentation';
  icon: React.ReactNode;
  category: string;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'mobilenet',
    name: 'MobileNet V4',
    description: 'General object classification',
    modelPath: 'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
    task: 'image-classification',
    icon: <Camera className="w-4 h-4" />,
    category: 'General'
  },
  {
    id: 'food',
    name: 'Food Classifier',
    description: 'Specialized for food recognition',
    modelPath: 'Kaludi/food-category-classification-v2.0',
    task: 'image-classification',
    icon: <Brain className="w-4 h-4" />,
    category: 'Specialized'
  },
  {
    id: 'animals',
    name: 'Animal Classifier',
    description: 'Animal and pet recognition',
    modelPath: 'microsoft/resnet-50',
    task: 'image-classification',
    icon: <Eye className="w-4 h-4" />,
    category: 'Specialized'
  },
  {
    id: 'detection',
    name: 'Object Detection',
    description: 'Detect multiple objects with bounding boxes',
    modelPath: 'Xenova/yolov9-c_all',
    task: 'object-detection',
    icon: <Eye className="w-4 h-4" />,
    category: 'Detection'
  },
  {
    id: 'segmentation',
    name: 'Background Removal',
    description: 'Remove or segment image backgrounds',
    modelPath: 'Xenova/segformer-b0-finetuned-ade-512-512',
    task: 'image-segmentation',
    icon: <Scissors className="w-4 h-4" />,
    category: 'Editing'
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Model</h3>
      </div>
      
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an AI model" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-3 py-1">
                {model.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {model.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentModel && (
        <div className="p-3 rounded-lg bg-secondary/50 border">
          <div className="flex items-center gap-2 mb-2">
            {currentModel.icon}
            <span className="font-medium">{currentModel.name}</span>
            <Badge variant="outline">{currentModel.task}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{currentModel.description}</p>
        </div>
      )}
    </div>
  );
};

export { AVAILABLE_MODELS };