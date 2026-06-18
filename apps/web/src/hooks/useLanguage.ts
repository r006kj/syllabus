import { useContext } from 'react'
import { LanguageContext } from '../context/language-context'

export const useLanguage = () => {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider')
  }

  return context
}