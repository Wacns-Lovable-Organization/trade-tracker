import { useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLProviderProps {
  children: ReactNode;
}

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export function RTLProvider({ children }: RTLProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    // Add/remove RTL class for styling hooks
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);

  return <>{children}</>;
}

export function useIsRTL() {
  const { i18n } = useTranslation();
  return RTL_LANGUAGES.includes(i18n.language);
}
