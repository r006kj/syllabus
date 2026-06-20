import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import { useProfile } from '../hooks/useProfile'
import { useSettingsData } from '../hooks/useSettingsData'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

type SettingsSection = 'profile' | 'appearance' | 'language' | 'notifications' | 'integrations' | 'canvas' | 'account'


const sections: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'profile', label: 'Perfil', icon: 'person' },
  { id: 'appearance', label: 'Apariencia', icon: 'palette' },
  { id: 'language', label: 'Idioma', icon: 'language' },
  { id: 'notifications', label: 'Notificaciones', icon: 'notifications' },
  { id: 'integrations', label: 'Integraciones', icon: 'sync' },
  { id: 'canvas', label: 'Conexión Canvas', icon: 'school' },
  { id: 'account', label: 'Cuenta', icon: 'security' }
]

const cardClass = 'bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700'
const labelClass = 'text-sm font-bold text-warmgray-500 dark:text-warmgray-400 uppercase tracking-wide mb-4'

export const Settings = () => {

  const [active, setActive] = useState<SettingsSection>('profile')
  const { darkMode, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const profile = useProfile()
  const { data: settings, loading, refresh } = useSettingsData()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [hoursBefore, setHoursBefore] = useState(24)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [canvasDomain, setCanvasDomain] = useState('')
  const [canvasToken, setCanvasToken] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [connectingCanvas, setConnectingCanvas] = useState(false)

  const [semesterStart, setSemesterStart] = useState('')
  const [savingSemesterStart, setSavingSemesterStart] = useState(false)

  useEffect(() => {
    if (settings?.semester_start) {
      setSemesterStart(settings.semester_start)
    }
  }, [settings?.semester_start])

  const handleSaveNotifPrefs = async () => {
    setSavingPrefs(true)
    try {
      await api.patch('/notifications/preferences', {
        notify_hours_before: hoursBefore,
        notifications_enabled: notifEnabled
      })
      await refresh()
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleSaveSemesterStart = async () => {
    setSavingSemesterStart(true)
    try {
      await api.patch('/profile/semester-start', { semester_start: semesterStart })
      await refresh()
    } finally {
      setSavingSemesterStart(false)
    }
  }

  const handleConnectCanvas = async () => {
    setConnectingCanvas(true)
    try {
      await api.post('/canvas/connect', { canvas_token: canvasToken, canvas_domain: canvasDomain })
      await api.post('/canvas/sync')
      await refresh()
      setCanvasToken('')
    } finally {
      setConnectingCanvas(false)
    }
  }

  const handleDisconnectCanvas = async () => {
    await api.delete('/canvas/disconnect')
    await refresh()
  }

  const handleSyncCanvas = async () => {
    await api.post('/canvas/sync')
  }

  const handleConnectGoogle = async () => {
    const res = await api.get('/integrations/google-calendar/connect')
    window.location.href = res.data.url
  }

  const handleSyncNotion = async () => {
    await api.post('/integrations/notion/sync')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 flex gap-8">
        <aside className="w-56 flex-shrink-0">
          <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mb-6">
            Configuración
          </h1>
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  active === s.id
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : 'text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 max-w-xl flex flex-col gap-4">

          {active === 'profile' && (
            <>
              <div className={`${cardClass} flex items-center gap-4`}>
                <div className="w-14 h-14 rounded-full bg-pink-200 dark:bg-pink-900/40 flex items-center justify-center text-pink-700 dark:text-pink-300 font-bold text-xl">
                  {profile?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-medium text-warmgray-900 dark:text-white">{profile?.name ?? 'Usuario'}</p>
                  <p className="text-sm text-warmgray-500 dark:text-warmgray-400">{profile?.email ?? ''}</p>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={labelClass}>Inicio del ciclo académico</h2>
                <p className="text-sm text-warmgray-600 dark:text-warmgray-300 mb-3">
                  Se usa para calcular la semana real del ciclo en el rendimiento de cada curso.
                </p>
                <input
                  type="date"
                  value={semesterStart}
                  onChange={(e) => setSemesterStart(e.target.value)}
                  className="w-full border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                />
                <button
                  onClick={handleSaveSemesterStart}
                  disabled={savingSemesterStart || !semesterStart}
                  className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {savingSemesterStart ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </>
          )}

          {active === 'appearance' && (
            <div className={cardClass}>
              <h2 className={labelClass}>Apariencia</h2>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-warmgray-900 dark:text-white">Modo oscuro</span>
                <button
                  onClick={toggleTheme}
                  className={`w-14 h-7 rounded-full relative transition-colors flex items-center px-1 ${
                    darkMode ? 'bg-pink-500' : 'bg-warmgray-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] transition-transform ${
                      darkMode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  >
                    {darkMode ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {active === 'language' && (
            <div className={cardClass}>
              <h2 className={labelClass}>Idioma</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    language === 'es' ? 'bg-pink-400 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300'
                  }`}
                >
                  Español
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    language === 'en' ? 'bg-pink-400 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          )}

          {active === 'notifications' && !loading && settings && (
            <div className={cardClass}>
              <h2 className={labelClass}>Notificaciones</h2>

              <div className="flex items-center justify-between py-2 mb-4">
                <span className="text-sm text-warmgray-900 dark:text-white">Avisos de vencimiento</span>
                <button
                  onClick={() => setNotifEnabled(!notifEnabled)}
                  className={`w-14 h-7 rounded-full relative transition-colors flex items-center px-1 ${
                    notifEnabled ? 'bg-pink-500' : 'bg-warmgray-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>

              <label className="text-sm text-warmgray-900 dark:text-white block mb-2">Avisar con anticipación de</label>
              <select
                value={hoursBefore}
                onChange={(e) => setHoursBefore(Number(e.target.value))}
                className="w-full border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
              >
                <option value={24}>24 horas</option>
                <option value={48}>48 horas</option>
                <option value={168}>1 semana</option>
              </select>

              <button
                onClick={handleSaveNotifPrefs}
                disabled={savingPrefs}
                className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {savingPrefs ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}

          {active === 'integrations' && !loading && settings && (
            <div className="flex flex-col gap-4">
              <div className={`${cardClass} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Google Calendar</p>
                  <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                    {settings.google_connected ? 'Conectado' : 'No conectado'}
                  </p>
                </div>
                <button
                  onClick={handleConnectGoogle}
                  className="bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-900 dark:text-white rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {settings.google_connected ? 'Reconectar' : 'Conectar'}
                </button>
              </div>

              <div className={`${cardClass} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Notion</p>
                  <p className="text-xs text-warmgray-500 dark:text-warmgray-400">Sincroniza tus tareas a una base de datos</p>
                </div>
                <button
                  onClick={handleSyncNotion}
                  className="bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-900 dark:text-white rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Sincronizar
                </button>
              </div>
            </div>
          )}

          {active === 'canvas' && !loading && settings && (
            <div className={cardClass}>
              <h2 className={labelClass}>Conexión Canvas</h2>

              {settings.canvas_connected ? (
                <>
                  <p className="text-sm text-warmgray-700 dark:text-warmgray-300 mb-1">Dominio conectado</p>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white mb-4">{settings.canvas_domain}</p>
                  <div className="flex gap-2">
                    <button onClick={handleSyncCanvas} className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium">
                      Sincronizar ahora
                    </button>
                    <button onClick={handleDisconnectCanvas} className="border border-warmgray-200 dark:border-warmgray-600 text-warmgray-700 dark:text-warmgray-300 rounded-lg px-4 py-2 text-sm font-medium">
                      Desconectar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Dominio (ej: utec.instructure.com)"
                    value={canvasDomain}
                    onChange={(e) => setCanvasDomain(e.target.value)}
                    className="w-full border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="Access Token de Canvas"
                    value={canvasToken}
                    onChange={(e) => setCanvasToken(e.target.value)}
                    className="w-full border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                  />
                  <button
                    onClick={handleConnectCanvas}
                    disabled={connectingCanvas || !canvasDomain || !canvasToken}
                    className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {connectingCanvas ? 'Conectando...' : 'Conectar Canvas'}
                  </button>
                </>
              )}
            </div>
          )}

          {active === 'account' && (
            <div className={cardClass}>
              <h2 className={labelClass}>Cuenta</h2>
              <button
                onClick={handleLogout}
                className="bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-900 dark:text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Cerrar sesión
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
  )
}