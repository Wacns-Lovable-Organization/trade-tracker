import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Calculator,
  Settings,
  Tags,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Cloud,
  Shield,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LowStockAlert } from '@/components/LowStockAlert';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Add Inventory', href: '/inventory/add', icon: Package },
  { label: 'Inventory List', href: '/inventory', icon: ShoppingCart },
  { label: 'Record Sale', href: '/sales', icon: TrendingUp },
  { label: 'Profit Simulator', href: '/simulate', icon: Calculator },
  { label: 'Categories', href: '/categories', icon: Tags },
  { label: 'Suppliers', href: '/suppliers', icon: Truck },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Admin Panel', href: '/admin', icon: Shield, adminOnly: true },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasAdminAccess, isLoading: roleLoading } = useUserRole();
  const { isViewingAs } = useViewAs();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Track device for admin visibility
  useDeviceTracking();

  // Filter nav items based on admin access
  const filteredNavItems = navItems.filter(item => !item.adminOnly || hasAdminAccess);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const userInitials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className={cn("min-h-screen bg-background", isViewingAs && "pt-9 sm:pt-10")}>
      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden fixed left-0 right-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm",
        isViewingAs ? "top-9 sm:top-10" : "top-0"
      )}>
        <div className="flex items-center justify-between h-full px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">GT Inventory</span>
          </Link>
          <div className="flex items-center gap-1">
            <LowStockAlert />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={cn(
          "lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm",
          isViewingAs ? "pt-[88px] sm:pt-[96px]" : "pt-14"
        )}>
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-default',
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 bottom-0 w-64 flex-col border-r border-border bg-sidebar",
        isViewingAs ? "top-10" : "top-0"
      )}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GT Inventory</h1>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-default group',
                location.pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5',
                location.pathname === item.href
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Synced
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "lg:pl-64 min-h-screen",
        isViewingAs ? "pt-[88px] sm:pt-[96px] lg:pt-0" : "pt-14 lg:pt-0"
      )}>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
