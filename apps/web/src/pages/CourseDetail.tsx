import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useCourseDetail } from '../hooks/useCourseDetail'
import { useCourseModules } from '../hooks/useCourseModules'
import { useSettingsData } from '../hooks/useSettingsData' // <-- Nuevo import
import { api } from '../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// --- Tipos ---
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

// --- Constructor de datos para la gráfica (Actualizado con fecha de inicio real) ---
const buildWeeklyData = (tasks: Task[], semesterStart: string | null) => {
  if (!semesterStart) {
    return Array.from({ length: 16 }, (_, i) => ({ week: `S${i + 1}`, nota: null }))
  }

  const startTime = new Date(semesterStart).getTime()
  const weeks: Record<number, { sum: number; count: number }> = {}

  tasks.forEach((t) => {
    if (!t.due_date || !t.grades?.length) return
    const grade = t.grades[0]
    if (!grade?.max_score) return

    const date = new Date(t.due_date)
    const diffDays = Math.floor((date.getTime() - startTime) / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1

    if (week < 1 || week > 16) return // fuera de rango del ciclo

    const normalized = Math.min(Math.round((grade.score / grade.max_score) * 20 * 10) / 10, 20)

    if (!weeks[week]) weeks[week] = { sum: 0, count: 0 }
    weeks[week].sum += normalized
    weeks[week].count++
  })

  return Array.from({ length: 16 }, (_, i) => {
    const w = i + 1
    const entry = weeks[w]
    return {
      week: `S${w}`,
      nota: entry ? Math.round((entry.sum / entry.count) * 10) / 10 : null
    }
  })
}

// --- Iconos dinámicos para items del módulo ---
const itemIcon = (type: string) => {
  if (type === 'File') return 'description'
  if (type === 'Page') return 'article'
  if (type === 'Quiz') return 'quiz'
  if (type === 'Assignment') return 'assignment'
  return 'link'
}

// --- Componente: Tarjeta de Módulo con seguridad en la petición ---
const ModuleCard = ({ mod }: { mod: Module }) => {
  const [open, setOpen] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation() // Evita que se cierre el acordeón
    if (summarizing) return

    setSummarizing(true)
    try {
      // Uso estricto de la instancia 'api' para inyectar el Token
      const res = await api.post('/summaries/generate')
      setSummary(res.data?.content?.courses?.[0]?.previous ?? 'Resumen generado con éxito.')
    }  catch (error) {
      console.error("Error al generar resumen:", error);
      setSummary('No se pudo generar el resumen en este momento.')
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="border border-warmgray-100 dark:border-warmgray-700 rounded-xl overflow-hidden bg-white dark:bg-warmgray-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 bg-warmgray-50 dark:bg-warmgray-800 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition-colors text-left min-h-[56px]"
      >
        <span className="text-sm font-medium text-warmgray-900 dark:text-white truncate pr-2">
          {mod.name}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-warmgray-400 dark:text-warmgray-500">
            {mod.items?.length ?? 0} items
          </span>
          <span className="material-symbols-outlined text-[18px] text-warmgray-400 dark:text-warmgray-500">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 flex flex-col gap-2 border-t border-warmgray-100 dark:border-warmgray-700">
          {(!mod.items || mod.items.length === 0) ? (
            <p className="text-xs text-warmgray-400 dark:text-warmgray-500">Sin archivos en este módulo.</p>
          ) : (
            mod.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-pink-400 dark:text-pink-300">
                  {itemIcon(item.type)}
                </span>
                {item.html_url ? (
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-warmgray-700 dark:text-warmgray-300 hover:text-pink-600 dark:hover:text-pink-300 truncate transition-colors"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-xs text-warmgray-700 dark:text-warmgray-300 truncate">{item.title}</span>
                )}
              </div>
            ))
          )}

          <div className="mt-3 pt-3 border-t border-warmgray-50 dark:border-warmgray-700/50">
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="text-xs font-bold text-pink-600 dark:text-pink-300 flex items-center gap-1 hover:opacity-80 disabled:opacity-50 transition-opacity w-fit"
            >
              <span className="material-symbols-outlined text-[14px]">
                {summarizing ? 'hourglass_empty' : 'auto_awesome'}
              </span>
              {summarizing ? 'Procesando...' : 'Resumir módulo'}
            </button>
            
            {summary && (
              <div className="mt-3 text-xs text-warmgray-700 dark:text-warmgray-300 bg-warmgray-50 dark:bg-warmgray-900 rounded-lg p-3 border border-warmgray-100 dark:border-warmgray-700">
                {summary}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Tooltip personalizado para la gráfica ---
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

// --- Página Principal ---
export const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  
  const { tasks, loading: tasksLoading } = useCourseDetail(id!)
  const { modules, loading: modulesLoading } = useCourseModules(id!)
  const { data: settings } = useSettingsData() // <-- Carga de configuraciones

  const pending = tasks.filter((t: Task) => t.status !== 'entregado')
  const submitted = tasks.filter((t: Task) => t.status === 'entregado')
  
  // <-- Uso de la fecha de inicio del ciclo extraída del perfil
  const weeklyData = buildWeeklyData(tasks, settings?.semester_start ?? null)
  const hasChartData = weeklyData.some((d) => d.nota !== null)

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/courses" className="p-1 text-warmgray-400 dark:text-warmgray-500 hover:text-pink-500 dark:hover:text-pink-300 transition-colors bg-white dark:bg-warmgray-800 rounded-full border border-warmgray-100 dark:border-warmgray-700 flex">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white">
              Detalle del Curso
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* COLUMNA IZQUIERDA: Tareas y Gráficos */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tareas Pendientes */}
              <div className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-pink-500 dark:text-pink-300">pending</span>
                  <h2 className="text-sm font-bold text-warmgray-900 dark:text-white uppercase tracking-wide">
                    Pendientes
                  </h2>
                  <span className="ml-auto text-xs font-bold bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </div>

                {tasksLoading ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-700 rounded-lg"></div>
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-700 rounded-lg"></div>
                  </div>
                ) : pending.length === 0 ? (
                  <p className="text-sm text-warmgray-400 dark:text-warmgray-500 text-center py-4">Sin tareas pendientes 🎉</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {pending.map((t: Task) => (
                      <div key={t.id} className="flex items-start gap-3 py-3 border-b border-warmgray-50 dark:border-warmgray-700/50 last:border-0">
                        <span className="material-symbols-outlined text-[18px] text-warmgray-300 dark:text-warmgray-600">radio_button_unchecked</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warmgray-900 dark:text-white truncate">{t.title}</p>
                          {t.due_date && (
                            <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-0.5">
                              {new Date(t.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tareas Entregadas */}
              <div className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-lemon-500 dark:text-lemon-400">task_alt</span>
                  <h2 className="text-sm font-bold text-warmgray-900 dark:text-white uppercase tracking-wide">
                    Entregadas
                  </h2>
                  <span className="ml-auto text-xs font-bold bg-lemon-100 dark:bg-lemon-900/40 text-lemon-600 dark:text-lemon-400 px-2 py-0.5 rounded-full">
                    {submitted.length}
                  </span>
                </div>

                {tasksLoading ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-700 rounded-lg"></div>
                    <div className="h-10 bg-warmgray-100 dark:bg-warmgray-700 rounded-lg"></div>
                  </div>
                ) : submitted.length === 0 ? (
                  <p className="text-sm text-warmgray-400 dark:text-warmgray-500 text-center py-4">Aún no hay entregas.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {submitted.map((t: Task) => {
                      const grade = t.grades?.[0]
                      const nota = grade?.max_score
                        ? Math.round((grade.score / grade.max_score) * 20 * 10) / 10
                        : null

                      return (
                        <div key={t.id} className="flex items-center gap-3 py-3 border-b border-warmgray-50 dark:border-warmgray-700/50 last:border-0">
                          <span className="material-symbols-outlined text-[18px] text-lemon-500 dark:text-lemon-400">check_circle</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warmgray-700 dark:text-warmgray-300 truncate">{t.title}</p>
                          </div>
                          {nota !== null && (
                            <span className="text-xs font-bold px-2 py-1 bg-warmgray-50 dark:bg-warmgray-900 rounded-md text-lemon-600 dark:text-lemon-400 flex-shrink-0">
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

            {/* Gráfico de Rendimiento */}
            <div className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-warmgray-900 dark:text-white uppercase tracking-wide mb-6">
                Rendimiento por semana
              </h2>

              {!hasChartData ? (
                <div className="flex flex-col items-center justify-center h-40 text-warmgray-300 dark:text-warmgray-600">
                  <span className="material-symbols-outlined text-[40px] mb-2 opacity-50">bar_chart</span>
                  <p className="text-sm">Sin calificaciones registradas aún.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} barCategoryGap="25%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#A99D98' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: '#A99D98' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(199,94,110,0.04)' }} />
                    <Bar dataKey="nota" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.nota === null ? '#E3DCD9' : entry.nota >= 14 ? '#A3C04C' : entry.nota >= 11 ? '#C75E6E' : '#E8A9B2'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-warmgray-50 dark:border-warmgray-700/50 justify-center">
                {[
                  { color: 'bg-lemon-500', label: 'Excelente (≥ 14)' },
                  { color: 'bg-pink-500', label: 'Regular (11–13)' },
                  { color: 'bg-pink-200', label: 'Por mejorar (< 11)' },
                  { color: 'bg-warmgray-200', label: 'Sin nota' }
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    <span className="text-xs font-medium text-warmgray-500 dark:text-warmgray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
{/* COLUMNA DERECHA */}
<div
  className="
    hidden lg:flex
    flex-col
    w-96
    h-[calc(100vh-6rem)]
    bg-white
    dark:bg-warmgray-800
    border
    border-warmgray-100
    dark:border-warmgray-700
    rounded-2xl
    overflow-hidden
    sticky
    top-6
  "
>
  <div className="px-5 py-4 border-b border-warmgray-100 dark:border-warmgray-700">
    <h2 className="font-bold uppercase text-sm">
      Módulos
    </h2>
  </div>

  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {modules.map((mod) => (
      <ModuleCard key={mod.id} mod={mod} />
    ))}
  </div>
</div>
        </div>
      </main>
    </div>
  )
}