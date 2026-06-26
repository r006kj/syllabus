import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { useCourseDetail } from '../hooks/useCourseDetail'
import { useCourseModules } from '../hooks/useCourseModules'
import { useCourse } from '../hooks/useCourse'
import { useSettingsData } from '../hooks/useSettingsData'
import { TutorialBanner } from '../components/TutorialBanner'
import { api } from '../lib/api'

const SYLLABUS_EXTRACTED_KEY = (id: string) => `syllabus_extracted_${id}`
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
type Task = {
  id: string
  title: string
  due_date: string | null
  status: string
  grades?: { score: number; max_score: number }[]
}

type Module = {
  id: number
  name: string
  items?: { id: number; title: string; type: string; html_url?: string }[]
}

type GroupCourse = { id: string; name: string; is_primary: boolean }

// ── Weekly chart data ─────────────────────────────────────────────────────────
const buildWeeklyData = (tasks: Task[], semesterStart: string | null, excludedIds: Set<string>) => {
  if (!semesterStart) {
    return Array.from({ length: 16 }, (_, i) => ({ week: `S${i + 1}`, nota: null }))
  }
  const startTime = new Date(semesterStart).getTime()
  const weeks: Record<number, { sum: number; count: number }> = {}
  tasks
    .filter(t => !excludedIds.has(t.id))
    .forEach((t) => {
      if (!t.due_date || !t.grades?.length) return
      const grade = t.grades[0]
      if (!grade?.max_score) return
      const diffDays = Math.floor((new Date(t.due_date).getTime() - startTime) / 86400000)
      const week = Math.floor(diffDays / 7) + 1
      if (week < 1 || week > 16) return
      const normalized = Math.min(Math.round((grade.score / grade.max_score) * 20 * 10) / 10, 20)
      if (!weeks[week]) weeks[week] = { sum: 0, count: 0 }
      weeks[week].sum += normalized
      weeks[week].count++
    })
  return Array.from({ length: 16 }, (_, i) => {
    const w = i + 1
    const entry = weeks[w]
    return { week: `S${w}`, nota: entry ? Math.round((entry.sum / entry.count) * 10) / 10 : null }
  })
}

// ── Section label (1-digit → Teoría, 2+ digits → Lab) ────────────────────────
const sectionLabel = (name: string): string => {
  const m = name.match(/\s(\d+)\s*(?:\([^)]*\))?\s*$/)
  if (m) return m[1].length === 1 ? 'Teoría' : 'Lab'
  return name.toLowerCase().includes('lab') ? 'Lab' : 'Teoría'
}

// ── Module item icon ───────────────────────────────────────────────────────────
const itemIcon = (type: string) => {
  if (type === 'File')       return 'description'
  if (type === 'Page')       return 'article'
  if (type === 'Quiz')       return 'quiz'
  if (type === 'Assignment') return 'assignment'
  return 'link'
}

