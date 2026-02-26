import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { InventoryTemplate } from '@/hooks/useInventoryTemplates';
import { useState } from 'react';

interface TemplateListProps {
  templates: InventoryTemplate[];
  onSelect: (template: InventoryTemplate) => void;
  onDelete: (id: string) => void;
}

export function TemplateList({ templates, onSelect, onDelete }: TemplateListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (templates.length === 0) return null;

  const displayTemplates = isExpanded ? templates : templates.slice(0, 3);

  return (
    <Card className="mb-6 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Quick Restock Templates</h3>
            <Badge variant="secondary" className="text-xs">{templates.length}</Badge>
          </div>
          {templates.length > 3 && (
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="gap-1 text-xs">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? 'Show less' : `+${templates.length - 3} more`}
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {displayTemplates.map(template => (
            <div key={template.id} className="group relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 pr-8"
                onClick={() => onSelect(template)}
              >
                <span className="truncate max-w-[120px]">{template.template_name}</span>
                <Badge variant="secondary" className="text-xs">{template.default_currency_unit}</Badge>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
