import { useState, useRef, useEffect, useCallback } from 'react'
import { Sidebar } from '../components/Sidebar'
import { api } from '../lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const BLOCK_COLORS = [
  { bg: 'bg-emerald-500/20 dark:bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-100 dark:text-emerald-100', dot: 'bg-emerald-400', solid: 'bg-emerald-600' },
  { bg: 'bg-blue-500/20 dark:bg-blue-500/30', border: 'border-blue-400', text: 'text-blue-100 dark:text-blue-100', dot: 'bg-blue-400', solid: 'bg-blue-600' },
  { bg: 'bg-violet-500/20 dark:bg-violet-500/30', border: 'border-violet-400', text: 'text-violet-100 dark:text-violet-100', dot: 'bg-violet-400', solid: 'bg-violet-600' },
  { bg: 'bg-amber-500/20 dark:bg-amber-500/30', border: 'border-amber-400', text: 'text-amber-100 dark:text-amber-100', dot: 'bg-amber-400', solid: 'bg-amber-600' },
  { bg: 'bg-rose-500/20 dark:bg-rose-500/30', border: 'border-rose-400', text: 'text-rose-100 dark:text-rose-100', dot: 'bg-rose-400', solid: 'bg-rose-600' },
  { bg: 'bg-cyan-500/20 dark:bg-cyan-500/30', border: 'border-cyan-400', text: 'text-cyan-100 dark:text-cyan-100', dot: 'bg-cyan-400', solid: 'bg-cyan-600' },
]

