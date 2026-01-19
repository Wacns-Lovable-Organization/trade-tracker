import { useTranslation } from 'react-i18next';
import { useEffect, useCallback } from 'react';
import { languages } from '@/i18n';
import { useUserSettings } from '@/hooks/useUserSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { settings, updateSettings, isLoading } = useUserSettings();

  // Sync language from database on mount
  useEffect(() => {
    if (settings?.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  const handleLanguageChange = useCallback(async (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Persist to database
    if (settings) {
      await updateSettings({ language: languageCode });
    }
    // Also update localStorage for faster initial load
    localStorage.setItem('i18nextLng', languageCode);
  }, [i18n, settings, updateSettings]);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select 
      value={i18n.language} 
      onValueChange={handleLanguageChange}
      disabled={isLoading}
    >
      <SelectTrigger 
        className="w-[180px]"
        aria-label={t('settings.selectLanguage', 'Select language')}
      >
        <Globe className="w-4 h-4 ltr:mr-2 rtl:ml-2" aria-hidden="true" />
        <SelectValue>
          <span aria-hidden="true">{currentLanguage.flag}</span>{' '}
          {currentLanguage.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem 
            key={language.code} 
            value={language.code}
            aria-label={language.name}
          >
            <span aria-hidden="true">{language.flag}</span>{' '}
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
