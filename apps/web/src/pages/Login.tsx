import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import { useTheme } from '../hooks/useTheme'
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'

const features = [
  { icon: 'calendar_month',    text: 'Visualiza todas tus entregas en un solo calendario' },
  { icon: 'school',            text: 'Importa cursos y notas directamente desde Canvas' },
  { icon: 'bolt',              text: 'Detecta semanas con sobrecarga automáticamente' },
]

export const Login = () => {
  const { darkMode } = useTheme()
  const [email,    setEmail]    = useState('')
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
    } catch {}
  }

  return (
    <div className="min-h-screen flex font-body">

      {/* ── Brand panel (lg+) ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-warmgray-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-pink-600/8 blur-3xl" />
        </div>

        <img src={logoDark} alt="Syllabus" className="relative z-10 w-16 h-16" />

        <div className="relative z-10 flex flex-col gap-10">
          <div>
            <h2 className="font-headline text-[2.4rem] font-bold text-white leading-[1.15] mb-4">
              Tu semestre,<br />organizado.
            </h2>
            <p className="text-warmgray-400 text-[15px] leading-relaxed max-w-xs">
              La plataforma de productividad académica pensada para estudiantes universitarios.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-pink-400 text-[18px]">{f.icon}</span>
                </div>
                <p className="text-warmgray-300 text-sm leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-warmgray-700 text-xs">© 2025 Syllabus</p>
      </div>

      {/* ── Form panel ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-warmgray-50 dark:bg-warmgray-950 p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={darkMode ? logoDark : logoLight} alt="Syllabus" className="w-16 h-16" />
          </div>

          <h1 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white mb-1">
            {t.welcomeBack}
          </h1>
          <p className="text-sm text-warmgray-500 dark:text-warmgray-400 mb-8">
            {t.loginSubtitle}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5 border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors mt-1"
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-warmgray-200 dark:bg-warmgray-700" />
            <span className="text-xs text-warmgray-400">{t.or}</span>
            <div className="flex-1 h-px bg-warmgray-200 dark:bg-warmgray-700" />
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2.5 text-warmgray-900 dark:text-white hover:bg-warmgray-50 dark:hover:bg-warmgray-700 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            {t.google}
          </button>

          <p className="text-sm text-warmgray-500 dark:text-warmgray-400 mt-6 text-center">
            {t.noAccount}{' '}
            <Link to="/register" className="text-pink-500 font-semibold hover:text-pink-600 transition-colors">
              {t.register}
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-warmgray-100 dark:border-warmgray-800 flex justify-center">
            <Link
              to="/install"
              className="flex items-center gap-2 text-xs font-semibold text-warmgray-400 dark:text-warmgray-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              Instalar app
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