const HOUR_HEIGHT = 64
const START_HOUR_DEFAULT = 7
const END_HOUR_DEFAULT = 22

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const minutesToTime = (m: number) => {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

const getWeekDates = () => {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const colorForCourse = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return BLOCK_COLORS[Math.abs(hash) % BLOCK_COLORS.length]
}

const fmtDuration = (startIso: string, endIso: string) => {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  const h = ms / 1000 / 3600
  return h >= 1 ? `${Math.round(h * 10) / 10}h` : `${Math.round(ms / 60000)}min`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleBlock = {
  id: string
  day_of_week: number
  start_time: string   // "HH:MM"
  end_time: string
  course_name: string
  location?: string
}

type Task = {
  id: string
  title: string
  due_date?: string
  status: string
  courses?: { name: string }
}

type StudySession = {
  id: string
  task_id?: string
  start_time: string   // ISO
  end_time: string     // ISO
  priority?: string
  auto_generated?: boolean
  tasks?: { title: string; due_date?: string }
  // local overrides
  _title?: string
  _course_name?: string
  _selected_task_ids?: string[]
}

type StudyPrefs = {
  dailyHours: number
  preferredStart: string
  preferredEnd: string
  breakMin: number
  studyDays: number[]
}

// ─── Block Modal ──────────────────────────────────────────────────────────────

const BlockModal = ({
  block, onSave, onDelete, onClose,
}: {
  block: Partial<ScheduleBlock>
  onSave: (b: Partial<ScheduleBlock>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) => {
  const [form, setForm] = useState<Partial<ScheduleBlock>>({
    day_of_week: 0, start_time: '08:00', end_time: '10:00', course_name: '', location: '',
    ...block
  })
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white">{block.id ? 'Editar bloque' : 'Nuevo bloque'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Curso', key: 'course_name', type: 'text', placeholder: 'Ej: Cálculo III' },
            { label: 'Ubicación', key: 'location', type: 'text', placeholder: 'Aula 301 (opcional)' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">{f.label}</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500 placeholder-white/20"
                value={(form as any)[f.key] ?? ''}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Día</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500"
              value={form.day_of_week ?? 0}
              onChange={e => setForm(p => ({ ...p, day_of_week: Number(e.target.value) }))}
            >
              {DAY_LABELS.map((d, i) => <option key={i} value={i} className="bg-[#1a1a1a]">{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['start_time', 'end_time'] as const).map((k, i) => (
              <div key={k}>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">{i === 0 ? 'Inicio' : 'Fin'}</label>
                <input type="time" className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500"
                  value={form[k] ?? ''}
                  onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handle} disabled={saving}
            className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {onDelete && (
            <button onClick={onDelete}
              className="px-4 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Session Modal ────────────────────────────────────────────────────────────

const SessionModal = ({
  session, tasks, onSave, onDelete, onClose,
}: {
  session: Partial<StudySession>
  tasks: Task[]
  onSave: (s: Partial<StudySession>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) => {
  const [form, setForm] = useState<Partial<StudySession>>({
    start_time: '', end_time: '', _title: '', _course_name: '',
    _selected_task_ids: [],
    ...session,
    _title: session._title ?? session.tasks?.title ?? '',
    _course_name: session._course_name ?? '',
    _selected_task_ids: session._selected_task_ids ?? (session.task_id ? [session.task_id] : []),
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'info' | 'tasks'>('info')

  const toggleTask = (id: string) => {
    setForm(p => {
      const ids = p._selected_task_ids ?? []
      return { ...p, _selected_task_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }
    })
  }

  const pendingTasks = tasks.filter(t => t.status === 'pendiente' || t.status === 'en_progreso')

  const handle = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-sm font-bold text-white">{session.id ? 'Editar sesión' : 'Nueva sesión'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {(['info', 'tasks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2.5 mr-5 text-xs font-bold border-b-2 transition-colors ${tab === t
                ? 'border-pink-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/60'}`}>
              {t === 'info' ? 'Info' : `Tareas (${pendingTasks.length})`}
            </button>
          ))}
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {tab === 'info' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Título</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500 placeholder-white/20"
                  value={form._title ?? ''}
                  onChange={e => setForm(p => ({ ...p, _title: e.target.value }))}
                  placeholder="Ej: Repaso Cálculo"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Curso</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500 placeholder-white/20"
                  value={form._course_name ?? ''}
                  onChange={e => setForm(p => ({ ...p, _course_name: e.target.value }))}
                  placeholder="Curso relacionado"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Inicio</label>
                  <input type="datetime-local"
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-xs text-white px-2 py-2 focus:outline-none focus:border-pink-500"
                    value={form.start_time?.slice(0, 16) ?? ''}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Fin</label>
                  <input type="datetime-local"
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-xs text-white px-2 py-2 focus:outline-none focus:border-pink-500"
                    value={form.end_time?.slice(0, 16) ?? ''}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Prioridad</label>
                <select className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500"
                  value={form.priority ?? 'medium'}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="high" className="bg-[#1a1a1a]">Alta</option>
                  <option value="medium" className="bg-[#1a1a1a]">Media</option>
                  <option value="low" className="bg-[#1a1a1a]">Baja</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="flex flex-col gap-2">
              {pendingTasks.length === 0 && (
                <p className="text-xs text-white/30 text-center py-6">No hay tareas pendientes.</p>
              )}
              {pendingTasks.map(task => {
                const selected = (form._selected_task_ids ?? []).includes(task.id)
                const due = task.due_date ? new Date(task.due_date) : null
                const overdue = due && due < new Date()
                return (
                  <button key={task.id} onClick={() => toggleTask(task.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${selected
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selected ? 'border-pink-500 bg-pink-500' : 'border-white/20'}`}>
                          {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="text-xs text-white font-medium leading-tight">{task.title}</span>
                      </div>
                      {due && (
                        <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-lg ${overdue ? 'text-red-400 bg-red-400/10' : 'text-white/30 bg-white/5'}`}>
                          {due.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {task.courses?.name && (
                      <p className="text-[10px] text-white/30 mt-1 ml-6">{task.courses.name}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button onClick={handle} disabled={saving}
            className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {onDelete && (
            <button onClick={onDelete}
              className="px-4 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Prefs Modal ──────────────────────────────────────────────────────────────

const PrefsModal = ({ prefs, onSave, onClose }: {
  prefs: StudyPrefs
  onSave: (p: StudyPrefs) => void
  onClose: () => void
}) => {
  const [form, setForm] = useState<StudyPrefs>(prefs)
  const days = DAY_LABELS
  const toggleDay = (i: number) =>
    setForm(f => ({ ...f, studyDays: f.studyDays.includes(i) ? f.studyDays.filter(d => d !== i) : [...f.studyDays, i] }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white">Preferencias de estudio</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              Horas diarias de estudio — <span className="text-pink-400">{form.dailyHours}h</span>
            </label>
            <input type="range" min={1} max={12} value={form.dailyHours}
              onChange={e => setForm(f => ({ ...f, dailyHours: Number(e.target.value) }))}
              className="w-full accent-pink-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([['preferredStart', 'Hora inicio preferida'], ['preferredEnd', 'Hora fin preferida']] as const).map(([k, l]) => (
              <div key={k}>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">{l}</label>
                <input type="time" className="w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white px-3 py-2 focus:outline-none focus:border-pink-500"
                  value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              Descanso entre sesiones — <span className="text-pink-400">{form.breakMin}min</span>
            </label>
            <input type="range" min={5} max={60} step={5} value={form.breakMin}
              onChange={e => setForm(f => ({ ...f, breakMin: Number(e.target.value) }))}
              className="w-full accent-pink-500" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Días disponibles</label>
            <div className="flex gap-1.5 flex-wrap">
              {days.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${form.studyDays.includes(i)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => onSave(form)}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors mt-5">
          Guardar preferencias
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Calendar = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingBlocks, setLoadingBlocks] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extended, setExtended] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Partial<ScheduleBlock> | null>(null)
  const [editingSession, setEditingSession] = useState<Partial<StudySession> | null>(null)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState<StudyPrefs>({
    dailyHours: 4, preferredStart: '14:00', preferredEnd: '20:00', breakMin: 15, studyDays: [0, 1, 2, 3, 4]
  })

  const startHour = extended ? 0 : START_HOUR_DEFAULT
  const endHour = extended ? 24 : END_HOUR_DEFAULT
  const totalHours = endHour - startHour
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i)
  const weekDates = getWeekDates()
  const today = new Date()
  const todayDow = (today.getDay() + 6) % 7
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoadingBlocks(true)
    try {
      const [blocksRes, studyRes, tasksRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/planner/study-blocks'),
        api.get('/tasks'),
      ])

      // Schedule blocks: API returns { day_of_week, start_time, end_time, location, courses: { name } }
      const blocks: ScheduleBlock[] = (blocksRes.data ?? []).map((b: any) => ({
        id: b.id,
        day_of_week: b.day_of_week,
        start_time: b.start_time?.slice(0, 5) ?? '00:00',
        end_time: b.end_time?.slice(0, 5) ?? '01:00',
        course_name: b.courses?.name ?? b.course_name ?? 'Clase',
        location: b.location,
      }))
      setScheduleBlocks(blocks)

      // Study sessions: { id, start_time, end_time, priority, tasks: { title, due_date } }
      setSessions(studyRes.data ?? [])

      // Tasks for selection in session modal
      setTasks(tasksRes.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingBlocks(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (START_HOUR_DEFAULT - startHour) * HOUR_HEIGHT
    }
  }, [extended, startHour])

  // ── Schedule block CRUD ─────────────────────────────────────────────────────
  const saveBlock = async (form: Partial<ScheduleBlock>) => {
    if (form.id) {
      await api.delete(`/schedule/blocks/${form.id}`)
    }
    await api.post('/schedule/blocks', {
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location ?? null,
      // course_id not sent since API uses it optionally; name comes back via join
    })
    setEditingBlock(null)
    await fetchAll()
  }

  const deleteBlock = async (id: string) => {
    await api.delete(`/schedule/blocks/${id}`)
    setEditingBlock(null)
    await fetchAll()
  }

  // ── Upload schedule image ───────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)
    try {
      await api.post('/schedule/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchAll()
    } catch (err) {
      console.error('Upload error', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Generate plan ───────────────────────────────────────────────────────────
  const generatePlan = async () => {
    setGenerating(true)
    try {
      await api.post('/planner/generate')
      await fetchAll()
    } finally {
      setGenerating(false)
    }
  }

  // ── Study session CRUD ──────────────────────────────────────────────────────
  const saveSession = async (form: Partial<StudySession>) => {
    // Sessions are study_blocks; we create new ones via planner endpoint
    // For editing we patch the local state since there's no PATCH /study-blocks endpoint
    // but we can delete + re-insert for now
    const payload = {
      start_time: form.start_time,
      end_time: form.end_time,
      priority: form.priority ?? 'medium',
      task_id: form._selected_task_ids?.[0] ?? form.task_id ?? null,
      auto_generated: false,
    }

    if (form.id) {
      // Update local state immediately (optimistic)
      setSessions(ss => ss.map(s => s.id === form.id ? {
        ...s, ...form,
        tasks: form._selected_task_ids?.length
          ? { title: tasks.find(t => t.id === form._selected_task_ids![0])?.title ?? s.tasks?.title ?? '', due_date: tasks.find(t => t.id === form._selected_task_ids![0])?.due_date }
          : s.tasks
      } : s))
    } else {
      // POST new session — use user_id from token (middleware handles auth)
      try {
        await api.post('/planner/generate', payload)
        await fetchAll()
      } catch {
        // If generate fails, add locally
        setSessions(ss => [...ss, {
          id: String(Date.now()),
          start_time: form.start_time ?? '',
          end_time: form.end_time ?? '',
          priority: form.priority,
          _title: form._title,
          _course_name: form._course_name,
          _selected_task_ids: form._selected_task_ids,
          tasks: form._selected_task_ids?.length
            ? { title: tasks.find(t => t.id === form._selected_task_ids![0])?.title ?? form._title ?? 'Sesión', due_date: tasks.find(t => t.id === form._selected_task_ids![0])?.due_date }
            : { title: form._title ?? 'Sesión' }
        }])
      }
    }
    setEditingSession(null)
  }

  const deleteSession = async (id: string) => {
    setSessions(ss => ss.filter(s => s.id !== id))
    setEditingSession(null)
  }

  // ── Grid helpers ────────────────────────────────────────────────────────────
  const blockStyle = (start: string, end: string) => {
    const s = timeToMinutes(start) - startHour * 60
    const e = timeToMinutes(end) - startHour * 60
    return {
      top: `${(s / 60) * HOUR_HEIGHT}px`,
      height: `${Math.max(((e - s) / 60) * HOUR_HEIGHT, 24)}px`,
    }
  }

  const nowTop = ((today.getHours() * 60 + today.getMinutes() - startHour * 60) / 60) * HOUR_HEIGHT

  // ── Priority badge ──────────────────────────────────────────────────────────
  const priorityBadge = (p?: string) => {
    if (p === 'high') return 'bg-red-500/20 text-red-400'
    if (p === 'low') return 'bg-emerald-500/20 text-emerald-400'
    return 'bg-amber-500/20 text-amber-400'
  }

  return (
    <div className="flex min-h-screen bg-[#111111] font-body">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">Mi Horario</h1>
            <button onClick={() => setShowPrefs(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors" title="Preferencias de estudio">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setExtended(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${extended
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {extended ? '24h' : '7–22h'}
            </button>
            <label className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {uploading ? 'Procesando...' : 'Subir horario'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button onClick={generatePlan} disabled={generating}
              className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {generating ? 'Generando...' : 'Generar plan'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── GRID ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#111111]">

            {/* Day headers */}
            <div className="flex flex-shrink-0 border-b border-white/8">
              <div className="w-12 flex-shrink-0" />
              {weekDates.map((date, i) => {
                const isToday = i === todayDow
                return (
                  <div key={i} className={`flex-1 text-center py-3 border-l border-white/5 ${isToday ? 'bg-pink-500/5' : ''}`}>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? 'text-pink-400' : 'text-white/25'}`}>
                      {DAY_LABELS[i]}
                    </div>
                    <div className={`text-base font-bold leading-tight mt-0.5 ${isToday
                      ? 'w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center mx-auto'
                      : 'text-white/60'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Scrollable grid */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="flex" style={{ height: `${totalHours * HOUR_HEIGHT}px` }}>

                {/* Hour labels */}
                <div className="w-12 flex-shrink-0 relative">
                  {hours.map(h => (
                    <div key={h} className="absolute left-0 right-0 flex justify-end pr-2"
                      style={{ top: `${(h - startHour) * HOUR_HEIGHT - 7}px` }}>
                      <span className="text-[9px] text-white/20 font-mono">{String(h).padStart(2, '0')}:00</span>
                    </div>
                  ))}
                </div>

                {/* Columns */}
                {weekDates.map((_, dayIdx) => {
                  const isToday = dayIdx === todayDow
                  const dayBlocks = scheduleBlocks.filter(b => b.day_of_week === dayIdx)

                  return (
                    <div key={dayIdx} className={`flex-1 relative border-l border-white/5 ${isToday ? 'bg-pink-500/[0.02]' : ''}`}>
                      {hours.map(h => (
                        <div key={h} className="absolute left-0 right-0 border-t border-white/5"
                          style={{ top: `${(h - startHour) * HOUR_HEIGHT}px` }} />
                      ))}
                      {hours.slice(0, -1).map(h => (
                        <div key={`half-${h}`} className="absolute left-0 right-0 border-t border-white/[0.02]"
                          style={{ top: `${(h - startHour) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
                      ))}

                      {/* Now line */}
                      {isToday && nowTop > 0 && nowTop < totalHours * HOUR_HEIGHT && (
                        <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${nowTop}px` }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 -ml-0.5 flex-shrink-0" />
                          <div className="flex-1 h-px bg-pink-500 opacity-60" />
                        </div>
                      )}

                      {/* Blocks */}
                      {dayBlocks.map(block => {
                        const style = blockStyle(block.start_time, block.end_time)
                        const color = colorForCourse(block.course_name)
                        const durationMin = timeToMinutes(block.end_time) - timeToMinutes(block.start_time)

                        return (
                          <button key={block.id} onClick={() => setEditingBlock(block)}
                            className={`absolute left-0.5 right-0.5 rounded-lg border-l-[3px] px-2 py-1 text-left group transition-all hover:brightness-110 z-10 ${color.bg} ${color.border}`}
                            style={{ top: style.top, height: style.height }}>
                            <p className={`text-[10px] font-bold truncate leading-tight ${color.text}`}>{block.course_name}</p>
                            {durationMin >= 50 && (
                              <p className={`text-[9px] opacity-50 truncate mt-0.5 ${color.text}`}>
                                {block.start_time}–{block.end_time}{block.location ? ` · ${block.location}` : ''}
                              </p>
                            )}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`${color.text} opacity-70`}>
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </div>
                          </button>
                        )
                      })}

                      {/* Double click to add */}
                      <div className="absolute inset-0 z-0"
                        onDoubleClick={e => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                          const clickY = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0)
                          const mins = Math.round(((clickY / HOUR_HEIGHT) * 60 + startHour * 60) / 30) * 30
                          setEditingBlock({ day_of_week: dayIdx, start_time: minutesToTime(mins), end_time: minutesToTime(mins + 60), course_name: '', location: '' })
                        }} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-[280px] flex-shrink-0 flex flex-col border-l border-white/8 bg-[#161616]">
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sesiones</h2>
                <p className="text-xs text-white/60 mt-0.5">{sessions.length} programadas</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {sessions.length === 0 && !loadingBlocks && (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                      <path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <p className="text-xs text-white/20 leading-relaxed">Sin sesiones.<br/>Genera un plan o crea una.</p>
                </div>
              )}

              {sessions.map(session => {
                const taskTitle = session._title ?? session.tasks?.title ?? 'Sesión de estudio'
                const courseName = session._course_name ?? session.tasks?.title
                const start = session.start_time ? new Date(session.start_time) : null
                const end = session.end_time ? new Date(session.end_time) : null
                const dur = start && end ? fmtDuration(session.start_time, session.end_time) : null
                const color = colorForCourse(taskTitle)

                // Selected tasks for this session
                const selectedTaskTitles = (session._selected_task_ids ?? [])
                  .map(id => tasks.find(t => t.id === id)?.title)
                  .filter(Boolean)

                return (
                  <div key={session.id}
                    className="rounded-xl border border-white/8 bg-white/[0.03] hover:border-white/15 transition-all group p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                        <p className="text-xs font-bold text-white truncate">{taskTitle}</p>
                      </div>
                      <button onClick={() => setEditingSession(session)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-pink-400 flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Selected tasks chips */}
                    {selectedTaskTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 pl-4">
                        {selectedTaskTitles.map((t, i) => (
                          <span key={i} className="text-[9px] bg-white/8 text-white/50 px-2 py-0.5 rounded-lg truncate max-w-[120px]">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pl-4">
                      <div className="flex flex-col">
                        {start && (
                          <span className="text-[10px] text-white/30 font-mono">
                            {start.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })} · {start.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {session.priority && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${priorityBadge(session.priority)}`}>
                            {session.priority === 'high' ? 'Alta' : session.priority === 'low' ? 'Baja' : 'Media'}
                          </span>
                        )}
                        {dur && (
                          <span className="text-[10px] font-bold text-pink-400 bg-pink-500/15 px-2 py-0.5 rounded-lg">{dur}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-white/8 flex-shrink-0">
              <button onClick={() => setEditingSession({})}
                className="w-full py-2.5 rounded-xl bg-white text-[#111111] hover:bg-white/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nueva sesión
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {editingBlock !== null && (
        <BlockModal
          block={editingBlock}
          onSave={saveBlock}
          onDelete={editingBlock.id ? () => deleteBlock(editingBlock.id!) : undefined}
          onClose={() => setEditingBlock(null)}
        />
      )}
      {editingSession !== null && (
        <SessionModal
          session={editingSession}
          tasks={tasks}
          onSave={saveSession}
          onDelete={(editingSession as StudySession).id ? () => deleteSession((editingSession as StudySession).id) : undefined}
          onClose={() => setEditingSession(null)}
        />
      )}
      {showPrefs && (
        <PrefsModal
          prefs={prefs}
          onSave={p => { setPrefs(p); setShowPrefs(false) }}
          onClose={() => setShowPrefs(false)}
        />
      )}
    </div>
  )
}