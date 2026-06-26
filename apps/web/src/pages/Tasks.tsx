import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { useTasksList } from '../hooks/useTasksList'
import { TutorialBanner } from '../components/TutorialBanner'

type StatusKey = 'all' | 'pendiente' | 'en_progreso' | 'entregado'

const STATUS_FILTERS: { value: StatusKey; label: string }[] = [
  { value: 'all',         label: 'Todas'       },
  { value: 'pendiente',   label: 'Pendientes'  },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'entregado',   label: 'Entregadas'  },
]

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  pendiente:   { label: 'Pendiente',   dot: 'bg-pink-400',   badge: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800/50'   },
  en_progreso: { label: 'En progreso', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' },
  entregado:   { label: 'Entregado',   dot: 'bg-lemon-500',  badge: 'bg-lemon-50 text-lemon-700 dark:bg-lemon-900/30 dark:text-lemon-600 border-lemon-200 dark:border-lemon-800/50'  },
}

export const Tasks = () => {
  const { collapsed } = useSidebar()
  const { tasks, loading, updateTask } = useTasksList()
  const [filter, setFilter] = useState<StatusKey>('all')

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const counts: Record<StatusKey, number> = {
    all:         tasks.length,
    pendiente:   tasks.filter(t => t.status === 'pendiente').length,
    en_progreso: tasks.filter(t => t.status === 'en_progreso').length,
    entregado:   tasks.filter(t => t.status === 'entregado').length,
  }

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-6 md:p-8`}>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Academics</p>
          <h1 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white">Tareas</h1>
        </div>

        <TutorialBanner
          section="tasks"
          title="Gestiona tus tareas"
          tips={[
            { icon: 'filter_list',    text: 'Filtra por estado: pendiente, en progreso o entregada.' },
            { icon: 'assignment_turned_in', text: 'Entra al detalle de un curso para marcar tareas como entregadas con nota.' },
            { icon: 'event',          text: 'Las tareas con fecha próxima aparecen resaltadas en rojo.' },
          ]}
        />

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 border border-warmgray-200 dark:border-warmgray-700 hover:border-warmgray-300 dark:hover:border-warmgray-600'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                filter === f.value
                  ? 'bg-white/25 text-white'
                  : 'bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-500 dark:text-warmgray-400'
              }`}>
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-warmgray-100 dark:bg-warmgray-800" />
                  <div className="h-2.5 bg-warmgray-100 dark:bg-warmgray-800 rounded w-24" />
                </div>
                <div className="h-3.5 bg-warmgray-100 dark:bg-warmgray-800 rounded w-2/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-7 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl w-28" />
                  <div className="h-7 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-warmgray-300 dark:text-warmgray-600 text-[28px]">task_alt</span>
            </div>
            <p className="text-sm font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">
              {filter === 'all' ? 'Sin tareas registradas' : 'Sin tareas en esta categoría'}
            </p>
            <p className="text-xs text-warmgray-400">
              {filter === 'all'
                ? 'Tus tareas importadas desde Canvas aparecerán aquí.'
                : 'Prueba seleccionando otra categoría.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(task => {
              const meta = STATUS_META[task.status] ?? STATUS_META.pendiente
              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-4 hover:border-warmgray-200 dark:hover:border-warmgray-700 transition-colors"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
                      <div className="min-w-0">
                        {task.courses?.name && (
                          <p className="text-xs font-semibold text-pink-500 dark:text-pink-400 mb-0.5 truncate">
                            {task.courses.name}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-warmgray-900 dark:text-white leading-snug">
                          {task.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.due_date && (
                        <span className="text-xs text-warmgray-400 dark:text-warmgray-500 tabular-nums">
                          {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2 flex-wrap pl-4.5 ml-[18px]">
                    <select
                      value={task.status}
                      onChange={e => updateTask(task.id, { status: e.target.value })}
                      className="text-xs border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2 py-1.5 bg-warmgray-50 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="entregado">Entregado</option>
                    </select>

                    <select
                      value={task.complexity ?? ''}
                      onChange={e => updateTask(task.id, { complexity: e.target.value })}
                      className="text-xs border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2 py-1.5 bg-warmgray-50 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all"
                    >
                      <option value="">Dificultad</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Horas est."
                      defaultValue={task.estimated_hours ?? ''}
                      onBlur={e => updateTask(task.id, { estimated_hours: Number(e.target.value) })}
                      className="text-xs border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2 py-1.5 w-24 bg-warmgray-50 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
