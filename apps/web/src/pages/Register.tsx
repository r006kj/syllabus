import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import { useTheme } from '../hooks/useTheme'
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'

const perks = [
  { icon: 'check_circle', text: 'Gratis para todos los estudiantes' },
  { icon: 'check_circle', text: 'Sincronización con Canvas LMS' },
  { icon: 'check_circle', text: 'Detección automática de sobrecarga' },
]

export const Register = () => {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const t = translations[language]

  const [name,          setName]          = useState('')
  const [username,      setUsername]      = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [acceptPolicy,  setAcceptPolicy]  = useState(false)
  const [acceptData,    setAcceptData]    = useState(false)

  const { register, loginWithGoogle, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptPolicy) return
    try {
      await register(email, password, name, username)
      navigate('/onboarding')
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

        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h2 className="font-headline text-[2.4rem] font-bold text-white leading-[1.15] mb-4">
              Empieza a organizar<br />tu semestre.
            </h2>
            <p className="text-warmgray-400 text-[15px] leading-relaxed max-w-xs">
              Únete a los estudiantes que ya gestionan sus cursos, tareas y notas con Syllabus.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-pink-400 text-[18px] flex-shrink-0">{p.icon}</span>
                <p className="text-warmgray-300 text-sm">{p.text}</p>
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
            {t.createAccount}
          </h1>
          <p className="text-sm text-warmgray-500 dark:text-warmgray-400 mb-8">
            {t.join}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5 border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">
                {t.name}
              </label>
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">
                Nombre de usuario
              </label>
              <input
                type="text"
                placeholder="@tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
                required
              />
              <p className="text-[10px] text-warmgray-400 mt-1">Visible para grupos y compañeros. Sin espacios.</p>
            </div>

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
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
                required
              />
            </div>

            {/* Consent checkboxes */}
            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptPolicy}
                    onChange={e => setAcceptPolicy(e.target.checked)}
                    className="sr-only"
                    required
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${acceptPolicy ? 'bg-pink-500 border-pink-500' : 'border-warmgray-300 dark:border-warmgray-600 group-hover:border-pink-400'}`}>
                    {acceptPolicy && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
                <span className="text-xs text-warmgray-600 dark:text-warmgray-400 leading-relaxed">
                  He leído y acepto la{' '}
                  <a href="#" className="text-pink-500 hover:underline font-semibold" onClick={e => e.preventDefault()}>
                    Política de Privacidad
                  </a>
                  {' '}de Syllabus. <span className="text-red-500 font-bold">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptData}
                    onChange={e => setAcceptData(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${acceptData ? 'bg-pink-500 border-pink-500' : 'border-warmgray-300 dark:border-warmgray-600 group-hover:border-pink-400'}`}>
                    {acceptData && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
                <span className="text-xs text-warmgray-600 dark:text-warmgray-400 leading-relaxed">
                  Acepto que Syllabus use mis datos académicos para mejorar las recomendaciones y el plan de estudio personalizado. <span className="text-warmgray-400 dark:text-warmgray-500">(opcional)</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptPolicy}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors mt-1"
            >
              {loading ? 'Creando cuenta...' : t.register}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-warmgray-200 dark:bg-warmgray-700" />
            <span className="text-xs text-warmgray-400">o</span>
            <div className="flex-1 h-px bg-warmgray-200 dark:bg-warmgray-700" />
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2.5 text-warmgray-900 dark:text-white hover:bg-warmgray-50 dark:hover:bg-warmgray-700 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            {t.google}
          </button>

          <p className="text-sm text-warmgray-500 dark:text-warmgray-400 mt-6 text-center">
            {t.already}{' '}
            <Link to="/login" className="text-pink-500 font-semibold hover:text-pink-600 transition-colors">
              {t.login}
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
