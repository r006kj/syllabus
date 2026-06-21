import { useState, useRef } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { Sidebar } from '../components/Sidebar'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

type Language = keyof typeof translations

const monthNames: Record<Language, string[]> = {
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December']
}
const dayNames: Record<Language, string[]> = {
  es: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
}

const buildCalendar = (taskDates: string[], language: Language) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; isToday: boolean; hasTask: boolean; dateStr: string }[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, isToday: false, hasTask: false, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0]
    cells.push({ day: d, isToday: d === today.getDate(), hasTask: taskDates.includes(dateStr), dateStr })
  }
  return { cells, monthLabel: monthNames[language][month], dayLabels: dayNames[language], today: today.getDate() }
}

// ── Task Quick Edit Modal ──────────────────────────────────────────────────────
const TaskQuickModal = ({
  tasks, dateStr, onClose, onSave
}: {
  tasks: any[]
  dateStr: string
  onClose: () => void
  onSave: (id: string, updates: any) => Promise<void>
}) => {
  const [edits, setEdits] = useState<Record<string, { complexity: string; estimated_hours: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const dayTasks = tasks.filter(t => t.due_date?.split('T')[0] === dateStr)
  const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleSave = async (id: string) => {
    const edit = edits[id]
    if (!edit) return
    setSaving(id)
    try {
      await onSave(id, {
        complexity: edit.complexity || undefined,
        estimated_hours: edit.estimated_hours ? Number(edit.estimated_hours) : undefined
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-warmgray-800 rounded-2xl shadow-2xl w-full max-w-md border border-warmgray-100 dark:border-warmgray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-warmgray-100 dark:border-warmgray-700 bg-warmgray-50 dark:bg-warmgray-900/50">
          <div>
            <h2 className="text-sm font-bold text-warmgray-900 dark:text-white capitalize">{dateLabel}</h2>
            <p className="text-xs text-warmgray-400 dark:text-warmgray-500 mt-0.5">{dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          {dayTasks.length === 0 && (
            <p className="text-sm text-warmgray-400 dark:text-warmgray-500 text-center py-6">Sin tareas este día.</p>
          )}
          {dayTasks.map(task => {
            const edit = edits[task.id] ?? { complexity: task.complexity ?? '', estimated_hours: task.estimated_hours?.toString() ?? '' }
            const isDirty = edits[task.id] !== undefined
            return (
              <div key={task.id} className="rounded-xl border border-warmgray-100 dark:border-warmgray-700 bg-warmgray-50 dark:bg-warmgray-900/40 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs text-pink-500 font-medium">{task.courses?.name}</p>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white leading-tight">{task.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    task.status === 'entregado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    task.status === 'en_progreso' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                  }`}>
                    {task.status === 'entregado' ? 'Entregado' : task.status === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-warmgray-400 uppercase tracking-wide mb-1 block">Dificultad</label>
                    <select
                      className="w-full text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                      value={edit.complexity}
                      onChange={e => setEdits(prev => ({ ...prev, [task.id]: { ...edit, complexity: e.target.value } }))}
                    >
                      <option value="">Sin definir</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-warmgray-400 uppercase tracking-wide mb-1 block">Horas estimadas</label>
                    <input
                      type="number"
                      min={0.5}
                      max={20}
                      step={0.5}
                      placeholder="ej: 2.5"
                      className="w-full text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                      value={edit.estimated_hours}
                      onChange={e => setEdits(prev => ({ ...prev, [task.id]: { ...edit, estimated_hours: e.target.value } }))}
                    />
                  </div>
                </div>
                {isDirty && (
                  <button
                    onClick={() => handleSave(task.id)}
                    disabled={saving === task.id}
                    className="mt-2 w-full py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {saving === task.id ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Grade Modal (from CourseDetail card) ──────────────────────────────────────
const GradeInputModal = ({
  task, onClose, onSave
}: {
  task: any
  onClose: () => void
  onSave: (id: string, score: number, maxScore: number) => Promise<void>
}) => {
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('20')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    if (!score || !maxScore) return
    setSaving(true)
    try { await onSave(task.id, Number(score), Number(maxScore)) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-warmgray-800 rounded-2xl shadow-2xl w-full max-w-xs p-5 border border-warmgray-100 dark:border-warmgray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-warmgray-900 dark:text-white">Ingresar calificación</h2>
          <button onClick={onClose} className="text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mb-3 truncate">{task.title}</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-warmgray-400 uppercase tracking-wide mb-1 block">Nota obtenida</label>
            <input type="number" min={0} step={0.5} placeholder="ej: 16.5"
              className="w-full text-sm border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
              value={score} onChange={e => setScore(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-warmgray-400 uppercase tracking-wide mb-1 block">Nota máxima</label>
            <input type="number" min={1} step={0.5}
              className="w-full text-sm border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-3 py-2 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
              value={maxScore} onChange={e => setMaxScore(e.target.value)} />
          </div>
        </div>
        <button onClick={handle} disabled={saving || !score}
          className="w-full py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
          {saving ? 'Guardando...' : 'Guardar nota'}
        </button>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { upcomingTasks, overloadedWeeks, grades, loading, allTasks, refetch } = useDashboard()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const t = translations[language]

  // Calendar hover/click
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Grades toggle
  const [showGrades, setShowGrades] = useState(true)
  const [gradingTask, setGradingTask] = useState<any | null>(null)

  // Overloaded panel selected week
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)

  const handleDayMouseEnter = (dateStr: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredDate(dateStr)
  }
  const handleDayMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setHoveredDate(null), 200)
  }

  const handleDayClick = (dateStr: string) => {
    if (!dateStr) return
    const hasTask = (allTasks ?? []).some(t => t.due_date?.split('T')[0] === dateStr)
    if (hasTask) setSelectedDate(dateStr)
  }

  const handleTaskSave = async (id: string, updates: any) => {
    await api.patch(`/tasks/${id}`, updates)
    await refetch()
  }

  const handleGradeSave = async (id: string, score: number, maxScore: number) => {
    await api.post('/grades/task', { task_id: id, score, max_score: maxScore })
    await refetch()
    setGradingTask(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmgray-50 dark:bg-warmgray-900">
        <p className="text-warmgray-500 dark:text-warmgray-400">Cargando...</p>
      </div>
    )
  }

  const taskDates = (allTasks ?? []).filter(t => t.due_date).map(t => t.due_date.split('T')[0])
  const { cells, monthLabel, dayLabels, today } = buildCalendar(taskDates, language)

  const hoveredTasks = hoveredDate ? (allTasks ?? []).filter(t => t.due_date?.split('T')[0] === hoveredDate) : []

  const selectedWeek = overloadedWeeks[selectedWeekIdx]

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900 font-body">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 flex flex-col gap-6">
        <section>
          <span className="text-xs font-bold text-pink-600 dark:text-pink-300 uppercase tracking-widest">{t.todaySummary}</span>
          <h1 className="text-4xl font-headline font-extrabold text-warmgray-900 dark:text-white mt-1">
            {t.today} {today} <span className="text-warmgray-400 dark:text-warmgray-400 text-2xl">{monthLabel}</span>
          </h1>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ── Calendario con hover ── */}
          <div className="md:col-span-2 bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700 relative">
            <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white mb-4">{monthLabel}</h2>
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayLabels.map(d => (
                <div key={d} className="text-warmgray-400 dark:text-warmgray-500 text-[11px] font-bold uppercase pb-1">{d}</div>
              ))}
              {cells.map((cell, i) => {
                const hasTasks = cell.hasTask
                const isHovered = hoveredDate === cell.dateStr && hasTasks
                return (
                  <div key={i} className="relative">
                    <button
                      onMouseEnter={() => cell.dateStr && handleDayMouseEnter(cell.dateStr)}
                      onMouseLeave={handleDayMouseLeave}
                      onClick={() => handleDayClick(cell.dateStr)}
                      disabled={!cell.day}
                      className={`w-full aspect-square flex items-center justify-center rounded-xl text-sm transition-all ${
                        !cell.day ? 'invisible' :
                        cell.isToday ? 'bg-pink-400 text-white font-bold shadow-md' :
                        isHovered ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 scale-105 shadow-sm' :
                        hasTasks ? 'bg-lemon-100 dark:bg-lemon-900/30 text-lemon-700 dark:text-lemon-300 font-medium cursor-pointer hover:scale-105' :
                        'text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-700'
                      }`}
                    >
                      {cell.day || ''}
                    </button>

                    {/* Hover tooltip */}
                    {isHovered && hoveredTasks.length > 0 && (
                      <div
                        className="absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-52 bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-xl shadow-xl p-3"
                        onMouseEnter={() => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }}
                        onMouseLeave={handleDayMouseLeave}
                      >
                        <p className="text-[10px] font-bold text-warmgray-400 uppercase tracking-wider mb-2">
                          {hoveredTasks.length} tarea{hoveredTasks.length !== 1 ? 's' : ''}
                        </p>
                        {hoveredTasks.slice(0, 4).map(task => (
                          <div key={task.id} className="flex items-start gap-1.5 py-1 border-b border-warmgray-50 dark:border-warmgray-700 last:border-0">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                              task.status === 'entregado' ? 'bg-emerald-400' :
                              task.status === 'en_progreso' ? 'bg-amber-400' : 'bg-pink-400'
                            }`} />
                            <span className="text-xs text-warmgray-700 dark:text-warmgray-200 leading-tight">{task.title}</span>
                          </div>
                        ))}
                        {hoveredTasks.length > 4 && (
                          <p className="text-[10px] text-warmgray-400 mt-1">+{hoveredTasks.length - 4} más</p>
                        )}
                        <p className="text-[9px] text-warmgray-300 dark:text-warmgray-600 mt-1.5 text-center">Clic para editar</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Semanas sobrecargadas ── */}
          <div className="bg-white dark:bg-warmgray-800 rounded-2xl p-6 flex flex-col gap-4 border border-warmgray-100 dark:border-warmgray-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-500 dark:text-pink-300">insights</span>
              <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white">{t.overloadedWeek}</h2>
            </div>

            {overloadedWeeks.length === 0 ? (
              <div className="bg-lemon-100 dark:bg-lemon-900/30 p-4 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-lemon-600 dark:text-lemon-300">check_circle</span>
                <p className="text-sm text-warmgray-700 dark:text-warmgray-200">{t.noOverload}</p>
              </div>
            ) : (
              <>
                {/* Week tabs */}
                {overloadedWeeks.length > 1 && (
                  <div className="flex gap-1 flex-wrap">
                    {overloadedWeeks.map((w, i) => (
                      <button key={i} onClick={() => setSelectedWeekIdx(i)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${selectedWeekIdx === i
                          ? 'bg-pink-500 text-white'
                          : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300'}`}>
                        S{i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {selectedWeek && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl border border-pink-100 dark:border-pink-800/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-pink-500 text-[18px]">priority_high</span>
                      <p className="text-sm font-bold text-pink-700 dark:text-pink-200">
                        {selectedWeek.count} entregas · {selectedWeek.week_start} → {selectedWeek.week_end}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 mt-3 max-h-48 overflow-y-auto">
                      {(selectedWeek.tasks ?? []).map((task: any, idx: number) => {
                        const fullTask = (allTasks ?? []).find(t => t.title === task.title)
                        return (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-white dark:bg-warmgray-800 rounded-lg px-3 py-2 text-xs">
                            <span className="text-warmgray-700 dark:text-warmgray-200 truncate font-medium">{task.title}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {fullTask && (
                                <>
                                  <select
                                    className="text-[10px] border border-warmgray-200 dark:border-warmgray-600 rounded px-1 py-0.5 bg-white dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200"
                                    defaultValue={fullTask.complexity ?? ''}
                                    onChange={e => handleTaskSave(fullTask.id, { complexity: e.target.value })}
                                  >
                                    <option value="">Dif.</option>
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                  </select>
                                  <input
                                    type="number" min={0.5} step={0.5}
                                    placeholder="hrs"
                                    defaultValue={fullTask.estimated_hours ?? ''}
                                    onBlur={e => handleTaskSave(fullTask.id, { estimated_hours: Number(e.target.value) })}
                                    className="w-12 text-[10px] border border-warmgray-200 dark:border-warmgray-600 rounded px-1 py-0.5 bg-white dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Upcoming tasks list */}
            <div className="mt-2">
              <h3 className="text-xs font-bold text-warmgray-400 uppercase tracking-wider mb-2">{t.upcomingTasks}</h3>
              {upcomingTasks.length === 0 && <p className="text-sm text-warmgray-400">{t.noUpcoming}</p>}
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-2.5 bg-pink-50 dark:bg-pink-900/20 rounded-xl mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-500 text-[16px]">event_note</span>
                    <span className="text-xs font-bold text-warmgray-900 dark:text-white truncate max-w-[120px]">{task.title}</span>
                  </div>
                  <span className="text-xs text-warmgray-500 dark:text-warmgray-400 flex-shrink-0">
                    {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cursos y promedio de notas ── */}
          <div className="md:col-span-2 xl:col-span-3 bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white">{t.courses}</h2>
              <div className="flex items-center gap-3">
                {/* Toggle acumulado / por tarea */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warmgray-500 dark:text-warmgray-400">Acumulado</span>
                  <button
                    onClick={() => setShowGrades(g => !g)}
                    className={`w-10 h-5 rounded-full relative transition-colors flex items-center px-0.5 ${showGrades ? 'bg-pink-500' : 'bg-warmgray-300 dark:bg-warmgray-600'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showGrades ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {/* Calcular notas */}
                <a
                  href="https://utec-calculator.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
                  </svg>
                  Calcular notas
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grades.map(g => {
                const percent = g.average ? (g.average / 20) * 100 : 0
                const circumference = 251.2
                const offset = circumference - (circumference * percent) / 100

                // Pending tasks for this course to show grade input
                const coursePendingTasks = (allTasks ?? []).filter(t =>
                  t.courses?.name === g.course && t.status === 'entregado' && !t.grades?.length
                )

                return (
                  <div key={g.course} className="bg-warmgray-50 dark:bg-warmgray-700 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="text-sm font-headline font-bold text-warmgray-900 dark:text-white leading-tight truncate">{g.course}</h3>
                        <span className="text-xs text-warmgray-500 dark:text-warmgray-400">{g.graded_tasks} {t.gradedTasks}</span>
                        {showGrades && g.average !== null && (
                          <div className="mt-1">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 bg-warmgray-200 dark:bg-warmgray-600 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${g.average >= 14 ? 'bg-emerald-500' : g.average >= 11 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min((g.average / 20) * 100, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${g.average >= 14 ? 'text-emerald-600 dark:text-emerald-400' : g.average >= 11 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                                {g.average}/20
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0 ml-3">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle className="text-warmgray-200 dark:text-warmgray-600 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                          <circle
                            className={`stroke-current ${g.average === null ? 'text-warmgray-300 dark:text-warmgray-600' : g.average >= 14 ? 'text-emerald-500' : g.average >= 11 ? 'text-amber-500' : 'text-red-400'}`}
                            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            cx="50" cy="50" fill="transparent" r="40"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            strokeWidth="8"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-warmgray-900 dark:text-white">{g.average ?? '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ingresar nota de tareas entregadas sin calificación */}
                    {coursePendingTasks.length > 0 && (
                      <button
                        onClick={() => setGradingTask(coursePendingTasks[0])}
                        className="mt-3 w-full text-xs text-pink-500 dark:text-pink-300 font-bold text-left flex items-center gap-1 hover:opacity-70 transition-opacity"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Añadir nota ({coursePendingTasks.length} pendiente{coursePendingTasks.length !== 1 ? 's' : ''})
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </section>
      </main>

      {/* Task quick edit modal */}
      {selectedDate && (
        <TaskQuickModal
          tasks={allTasks ?? []}
          dateStr={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSave={handleTaskSave}
        />
      )}

      {/* Grade input modal */}
      {gradingTask && (
        <GradeInputModal
          task={gradingTask}
          onClose={() => setGradingTask(null)}
          onSave={handleGradeSave}
        />
      )}
    </div>
  )
}