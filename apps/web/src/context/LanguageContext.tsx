import { useState } from 'react'
import { LanguageContext } from './language-context'

export type Language = 'es' | 'en'

export type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
}


export const LanguageProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'es'
  )

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}