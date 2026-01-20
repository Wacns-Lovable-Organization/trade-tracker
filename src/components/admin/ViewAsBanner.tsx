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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-1.5 sm:py-2 px-2 sm:px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left side - Mode indicator and user info */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shrink-0">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-semibold text-[10px] sm:text-sm hidden xs:inline">IMPERSONATION</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-[10px] sm:text-sm opacity-90 hidden sm:inline">Viewing as:</span>
            <Badge variant="secondary" className="bg-white/25 text-white border-white/30 font-semibold text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-[150px]">
              {viewAsUser.growId || viewAsUser.email}
            </Badge>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs bg-white/10 rounded-lg px-2 py-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Changes affect user's data</span>
          </div>
          {!isOnAdminPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-1 text-white hover:bg-white/20 border border-white/30 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Back to</span> Admin
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExit}
            className="gap-1 bg-white text-amber-700 hover:bg-white/90 font-semibold h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}