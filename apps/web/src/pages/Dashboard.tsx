import { useState, useRef, useCallback, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useSchedule } from '../hooks/useSchedule'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { TutorialBanner } from '../components/TutorialBanner'

type Language = keyof typeof translations

const monthNames: Record<Language, string[]> = {
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const dayNames: Record<Language, string[]> = {
  es: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
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

// ── Types ─────────────────────────────────────────────────────────────────────
type WidgetId = 'calendar' | 'schedule' | 'panel' | 'courses'
type TabId    = 'overloaded' | 'upcoming' | 'today'

const WIDGET_META: Record<WidgetId, { label: string; icon: string; description: string }> = {
  calendar: { label: 'Calendario',      icon: 'calendar_month',    description: 'Vista mensual de entregas' },
  schedule: { label: 'Horario',         icon: 'calendar_view_week', description: 'Clases de la semana'      },
  panel:    { label: 'Panel de tareas', icon: 'dashboard',          description: 'Sobrecarga, entregas, hoy' },
  courses:  { label: 'Cursos y notas',  icon: 'school',             description: 'Promedio por materia'     },
}

const TAB_LABELS: Record<TabId, { label: string; icon: string }> = {
  overloaded: { label: 'Sobrecarga', icon: 'priority_high' },
  upcoming:   { label: 'Entregas',   icon: 'event_note'    },
  today:      { label: 'Hoy',        icon: 'today'         },
}

// Top-row widgets: calendar/schedule ↔ panel. These two are mutually exclusive with schedule/calendar.
const TOP_ROW_IDS: WidgetId[] = ['calendar', 'schedule', 'panel']

type DashConfig = {
  widgetOrder:   WidgetId[]
  widgetVisible: Record<WidgetId, boolean>
  tabOrder:      TabId[]
  tabVisible:    Record<TabId, boolean>
}

const DEFAULT_CONFIG: DashConfig = {
  widgetOrder:   ['calendar', 'panel', 'courses'],
  widgetVisible: { calendar: true, schedule: false, panel: true, courses: true },
  tabOrder:      ['overloaded', 'upcoming', 'today'],
  tabVisible:    { overloaded: true, upcoming: true, today: true },
}

const loadConfig = (): DashConfig => {
  try {
    const raw = localStorage.getItem('dash_config_v3')
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<DashConfig>
    return {
      widgetOrder:   parsed.widgetOrder   ?? DEFAULT_CONFIG.widgetOrder,
      widgetVisible: { ...DEFAULT_CONFIG.widgetVisible, ...parsed.widgetVisible },
      tabOrder:      parsed.tabOrder      ?? DEFAULT_CONFIG.tabOrder,
      tabVisible:    { ...DEFAULT_CONFIG.tabVisible,    ...parsed.tabVisible    },
    }
  } catch { return DEFAULT_CONFIG }
}
const saveConfig = (c: DashConfig) => localStorage.setItem('dash_config_v3', JSON.stringify(c))

// ── Task 3-dot menu ───────────────────────────────────────────────────────────
const TaskDotMenu = ({ task, onSave, onClose }: {
  task: any; onSave: (id: string, u: any) => Promise<void>; onClose: () => void
}) => {
  const [complexity, setComplexity] = useState(task.complexity ?? '')
  const [hours,      setHours]      = useState(task.estimated_hours?.toString() ?? '')
  const [saving,     setSaving]     = useState(false)
  const handle = async () => {
    setSaving(true)
    const u: any = {}
    if (complexity) u.complexity = complexity
    if (hours)      u.estimated_hours = Number(hours)
    await onSave(task.id, u)
    setSaving(false)
    onClose()
  }
  return (
    <div className="absolute right-0 top-7 z-50 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-600 rounded-xl shadow-xl p-3 w-52"
      onClick={e => e.stopPropagation()}>
      <p className="text-[10px] font-bold text-warmgray-400 uppercase tracking-widest mb-2">Configurar tarea</p>
      <div className="mb-2">
        <label className="text-[10px] text-warmgray-400 block mb-0.5">Dificultad</label>
        <select value={complexity} onChange={e => setComplexity(e.target.value)}
          className="w-full text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white">
          <option value="">Sin definir</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="text-[10px] text-warmgray-400 block mb-0.5">Horas estimadas</label>
        <input type="number" min={0.5} step={0.5} value={hours} onChange={e => setHours(e.target.value)}
          className="w-full text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
          placeholder="ej: 2.5" />
      </div>
      <button onClick={handle} disabled={saving}
        className="w-full py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors">
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

// ── Day popover ───────────────────────────────────────────────────────────────
const DayPopover = ({ tasks, dateStr, onMouseEnter, onMouseLeave, onClickEdit }: {
  tasks: any[]; dateStr: string
  onMouseEnter: () => void; onMouseLeave: () => void; onClickEdit: () => void
}) => {
  const label = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="absolute z-40 left-1/2 -translate-x-1/2 top-full mt-1 w-52 bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl shadow-2xl p-3 pointer-events-auto"
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <p className="text-[10px] font-bold text-warmgray-400 uppercase mb-2 capitalize">{label}</p>
      {tasks.slice(0, 4).map(t => (
        <div key={t.id} className="flex items-start gap-1.5 py-1 border-b border-warmgray-50 dark:border-warmgray-700 last:border-0">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.status === 'entregado' ? 'bg-emerald-400' : 'bg-pink-400'}`} />
          <span className="text-xs text-warmgray-700 dark:text-warmgray-200 leading-tight">{t.title}</span>
        </div>
      ))}
      {tasks.length > 4 && <p className="text-[10px] text-warmgray-400 mt-1">+{tasks.length - 4} más</p>}
      <button onClick={onClickEdit} className="mt-2 w-full text-[10px] text-pink-500 font-bold text-center hover:opacity-70">Editar →</button>
    </div>
  )
}

// ── Task edit modal ───────────────────────────────────────────────────────────
const TaskEditModal = ({ tasks, dateStr, onClose, onSave }: {
  tasks: any[]; dateStr: string; onClose: () => void; onSave: (id: string, u: any) => Promise<void>
}) => {
  const [edits,  setEdits]  = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const dayTasks = tasks.filter(t => t.due_date?.split('T')[0] === dateStr)
  const label    = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const save = async (id: string) => {
    if (!edits[id]) return
    setSaving(id)
    await onSave(id, edits[id])
    setSaving(null)
    setEdits(p => { const n = { ...p }; delete n[id]; return n })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-warmgray-800 rounded-2xl shadow-2xl w-full max-w-md border border-warmgray-100 dark:border-warmgray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-warmgray-100 dark:border-warmgray-700">
          <div>
            <h2 className="text-sm font-bold text-warmgray-900 dark:text-white capitalize">{label}</h2>
            <p className="text-xs text-warmgray-400 mt-0.5">{dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          {dayTasks.length === 0 && <p className="text-sm text-warmgray-400 text-center py-6">Sin tareas este día.</p>}
          {dayTasks.map(task => {
            const e = edits[task.id] ?? {}
            return (
              <div key={task.id} className="rounded-xl border border-warmgray-100 dark:border-warmgray-700 bg-warmgray-50 dark:bg-warmgray-900/40 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-pink-500 font-medium">{task.courses?.name}</p>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white">{task.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${task.status === 'entregado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'}`}>
                    {task.status === 'entregado' ? 'Entregado' : 'Pendiente'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={e.complexity ?? task.complexity ?? ''} onChange={ev => setEdits(p => ({ ...p, [task.id]: { ...p[task.id], complexity: ev.target.value } }))}
                    className="text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white">
                    <option value="">Dificultad</option>
                    <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option>
                  </select>
                  <input type="number" min={0.5} step={0.5} placeholder="Horas est."
                    value={e.estimated_hours ?? task.estimated_hours ?? ''}
                    onChange={ev => setEdits(p => ({ ...p, [task.id]: { ...p[task.id], estimated_hours: Number(ev.target.value) } }))}
                    className="text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white" />
                </div>
                {edits[task.id] && (
                  <button onClick={() => save(task.id)} disabled={saving === task.id}
                    className="mt-2 w-full py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
                    {saving === task.id ? 'Guardando...' : 'Guardar'}
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

// ── Edit-mode widget wrapper ──────────────────────────────────────────────────
const EditWidget = ({ id, isOver, isDragging, onRemove, onDragStart, onDragOver, onDrop, onDragEnd, children, className }: {
  id: WidgetId; isOver: boolean; isDragging: boolean
  onRemove: () => void
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void
  onDrop: () => void; onDragEnd: () => void
  children: React.ReactNode; className?: string
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
    className={`relative cursor-grab active:cursor-grabbing transition-all duration-150 rounded-2xl
      widget-wiggle
      ${isDragging ? 'opacity-40 scale-95' : ''}
      ${isOver ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-warmgray-50 dark:ring-offset-warmgray-900' : ''}
      ${className ?? ''}
    `}
  >
    {/* Interaction blocker */}
    <div className="absolute inset-0 z-10 rounded-2xl" />
    {/* X remove button — inside card, top-left, large enough to tap */}
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onRemove() }}
      className="absolute top-2.5 left-2.5 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 active:scale-90 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-warmgray-800 transition-transform"
      aria-label={`Quitar ${WIDGET_META[id].label}`}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    {children}
  </div>
)

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { collapsed } = useSidebar()
  const { upcomingTasks, overloadedWeeks, grades, allTasks, loading, refetch } = useDashboard()

  const { scheduleBlocks } = useSchedule()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const t = translations[language]

  const [config, setConfig] = useState<DashConfig>(loadConfig)
  const updateConfig = (c: DashConfig) => { setConfig(c); saveConfig(c) }

  // Edit mode state
  const [isEditing,      setIsEditing]      = useState(false)
  const [dragOverWidget, setDragOverWidget]  = useState<WidgetId | null>(null)
  const [draggingWidget, setDraggingWidget]  = useState<WidgetId | null>(null)

  // Tab drag state
  const tabDragRef                          = useRef<number | null>(null)
  const [tabDragOver, setTabDragOver]       = useState<number | null>(null)

  // ── Config helpers ─────────────────────────────────────────────────────────
  const removeWidget = (id: WidgetId) =>
    updateConfig({ ...config, widgetVisible: { ...config.widgetVisible, [id]: false } })

  const addWidget = (id: WidgetId) => {
    const newVisible = { ...config.widgetVisible, [id]: true }
    let newOrder     = [...config.widgetOrder]
    // calendar ↔ schedule are mutually exclusive
    if (id === 'schedule') {
      newVisible.calendar = false
      const calIdx = newOrder.indexOf('calendar')
      if (calIdx !== -1) newOrder[calIdx] = 'schedule'
      else if (!newOrder.includes('schedule')) newOrder = ['schedule', ...newOrder.filter(x => x !== 'schedule')]
    } else if (id === 'calendar') {
      newVisible.schedule = false
      const schIdx = newOrder.indexOf('schedule')
      if (schIdx !== -1) newOrder[schIdx] = 'calendar'
      else if (!newOrder.includes('calendar')) newOrder = ['calendar', ...newOrder.filter(x => x !== 'calendar')]
    } else if (!newOrder.includes(id)) {
      newOrder.push(id)
    }
    updateConfig({ ...config, widgetOrder: newOrder, widgetVisible: newVisible })
  }

  const swapTopWidgets = (a: WidgetId, b: WidgetId) => {
    const newOrder = [...config.widgetOrder]
    const ai = newOrder.indexOf(a)
    const bi = newOrder.indexOf(b)
    if (ai !== -1 && bi !== -1) {
      ;[newOrder[ai], newOrder[bi]] = [newOrder[bi], newOrder[ai]]
      updateConfig({ ...config, widgetOrder: newOrder })
    }
  }

  const reorderTab = (from: number, to: number) => {
    const n = [...config.tabOrder]
    const [item] = n.splice(from, 1)
    n.splice(to, 0, item)
    updateConfig({ ...config, tabOrder: n })
  }
  const removeTab = (id: TabId) =>
    updateConfig({ ...config, tabVisible: { ...config.tabVisible, [id]: false } })
  const addTab = (id: TabId) =>
    updateConfig({ ...config, tabVisible: { ...config.tabVisible, [id]: true } })

  // ── Active tab ─────────────────────────────────────────────────────────────
  const visibleTabs    = config.tabOrder.filter(id => config.tabVisible[id])
const visibleTabsKey = visibleTabs.join(',')
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const vis = loadConfig().tabOrder.filter(id => loadConfig().tabVisible[id])
    return vis[0] ?? 'overloaded'
  })
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0] ?? 'overloaded')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabsKey])

  // ── Other state ────────────────────────────────────────────────────────────
  const [showAccum,   setShowAccum]   = useState(true)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [editDate,    setEditDate]    = useState<string | null>(null)
  const hoverTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [openMenuId,  setOpenMenuId]  = useState<string | null>(null)
  const [selWeek,     setSelWeek]     = useState(0)

  // ── Resize state for top-row split ────────────────────────────────────────
  const [leftPct, setLeftPct] = useState<number>(() => {
    const stored = localStorage.getItem('dash_left_pct')
    return stored ? Number(stored) : 40
  })
  const leftPctRef   = useRef<number>(leftPct)
  const topRowRef    = useRef<HTMLDivElement>(null)
  const isResizing   = useRef(false)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current || !topRowRef.current) return
      const rect = topRowRef.current.getBoundingClientRect()
      const raw  = ((ev.clientX - rect.left) / rect.width) * 100
      const clamped = Math.round(Math.min(Math.max(raw, 20), 80) * 10) / 10
      leftPctRef.current = clamped
      setLeftPct(clamped)
    }

    const onUp = () => {
      isResizing.current = false
      localStorage.setItem('dash_left_pct', String(leftPctRef.current))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const handleTaskSave = useCallback(async (id: string, updates: any) => {
    await api.patch(`/tasks/${id}`, updates)
    refetch()
  }, [refetch])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-warmgray-200 dark:border-warmgray-700 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-sm text-warmgray-400">Cargando...</p>
      </div>
    </div>
  )

  const taskDates    = (allTasks ?? []).filter(x => x.due_date).map(x => x.due_date.split('T')[0])
  const { cells, monthLabel, dayLabels, today } = buildCalendar(taskDates, language)
  const hoveredTasks = hoveredDate ? (allTasks ?? []).filter(x => x.due_date?.split('T')[0] === hoveredDate) : []
  const selWeekData  = overloadedWeeks[selWeek]
  const todayStr     = new Date().toISOString().split('T')[0]
  const todayTasks   = (allTasks ?? []).filter(x => x.due_date?.split('T')[0] === todayStr)
  const todayDow     = new Date().getDay() // 0=Sun, 1=Mon…

  // ── Layout helpers ─────────────────────────────────────────────────────────
  // Visible top-row widgets in their order
  const topRowWidgets = config.widgetOrder.filter(id => TOP_ROW_IDS.includes(id) && config.widgetVisible[id])
  const leftWidget    = topRowWidgets[0] as WidgetId | undefined
  const rightWidget   = topRowWidgets[1] as WidgetId | undefined
  const hiddenWidgets = (Object.keys(WIDGET_META) as WidgetId[]).filter(id => !config.widgetVisible[id])

  // ── Widget JSX ─────────────────────────────────────────────────────────────
  const calendarWidget = (
    <div className="bg-white dark:bg-warmgray-800 rounded-2xl p-4 border border-warmgray-100 dark:border-warmgray-700 h-full flex flex-col">
      <h2 className="text-sm font-bold text-warmgray-700 dark:text-warmgray-200 mb-3">{monthLabel}</h2>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayLabels.map(d => (
          <div key={d} className="text-[9px] font-bold text-warmgray-300 dark:text-warmgray-600 uppercase pb-1">{d}</div>
        ))}
        {cells.map((cell, i) => {
          const isHov = hoveredDate === cell.dateStr && cell.hasTask
          return (
            <div key={i} className="relative">
              <button disabled={!cell.day}
                onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); if (cell.dateStr) setHoveredDate(cell.dateStr) }}
                onMouseLeave={() => { hoverTimer.current = setTimeout(() => setHoveredDate(null), 250) }}
                onClick={() => cell.dateStr && cell.hasTask && setEditDate(cell.dateStr)}
                className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-all ${
                  !cell.day    ? 'invisible' :
                  cell.isToday ? 'bg-pink-400 text-white font-bold' :
                  isHov        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 scale-110' :
                  cell.hasTask ? 'bg-lemon-100 dark:bg-lemon-900/30 text-lemon-700 dark:text-lemon-300 font-medium cursor-pointer hover:scale-105' :
                                 'text-warmgray-500 dark:text-warmgray-400 hover:bg-warmgray-50 dark:hover:bg-warmgray-700'
                }`}>
                {cell.day || ''}
              </button>
              {isHov && hoveredTasks.length > 0 && (
                <DayPopover tasks={hoveredTasks} dateStr={cell.dateStr}
                  onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current) }}
                  onMouseLeave={() => { hoverTimer.current = setTimeout(() => setHoveredDate(null), 250) }}
                  onClickEdit={() => { setEditDate(cell.dateStr); setHoveredDate(null) }} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 pt-3 border-t border-warmgray-50 dark:border-warmgray-700 mt-auto">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-400" /><span className="text-[9px] text-warmgray-400">Hoy</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lemon-400" /><span className="text-[9px] text-warmgray-400">Entrega</span></div>
      </div>
    </div>
  )

  const SCHED_DAYS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie']

  // Strip "- Laboratorio", "- Lab", "- Teoría", "- Teo", etc. to get the base name
  const baseCourseName = (name: string) =>
    name.replace(/\s*[-–]\s*(Laboratorio|Laboratorios|Lab|Teoría|Teoria|Teo|Teor|L|T)\b.*/i, '').trim()

  // Merge blocks that share the same base name + dow: keep all time slots, deduplicated by start
  type MergedBlock = { baseName: string; slots: string[]; ids: string[]; isLab: boolean; isTheory: boolean }
  const mergeBlocksByDay = (dow: number): MergedBlock[] => {
    const raw = (scheduleBlocks as any[])
      .filter(b => b.day_of_week === dow)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    const map = new Map<string, MergedBlock>()
    for (const b of raw) {
      const base = baseCourseName(b.course_name ?? '')
      const rawName: string = b.course_name ?? ''
      const isLab    = /lab(oratorio)?/i.test(rawName)
      const isTheory = /te[oó](r(ía|ia))?/i.test(rawName)
      if (!map.has(base)) {
        map.set(base, { baseName: base || rawName, slots: [], ids: [], isLab, isTheory })
      }
      const entry = map.get(base)!
      const slot = b.start_time?.slice(0,5)
      if (slot && !entry.slots.includes(slot)) entry.slots.push(slot)
      if (b.id) entry.ids.push(b.id)
      if (isLab)    entry.isLab    = true
      if (isTheory) entry.isTheory = true
    }
    return Array.from(map.values())
  }

  const scheduleWidget = (
    <div className="bg-white dark:bg-warmgray-800 rounded-2xl p-4 border border-warmgray-100 dark:border-warmgray-700 h-full flex flex-col">
      <h2 className="text-sm font-bold text-warmgray-700 dark:text-warmgray-200 mb-3">Horario semanal</h2>
      {scheduleBlocks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <span className="material-symbols-outlined text-warmgray-300 dark:text-warmgray-600 text-[36px] mb-2">calendar_view_week</span>
          <p className="text-xs text-warmgray-400 mb-1">Sin clases registradas</p>
          <button onClick={() => navigate('/calendar')} className="text-[10px] text-pink-500 font-bold hover:opacity-70">
            Ir al Planner →
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5 flex-1">
          {[1,2,3,4,5].map(dow => {
            const merged  = mergeBlocksByDay(dow)
            const isToday = todayDow === dow
            return (
              <div key={dow} className="flex-1 min-w-0 flex flex-col">
                <div className={`text-center text-[9px] font-bold py-0.5 mb-1.5 rounded-md transition-colors ${
                  isToday ? 'bg-pink-500 text-white' : 'text-warmgray-400 dark:text-warmgray-500'
                }`}>
                  {SCHED_DAYS[dow]}
                </div>
                <div className="flex flex-col gap-1">
                  {merged.map((m, i) => (
                    <div key={m.ids[0] ?? i} className={`rounded-lg p-1 ${isToday ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-warmgray-50 dark:bg-warmgray-700/60'}`}>
                      <p className={`text-[9px] font-bold leading-tight truncate ${isToday ? 'text-pink-600 dark:text-pink-300' : 'text-warmgray-700 dark:text-warmgray-200'}`}>
                        {m.baseName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {m.slots.map(s => (
                          <span key={s} className="text-[8px] text-warmgray-400 leading-tight">{s}</span>
                        ))}
                        {(m.isLab || m.isTheory) && (
                          <span className="text-[7px] font-bold text-pink-400/80 leading-tight">
                            {m.isLab && m.isTheory ? 'T+L' : m.isLab ? 'Lab' : 'Teo'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {merged.length === 0 && <div className="h-6" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const panelWidget = (
    <div className="bg-white dark:bg-warmgray-800 rounded-2xl border border-warmgray-100 dark:border-warmgray-700 flex flex-col h-full" style={{ minHeight: 360 }}>
      {/* Tab headers — always draggable */}
      <div className="flex border-b border-warmgray-100 dark:border-warmgray-700 px-4 flex-shrink-0 flex-wrap">
        {config.tabOrder.map((id, i) => {
          const visible = config.tabVisible[id]
          if (!visible && !isEditing) return null
          return (
            <div key={id}
              draggable
              onDragStart={() => { tabDragRef.current = i }}
              onDragOver={e => {
                e.preventDefault()
                if (tabDragRef.current !== null && tabDragRef.current !== i) setTabDragOver(i)
              }}
              onDrop={() => {
                if (tabDragRef.current !== null && tabDragRef.current !== i) {
                  reorderTab(tabDragRef.current, i)
                }
                tabDragRef.current = null
                setTabDragOver(null)
              }}
              onDragEnd={() => { tabDragRef.current = null; setTabDragOver(null) }}
              onClick={() => { if (visible) setActiveTab(id) }}
              className={`group flex items-center gap-1 pb-3 pt-3 mr-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors select-none cursor-grab active:cursor-grabbing
                ${activeTab === id && visible && !isEditing ? 'border-pink-500 text-pink-600 dark:text-pink-300' : 'border-transparent text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-200'}
                ${!visible ? 'opacity-40' : ''}
                ${tabDragOver === i ? 'border-pink-300' : ''}
              `}
            >
              {/* Drag grip — always visible on hover, dim when not */}
              <svg width="8" height="10" viewBox="0 0 8 12" fill="currentColor"
                className="text-warmgray-200 dark:text-warmgray-600 group-hover:text-warmgray-400 mr-0.5 flex-shrink-0 transition-colors">
                <circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/>
                <circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/>
                <circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/>
              </svg>
              <span className="material-symbols-outlined text-[13px]">{TAB_LABELS[id].icon}</span>
              {TAB_LABELS[id].label}
              {isEditing && (
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    if (visible) removeTab(id); else addTab(id)
                  }}
                  className={`ml-1 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${visible ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {visible ? (
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  ) : (
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M12 5v14M5 12h14"/></svg>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* SOBRECARGA */}
        {activeTab === 'overloaded' && (
          <>
            {overloadedWeeks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="w-10 h-10 rounded-full bg-lemon-100 dark:bg-lemon-900/30 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-lemon-600 text-[18px]">check_circle</span>
                </div>
                <p className="text-sm text-warmgray-500 dark:text-warmgray-400">{t.noOverload}</p>
              </div>
            ) : (
              <>
                {overloadedWeeks.length > 1 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {overloadedWeeks.map((_, i) => (
                      <button key={i} onClick={() => setSelWeek(i)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${selWeek === i ? 'bg-pink-500 text-white' : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300'}`}>
                        Sem {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                {selWeekData && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-pink-600 dark:text-pink-300">
                        {selWeekData.count} entregas · {selWeekData.week_start} → {selWeekData.week_end}
                      </p>
                      <button onClick={() => navigate('/calendar', { state: { highlightWeek: selWeekData.week_start, openPlan: true } })}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 px-2.5 py-1 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[13px]">bolt</span>
                        Planear
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(selWeekData.tasks ?? []).map((task: any, idx: number) => {
                        const full = (allTasks ?? []).find(x => x.title === task.title)
                        return (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-warmgray-50 dark:bg-warmgray-700 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                              <span className="text-xs text-warmgray-700 dark:text-warmgray-200 truncate">{task.title}</span>
                            </div>
                            {full && (
                              <div className="relative flex-shrink-0">
                                <button onClick={() => setOpenMenuId(openMenuId === full.id + '_ov' ? null : full.id + '_ov')}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-warmgray-200 dark:hover:bg-warmgray-600 text-warmgray-400 transition-colors">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                                </button>
                                {openMenuId === full.id + '_ov' && <TaskDotMenu task={full} onSave={handleTaskSave} onClose={() => setOpenMenuId(null)} />}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* PRÓXIMAS ENTREGAS */}
        {activeTab === 'upcoming' && (
          upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <span className="material-symbols-outlined text-warmgray-300 text-[40px] mb-2">event_available</span>
              <p className="text-sm text-warmgray-400">{t.noUpcoming}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 bg-pink-50 dark:bg-pink-900/20 rounded-xl relative">
                  <span className="material-symbols-outlined text-pink-400 text-[18px]">event_note</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-pink-600 dark:text-pink-400 font-medium truncate">{task.courses?.name}</p>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white truncate">{task.title}</p>
                  </div>
                  <span className="text-xs text-warmgray-500 dark:text-warmgray-400 flex-shrink-0">
                    {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setOpenMenuId(openMenuId === task.id + '_up' ? null : task.id + '_up')}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-pink-200 dark:hover:bg-pink-800/40 text-warmgray-400 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                    {openMenuId === task.id + '_up' && <TaskDotMenu task={task} onSave={handleTaskSave} onClose={() => setOpenMenuId(null)} />}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* HOY */}
        {activeTab === 'today' && (
          todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <span className="material-symbols-outlined text-warmgray-300 text-[40px] mb-2">today</span>
              <p className="text-sm text-warmgray-400">Sin actividades hoy.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 bg-lemon-50 dark:bg-lemon-900/20 rounded-xl relative">
                  <span className="material-symbols-outlined text-lemon-600 text-[18px]">task_alt</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-lemon-700 dark:text-lemon-400 font-medium truncate">{task.courses?.name}</p>
                    <p className="text-sm font-bold text-warmgray-900 dark:text-white truncate">{task.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${task.status === 'entregado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'}`}>
                    {task.status === 'entregado' ? 'Listo' : 'Pendiente'}
                  </span>
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setOpenMenuId(openMenuId === task.id + '_td' ? null : task.id + '_td')}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-lemon-200 dark:hover:bg-lemon-800/40 text-warmgray-400 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                    {openMenuId === task.id + '_td' && <TaskDotMenu task={task} onSave={handleTaskSave} onClose={() => setOpenMenuId(null)} />}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )

  const coursesWidget = (
    <div className="bg-white dark:bg-warmgray-800 rounded-2xl p-5 border border-warmgray-100 dark:border-warmgray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-headline font-bold text-warmgray-900 dark:text-white">{t.courses}</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-warmgray-500 dark:text-warmgray-400">Acumulado</span>
            <button onClick={() => setShowAccum(a => !a)}
              className={`w-10 h-5 rounded-full relative transition-colors flex items-center px-0.5 ${showAccum ? 'bg-pink-500' : 'bg-warmgray-300 dark:bg-warmgray-600'}`}>
              <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showAccum ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <a href="https://utec-calculator.vercel.app/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
            </svg>
            Calcular notas
          </a>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map(g => {
          const avgReal      = g.average
          const circumference = 251.2
          const hasGrade     = avgReal && avgReal > 0
          // Circle always shows actual grade; bar only appears in accumulated mode
          const circleOffset = (!showAccum && hasGrade)
            ? circumference - (circumference * (avgReal / 20))
            : circumference
          const gradeColor = (avgReal ?? 0) >= 14 ? 'emerald' : (avgReal ?? 0) >= 11 ? 'amber' : 'red'
          const strokeClass = (!showAccum && hasGrade)
            ? gradeColor === 'emerald' ? 'stroke-emerald-500' : gradeColor === 'amber' ? 'stroke-amber-500' : 'stroke-red-400'
            : 'stroke-warmgray-200 dark:stroke-warmgray-700'

          return (
            <div key={g.course} className="bg-warmgray-50 dark:bg-warmgray-700 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="text-sm font-headline font-bold text-warmgray-900 dark:text-white leading-tight truncate">{g.course}</h3>
                <span className="text-xs text-warmgray-500 dark:text-warmgray-400">{g.graded_tasks} {t.gradedTasks}</span>

                {/* Bar — only shown in accumulated mode */}
                {showAccum && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-warmgray-200 dark:bg-warmgray-600 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-warmgray-300 dark:bg-warmgray-500 transition-all duration-700" style={{ width: '0%' }} />
                    </div>
                    <span className="text-xs font-bold text-warmgray-400">—</span>
                  </div>
                )}
              </div>

              {/* Circle — always shows actual grade */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0 ml-3">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" className="stroke-warmgray-200 dark:stroke-warmgray-600" />
                  <circle cx="50" cy="50" fill="transparent" r="40"
                    strokeDasharray={circumference} strokeDashoffset={circleOffset} strokeLinecap="round" strokeWidth="8"
                    className={`transition-all duration-700 ${strokeClass}`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold ${hasGrade && !showAccum
                    ? gradeColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
                    : gradeColor === 'amber' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-500'
                    : 'text-warmgray-400 dark:text-warmgray-500'}`}>
                    {!showAccum && hasGrade ? avgReal : '—'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const widgetContents: Partial<Record<WidgetId, React.ReactNode>> = {
    calendar: calendarWidget,
    schedule: scheduleWidget,
    panel:    panelWidget,
    courses:  coursesWidget,
  }

  // ── Drag handlers for top-row swap ─────────────────────────────────────────
  const makeTopDragProps = (thisId: WidgetId, otherId: WidgetId | undefined) => ({
    onDragStart: () => setDraggingWidget(thisId),
    onDragOver: (e: React.DragEvent) => {
      if (!otherId) return
      e.preventDefault()
      if (draggingWidget === otherId) setDragOverWidget(thisId)
    },
    onDrop: () => {
      if (otherId && draggingWidget === otherId) swapTopWidgets(thisId, otherId)
      setDraggingWidget(null)
      setDragOverWidget(null)
    },
    onDragEnd: () => {
      setDraggingWidget(null)
      setDragOverWidget(null)
    },
  })

  // ── Courses drag (just shows wiggle chrome, no positional swap) ────────────
  const coursesDragProps = {
    onDragStart: () => setDraggingWidget('courses'),
    onDragOver: (e: React.DragEvent) => { e.preventDefault() },
    onDrop: () => setDraggingWidget(null),
    onDragEnd: () => setDraggingWidget(null),
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <style>{`
        @keyframes ios-wiggle {
          0%   { transform: rotate(-0.5deg); }
          50%  { transform: rotate(0.5deg);  }
          100% { transform: rotate(-0.5deg); }
        }
        .widget-wiggle {
          animation: ios-wiggle 0.55s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>

      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-5 md:p-8 flex flex-col gap-5`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">{t.todaySummary}</span>
            <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mt-0.5">
              {t.today} {today} <span className="text-warmgray-400 font-normal text-lg">{monthLabel}</span>
            </h1>
          </div>
          {isEditing ? (
            <button onClick={() => setIsEditing(false)}
              className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
              Listo
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-700 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              Editar
            </button>
          )}
        </div>

        {isEditing && (
          <p className="text-[10px] text-warmgray-400 text-center -mt-3">
            Arrastra los widgets para intercambiarlos · <span className="text-red-500 font-bold">✕</span> para quitar · <span className="text-emerald-500 font-bold">+</span> para mostrar tab
          </p>
        )}

        <TutorialBanner
          section="dashboard"
          title="Bienvenido al Dashboard"
          tips={[
            { icon: 'drag_pan',       text: 'Presiona "Editar" para reorganizar, ocultar o cambiar el tamaño de los widgets.' },
            { icon: 'priority_high',  text: 'La pestaña "Sobrecarga" te muestra semanas con muchas entregas. Usa el botón "Planear" para generar un plan de estudio.' },
            { icon: 'school',         text: 'El widget de Cursos muestra tu promedio real en el círculo. Activa "Acumulado" para ver la proyección.' },
          ]}
        />

        {/* ── Top row: left widget + panel ── */}
        {(leftWidget || rightWidget) && (
          isEditing ? (
            /* Edit mode: keep grid layout for drag-swap */
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
              {leftWidget && (
                <EditWidget
                  key={leftWidget}
                  id={leftWidget}
                  isOver={dragOverWidget === leftWidget}
                  isDragging={draggingWidget === leftWidget}
                  onRemove={() => removeWidget(leftWidget)}
                  className={rightWidget ? 'xl:col-span-2' : 'xl:col-span-5'}
                  {...makeTopDragProps(leftWidget, rightWidget)}
                >
                  {widgetContents[leftWidget]}
                </EditWidget>
              )}
              {rightWidget && (
                <EditWidget
                  key={rightWidget}
                  id={rightWidget}
                  isOver={dragOverWidget === rightWidget}
                  isDragging={draggingWidget === rightWidget}
                  onRemove={() => removeWidget(rightWidget)}
                  className={leftWidget ? 'xl:col-span-3' : 'xl:col-span-5'}
                  {...makeTopDragProps(rightWidget, leftWidget)}
                >
                  {widgetContents[rightWidget]}
                </EditWidget>
              )}
            </div>
          ) : leftWidget && rightWidget ? (
            /* Normal mode with two widgets: flex + drag-resize handle */
            <div ref={topRowRef} className="flex items-stretch select-none">
              <div key={leftWidget} className="min-w-0 flex-none" style={{ width: `${leftPct}%` }}>
                {widgetContents[leftWidget]}
              </div>

              {/* Resize handle */}
              <div
                className="w-5 flex-none flex items-center justify-center cursor-col-resize group"
                onMouseDown={startResize}
              >
                <div className="w-0.5 h-10 rounded-full bg-warmgray-200 dark:bg-warmgray-700 group-hover:bg-pink-400 dark:group-hover:bg-pink-500 transition-colors" />
              </div>

              <div key={rightWidget} className="flex-1 min-w-0">
                {widgetContents[rightWidget]}
              </div>
            </div>
          ) : (
            /* Normal mode with a single widget */
            <div>
              {leftWidget  && <div key={leftWidget}>{widgetContents[leftWidget]}</div>}
              {rightWidget && <div key={rightWidget}>{widgetContents[rightWidget]}</div>}
            </div>
          )
        )}

        {/* ── Courses ── */}
        {config.widgetVisible.courses && (
          isEditing ? (
            <EditWidget
              id="courses"
              isOver={false}
              isDragging={draggingWidget === 'courses'}
              onRemove={() => removeWidget('courses')}
              {...coursesDragProps}
            >
              {coursesWidget}
            </EditWidget>
          ) : coursesWidget
        )}

        {/* ── Add hidden widgets (edit mode only) ── */}
        {isEditing && hiddenWidgets.length > 0 && (
          <div className="bg-white dark:bg-warmgray-800 rounded-2xl border-2 border-dashed border-warmgray-200 dark:border-warmgray-700 p-4">
            <p className="text-[10px] font-bold text-warmgray-400 uppercase tracking-widest mb-3">Agregar widget</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hiddenWidgets.map(id => (
                <button key={id} onClick={() => addWidget(id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-700/50 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition-colors text-left group">
                  <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pink-500">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-warmgray-800 dark:text-warmgray-100 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-warmgray-400">{WIDGET_META[id].icon}</span>
                      {WIDGET_META[id].label}
                    </p>
                    <p className="text-[10px] text-warmgray-400 truncate">{WIDGET_META[id].description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      {editDate   && <TaskEditModal tasks={allTasks ?? []} dateStr={editDate} onClose={() => setEditDate(null)} onSave={handleTaskSave} />}
      {openMenuId && <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />}
    </div>
  )
}
