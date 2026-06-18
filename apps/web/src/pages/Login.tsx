import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import { ThemeToggle } from '../components/ThemeToggle'
import { LanguageSelector } from '../components/LanguageSelector'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loginWithGoogle, loading, error } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      // el error ya se muestra desde el hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <ThemeToggle />

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm w-full max-w-sm"
      >
        <h1 className="text-xl font-medium mb-1 text-gray-900 dark:text-white">
          {t.welcomeBack}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t.loginSubtitle}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
        <input
          type="password"
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-900 dark:bg-red-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? t.signingIn : t.signIn}
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          <span className="text-xs text-gray-400 dark:text-gray-500">{t.or}</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full border dark:border-gray-600 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 text-gray-900 dark:text-white"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
          {t.google}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
          {t.noAccount}{' '}
          <Link to="/register" className="text-red-800 dark:text-red-400">
            {t.login}
          </Link>
        </p>
      </form>

      <LanguageSelector />
    </div>
  )
}