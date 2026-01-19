import { useTranslation } from 'react-i18next';

export function SkipLinks() {
  const { t } = useTranslation();

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-[100] bg-primary text-primary-foreground px-4 py-2 focus:not-sr-only focus:absolute"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
          main?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        {t('accessibility.skipToMain', 'Skip to main content')}
      </a>
      <a
        href="#navigation"
        className="fixed top-0 left-32 z-[100] bg-primary text-primary-foreground px-4 py-2 focus:not-sr-only focus:absolute"
        onClick={(e) => {
          e.preventDefault();
          const nav = document.getElementById('navigation');
          nav?.focus();
        }}
      >
        {t('accessibility.skipToNav', 'Skip to navigation')}
      </a>
    </div>
  );
}
