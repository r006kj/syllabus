
import { Link } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useCourses } from '../hooks/useCourses'

export const Courses = () => {
  const { courses, loading } = useCourses()

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6">
        <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white mb-6">
          Cursos
        </h1>

        {loading ? (
          <p className="text-warmgray-500 dark:text-warmgray-400">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-5 hover:-translate-y-0.5 transition-transform"
              >
                <h3 className="font-headline font-bold text-warmgray-900 dark:text-white mb-1">
                  {course.name}
                </h3>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400">{course.semester}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}