import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language.split('-')[0];

  return (
    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
      {[
        { code: 'ru', label: 'RU' },
        { code: 'kk', label: 'KK' },
        { code: 'en', label: 'EN' }
      ].map((lang) => (
        <button
          key={lang.code}
          onClick={() => toggleLanguage(lang.code)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            currentLanguage === lang.code
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
