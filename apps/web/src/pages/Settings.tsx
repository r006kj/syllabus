import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import { useProfile } from '../hooks/useProfile'
import { useSettingsData } from '../hooks/useSettingsData'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection =
  | 'profile' | 'appearance' | 'language' | 'notifications'
  | 'integrations' | 'canvas' | 'account' | 'report'

const sections: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Perfil',           icon: 'person'        },
  { id: 'appearance',    label: 'Apariencia',        icon: 'palette'       },
  { id: 'language',      label: 'Idioma',            icon: 'language'      },
  { id: 'notifications', label: 'Notificaciones',    icon: 'notifications' },
  { id: 'integrations',  label: 'Integraciones',     icon: 'sync'          },
  { id: 'canvas',        label: 'Canvas',            icon: 'school'        },
  { id: 'account',       label: 'Cuenta',            icon: 'security'      },
  { id: 'report',        label: 'Reportar problema', icon: 'bug_report'    },
]

// ─── Style constants ──────────────────────────────────────────────────────────

const card  = 'bg-white dark:bg-warmgray-800 rounded-2xl border border-warmgray-100 dark:border-warmgray-700'
const lbl   = 'text-[10px] font-bold text-warmgray-400 dark:text-warmgray-500 uppercase tracking-widest mb-2 block'
const input = 'w-full border border-warmgray-200 dark:border-warmgray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-warmgray-700/50 text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-shadow placeholder-warmgray-300 dark:placeholder-warmgray-500'
const btn   = 'bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors'
const btnGhost = 'border border-warmgray-200 dark:border-warmgray-600 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors'
const row   = 'flex items-center justify-between py-3.5 border-b border-warmgray-100 dark:border-warmgray-700 last:border-0'

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`w-12 h-6 rounded-full relative transition-colors flex items-center px-0.5 flex-shrink-0 ${value ? 'bg-pink-500' : 'bg-warmgray-300 dark:bg-warmgray-600'}`}>
    <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
)

