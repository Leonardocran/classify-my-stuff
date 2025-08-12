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
    id: 'animals',
    name: 'Animal Classifier',
    description: 'Animal and pet recognition',
    modelPath: 'microsoft/resnet-50',
    task: 'image-classification',
    icon: <Eye className="w-4 h-4" />,
    category: 'Specialized'
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