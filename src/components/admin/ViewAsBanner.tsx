import { useViewAs } from '@/contexts/ViewAsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function ViewAsBanner() {
  const { viewAsUser, isViewingAs, clearViewAs } = useViewAs();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isViewingAs || !viewAsUser) return null;

  const handleExit = () => {
    clearViewAs();
    navigate('/admin');
  };

  const isOnAdminPage = location.pathname === '/admin';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2.5 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <Eye className="w-4 h-4" />
            <span className="font-semibold text-sm">IMPERSONATION MODE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-90">Viewing & editing as:</span>
            <Badge variant="secondary" className="bg-white/25 text-white border-white/30 font-semibold">
              {viewAsUser.displayName || viewAsUser.email}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>All changes affect this user's data</span>
          </div>
          {!isOnAdminPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-1 text-white hover:bg-white/20 border border-white/30"
            >
              Back to Admin
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExit}
            className="gap-1 bg-white text-amber-700 hover:bg-white/90 font-semibold"
          >
            <X className="w-4 h-4" />
            Exit Impersonation
          </Button>
        </div>
      </div>
    </div>
  );
}
