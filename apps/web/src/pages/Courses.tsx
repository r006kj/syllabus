import { Link } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../context/SidebarContext'
import { useCourses } from '../hooks/useCourses'
import { TutorialBanner } from '../components/TutorialBanner'

const COURSE_PALETTES = [
  { bg: 'bg-pink-100 dark:bg-pink-900/30',    text: 'text-pink-600 dark:text-pink-400'    },
  { bg: 'bg-lemon-100 dark:bg-lemon-900/30',  text: 'text-lemon-700 dark:text-lemon-400'  },
  { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400'    },
  { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-600 dark:text-amber-400'  },
  { bg: 'bg-violet-100 dark:bg-violet-900/30',text: 'text-violet-600 dark:text-violet-400'},
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
]

const ACCENT_BARS = [
  'bg-pink-400',
  'bg-lemon-500',
  'bg-blue-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-emerald-500',
]

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

export const Courses = () => {
  const { collapsed } = useSidebar()
  const { courses, loading } = useCourses()

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">
      <Sidebar />

      <main className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-6 md:p-8`}>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Academics</p>
          <h1 className="font-headline text-2xl font-bold text-warmgray-900 dark:text-white">
            Mis cursos
          </h1>
        </div>

        <TutorialBanner
          section="courses"
          title="Explora tus cursos"
          tips={[
            { icon: 'school',         text: 'Haz clic en un curso para ver sus tareas, notas y módulos de Canvas.' },
            { icon: 'event_note',     text: 'Desde el detalle del curso puedes leer el sílabo y extraer fechas de evaluaciones automáticamente.' },
            { icon: 'bar_chart',      text: 'El gráfico de rendimiento muestra tu promedio semana a semana durante el semestre.' },
          ]}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-warmgray-900 rounded-2xl border border-warmgray-100 dark:border-warmgray-800 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-warmgray-100 dark:bg-warmgray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg w-3/4" />
                    <div className="h-2.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-warmgray-300 dark:text-warmgray-600 text-[28px]">menu_book</span>
            </div>
            <p className="text-sm font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">Sin cursos registrados</p>
            <p className="text-xs text-warmgray-400">Conecta Canvas en Configuración para importar tus cursos automáticamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => {
              const palette  = COURSE_PALETTES[i % COURSE_PALETTES.length]
              const accentBg = ACCENT_BARS[i % ACCENT_BARS.length]
              const initials = getInitials(course.name)

              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl overflow-hidden hover:border-warmgray-200 dark:hover:border-warmgray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Color accent bar */}
                  <div className={`h-1 w-full ${accentBg}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      {/* Initials avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-headline font-bold text-sm ${palette.bg} ${palette.text}`}>
                        {initials || '?'}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-headline font-bold text-warmgray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {course.semester && (
                            <p className="text-xs text-warmgray-400 dark:text-warmgray-500 truncate">
                              {course.semester}
                            </p>
                          )}
                          {(course as any)._section_count > 1 && (
                            <span className="text-[9px] font-bold text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {(course as any)._section_count} secciones
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-warmgray-400 dark:text-warmgray-500">Ver detalles</span>
                      <span className="material-symbols-outlined text-[16px] text-warmgray-300 dark:text-warmgray-600 group-hover:text-pink-400 transition-colors">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
