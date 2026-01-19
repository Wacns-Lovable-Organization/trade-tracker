import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate a unique device ID (persisted in localStorage)
function getOrCreateDeviceId(): string {
  const key = 'app_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

// Parse user agent for device info
function parseUserAgent(): {
  browser: string;
  os: string;
  deviceType: string;
  deviceInfo: Record<string, unknown>;
} {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';
  
  const deviceInfo = {
    userAgent: ua,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    vendor: navigator.vendor,
    cookieEnabled: navigator.cookieEnabled,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchPoints: navigator.maxTouchPoints,
    online: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
  };
  
  return { browser, os, deviceType, deviceInfo };
}

export function useDeviceTracking() {
  const { user } = useAuth();
  const deviceId = useRef<string | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const trackDevice = useCallback(async () => {
    if (!user) return;
    
    try {
      const id = getOrCreateDeviceId();
      deviceId.current = id;
      const { browser, os, deviceType, deviceInfo } = parseUserAgent();
      
      await supabase.rpc('upsert_user_device', {
        _device_id: id,
        _device_info: JSON.parse(JSON.stringify(deviceInfo)),
        _user_agent: navigator.userAgent,
        _browser: browser,
        _os: os,
        _device_type: deviceType,
      });
    } catch (error) {
      console.error('Failed to track device:', error);
    }
  }, [user]);

  const setOffline = useCallback(async () => {
    if (!user || !deviceId.current) return;
    
    try {
      await supabase.rpc('set_device_offline', {
        _device_id: deviceId.current,
      });
    } catch (error) {
      console.error('Failed to set device offline:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Track device on mount
    trackDevice();

    // Send heartbeat every 2 minutes to update last_seen_at
    heartbeatInterval.current = setInterval(trackDevice, 2 * 60 * 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackDevice();
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const deviceIdVal = deviceId.current;
      if (deviceIdVal) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/set_device_offline`,
          JSON.stringify({ _device_id: deviceIdVal })
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user, trackDevice, setOffline]);

  return { deviceId: deviceId.current };
}

export function getDeviceId(): string {
  return getOrCreateDeviceId();
}
