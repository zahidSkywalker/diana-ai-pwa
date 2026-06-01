'use client';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AIModel } from '@/lib/hexagon-types';
import { Sparkles, Zap, Crown, Hexagon } from 'lucide-react';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const modelIcons: Record<string, React.ReactNode> = {
  discord: <Hexagon className="h-3 w-3" />,
};

const tierIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-2.5 w-2.5" />,
  paid: <Crown className="h-2.5 w-2.5" />,
};

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'w-[180px] h-8 text-xs border-border/40 bg-card/50 rounded-lg',
          'focus:ring-1 focus:ring-primary/30',
        )}
      >
        <SelectValue>
          {currentModel && (
            <span className="flex items-center gap-1.5">
              {modelIcons[currentModel.provider] || <Sparkles className="h-3 w-3" />}
              <span className="truncate">{currentModel.name}</span>
              {tierIcons[currentModel.tier]}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs py-2">
            <div className="flex items-center gap-2">
              {modelIcons[model.provider] || <Sparkles className="h-3 w-3" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{model.name}</span>
                  <Badge
                    variant={model.tier === 'free' ? 'default' : 'secondary'}
                    className={cn(
                      'text-[9px] px-1 py-0 h-3.5',
                      model.tier === 'free'
                        ? 'bg-green-500/15 text-green-400 border-green-500/20'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/20',
                    )}
                  >
                    {model.tier === 'free' ? 'Free' : 'Pro'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {model.description}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
