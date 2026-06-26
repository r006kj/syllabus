import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { api } from '../lib/api'

type CourseStat = {
  course_id: string | null
  course_name: string
  expected: number
  attended: number
  total_recorded: number
  percentage: number | null
}

type HistoryRecord = {
  id: string
  date: string
  attended: boolean
  schedule_blocks: { course_name: string; start_time: string; end_time: string } | null
}

const pct = (n: number | null) => (n == null ? '–' : `${n}%`)

const PctBar = ({ value }: { value: number | null }) => {
  const v = value ?? 0
  const color = v >= 70 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="w-full h-1.5 rounded-full bg-warmgray-100 dark:bg-warmgray-700 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(v, 100)}%` }} />
    </div>
  )
}

const PctBadge = ({ value }: { value: number | null }) => {
  const v = value ?? -1
  const cls = v >= 70 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : v >= 50 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
            : v >= 0  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            : 'text-warmgray-400 bg-warmgray-100 dark:bg-warmgray-800'
  return (
    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{pct(value)}</span>
  )
}

export const Attendance = () => {
  const { collapsed } = useSidebar()
  const [stats,   setStats]   = useState<CourseStat[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [history,  setHistory]  = useState<Record<string, HistoryRecord[]>>({})
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/attendance/stats')
      setStats(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const toggleHistory = async (courseId: string | null, key: string) => {
    if (expanded === key) { setExpanded(null); return }
    setExpanded(key)
    if (history[key] || !courseId) return
    setLoadingHistory(key)
    try {
      const { data } = await api.get(`/attendance/history/${courseId}`)
      setHistory(h => ({ ...h, [key]: data }))
    } catch { setHistory(h => ({ ...h, [key]: [] })) }
    finally { setLoadingHistory(null) }
  }

  const toggle = async (record: HistoryRecord, key: string) => {
    try {
      await api.post('/attendance', {
        schedule_block_id: record.schedule_blocks ? undefined : undefined,
        date: record.date,
        attended: !record.attended,
      })
      setHistory(h => ({
        ...h,
        [key]: h[key].map(r => r.id === record.id ? { ...r, attended: !r.attended } : r)
      }))
      fetchStats()
    } catch { /* ignore */ }
  }

  const deleteRecord = async (recordId: string, key: string) => {
    try {
      await api.delete(`/attendance/${recordId}`)
      setHistory(h => ({ ...h, [key]: h[key].filter(r => r.id !== recordId) }))
      fetchStats()
    } catch { /* ignore */ }
  }

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-6 md:p-8`}>

        <div className="mb-6">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Academics</p>
          <h1 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white">
            Asistencias
          </h1>
          <p className="text-sm text-warmgray-400 dark:text-warmgray-500 mt-0.5">
            Solo se muestran cursos con asistencia obligatoria marcada en tu horario.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-warmgray-900 rounded-2xl border border-warmgray-100 dark:border-warmgray-800 p-5 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg w-48" />
                  <div className="h-6 w-12 bg-warmgray-100 dark:bg-warmgray-800 rounded-full" />
                </div>
                <div className="h-1.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-warmgray-300 dark:text-warmgray-600 text-[28px]">event_available</span>
            </div>
            <p className="text-sm font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">Sin cursos con asistencia</p>
            <p className="text-xs text-warmgray-400 max-w-xs">
              Activa "Asistencia obligatoria" en los bloques de tu horario (Planner → doble clic en un bloque).
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {stats.map(stat => {
              const key = stat.course_id ?? `__${stat.course_name}`
              const isOpen = expanded === key
              const hist = history[key] ?? []
              const isLoadingHist = loadingHistory === key

              return (
                <div key={key} className="bg-white dark:bg-warmgray-900 rounded-2xl border border-warmgray-100 dark:border-warmgray-800 overflow-hidden">
                  <button
                    onClick={() => toggleHistory(stat.course_id, key)}
                    className="w-full p-5 text-left hover:bg-warmgray-50 dark:hover:bg-warmgray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-bold text-warmgray-900 dark:text-white text-sm truncate">
                          {stat.course_name}
                        </p>
                        <p className="text-xs text-warmgray-400 mt-0.5">
                          {stat.attended}/{stat.expected > 0 ? stat.expected : stat.total_recorded} clases asistidas
                          {stat.expected === 0 && stat.total_recorded === 0 && ' · Sin registros aún'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PctBadge value={stat.percentage} />
                        <span className={`material-symbols-outlined text-[18px] text-warmgray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                    </div>
                    <PctBar value={stat.percentage} />
                    {stat.percentage !== null && stat.percentage < 70 && (
                      <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5 font-medium">
                        ⚠ Por debajo del mínimo recomendado (70%)
                      </p>
                    )}
                  </button>

                  {/* Expanded history */}
                  {isOpen && (
                    <div className="border-t border-warmgray-100 dark:border-warmgray-800">
                      {isLoadingHist ? (
                        <div className="px-5 py-4 text-xs text-warmgray-400 animate-pulse">Cargando historial...</div>
                      ) : hist.length === 0 ? (
                        <p className="px-5 py-4 text-xs text-warmgray-400">
                          No hay registros todavía. El popup de asistencia los irá capturando automáticamente.
                        </p>
                      ) : (
                        <div className="divide-y divide-warmgray-100 dark:divide-warmgray-800">
                          {hist.map(r => (
                            <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                r.attended
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                <span className={`material-symbols-outlined text-[13px] ${
                                  r.attended ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {r.attended ? 'check' : 'close'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-warmgray-800 dark:text-warmgray-200">
                                  {new Date(r.date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </p>
                                {r.schedule_blocks && (
                                  <p className="text-[10px] text-warmgray-400">
                                    {r.schedule_blocks.start_time.slice(0, 5)} – {r.schedule_blocks.end_time.slice(0, 5)}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteRecord(r.id, key)}
                                className="text-warmgray-300 dark:text-warmgray-600 hover:text-red-400 transition-colors p-1"
                                title="Eliminar registro"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
