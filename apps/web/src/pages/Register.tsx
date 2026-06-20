import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import {useTheme} from "../hooks/useTheme";
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'


export const Register = () => {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const t = translations[language]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { register, loginWithGoogle, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await register(email, password, name)
      navigate('/login')
    } catch {
      // El error ya se muestra desde el hook
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-neutral-950">

      {/* Botón modo oscuro */}
      <div className="absolute top-6 right-6">
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm w-full max-w-sm"
      >
               <div className="flex flex-col items-center mb-1">
  <img
  src={darkMode ? logoDark : logoLight}
  alt="Syllabus"
  className="w-40 h-40"
/>
</div>
        <h1 className="text-xl text-gray-900 dark:text-white font-medium mb-1">
          {t.createAccount}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t.join}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border dark:border-neutral-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          required
        />

        <input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border dark:border-neutral-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          required
        />

        <input
          type="password"
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border dark:border-neutral-600 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 dark:bg-red-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : t.register}
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          <span className="text-xs text-gray-400 dark:text-gray-500">o</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full border dark:border-gray-600 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 text-gray-900 dark:text-white"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-4 h-4"
          />
          {t.google}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
          {t.already}{' '}
          <Link to="/login" className="text-red-800 dark:text-red-400">
            {t.login}
          </Link>
        </p>
      </form>

      {/* Selector idioma */}
      <div className="absolute bottom-6">
      </div>

    </div>
  )
}