import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'

// ─── Types ────────────────────────────────────────────────────────────────────

type Course = { id: string; name: string; is_primary: boolean | null }

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = ['Canvas', 'Sílabos', 'Listo']

const StepBar = ({ current }: { current: number }) => (
  <div className="flex items-center gap-0 mb-10">
    {STEPS.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
            i < current  ? 'bg-lemon-500 text-white' :
            i === current ? 'bg-pink-500 text-white ring-4 ring-pink-500/20' :
            'bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-400'
          }`}>
            {i < current
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              : i + 1}
          </div>
          <span className={`text-[9px] font-bold mt-1 ${i === current ? 'text-pink-500' : 'text-warmgray-400'}`}>{label}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`w-12 h-px mx-1 mb-5 transition-colors ${i < current ? 'bg-lemon-400' : 'bg-warmgray-200 dark:bg-warmgray-700'}`} />
        )}
      </div>
    ))}
  </div>
)

// ─── Step 1 – Canvas connect ─────────────────────────────────────────────────

const StepCanvas = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => {
  const [domain,  setDomain]  = useState('')
  const [token,   setToken]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  const handleConnect = async () => {
    if (!domain.trim() || !token.trim()) { setError('Completa ambos campos.'); return }
    setLoading(true); setError(null)
    const cleanDomain = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase()
    try {
      await api.post('/canvas/connect', { canvas_domain: cleanDomain, canvas_token: token.trim() })
      // Fire sync immediately so courses are ready by the time user reaches step 2.
      // Run in background — don't await, don't block the success screen.
      api.post('/canvas/sync').catch(() => {})
      setDone(true)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No se pudo conectar. Verifica el dominio y el token.')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="w-16 h-16 rounded-2xl bg-lemon-50 dark:bg-lemon-900/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-lemon-500 text-[32px]">check_circle</span>
      </div>
      <div>
        <h3 className="font-headline text-xl font-bold text-warmgray-900 dark:text-white mb-1">¡Canvas conectado!</h3>
        <p className="text-sm text-warmgray-500 dark:text-warmgray-400">Tus cursos y notas se sincronizarán automáticamente.</p>
      </div>
      <button onClick={onNext} className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm rounded-xl px-8 py-2.5 transition-colors">
        Continuar →
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white mb-1">Conecta Canvas</h2>
        <p className="text-sm text-warmgray-500 dark:text-warmgray-400">
          Importa tus cursos, notas y fechas de entrega directamente desde Canvas LMS.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">Dominio de Canvas</label>
        <input
          type="text"
          placeholder="utec.instructure.com"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onBlur={e => setDomain(e.target.value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase())}
          className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
        />
        <p className="text-[10px] text-warmgray-400 mt-1">Solo el dominio, sin https:// · ej: <span className="font-mono">utec.instructure.com</span></p>
      </div>

      <div>
        <label className="text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 mb-1.5 block">Token de acceso</label>
        <input
          type="password"
          placeholder="Tu token de Canvas"
          value={token}
          onChange={e => setToken(e.target.value)}
          className="w-full border border-warmgray-200 dark:border-warmgray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 transition-all placeholder-warmgray-300 dark:placeholder-warmgray-600"
        />
        <p className="text-[10px] text-warmgray-400 mt-1">En Canvas: Cuenta → Configuración → Tokens de acceso → Nuevo token</p>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          {loading ? 'Conectando...' : 'Conectar Canvas'}
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-300 transition-colors py-1"
        >
          Omitir por ahora (puedes conectarlo desde Configuración)
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 – Syllabus selection ─────────────────────────────────────────────

const StepSyllabus = ({ onNext }: { onNext: () => void }) => {
  const [courses,   setCourses]   = useState<Course[]>([])
  const [loaded,    setLoaded]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(false)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [extracting, setExtracting] = useState<Set<string>>(new Set())
  const [done,      setDone]      = useState<Set<string>>(new Set())

  const syncCourses = async () => {
    setSyncing(true)
    try {
      await api.post('/canvas/sync')
      const res = await api.get('/courses')
      const primary = (res.data as Course[]).filter(c => c.is_primary !== false)
      setCourses(primary)
      setLoaded(true)
    } catch { /* user skipped canvas — fetch courses anyway */
      try {
        const res = await api.get('/courses')
        const primary = (res.data as Course[]).filter(c => c.is_primary !== false)
        setCourses(primary)
        setLoaded(true)
      } catch { setLoaded(true) }
    } finally { setSyncing(false) }
  }

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const extractSelected = async () => {
    setLoading(true)
    const ids = Array.from(selected)
    for (const id of ids) {
      setExtracting(prev => new Set(prev).add(id))
      try {
        await api.post(`/syllabus/${id}/extract`)
        localStorage.setItem(`syllabus_extracted_${id}`, '1')
        setDone(prev => new Set(prev).add(id))
      } catch { /* ignore individual errors */ }
      finally { setExtracting(prev => { const n = new Set(prev); n.delete(id); return n }) }
    }
    setLoading(false)
    onNext()
  }

  if (!loaded) return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white mb-1">Elige tus sílabos</h2>
        <p className="text-sm text-warmgray-500 dark:text-warmgray-400">
          Syllabus puede leer tus sílabos y extraer automáticamente las fechas de evaluaciones.
        </p>
      </div>
      <button
        onClick={syncCourses}
        disabled={syncing}
        className="flex items-center justify-center gap-2 w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
      >
        <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
        {syncing ? 'Cargando cursos...' : 'Cargar mis cursos'}
      </button>
      <button onClick={onNext} className="text-xs text-warmgray-400 hover:text-warmgray-600 transition-colors py-1 text-center">
        Omitir este paso
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white mb-1">Elige tus sílabos</h2>
        <p className="text-sm text-warmgray-500 dark:text-warmgray-400">
          Selecciona los cursos cuyos sílabos quieres leer. Esto es <span className="font-semibold">opcional</span> y puedes hacerlo después desde cada curso.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8 text-warmgray-400 text-sm">
          No se encontraron cursos. Puedes sincronizar Canvas desde Configuración.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {courses.map(c => {
            const isSelected = selected.has(c.id)
            const isExtracting = extracting.has(c.id)
            const isDone = done.has(c.id)
            return (
              <button
                key={c.id}
                onClick={() => !isDone && toggle(c.id)}
                disabled={isDone || loading}
                className={`w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                  isDone ? 'border-lemon-300 dark:border-lemon-700 bg-lemon-50 dark:bg-lemon-900/20' :
                  isSelected ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/40' :
                  'border-warmgray-200 dark:border-warmgray-700 hover:border-pink-300 dark:hover:border-pink-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDone ? 'bg-lemon-500 border-lemon-500' :
                  isSelected ? 'bg-pink-500 border-pink-500' :
                  'border-warmgray-300 dark:border-warmgray-600'
                }`}>
                  {isDone
                    ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : isSelected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span className="text-sm text-warmgray-800 dark:text-warmgray-200 flex-1 truncate">{c.name}</span>
                {isExtracting && (
                  <span className="material-symbols-outlined text-[14px] text-pink-400 animate-spin">progress_activity</span>
                )}
                {isDone && <span className="text-[10px] font-bold text-lemon-600 dark:text-lemon-400">Listo</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={extractSelected}
          disabled={loading || selected.size === 0}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          {loading ? 'Procesando...' : `Leer sílabos seleccionados (${selected.size})`}
        </button>
        <button onClick={onNext} className="text-xs text-warmgray-400 hover:text-warmgray-600 transition-colors py-1 text-center">
          Omitir y hacer esto después
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 – Settings overview ──────────────────────────────────────────────

const CONFIG_SECTIONS = [
  { icon: 'person',        label: 'Perfil',        desc: 'Foto, nombre de usuario, datos personales',     href: '/settings#profile'       },
  { icon: 'palette',       label: 'Apariencia',    desc: 'Color de acento, modo oscuro, fuente',          href: '/settings#appearance'    },
  { icon: 'notifications', label: 'Notificaciones',desc: 'Alertas de entregas y recordatorios',           href: '/settings#notifications' },
  { icon: 'school',        label: 'Canvas',        desc: 'Sincronización, tokens y cursos',               href: '/settings#canvas'        },
  { icon: 'calendar_month',label: 'Semestre',      desc: 'Fecha de inicio, semanas de parciales y finales', href: '/settings#preferences'  },
  { icon: 'sync',          label: 'Integraciones', desc: 'Notion, Google Calendar y más',                 href: '/settings#integrations'  },
]

const StepDone = ({ onFinish }: { onFinish: () => void }) => (
  <div className="flex flex-col gap-6">
    <div>
      <h2 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white mb-1">¡Todo listo!</h2>
      <p className="text-sm text-warmgray-500 dark:text-warmgray-400">
        Aquí tienes un vistazo de todo lo que puedes configurar en Syllabus.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2.5">
      {CONFIG_SECTIONS.map((s, i) => (
        <a
          key={i}
          href={s.href}
          className="flex items-start gap-2.5 p-3 rounded-xl border border-warmgray-100 dark:border-warmgray-800 bg-warmgray-50 dark:bg-warmgray-900 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all group"
        >
          <span className="material-symbols-outlined text-[18px] text-warmgray-400 group-hover:text-pink-500 transition-colors flex-shrink-0 mt-0.5">{s.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{s.label}</p>
            <p className="text-[10px] text-warmgray-400 leading-snug mt-0.5 truncate">{s.desc}</p>
          </div>
        </a>
      ))}
    </div>

    <button
      onClick={onFinish}
      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
    >
      <span className="material-symbols-outlined text-[18px]">dashboard</span>
      Ir al Dashboard
    </button>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

export const Onboarding = () => {
  const { darkMode } = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const next = () => setStep(s => s + 1)

  return (
    <div className="min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <div className="mb-8">
        <img src={darkMode ? logoDark : logoLight} alt="Syllabus" className="w-12 h-12 mx-auto" />
      </div>

      <div className="w-full max-w-md">
        <StepBar current={step} />

        <div className="bg-white dark:bg-warmgray-900 rounded-2xl border border-warmgray-100 dark:border-warmgray-800 shadow-sm p-7">
          {step === 0 && <StepCanvas onNext={next} onSkip={next} />}
          {step === 1 && <StepSyllabus onNext={next} />}
          {step === 2 && <StepDone onFinish={() => navigate('/dashboard')} />}
        </div>

        <p className="text-center text-[10px] text-warmgray-400 mt-5">
          Paso {step + 1} de {STEPS.length} · Puedes omitir y configurar todo desde{' '}
          <button onClick={() => navigate('/settings')} className="text-pink-500 hover:text-pink-600 font-semibold transition-colors">
            Ajustes
          </button>
        </p>
      </div>
    </div>
  )
}
