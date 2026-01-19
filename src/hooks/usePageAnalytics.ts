import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate or retrieve a persistent session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type from user agent
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Detect browser from user agent
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

// Detect OS from user agent
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

// Page title map for analytics
const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory List',
  '/inventory/add': 'Add Inventory',
  '/sales': 'Sales',
  '/simulate': 'Profit Simulator',
  '/categories': 'Categories',
  '/suppliers': 'Suppliers',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
  '/profile': 'Profile',
  '/auth': 'Authentication',
  '/install': 'Install App',
};

export function usePageAnalytics() {
  const location = useLocation();
  const { user } = useAuth();
  const pageStartTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  const trackPageView = useCallback(async (pagePath: string, duration?: number) => {
    try {
      const sessionId = getSessionId();
      const pageTitle = PAGE_TITLES[pagePath] || pagePath;

      await (supabase.from('page_analytics') as any).insert({
        user_id: user?.id || null,
        session_id: sessionId,
        page_path: pagePath,
        page_title: pageTitle,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        duration_ms: duration || null,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [user]);

  useEffect(() => {
    const currentPath = location.pathname;
    
    // If we have a previous path, track duration for that page
    if (lastPath.current && lastPath.current !== currentPath) {
      const duration = Date.now() - pageStartTime.current;
      // We don't await here to not block navigation
      trackPageView(lastPath.current, duration);
    }

    // Track new page view (without duration yet)
    if (currentPath !== lastPath.current) {
      trackPageView(currentPath);
      pageStartTime.current = Date.now();
      lastPath.current = currentPath;
    }

    // Track duration when user leaves
    const handleBeforeUnload = () => {
      const duration = Date.now() - pageStartTime.current;
      // Use sendBeacon for reliability on page unload
      const data = {
        user_id: user?.id || null,
        session_id: getSessionId(),
        page_path: currentPath,
        page_title: PAGE_TITLES[currentPath] || currentPath,
        duration_ms: duration,
      };
      
      // sendBeacon is more reliable for unload events
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_analytics`,
        JSON.stringify(data)
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname, user, trackPageView]);

  return { trackPageView };
}

export function usePageAnalyticsData() {
  const fetchAnalyticsSummary = useCallback(async (days: number = 30) => {
    try {
      const { data, error } = await supabase.rpc('get_page_analytics_summary', {
        _days: days
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      return [];
    }
  }, []);

  return { fetchAnalyticsSummary };
}
