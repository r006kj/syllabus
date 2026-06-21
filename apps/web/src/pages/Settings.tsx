import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import { useProfile } from '../hooks/useProfile'
import { useSettingsData } from '../hooks/useSettingsData'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type SettingsSection =
  | 'profile' | 'appearance' | 'language' | 'notifications'
  | 'integrations' | 'canvas' | 'account' | 'report'

const sections: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'profile',        label: 'Perfil',            icon: 'person'         },
  { id: 'appearance',     label: 'Apariencia',         icon: 'palette'        },
  { id: 'language',       label: 'Idioma',             icon: 'language'       },
  { id: 'notifications',  label: 'Notificaciones',     icon: 'notifications'  },
  { id: 'integrations',   label: 'Integraciones',      icon: 'sync'           },
  { id: 'canvas',         label: 'Conexión Canvas',    icon: 'school'         },
  { id: 'account',        label: 'Cuenta',             icon: 'security'       },
  { id: 'report',         label: 'Reportar problema',  icon: 'bug_report'     },
]

const card  = 'bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700'
const lbl   = 'text-sm font-bold text-warmgray-500 dark:text-warmgray-400 uppercase tracking-wide mb-3 block'
const input = 'w-full border border-warmgray-200 dark:border-warmgray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400'
const btn   = 'bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-bold transition-colors'
const btnGhost = 'border border-warmgray-200 dark:border-warmgray-600 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors'

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-12 h-6 rounded-full relative transition-colors flex items-center px-0.5 ${value ? 'bg-pink-500' : 'bg-warmgray-300 dark:bg-warmgray-600'}`}
  >
    <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
)

export const Settings = () => {
  const [active, setActive]   = useState<SettingsSection>('profile')
  const { darkMode, toggleTheme, fontSize, setFontSize, accentColor, setAccentColor } = useTheme() as any
  const { language, setLanguage } = useLanguage()
  const profile = useProfile()
  const { data: settings, loading, refresh } = useSettingsData()
  const { logout } = useAuth()
  const navigate = useNavigate()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [displayName, setDisplayName]     = useState('')
  const [savingName, setSavingName]       = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Semester dates ───────────────────────────────────────────────────────
  const [semesterStart, setSemesterStart]   = useState('')
  const [midtermWeek,   setMidtermWeek]     = useState('')
  const [finalWeek,     setFinalWeek]       = useState('')
  const [savingSem, setSavingSem]           = useState(false)

  // ── Canvas ───────────────────────────────────────────────────────────────
  const [canvasDomain, setCanvasDomain] = useState('')
  const [canvasToken,  setCanvasToken]  = useState('')
  const [connectingCanvas, setConnectingCanvas] = useState(false)

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifEnabled,    setNotifEnabled]   = useState(true)
  const [hoursBefore,     setHoursBefore]    = useState(24)
  // Class reminders
  const [classReminder,   setClassReminder]  = useState<'start'|'end'|'both'|'off'>('off')
  // Exam weekly digest
  const [examDigest,      setExamDigest]     = useState(false)
  const [examDigestDay,   setExamDigestDay]  = useState<'fri'|'sat'|'sun'>('fri')
  // Overload notif
  const [overloadNotif,   setOverloadNotif]  = useState(false)
  const [savingNotif, setSavingNotif]        = useState(false)

  // ── Account ──────────────────────────────────────────────────────────────
  const [newEmail,       setNewEmail]        = useState('')
  const [newPassword,    setNewPassword]     = useState('')
  const [confirmPass,    setConfirmPass]     = useState('')
  const [deleteConfirm,  setDeleteConfirm]   = useState('')
  const [accountMsg,     setAccountMsg]      = useState<string|null>(null)
  const [accountErr,     setAccountErr]      = useState<string|null>(null)

  // ── Report ───────────────────────────────────────────────────────────────
  const [reportText,   setReportText]   = useState('')
  const [reportImages, setReportImages] = useState<File[]>([])
  const [sendingReport, setSendingReport] = useState(false)
  const [reportDone,   setReportDone]   = useState(false)
  const reportFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (settings) {
      if (settings.semester_start) setSemesterStart(settings.semester_start)
      if ((settings as any).midterm_week)   setMidtermWeek((settings as any).midterm_week)
      if ((settings as any).final_week)     setFinalWeek((settings as any).final_week)
    }
  }, [settings])

  useEffect(() => {
    if (profile?.name) setDisplayName(profile.name)
  }, [profile])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    // Optionally upload to Supabase storage here; for now show preview
  }

  const handleSaveName = async () => {
    setSavingName(true)
    try {
      await supabase.auth.updateUser({ data: { name: displayName } })
      // Update localStorage user
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        u.user_metadata = { ...u.user_metadata, name: displayName }
        localStorage.setItem('user', JSON.stringify(u))
      }
    } finally { setSavingName(false) }
  }

  const handleSaveSem = async () => {
    setSavingSem(true)
    try {
      await api.patch('/profile/semester-start', {
        semester_start: semesterStart,
        midterm_week: midtermWeek || null,
        final_week: finalWeek || null
      })
      await refresh()
    } finally { setSavingSem(false) }
  }

  const handleConnectCanvas = async () => {
    setConnectingCanvas(true)
    try {
      await api.post('/canvas/connect', { canvas_token: canvasToken, canvas_domain: canvasDomain })
      await api.post('/canvas/sync')
      await refresh()
      setCanvasToken('')
    } finally { setConnectingCanvas(false) }
  }

  const handleSyncCanvas   = async () => { await api.post('/canvas/sync') }
  const handleDisconnectCanvas = async () => { await api.delete('/canvas/disconnect'); await refresh() }
  const handleConnectGoogle = async () => {
    const res = await api.get('/integrations/google-calendar/connect')
    window.location.href = res.data.url
  }

  const handleSaveNotif = async () => {
    setSavingNotif(true)
    try {
      await api.patch('/notifications/preferences', {
        notify_hours_before: hoursBefore,
        notifications_enabled: notifEnabled,
        class_reminder: classReminder,
        exam_digest: examDigest,
        exam_digest_day: examDigestDay,
        overload_notif: overloadNotif
      })
      await refresh()
    } finally { setSavingNotif(false) }
  }

  const handleChangeEmail = async () => {
    setAccountErr(null); setAccountMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) setAccountErr(error.message)
    else setAccountMsg('Correo de confirmación enviado a ' + newEmail)
    setNewEmail('')
  }

  const handleChangePassword = async () => {
    setAccountErr(null); setAccountMsg(null)
    if (newPassword !== confirmPass) { setAccountErr('Las contraseñas no coinciden'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setAccountErr(error.message)
    else setAccountMsg('Contraseña actualizada correctamente')
    setNewPassword(''); setConfirmPass('')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') { setAccountErr('Escribe ELIMINAR para confirmar'); return }
    const { error } = await supabase.rpc('delete_user')
    if (error) setAccountErr(error.message)
    else { await logout(); navigate('/login') }
  }

  const handleReport = async () => {
    if (!reportText.trim()) return
    setSendingReport(true)
    try {
      const form = new FormData()
      form.append('message', reportText)
      form.append('email', profile?.email ?? '')
      reportImages.forEach((f, i) => form.append(`image_${i}`, f))
      await api.post('/support/report', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setReportDone(true)
      setReportText('')
      setReportImages([])
    } catch {
      // show generic error
    } finally { setSendingReport(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 flex gap-8">

        {/* Side nav */}
        <aside className="w-56 flex-shrink-0">
          <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mb-6">Configuración</h1>
          <nav className="flex flex-col gap-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  active === s.id
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : 'text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800'
                }`}>
                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 max-w-xl flex flex-col gap-5">

          {/* ── PROFILE ── */}
          {active === 'profile' && (
            <>
              {/* Avatar + name */}
              <div className={card}>
                <span className={lbl}>Foto de perfil</span>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-pink-200 dark:bg-pink-900/40 flex items-center justify-center text-pink-700 dark:text-pink-300 font-bold text-2xl overflow-hidden">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                        : profile?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white">{profile?.name}</p>
                    <p className="text-xs text-warmgray-500 dark:text-warmgray-400">{profile?.email}</p>
                  </div>
                </div>

                <span className={lbl}>Nombre para mostrar</span>
                <div className="flex gap-2">
                  <input className={input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" />
                  <button onClick={handleSaveName} disabled={savingName} className={btn}>
                    {savingName ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Academic calendar */}
              <div className={card}>
                <span className={lbl}>Calendario académico</span>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-1 block">Inicio del ciclo</label>
                    <input type="date" className={input} value={semesterStart} onChange={e => setSemesterStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-1 block">Semana de parciales (fecha lunes)</label>
                    <input type="date" className={input} value={midtermWeek} onChange={e => setMidtermWeek(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-1 block">Semana de finales (fecha lunes)</label>
                    <input type="date" className={input} value={finalWeek} onChange={e => setFinalWeek(e.target.value)} />
                  </div>
                  <button onClick={handleSaveSem} disabled={savingSem} className={btn}>
                    {savingSem ? 'Guardando...' : 'Guardar fechas'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {active === 'appearance' && (
            <div className={card}>
              <span className={lbl}>Apariencia</span>

              {/* Dark mode */}
              <div className="flex items-center justify-between py-3 border-b border-warmgray-100 dark:border-warmgray-700">
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Modo oscuro</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Cambia entre tema claro y oscuro</p>
                </div>
                <Toggle value={darkMode} onChange={toggleTheme} />
              </div>

              {/* Font size */}
              <div className="py-3 border-b border-warmgray-100 dark:border-warmgray-700">
                <p className="text-sm font-medium text-warmgray-900 dark:text-white mb-2">Tamaño de texto</p>
                <div className="flex gap-2">
                  {(['sm','md','lg'] as const).map(s => (
                    <button key={s} onClick={() => setFontSize?.(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        (fontSize ?? 'md') === s
                          ? 'bg-pink-400 text-white'
                          : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300'
                      }`}>
                      {s === 'sm' ? 'Pequeño' : s === 'md' ? 'Normal' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div className="py-3 border-b border-warmgray-100 dark:border-warmgray-700">
                <p className="text-sm font-medium text-warmgray-900 dark:text-white mb-2">Color de acento</p>
                <div className="flex gap-2">
                  {[
                    { name: 'pink',   bg: 'bg-pink-500'   },
                    { name: 'violet', bg: 'bg-violet-500'  },
                    { name: 'blue',   bg: 'bg-blue-500'    },
                    { name: 'emerald',bg: 'bg-emerald-500' },
                    { name: 'amber',  bg: 'bg-amber-500'   },
                  ].map(c => (
                    <button key={c.name} onClick={() => setAccentColor?.(c.name)}
                      className={`w-8 h-8 rounded-full ${c.bg} transition-all ${(accentColor ?? 'pink') === c.name ? 'ring-2 ring-offset-2 ring-warmgray-400 scale-110' : 'opacity-60 hover:opacity-100'}`} />
                  ))}
                </div>
              </div>

              {/* Reduce motion */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Reducir animaciones</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Menos efectos de movimiento</p>
                </div>
                <Toggle value={false} onChange={() => {}} />
              </div>
            </div>
          )}

          {/* ── LANGUAGE ── */}
          {active === 'language' && (
            <div className={card}>
              <span className={lbl}>Idioma</span>
              <div className="flex gap-2">
                {(['es','en'] as const).map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      language === lang ? 'bg-pink-400 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300'
                    }`}>
                    {lang === 'es' ? '🇵🇪 Español' : '🇺🇸 English'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {active === 'notifications' && !loading && settings && (
            <div className={`${card} flex flex-col gap-5`}>
              <span className={lbl}>Notificaciones</span>

              {/* Global toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Activar notificaciones</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Recibir avisos de tareas y clases</p>
                </div>
                <Toggle value={notifEnabled} onChange={setNotifEnabled} />
              </div>

              {/* Task deadline reminder */}
              <div className="border-t border-warmgray-100 dark:border-warmgray-700 pt-4">
                <p className="text-sm font-bold text-warmgray-900 dark:text-white mb-2">Recordatorio de entregas</p>
                <label className="text-xs text-warmgray-500 mb-1 block">Avisar con anticipación de</label>
                <select value={hoursBefore} onChange={e => setHoursBefore(Number(e.target.value))} className={input}>
                  <option value={1}>1 hora</option>
                  <option value={6}>6 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                  <option value={168}>1 semana</option>
                </select>
              </div>

              {/* Class attendance reminder */}
              <div className="border-t border-warmgray-100 dark:border-warmgray-700 pt-4">
                <p className="text-sm font-bold text-warmgray-900 dark:text-white mb-1">Recordatorio de clases con asistencia</p>
                <p className="text-xs text-warmgray-400 mb-3">Solo para clases marcadas como "requiere asistencia"</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { val: 'off',   label: 'Desactivado' },
                    { val: 'start', label: 'Al inicio' },
                    { val: 'end',   label: 'Al terminar' },
                    { val: 'both',  label: 'Ambas' },
                  ] as const).map(o => (
                    <button key={o.val} onClick={() => setClassReminder(o.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors border ${
                        classReminder === o.val
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-warmgray-50 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300 border-warmgray-200 dark:border-warmgray-600'
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam weekly digest */}
              <div className="border-t border-warmgray-100 dark:border-warmgray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white">Informe semanal de exámenes</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">Resumen de todos los exámenes de la próxima semana</p>
                  </div>
                  <Toggle value={examDigest} onChange={setExamDigest} />
                </div>
                {examDigest && (
                  <div className="flex gap-2 mt-2">
                    {([
                      { val: 'fri', label: 'Viernes' },
                      { val: 'sat', label: 'Sábado' },
                      { val: 'sun', label: 'Domingo' },
                    ] as const).map(d => (
                      <button key={d.val} onClick={() => setExamDigestDay(d.val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          examDigestDay === d.val ? 'bg-pink-500 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Overload notification */}
              <div className="border-t border-warmgray-100 dark:border-warmgray-700 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white">Alerta de semana sobrecargada</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Aviso cuando tengas 3+ entregas en una semana</p>
                </div>
                <Toggle value={overloadNotif} onChange={setOverloadNotif} />
              </div>

              <button onClick={handleSaveNotif} disabled={savingNotif} className={btn}>
                {savingNotif ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {active === 'integrations' && !loading && settings && (
            <div className="flex flex-col gap-4">
              <div className={`${card} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Google Calendar</p>
                  <p className="text-xs text-warmgray-400">{settings.google_connected ? '✅ Conectado' : 'No conectado'}</p>
                </div>
                <button onClick={handleConnectGoogle} className={btnGhost}>
                  {settings.google_connected ? 'Reconectar' : 'Conectar'}
                </button>
              </div>
              <div className={`${card} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">Notion</p>
                  <p className="text-xs text-warmgray-400">Sincroniza tus tareas a una base de datos</p>
                </div>
                <button onClick={() => api.post('/integrations/notion/sync')} className={btnGhost}>Sincronizar</button>
              </div>
            </div>
          )}

          {/* ── CANVAS ── */}
          {active === 'canvas' && !loading && settings && (
            <div className={card}>
              <span className={lbl}>Conexión Canvas</span>
              {settings.canvas_connected ? (
                <>
                  <p className="text-xs text-warmgray-500 mb-1">Dominio conectado</p>
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white mb-4">{settings.canvas_domain}</p>
                  <div className="flex gap-2">
                    <button onClick={handleSyncCanvas} className={btn}>Sincronizar ahora</button>
                    <button onClick={handleDisconnectCanvas} className={btnGhost}>Desconectar</button>
                  </div>
                </>
              ) : (
                <>
                  <input className={`${input} mb-3`} placeholder="Dominio (ej: utec.instructure.com)" value={canvasDomain} onChange={e => setCanvasDomain(e.target.value)} />
                  <input type="password" className={`${input} mb-4`} placeholder="Access Token de Canvas" value={canvasToken} onChange={e => setCanvasToken(e.target.value)} />
                  <button onClick={handleConnectCanvas} disabled={connectingCanvas || !canvasDomain || !canvasToken} className={btn}>
                    {connectingCanvas ? 'Conectando...' : 'Conectar Canvas'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {active === 'account' && (
            <div className="flex flex-col gap-4">
              {accountMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-3 text-sm">{accountMsg}</div>
              )}
              {accountErr && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl px-4 py-3 text-sm">{accountErr}</div>
              )}

              {/* Change email */}
              <div className={card}>
                <span className={lbl}>Cambiar correo electrónico</span>
                <input type="email" className={`${input} mb-3`} placeholder="Nuevo correo" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <button onClick={handleChangeEmail} disabled={!newEmail} className={btn}>Actualizar correo</button>
              </div>

              {/* Change password */}
              <div className={card}>
                <span className={lbl}>Cambiar contraseña</span>
                <input type="password" className={`${input} mb-2`} placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <input type="password" className={`${input} mb-3`} placeholder="Confirmar contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                <button onClick={handleChangePassword} disabled={!newPassword || newPassword !== confirmPass} className={btn}>Cambiar contraseña</button>
              </div>

              {/* Logout */}
              <div className={card}>
                <span className={lbl}>Sesión</span>
                <button onClick={async () => { await logout(); navigate('/login') }} className={btnGhost}>Cerrar sesión</button>
              </div>

              {/* Delete account */}
              <div className={`${card} border-red-200 dark:border-red-800/50`}>
                <span className="text-sm font-bold text-red-500 uppercase tracking-wide mb-3 block">⚠ Zona de peligro</span>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-3">Esta acción es irreversible. Escribe <strong className="text-warmgray-700 dark:text-warmgray-300">ELIMINAR</strong> para confirmar.</p>
                <input className={`${input} mb-3`} placeholder="ELIMINAR" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'ELIMINAR'}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-bold transition-colors">
                  Eliminar cuenta permanentemente
                </button>
              </div>
            </div>
          )}

          {/* ── REPORT ── */}
          {active === 'report' && (
            <div className={card}>
              <span className={lbl}>Reportar un problema</span>
              {reportDone ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white">¡Reporte enviado!</p>
                  <p className="text-xs text-warmgray-400 mt-1">Lo revisaremos pronto. Gracias por ayudarnos a mejorar.</p>
                  <button onClick={() => setReportDone(false)} className="mt-4 text-xs text-pink-500 font-bold hover:opacity-70">Enviar otro reporte</button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-3">
                    Describe el problema con el mayor detalle posible. Puedes adjuntar capturas de pantalla.
                  </p>
                  <textarea
                    className={`${input} min-h-[120px] resize-y mb-3`}
                    placeholder="Describe el error o problema que encontraste..."
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                  />

                  {/* Image attachments */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {reportImages.map((f, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-warmgray-200 dark:border-warmgray-600">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setReportImages(imgs => imgs.filter((_, j) => j !== i))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      {reportImages.length < 5 && (
                        <button
                          onClick={() => reportFileRef.current?.click()}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-warmgray-300 dark:border-warmgray-600 flex items-center justify-center text-warmgray-400 hover:border-pink-400 hover:text-pink-400 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      )}
                    </div>
                    <input
                      ref={reportFileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files ?? [])
                        setReportImages(prev => [...prev, ...files].slice(0, 5))
                        e.target.value = ''
                      }}
                    />
                    <p className="text-[10px] text-warmgray-400">Máximo 5 imágenes</p>
                  </div>

                  <button onClick={handleReport} disabled={sendingReport || !reportText.trim()} className={btn}>
                    {sendingReport ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </>
              )}
            </div>
          )}

        </section>
      </main>
    </div>
  )
}