import { useViewAs } from '@/contexts/ViewAsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ViewAsBanner() {
  const { viewAsUser, isViewingAs, clearViewAs } = useViewAs();
  const navigate = useNavigate();

  if (!isViewingAs || !viewAsUser) return null;

  const handleExit = () => {
    clearViewAs();
    navigate('/admin');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span className="font-medium">Viewing as:</span>
        <Badge variant="secondary" className="bg-amber-600/20 text-amber-950 border-amber-600/30">
          {viewAsUser.displayName || viewAsUser.email}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="gap-1 text-amber-950 hover:bg-amber-600/20"
      >
        <X className="w-4 h-4" />
        Exit View
      </Button>
    </div>
  );
}
