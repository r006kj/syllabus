import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useTasksList } from '../hooks/useTasksList'

const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'entregado', label: 'Entregadas' }
]

export const Tasks = () => {
  const { tasks, loading, updateTask } = useTasksList()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6">
        <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mb-4">Tareas</h1>

        <div className="flex gap-2 mb-6">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === f.value
                  ? 'bg-pink-400 text-white'
                  : 'bg-white dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 border border-warmgray-100 dark:border-warmgray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-warmgray-500 dark:text-warmgray-400">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((task) => (
              <div key={task.id} className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-pink-600 dark:text-pink-300">{task.courses?.name}</p>
                    <p className="text-sm font-medium text-warmgray-900 dark:text-white">{task.title}</p>
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                      {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    className="text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="entregado">Entregado</option>
                  </select>

                  <select
                    value={task.complexity ?? ''}
                    onChange={(e) => updateTask(task.id, { complexity: e.target.value })}
                    className="text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                  >
                    <option value="">Complejidad</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Horas est."
                    defaultValue={task.estimated_hours ?? ''}
                    onBlur={(e) => updateTask(task.id, { estimated_hours: Number(e.target.value) })}
                    className="text-xs border border-warmgray-200 dark:border-warmgray-600 rounded-lg px-2 py-1 w-20 bg-white dark:bg-warmgray-700 text-warmgray-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}