// ── Module accordion ──────────────────────────────────────────────────────────
const ModuleCard = ({ mod }: { mod: Module }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-warmgray-100 dark:border-warmgray-700 rounded-xl overflow-hidden flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-warmgray-50 dark:bg-warmgray-800/60 hover:bg-warmgray-100 dark:hover:bg-warmgray-700/60 transition-colors text-left"
      >
        <span className="text-sm font-medium text-warmgray-900 dark:text-white truncate pr-2">
          {mod.name}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-warmgray-400">{mod.items?.length ?? 0}</span>
          <span className="material-symbols-outlined text-[18px] text-warmgray-400">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 flex flex-col gap-1.5 bg-white dark:bg-warmgray-900/40 border-t border-warmgray-100 dark:border-warmgray-700">
          {(!mod.items || mod.items.length === 0) ? (
            <p className="text-xs text-warmgray-400 py-2">Sin archivos en este módulo.</p>
          ) : (
            mod.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1">
                <span className="material-symbols-outlined text-[14px] text-pink-400 flex-shrink-0">
                  {itemIcon(item.type)}
                </span>
                {item.html_url ? (
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-warmgray-700 dark:text-warmgray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors truncate"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-xs text-warmgray-600 dark:text-warmgray-400 truncate">{item.title}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-warmgray-900 dark:text-white">{label}</p>
      <p className="text-pink-500 font-medium">
        {payload[0].value !== null ? `${payload[0].value} / 20` : 'Sin nota'}
      </p>
    </div>
  )
}

// ── Inline grade form for pending tasks ───────────────────────────────────────
const CompleteTaskForm = ({ task, onDone }: { task: Task; onDone: () => void }) => {
  const [score,    setScore]    = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/tasks/${task.id}`, {
        status: 'entregado',
        ...(score    ? { grade_score: Number(score)    } : {}),
        ...(maxScore ? { grade_max:   Number(maxScore) } : {}),
      })
      onDone()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5 flex-wrap">
      <input
        type="number" min={0} step={0.5}
        placeholder="Nota"
        value={score}
        onChange={e => setScore(e.target.value)}
        className="w-16 text-xs border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-400"
      />
      <span className="text-xs text-warmgray-400">/</span>
      <input
        type="number" min={0} step={0.5}
        placeholder="Máx"
        value={maxScore}
        onChange={e => setMaxScore(e.target.value)}
        className="w-16 text-xs border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-800 text-warmgray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-400"
      />
      <button
        type="submit"
        disabled={saving}
        className="text-xs font-semibold px-2.5 py-1 bg-lemon-500 hover:bg-lemon-600 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {saving ? '...' : 'Marcar entregado'}
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const CourseDetail = () => {
  const { collapsed } = useSidebar()
  const { id } = useParams<{ id: string }>()

  // Group courses (theory + lab sections sharing same group_key)
  const [groupCourses,   setGroupCourses]   = useState<GroupCourse[]>([])
  const [activeCourseId, setActiveCourseId] = useState<string>(id!)

  useEffect(() => {
    if (!id) return
    api.get(`/courses/${id}/group`).then(r => {
      const list = r.data as GroupCourse[]
      setGroupCourses(list)
      // Default to primary (theory) section
      const primary = list.find(c => c.is_primary) ?? list[0]
      if (primary) setActiveCourseId(primary.id)
    }).catch(() => {})
  }, [id])

  // All data hooks use activeCourseId so switching tabs refreshes everything
  const { tasks, loading: tasksLoading, refresh: refetchTasks } = useCourseDetail(activeCourseId)
  const { course }         = useCourse(activeCourseId)
  const { data: settings } = useSettingsData()
  const { modules, loading: modulesLoading, error: modulesError, retry: retryModules } = useCourseModules(activeCourseId)

  const [expandedTask,      setExpandedTask]      = useState<string | null>(null)
  const [excludedFromChart, setExcludedFromChart] = useState<Set<string>>(new Set())
  const [extracting,        setExtracting]        = useState(false)
  const [extractMsg,        setExtractMsg]        = useState<string | null>(null)
  const [syllabusExtracted, setSyllabusExtracted] = useState(
    () => !!localStorage.getItem(SYLLABUS_EXTRACTED_KEY(id!))
  )

  // Reset excluded tasks when switching sections
  useEffect(() => { setExcludedFromChart(new Set()) }, [activeCourseId])

  const handleExtractSyllabus = async () => {
    setExtracting(true)
    setExtractMsg(null)
    try {
      const res = await api.post(`/syllabus/${activeCourseId}/extract`)
      const msg: string = res.data?.message ?? 'Listo'
      setExtractMsg(msg)
      if (!msg.toLowerCase().includes('vinculado')) {
        localStorage.setItem(SYLLABUS_EXTRACTED_KEY(id!), '1')
        setSyllabusExtracted(true)
      }
    } catch {
      setExtractMsg('Error al procesar el sílabo.')
    } finally {
      setExtracting(false)
    }
  }

  const toggleExclude = (taskId: string) =>
    setExcludedFromChart(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })

  const pending   = tasks.filter((t: Task) => t.status !== 'entregado')
  const submitted = tasks.filter((t: Task) => t.status === 'entregado')
  const weeklyData   = buildWeeklyData(tasks, settings?.semester_start ?? null, excludedFromChart)
  const hasChartData = weeklyData.some((d) => d.nota !== null)

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-6 md:p-8 flex flex-col gap-6`}>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 text-warmgray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">Cursos</p>
            <h1 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white leading-tight">
              {course?.name ?? 'Detalle del curso'}
            </h1>
          </div>
        </div>

        {/* Theory / Lab tabs — page-level, control ALL content */}
        {groupCourses.length > 1 && (
          <div className="flex gap-1 bg-warmgray-100 dark:bg-warmgray-800/60 rounded-xl p-1 w-fit">
            {groupCourses.map(gc => {
              const label = sectionLabel(gc.name)
              const active = activeCourseId === gc.id
              return (
                <button
                  key={gc.id}
                  onClick={() => setActiveCourseId(gc.id)}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-white dark:bg-warmgray-900 text-pink-600 dark:text-pink-400 shadow-sm'
                      : 'text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

        <TutorialBanner
          section="course_detail"
          title="Detalle del curso"
          tips={[
            { icon: 'assignment_turned_in', text: 'Haz clic en una tarea pendiente para ingresar la nota y marcarla como entregada.' },
            { icon: 'visibility_off',       text: 'En tareas entregadas puedes excluir evaluaciones del gráfico usando el ícono de visibilidad.' },
            { icon: 'event_note',           text: 'Usa "Sacar fechas del sílabo" para importar las fechas de exámenes automáticamente desde el PDF del sílabo.' },
          ]}
        />

        {/* Body: 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left: tasks + chart ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Task cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Pendientes */}
              <div className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[16px] text-pink-500">pending</span>
                  <h2 className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-widest">Pendientes</h2>
                  <span className="ml-auto text-xs font-bold bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </div>

                {tasksLoading ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                  </div>
                ) : pending.length === 0 ? (
                  <p className="text-sm text-warmgray-400 text-center py-6">Sin tareas pendientes 🎉</p>
                ) : (
                  <div className="flex flex-col gap-0 max-h-80 overflow-y-auto">
                    {pending.map((t: Task) => (
                      <div key={t.id} className="py-3 border-b border-warmgray-50 dark:border-warmgray-800 last:border-0">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)}
                            title="Marcar como entregado"
                            className="w-4 h-4 rounded border-2 border-warmgray-200 dark:border-warmgray-600 hover:border-lemon-500 dark:hover:border-lemon-400 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warmgray-900 dark:text-white truncate">{t.title}</p>
                            {t.due_date && (
                              <p className="text-xs text-warmgray-400 mt-0.5">
                                {new Date(t.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                            {expandedTask === t.id && (
                              <CompleteTaskForm task={t} onDone={() => { setExpandedTask(null); refetchTasks() }} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entregadas */}
              <div className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[16px] text-lemon-500">task_alt</span>
                  <h2 className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-widest">Entregadas</h2>
                  <span className="ml-auto text-xs font-bold bg-lemon-50 dark:bg-lemon-900/30 text-lemon-700 dark:text-lemon-400 px-2 py-0.5 rounded-full">
                    {submitted.length}
                  </span>
                </div>
                <p className="text-[10px] text-warmgray-400 mb-3">Activa el ojo para incluir en el gráfico</p>

                {tasksLoading ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                  </div>
                ) : submitted.length === 0 ? (
                  <p className="text-sm text-warmgray-400 text-center py-6">Aún no hay entregas.</p>
                ) : (
                  <div className="flex flex-col gap-0 max-h-80 overflow-y-auto">
                    {submitted.map((t: Task) => {
                      const grade = t.grades?.[0]
                      const nota = grade?.max_score
                        ? Math.round((grade.score / grade.max_score) * 20 * 10) / 10
                        : null
                      const included = !excludedFromChart.has(t.id)
                      return (
                        <div key={t.id} className="flex items-center gap-3 py-3 border-b border-warmgray-50 dark:border-warmgray-800 last:border-0">
                          <button
                            onClick={() => toggleExclude(t.id)}
                            title={included ? 'Excluir del gráfico' : 'Incluir en el gráfico'}
                            className={`flex-shrink-0 transition-colors ${included ? 'text-lemon-500' : 'text-warmgray-300 dark:text-warmgray-600'}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {included ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                          <p className={`text-sm font-medium truncate flex-1 ${included ? 'text-warmgray-700 dark:text-warmgray-300' : 'text-warmgray-400 dark:text-warmgray-600 line-through'}`}>
                            {t.title}
                          </p>
                          {nota !== null && (
                            <span className={`text-xs font-bold flex-shrink-0 ${included ? 'text-lemon-700 dark:text-lemon-400' : 'text-warmgray-400'}`}>
                              {nota}/20
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Performance chart */}
            <div className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-warmgray-500 dark:text-warmgray-400 uppercase tracking-widest mb-5">
                Rendimiento por semana
              </h2>

              {!hasChartData ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span className="material-symbols-outlined text-[36px] text-warmgray-200 dark:text-warmgray-700">bar_chart</span>
                  <p className="text-sm text-warmgray-400">Sin calificaciones registradas aún.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} barCategoryGap="25%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#A99D98' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: '#A99D98' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(199,94,110,0.04)' }} />
                    <Bar dataKey="nota" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.nota === null ? '#E3DCD9'
                            : entry.nota >= 14 ? '#A3C04C'
                            : entry.nota >= 11 ? '#C75E6E'
                            : '#E8A9B2'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-warmgray-50 dark:border-warmgray-800">
                {[
                  { color: 'bg-lemon-500',    label: 'Excelente (≥ 14)' },
                  { color: 'bg-pink-500',     label: 'Regular (11–13)'  },
                  { color: 'bg-pink-200',     label: 'Por mejorar (< 11)' },
                  { color: 'bg-warmgray-200', label: 'Sin nota'         },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-xs text-warmgray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: modules panel ── */}
          <div className="hidden lg:flex flex-col h-[calc(100vh-7rem)] bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl overflow-hidden sticky top-6">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-warmgray-100 dark:border-warmgray-800 flex-shrink-0">
              <h2 className="text-xs font-bold text-warmgray-500 dark:text-warmgray-400 uppercase tracking-widest">
                Módulos del curso
              </h2>
            </div>

            {/* Syllabus extraction */}
            <div className="px-4 pt-3 pb-2 border-b border-warmgray-100 dark:border-warmgray-800 flex-shrink-0">
              {course?.is_primary === false ? (
                <p className="text-[10px] text-warmgray-400 dark:text-warmgray-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-amber-400">link</span>
                  El sílabo se procesa desde el curso teoría vinculado.
                </p>
              ) : syllabusExtracted ? (
                <p className="text-[10px] text-lemon-600 dark:text-lemon-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Fechas del sílabo ya extraídas.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleExtractSyllabus}
                    disabled={extracting}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-pink-500 hover:text-pink-600 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {extracting ? 'hourglass_top' : 'event_note'}
                    </span>
                    {extracting ? 'Procesando sílabo...' : 'Sacar fechas del sílabo'}
                  </button>
                  {extractMsg && (
                    <p className="text-[10px] text-warmgray-500 dark:text-warmgray-400 leading-snug">{extractMsg}</p>
                  )}
                </div>
              )}
            </div>

            {modulesLoading ? (
              <div className="flex-1 flex flex-col gap-2 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 animate-pulse" />
                ))}
              </div>
            ) : modulesError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="material-symbols-outlined text-[28px] text-red-300 dark:text-red-700">error_outline</span>
                <p className="text-xs text-warmgray-400 leading-snug">{modulesError}</p>
                <button
                  onClick={retryModules}
                  className="text-[10px] font-bold text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span>
                  Reintentar
                </button>
              </div>
            ) : modules.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="material-symbols-outlined text-[32px] text-warmgray-200 dark:text-warmgray-700">folder_open</span>
                <p className="text-xs text-warmgray-400">Sin módulos en esta sección.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {modules.map((mod) => (
                  <ModuleCard key={mod.id} mod={mod} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
