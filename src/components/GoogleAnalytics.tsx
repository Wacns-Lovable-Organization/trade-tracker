// import { useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
//
// declare global {
//   interface Window {
//     gtag: (...args: unknown[]) => void;
//     dataLayer: unknown[];
//   }
// }
//
// interface GoogleAnalyticsProps {
//   measurementId: string;
// }
//
// export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
//   const location = useLocation();
//
//   useEffect(() => {
//     // Skip if no measurement ID or in development
//     if (!measurementId || !measurementId.startsWith('G-')) {
//       return;
//     }
//
//     // Check if script is already loaded
//     if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
//       return;
//     }
//
//     // Load Google Analytics script
//     const script = document.createElement('script');
//     script.async = true;
//     script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
//     document.head.appendChild(script);
//
//     // Initialize gtag
//     window.dataLayer = window.dataLayer || [];
//     window.gtag = function gtag(...args: unknown[]) {
//       window.dataLayer.push(args);
//     };
//     window.gtag('js', new Date());
//     window.gtag('config', measurementId, {
//       page_path: location.pathname,
//       send_page_view: true,
//     });
//
//     return () => {
//       // Cleanup script on unmount (if needed)
//     };
//   }, [measurementId]);
//
//   // Track page views on route change
//   useEffect(() => {
//     if (!measurementId || !window.gtag) return;
//
//     window.gtag('config', measurementId, {
//       page_path: location.pathname,
//       page_title: document.title,
//     });
//   }, [location.pathname, measurementId]);
//
//   return null;
// }


import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const location = useLocation();

  useEffect(() => {
    // Skip if no measurement ID
    if (!measurementId || !measurementId.startsWith('G-')) {
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      return;
    }

    // Initialize dataLayer and gtag BEFORE loading the script
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    // Now load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    if (!measurementId || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname,
      page_title: document.title,
    });
  }, [location.pathname, measurementId]);

  return null;
}
// Hook for custom event tracking
export function useGoogleAnalytics() {
  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  const trackPurchase = (transactionId: string, value: number, currency: string = 'USD') => {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
      });
    }
  };

  const setUserId = (userId: string) => {
    if (window.gtag) {
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  };

  return { trackEvent, trackPurchase, setUserId };
}

// Add type for GA measurement ID on window
declare global {
  interface Window {
    GA_MEASUREMENT_ID?: string;
  }
}
