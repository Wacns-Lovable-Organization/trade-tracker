import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing keyboard navigation in lists and menus
 */
export function useAccessibleNavigation<T extends HTMLElement>(
  itemCount: number,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const currentIndex = useRef(0);
  const containerRef = useRef<T>(null);

  const focusItem = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const items = containerRef.current.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="option"], [role="tab"], button, a[href], [tabindex="0"]'
    );
    
    if (items[index]) {
      items[index].focus();
      currentIndex.current = index;
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const items = containerRef.current.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="option"], [role="tab"], button, a[href], [tabindex="0"]'
    );
    
    const count = items.length;
    if (count === 0) return;

    let newIndex = currentIndex.current;
    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop 
            ? (currentIndex.current + 1) % count 
            : Math.min(currentIndex.current + 1, count - 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop 
            ? (currentIndex.current - 1 + count) % count 
            : Math.max(currentIndex.current - 1, 0);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop 
            ? (currentIndex.current + 1) % count 
            : Math.min(currentIndex.current + 1, count - 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop 
            ? (currentIndex.current - 1 + count) % count 
            : Math.max(currentIndex.current - 1, 0);
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = count - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onSelect && document.activeElement === items[currentIndex.current]) {
          onSelect(currentIndex.current);
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      if (newIndex !== currentIndex.current) {
        focusItem(newIndex);
      }
    }
  }, [orientation, loop, onSelect, focusItem]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    focusItem,
    currentIndex: currentIndex.current,
  };
}

/**
 * Hook for skip links and focus management
 */
export function useSkipLinks() {
  const mainContentRef = useRef<HTMLElement>(null);

  const skipToMain = useCallback(() => {
    mainContentRef.current?.focus();
  }, []);

  return { mainContentRef, skipToMain };
}

/**
 * Hook for announcing dynamic content changes to screen readers
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return { announce };
}

/**
 * Hook for managing focus trap within a container
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
