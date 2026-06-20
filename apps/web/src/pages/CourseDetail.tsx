import { useParams, Link } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useCourseDetail } from '../hooks/useCourseDetail'

export const CourseDetail = () => {
  const { id } = useParams()
  const { tasks, loading } = useCourseDetail(id!)

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 max-w-3xl">
        <Link to="/courses" className="text-sm text-pink-600 dark:text-pink-300 mb-4 inline-block">
          ← Volver a cursos
        </Link>
        <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mb-6">
          Tareas del curso
        </h1>

        {loading ? (
          <p className="text-warmgray-500 dark:text-warmgray-400">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-xl p-4 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-warmgray-900 dark:text-white">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                      {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 h-fit">
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}