const Toast = ({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) => (
  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium mb-4
    ${type === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50'
      : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-700/50'}`}>
    {type === 'ok'
      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
    <span className="flex-1">{msg}</span>
    <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
)

// ─── Service logos ────────────────────────────────────────────────────────────

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const NotionLogo = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="12" fill="white"/>
    <path d="M12 18.4c2.2 1.8 3 1.7 7.1 1.4l38.6-2.3c.8 0 .1-.8-.3-1L51 11.7c-.9-.7-2.1-1.5-4.4-1.3L9.6 13c-1.4.1-1.7.8-1.1 1.5l3.5 3.9zm2.1 7.5v40.5c0 2.2 1.1 3 3.5 2.8l42.4-2.4c2.4-.1 3-.8 3-3V23.4c0-2.2-1-3.3-2.9-3.1l-43 2.4c-2 .1-3 1.2-3 3.2zm42.3 1.9c.3 1.4 0 2.8-1.4 3l-2.2.4v32.3c-1.9 1-3.7 1.6-5.2.6l-16.8-26.3v25.5l5.3 1.2s0 2.8-3.9 3L23 69.4c-.3-.7 0-2.4 1.1-2.7l2.9-.8V34.8L23 34.3c-.3-1.4.4-3.4 2.5-3.5l14.5-.9L57.2 56V31.9l-4.4-.5c-.4-1.7.7-2.9 2-3l13-3.5c.3 1.1-.1 2.5-.4 3.4z" fill="black"/>
  </svg>
)

const CanvasLogo = () => (
  <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#E66000"/>
    <path d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 21.2c-5.1 0-9.2-4.1-9.2-9.2s4.1-9.2 9.2-9.2 9.2 4.1 9.2 9.2-4.1 9.2-9.2 9.2z" fill="white"/>
    <circle cx="20" cy="20" r="4" fill="white"/>
  </svg>
)

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange, onComplete, disabled }: {
  value: string
  onChange: (v: string) => void
  onComplete: (v: string) => void
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')

  const commit = (arr: string[]) => {
    const joined = arr.join('').trimEnd()
    onChange(joined)
    if (joined.replace(/ /g, '').length === 6) onComplete(joined)
  }

  const handleChange = (i: number, raw: string) => {
    const ch = raw.replace(/\D/g, '').slice(-1)
    const arr = [...digits]; arr[i] = ch || ' '
    commit(arr)
    if (ch && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = [...digits]
      if (arr[i].trim()) { arr[i] = ' '; commit(arr) }
      else if (i > 0) { arr[i - 1] = ' '; commit(arr); refs.current[i - 1]?.focus() }
    } else if (e.key === 'ArrowLeft' && i > 0) { refs.current[i - 1]?.focus() }
    else if (e.key === 'ArrowRight' && i < 5) { refs.current[i + 1]?.focus() }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const arr = pasted.padEnd(6, ' ').slice(0, 6).split('')
    commit(arr)
    const next = Math.min(pasted.length, 5)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, i) => (
        <input key={i}
          ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1}
          value={d.trim()} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all
            bg-white dark:bg-warmgray-700/50 text-warmgray-900 dark:text-white
            disabled:opacity-40 outline-none
            ${d.trim()
              ? 'border-pink-400 dark:border-pink-500 shadow-[0_0_0_3px_rgba(199,94,110,0.15)]'
              : 'border-warmgray-200 dark:border-warmgray-600 focus:border-pink-400 focus:shadow-[0_0_0_3px_rgba(199,94,110,0.15)]'
            }`}
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Settings = () => {
  const { collapsed }  = useSidebar()
  const [active, setActive] = useState<SettingsSection>('profile')
  const { darkMode, toggleTheme, fontSize, setFontSize, accentColor, setAccentColor, reduceMotion, setReduceMotion } = useTheme()
  const { language, setLanguage } = useLanguage()
  const profile                   = useProfile()
  const { data: settings, loading, refresh } = useSettingsData()
  const { logout }   = useAuth()
  const navigate     = useNavigate()

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'ok'|'err' } | null>(null)
  const showOk  = (msg: string) => setToast({ msg, type: 'ok' })
  const showErr = (msg: string) => setToast({ msg, type: 'err' })

  // ── Profile ────────────────────────────────────────────────────────────────
  const [displayName,   setDisplayName]   = useState('')
  const [savingName,    setSavingName]    = useState(false)

  // ── Semester ───────────────────────────────────────────────────────────────
  const [semesterStart, setSemesterStart] = useState('')
  const [midtermWeek,   setMidtermWeek]   = useState('')
  const [finalWeek,     setFinalWeek]     = useState('')
  const [savingSem,     setSavingSem]     = useState(false)

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const [canvasDomain,      setCanvasDomain]      = useState('')
  const [canvasToken,       setCanvasToken]       = useState('')
  const [connectingCanvas,  setConnectingCanvas]  = useState(false)

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifEnabled,  setNotifEnabled]  = useState(true)
  const [hoursBefore,   setHoursBefore]   = useState(24)
  const [classReminder, setClassReminder] = useState<'start'|'end'|'both'|'off'>('off')
  const [examDigest,    setExamDigest]    = useState(false)
  const [examDigestDay, setExamDigestDay] = useState<'fri'|'sat'|'sun'>('fri')
  const [overloadNotif, setOverloadNotif] = useState(false)
  const [savingNotif,   setSavingNotif]   = useState(false)

  // ── Account ────────────────────────────────────────────────────────────────
  const [newEmail,      setNewEmail]      = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [confirmPass,   setConfirmPass]   = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  type CodeAction = 'email' | 'password' | 'delete'
  const [codeTarget,  setCodeTarget]  = useState<CodeAction | null>(null)
  const [otpValue,    setOtpValue]    = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifying,   setVerifying]   = useState(false)
  const [countdown,   setCountdown]   = useState(0)

  // ── Report ─────────────────────────────────────────────────────────────────
  const [reportText,   setReportText]   = useState('')
  const [reportImages, setReportImages] = useState<File[]>([])
  const [sendingReport, setSendingReport] = useState(false)
  const [reportDone,   setReportDone]   = useState(false)


  // ── Load from settings ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings) return
    if (settings.semester_start)            setSemesterStart(settings.semester_start)
    if ((settings as any).midterm_week)     setMidtermWeek((settings as any).midterm_week)
    if ((settings as any).final_week)       setFinalWeek((settings as any).final_week)
    if (settings.notifications_enabled !== undefined) setNotifEnabled(settings.notifications_enabled)
    if (settings.notify_hours_before)       setHoursBefore(settings.notify_hours_before)
    if ((settings as any).class_reminder)   setClassReminder((settings as any).class_reminder)
    if ((settings as any).exam_digest !== undefined) setExamDigest((settings as any).exam_digest)
    if ((settings as any).exam_digest_day)  setExamDigestDay((settings as any).exam_digest_day)
    if ((settings as any).overload_notif !== undefined) setOverloadNotif((settings as any).overload_notif)
  }, [settings])

  useEffect(() => { if (profile?.name) setDisplayName(profile.name) }, [profile])

  // ── Helpers ────────────────────────────────────────────────────────────────

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    setSavingName(true)
    try {
      await supabase.auth.updateUser({ data: { name: displayName } })
      await api.patch('/profile', { name: displayName }).catch(() => null)
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        u.user_metadata = { ...u.user_metadata, name: displayName }
        localStorage.setItem('user', JSON.stringify(u))
      }
      window.dispatchEvent(new CustomEvent('profile-updated'))
      showOk('Nombre actualizado correctamente')
    } catch { showErr('No se pudo guardar el nombre') }
    finally { setSavingName(false) }
  }

  const handleSaveSem = async () => {
    setSavingSem(true)
    try {
      await api.patch('/profile/semester-start', { semester_start: semesterStart, midterm_week: midtermWeek || null, final_week: finalWeek || null })
      await refresh()
      showOk('Calendario académico guardado')
    } catch { showErr('Error al guardar') }
    finally { setSavingSem(false) }
  }

  const handleConnectCanvas = async () => {
    setConnectingCanvas(true)
    try {
      await api.post('/canvas/connect', { canvas_token: canvasToken, canvas_domain: canvasDomain })
      await api.post('/canvas/sync')
      await refresh()
      setCanvasToken('')
      showOk('Canvas conectado y sincronizado')
    } catch { showErr('No se pudo conectar Canvas') }
    finally { setConnectingCanvas(false) }
  }

  const handleSyncCanvas   = async () => {
    try { await api.post('/canvas/sync'); showOk('Canvas sincronizado') }
    catch { showErr('Error al sincronizar') }
  }
  const handleDisconnectCanvas = async () => {
    try { await api.delete('/canvas/disconnect'); await refresh(); showOk('Canvas desconectado') }
    catch { showErr('Error al desconectar') }
  }

  const handleConnectGoogle = async () => {
    try {
      const res = await api.get('/integrations/google-calendar/connect')
      window.location.href = res.data.url
    } catch { showErr('Error al conectar Google') }
  }

  const handleSaveNotif = async () => {
    setSavingNotif(true)
    try {
      await api.patch('/notifications/preferences', {
        notify_hours_before: hoursBefore, notifications_enabled: notifEnabled,
        class_reminder: classReminder, exam_digest: examDigest,
        exam_digest_day: examDigestDay, overload_notif: overloadNotif,
      })
      await refresh()
      showOk('Preferencias de notificación guardadas')
    } catch { showErr('Error al guardar') }
    finally { setSavingNotif(false) }
  }

  // countdown tick
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const requestCode = async (target: CodeAction) => {
    setSendingCode(true)
    try {
      await api.post('/verification/send-code')
      setCodeTarget(target)
      setOtpValue('')
      setCountdown(600)
    } catch (e: any) { showErr(e?.response?.data?.error ?? 'No se pudo enviar el código') }
    finally { setSendingCode(false) }
  }

  const cancelCode = () => { setCodeTarget(null); setOtpValue(''); setCountdown(0) }

  const handleOtpComplete = async (code: string) => {
    setVerifying(true)
    try {
      await api.post('/verification/verify-code', { code })
      if (codeTarget === 'email') {
        const { error } = await supabase.auth.updateUser({ email: newEmail })
        if (error) throw error
        showOk('Correo de confirmación enviado a ' + newEmail)
        setNewEmail('')
      } else if (codeTarget === 'password') {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
        showOk('Contraseña actualizada correctamente')
        setNewPassword(''); setConfirmPass('')
      } else if (codeTarget === 'delete') {
        const { error } = await supabase.rpc('delete_user')
        if (error) throw error
        await logout(); navigate('/login')
      }
      cancelCode()
    } catch (e: any) {
      showErr(e?.response?.data?.error ?? e?.message ?? 'Código incorrecto')
    } finally {
      setVerifying(false)
    }
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
      setReportDone(true); setReportText(''); setReportImages([])
    } catch { showErr('Error al enviar el reporte') }
    finally { setSendingReport(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950">
      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-64'} flex gap-0`}>

        {/* Left nav */}
        <aside className="w-60 flex-shrink-0 border-r border-warmgray-100 dark:border-warmgray-800 bg-white dark:bg-warmgray-900 min-h-screen sticky top-0 p-5">
          <h1 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white mb-6">Configuración</h1>
          <nav className="flex flex-col gap-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => { setActive(s.id); setToast(null) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                  active === s.id
                    ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                    : 'text-warmgray-600 dark:text-warmgray-400 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 hover:text-warmgray-900 dark:hover:text-white'
                }`}>
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 p-8 max-w-2xl">
          {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

          {/* ── PROFILE ── */}
          {active === 'profile' && (
            <div className="flex flex-col gap-5">
              <div className={`${card} p-6`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-300 font-bold text-2xl border-2 border-warmgray-100 dark:border-warmgray-700 flex-shrink-0">
                    {profile?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-warmgray-900 dark:text-white">{profile?.name}</p>
                    <p className="text-sm text-warmgray-400">{profile?.email}</p>
                  </div>
                </div>
                <span className={lbl}>Nombre para mostrar</span>
                <div className="flex gap-2">
                  <input className={input} value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Tu nombre completo" onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
                  <button onClick={handleSaveName} disabled={savingName || !displayName.trim()} className={btn}>
                    {savingName ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              <div className={`${card} p-6`}>
                <span className={lbl}>Calendario académico</span>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Inicio del ciclo',              val: semesterStart, set: setSemesterStart },
                    { label: 'Semana de parciales (lunes)',    val: midtermWeek,   set: setMidtermWeek   },
                    { label: 'Semana de finales (lunes)',      val: finalWeek,     set: setFinalWeek     },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-1 block">{f.label}</label>
                      <input type="date" className={input} value={f.val} onChange={e => f.set(e.target.value)} />
                    </div>
                  ))}
                  <button onClick={handleSaveSem} disabled={savingSem} className={`${btn} mt-1`}>
                    {savingSem ? 'Guardando...' : 'Guardar fechas'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {active === 'appearance' && (
            <div className={`${card} p-6 flex flex-col`}>
              <span className={lbl}>Apariencia</span>

              <div className={row}>
                <div>
                  <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Modo oscuro</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Cambia entre tema claro y oscuro</p>
                </div>
                <Toggle value={darkMode} onChange={toggleTheme} />
              </div>

              <div className={row}>
                <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Tamaño de texto</p>
                <div className="flex gap-1.5">
                  {([['sm','A','text-xs'], ['md','A','text-sm'], ['lg','A','text-base']] as const).map(([s, label, cls]) => (
                    <button key={s} onClick={() => setFontSize(s)}
                      className={`w-9 h-9 rounded-xl font-bold transition-all ${fontSize === s
                        ? 'bg-pink-500 text-white'
                        : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-200 dark:hover:bg-warmgray-600'} ${cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={row}>
                <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Color de acento</p>
                <div className="flex gap-2">
                  {[
                    { name: 'pink',    bg: 'bg-pink-500'    },
                    { name: 'violet',  bg: 'bg-violet-500'  },
                    { name: 'blue',    bg: 'bg-blue-500'    },
                    { name: 'emerald', bg: 'bg-emerald-500' },
                    { name: 'amber',   bg: 'bg-amber-500'   },
                  ].map(c => (
                    <button key={c.name} onClick={() => setAccentColor(c.name)}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-all ${accentColor === c.name
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-warmgray-800 ring-warmgray-400 scale-110'
                        : 'opacity-50 hover:opacity-90 hover:scale-105'}`} />
                  ))}
                </div>
              </div>

              <div className={row}>
                <div>
                  <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Reducir animaciones</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Elimina transiciones y efectos de movimiento</p>
                </div>
                <Toggle value={reduceMotion} onChange={setReduceMotion} />
              </div>
            </div>
          )}

          {/* ── LANGUAGE ── */}
          {active === 'language' && (
            <div className={`${card} p-6`}>
              <span className={lbl}>Idioma de la aplicación</span>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { code: 'es', name: 'Español', sub: 'Idioma por defecto' },
                  { code: 'en', name: 'English',  sub: 'Default language'   },
                ] as const).map(lang => (
                  <button key={lang.code} onClick={() => setLanguage(lang.code)}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${language === lang.code
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-warmgray-200 dark:border-warmgray-600 hover:border-warmgray-300 dark:hover:border-warmgray-500 bg-white dark:bg-warmgray-700/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-bold ${language === lang.code ? 'text-pink-600 dark:text-pink-400' : 'text-warmgray-900 dark:text-white'}`}>
                        {lang.name}
                      </p>
                      {language === lang.code && (
                        <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-warmgray-400">{lang.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {active === 'notifications' && !loading && settings && (
            <div className={`${card} p-6 flex flex-col gap-0`}>
              <span className={lbl}>Notificaciones</span>

              <div className={row}>
                <div>
                  <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Activar notificaciones</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Recibir avisos de tareas y clases</p>
                </div>
                <Toggle value={notifEnabled} onChange={setNotifEnabled} />
              </div>

              <div className="py-4 border-b border-warmgray-100 dark:border-warmgray-700">
                <p className="text-sm font-semibold text-warmgray-900 dark:text-white mb-2">Recordatorio de entregas</p>
                <label className="text-xs text-warmgray-400 mb-1.5 block">Avisar con anticipación de</label>
                <select value={hoursBefore} onChange={e => setHoursBefore(Number(e.target.value))} className={input}>
                  {[1,6,12,24,48,168].map(h => <option key={h} value={h}>{h === 168 ? '1 semana' : `${h} hora${h > 1 ? 's' : ''}`}</option>)}
                </select>
              </div>

              <div className="py-4 border-b border-warmgray-100 dark:border-warmgray-700">
                <p className="text-sm font-semibold text-warmgray-900 dark:text-white mb-0.5">Recordatorio de clases</p>
                <p className="text-xs text-warmgray-400 mb-3">Solo para clases marcadas como "requiere asistencia"</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { val: 'off',   label: 'Desactivado' },
                    { val: 'start', label: 'Al iniciar'  },
                    { val: 'end',   label: 'Al terminar' },
                    { val: 'both',  label: 'Ambas'       },
                  ] as const).map(o => (
                    <button key={o.val} onClick={() => setClassReminder(o.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        classReminder === o.val
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-warmgray-50 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300 border-warmgray-200 dark:border-warmgray-600 hover:border-warmgray-300'
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-4 border-b border-warmgray-100 dark:border-warmgray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Informe semanal de exámenes</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">Resumen de exámenes de la próxima semana</p>
                  </div>
                  <Toggle value={examDigest} onChange={setExamDigest} />
                </div>
                {examDigest && (
                  <div className="flex gap-2 mt-3">
                    {([{val:'fri',label:'Viernes'},{val:'sat',label:'Sábado'},{val:'sun',label:'Domingo'}] as const).map(d => (
                      <button key={d.val} onClick={() => setExamDigestDay(d.val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${examDigestDay === d.val ? 'bg-pink-500 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={row}>
                <div>
                  <p className="text-sm font-semibold text-warmgray-900 dark:text-white">Alerta de semana sobrecargada</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Aviso cuando tengas 3+ entregas en una semana</p>
                </div>
                <Toggle value={overloadNotif} onChange={setOverloadNotif} />
              </div>

              <button onClick={handleSaveNotif} disabled={savingNotif} className={`${btn} mt-4`}>
                {savingNotif ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {active === 'integrations' && !loading && settings && (
            <div className="flex flex-col gap-3">
              {/* Google Calendar */}
              <div className={`${card} p-5 flex items-center gap-4`}>
                <div className="w-11 h-11 rounded-xl border border-warmgray-100 dark:border-warmgray-700 bg-white dark:bg-warmgray-700 flex items-center justify-center flex-shrink-0">
                  <GoogleLogo />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white">Google Calendar</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {settings.google_connected
                      ? <span className="text-emerald-500 font-medium">Conectado</span>
                      : 'Sincroniza tus eventos del calendario'}
                  </p>
                </div>
                <button onClick={handleConnectGoogle} className={settings.google_connected ? btnGhost : btn}>
                  {settings.google_connected ? 'Reconectar' : 'Conectar'}
                </button>
              </div>

              {/* Notion */}
              <div className={`${card} p-5 flex items-center gap-4`}>
                <div className="w-11 h-11 rounded-xl border border-warmgray-100 dark:border-warmgray-700 overflow-hidden flex-shrink-0">
                  <NotionLogo />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white">Notion</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">Exporta tus tareas a una base de datos</p>
                </div>
                <button onClick={() => api.post('/integrations/notion/sync')} className={btnGhost}>
                  Sincronizar
                </button>
              </div>
            </div>
          )}

          {/* ── CANVAS ── */}
          {active === 'canvas' && !loading && settings && (
            <div className={`${card} p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-warmgray-100 dark:border-warmgray-700 flex-shrink-0">
                  <CanvasLogo />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-warmgray-900 dark:text-white">Canvas LMS</h2>
                  <p className="text-xs text-warmgray-400">Sincroniza tareas, notas y fechas de entrega</p>
                </div>
              </div>

              {settings.canvas_connected ? (
                <>
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-4 py-3 mb-4">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Conectado</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{settings.canvas_domain}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSyncCanvas} className={btn}>Sincronizar ahora</button>
                    <button onClick={handleDisconnectCanvas} className={btnGhost}>Desconectar</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-warmgray-500 mb-1.5 block">Dominio institucional</label>
                    <input className={input} placeholder="utec.instructure.com" value={canvasDomain} onChange={e => setCanvasDomain(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-warmgray-500 mb-1.5 block">Access Token</label>
                    <input type="password" className={input} placeholder="••••••••••••••••" value={canvasToken} onChange={e => setCanvasToken(e.target.value)} />
                  </div>
                  <button onClick={handleConnectCanvas} disabled={connectingCanvas || !canvasDomain || !canvasToken} className={`${btn} mt-1`}>
                    {connectingCanvas ? 'Conectando...' : 'Conectar Canvas'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {active === 'account' && (
            <div className="flex flex-col gap-4">

              {/* ── OTP panel (shared) ── */}
              {codeTarget && (
                <div className={`${card} p-6`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={lbl} style={{margin:0}}>Verificación de identidad</span>
                    <button type="button" onClick={cancelCode}
                      className="text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-200 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-5">
                    Enviamos un código de 6 dígitos a <strong className="text-warmgray-700 dark:text-warmgray-200">{profile?.email}</strong>.
                    {countdown > 0 && <span className="ml-1 tabular-nums">Expira en {fmtCountdown(countdown)}.</span>}
                  </p>
                  <div className="mb-5">
                    <OtpInput
                      value={otpValue}
                      onChange={setOtpValue}
                      onComplete={handleOtpComplete}
                      disabled={verifying}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {verifying && (
                      <div className="flex items-center gap-2 text-xs text-warmgray-400">
                        <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-500 rounded-full animate-spin" />
                        Verificando...
                      </div>
                    )}
                    {countdown === 0 && !verifying && (
                      <button type="button" onClick={() => requestCode(codeTarget)}
                        disabled={sendingCode}
                        className="text-xs text-pink-500 font-bold hover:underline disabled:opacity-40">
                        {sendingCode ? 'Enviando...' : 'Reenviar código'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Change email */}
              <div className={`${card} p-5 ${codeTarget === 'email' ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className={lbl}>Cambiar correo electrónico</span>
                <input type="email" className={`${input} mb-3`} placeholder="Nuevo correo electrónico"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <button type="button"
                  onClick={() => requestCode('email')}
                  disabled={sendingCode || !newEmail || !!codeTarget}
                  className={btn}>
                  {sendingCode && codeTarget === null ? 'Enviando código...' : 'Solicitar código'}
                </button>
              </div>

              {/* Change password */}
              <div className={`${card} p-5 ${codeTarget === 'password' ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className={lbl}>Cambiar contraseña</span>
                <div className="flex flex-col gap-2.5 mb-3">
                  <input type="password" className={input} placeholder="Nueva contraseña"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password" />
                  <input type="password" className={input} placeholder="Confirmar nueva contraseña"
                    value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    autoComplete="new-password" />
                  {newPassword && confirmPass && newPassword !== confirmPass && (
                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </div>
                <button type="button"
                  onClick={() => requestCode('password')}
                  disabled={sendingCode || !newPassword || newPassword !== confirmPass || !!codeTarget}
                  className={btn}>
                  {sendingCode && codeTarget === null ? 'Enviando código...' : 'Solicitar código'}
                </button>
              </div>

              {/* Logout */}
              <div className={`${card} p-5`}>
                <span className={lbl}>Sesión activa</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warmgray-900 dark:text-white">{profile?.email}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">Sesión actual</p>
                  </div>
                  <button onClick={async () => { await logout(); navigate('/login') }} className={btnGhost}>
                    Cerrar sesión
                  </button>
                </div>
              </div>

              {/* Delete account */}
              <div className={`${card} p-5 border-red-200 dark:border-red-900/50 ${codeTarget === 'delete' ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 block">Zona de peligro</span>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-3">
                  Esta acción es <strong className="text-warmgray-700 dark:text-warmgray-200">irreversible</strong>. Escribe{' '}
                  <code className="bg-warmgray-100 dark:bg-warmgray-700 px-1 py-0.5 rounded text-red-500 font-bold">ELIMINAR</code>{' '}
                  para confirmar y solicitar el código.
                </p>
                <input className={`${input} mb-3`} placeholder="ELIMINAR"
                  value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                <button type="button"
                  onClick={() => requestCode('delete')}
                  disabled={sendingCode || deleteConfirm !== 'ELIMINAR' || !!codeTarget}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors w-full">
                  {sendingCode && codeTarget === null ? 'Enviando código...' : 'Solicitar código de eliminación'}
                </button>
              </div>
            </div>
          )}

          {/* ── REPORT ── */}
          {active === 'report' && (
            <div className={`${card} p-6`}>
              <span className={lbl}>Reportar un problema</span>
              {reportDone ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm font-bold text-warmgray-900 dark:text-white mb-1">¡Reporte enviado!</p>
                  <p className="text-xs text-warmgray-400">Lo revisaremos pronto. Gracias por ayudarnos a mejorar.</p>
                  <button onClick={() => setReportDone(false)} className="mt-5 text-xs text-pink-500 font-bold hover:underline">
                    Enviar otro reporte
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-3">
                    Describe el problema con el mayor detalle posible. Puedes adjuntar capturas de pantalla.
                  </p>
                  <textarea className={`${input} min-h-[120px] resize-y mb-3`}
                    placeholder="Describe el error o problema que encontraste..."
                    value={reportText} onChange={e => setReportText(e.target.value)} />
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {reportImages.map((f, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-warmgray-200 dark:border-warmgray-600 flex-shrink-0">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setReportImages(imgs => imgs.filter((_, j) => j !== i))}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full text-white flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      {reportImages.length < 5 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-warmgray-300 dark:border-warmgray-600 flex items-center justify-center text-warmgray-300 dark:text-warmgray-500 hover:border-pink-400 hover:text-pink-400 transition-colors cursor-pointer flex-shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          <input type="file" accept="image/*" multiple className="hidden"
                            onChange={e => {
                              const picked = Array.from(e.target.files ?? [])
                              e.target.value = ''
                              setReportImages(p => [...p, ...picked].slice(0, 5))
                            }} />
                        </label>
                      )}
                    </div>
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
