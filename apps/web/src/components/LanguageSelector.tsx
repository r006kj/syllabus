import { useLanguage } from '../hooks/useLanguage'

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() =>
        setLanguage(language === 'es' ? 'en' : 'es')
      }
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-950 border-neutral-800 rounded-lg px-4 py-2 shadow"
    >
      {language.toUpperCase()}
    </button>
  )
}