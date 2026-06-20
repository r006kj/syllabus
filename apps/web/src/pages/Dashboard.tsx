import { useDashboard } from '../hooks/useDashboard'
import { Sidebar } from '../components/Sidebar'
import { useLanguage } from '../hooks/useLanguage'
import { translations } from '../i18n/translations'

type Language = keyof typeof translations

const monthNames: Record<Language, string[]> = {
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  en: [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ]
}

const dayNames: Record<Language, string[]> = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

const buildCalendar = (
  taskDates: string[],
  language: Language
) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: {
    day: number
    isToday: boolean
    hasTask: boolean
  }[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({
      day: 0,
      isToday: false,
      hasTask: false
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d)
      .toISOString()
      .split('T')[0]

    cells.push({
      day: d,
      isToday: d === today.getDate(),
      hasTask: taskDates.includes(dateStr)
    })
  }

  return {
    cells,
    monthLabel: monthNames[language][month],
    dayLabels: dayNames[language],
    today: today.getDate()
  }
}

export const Dashboard = () => {
  const { upcomingTasks, overloadedWeeks, grades, loading } = useDashboard()
  const { language } = useLanguage()

  const t = translations[language]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmgray-50 dark:bg-warmgray-900">
        <p className="text-warmgray-500 dark:text-warmgray-400">
          Cargando...
        </p>
      </div>
    )
  }

  const taskDates = upcomingTasks
    .map(t => t.due_date?.split('T')[0])
    .filter(Boolean) as string[]

  const {
    cells,
    monthLabel,
    dayLabels,
    today
  } = buildCalendar(taskDates, language)

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900 font-body">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 flex flex-col gap-8">
        <section>
          <span className="text-xs font-bold text-pink-600 dark:text-pink-300 uppercase tracking-widest">
            {t.todaySummary}
          </span>
          <h1 className="text-4xl font-headline font-extrabold text-warmgray-900 dark:text-white mt-1">
            {t.today} {today} <span className="text-warmgray-400 dark:text-warmgray-400 text-2xl">{monthLabel}</span>
          </h1>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Calendario */}
          <div className="md:col-span-2 bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700">
            <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white mb-4">
              {monthLabel}
            </h2>
            <div className="grid grid-cols-7 gap-2 text-center">
              {dayLabels.map(d => (
                <div key={d} className="text-warmgray-400 dark:text-warmgray-500 text-[11px] font-bold uppercase">
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-sm ${
                    cell.day === 0
                      ? ''
                      : cell.isToday
                      ? 'bg-pink-400 text-white font-bold'
                      : cell.hasTask
                      ? 'bg-lemon-200 dark:bg-lemon-900/40 text-lemon-700 dark:text-lemon-300 font-medium'
                      : 'text-warmgray-700 dark:text-warmgray-300'
                  }`}
                >
                  {cell.day !== 0 ? cell.day : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Carga académica */}
          <div className="bg-white dark:bg-warmgray-800 rounded-2xl p-6 flex flex-col gap-4 border border-warmgray-100 dark:border-warmgray-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-500 dark:text-pink-300">insights</span>
              <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white">
                {t.overloadedWeek}
              </h2>
            </div>

            {overloadedWeeks.length > 0 ? (
              <div className="bg-pink-100 dark:bg-pink-900/30 p-4 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-pink-600 dark:text-pink-300">priority_high</span>
                <div>
                  <span className="text-sm font-bold text-pink-700 dark:text-pink-200 block mb-1">
                    {t.overloadedWeek}
                  </span>
                  <p className="text-sm text-warmgray-700 dark:text-warmgray-200">
                    {overloadedWeeks[0].count} entregas entre el {overloadedWeeks[0].week_start} y {overloadedWeeks[0].week_end}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-lemon-100 dark:bg-lemon-900/30 p-4 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-lemon-600 dark:text-lemon-300">check_circle</span>
                <p className="text-sm text-warmgray-700 dark:text-warmgray-200">
                  {t.noOverload}
                </p>
              </div>
            )}
          </div>

          {/* Próximas entregas + Cursos */}
          <div className="md:col-span-2 xl:col-span-3 bg-white dark:bg-warmgray-800 rounded-2xl p-6 border border-warmgray-100 dark:border-warmgray-700">
            <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white mb-4">
              {t.upcomingTasks}
            </h2>
            <div className="flex flex-col gap-3 mb-8">
              {upcomingTasks.length === 0 && (
                <p className="text-sm text-warmgray-400 dark:text-warmgray-500">{t.noUpcoming}</p>
              )}
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-pink-500 dark:text-pink-300">event_note</span>
                    <span className="text-sm font-bold text-warmgray-900 dark:text-white">{task.title}</span>
                  </div>
                  <span className="text-sm text-warmgray-500 dark:text-warmgray-400">
                    {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white mb-4">
              {t.courses}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grades.map(g => {
                const percent = g.average ? (g.average / 20) * 100 : 0
                const circumference = 251.2
                const offset = circumference - (circumference * percent) / 100

                return (
                  <div key={g.course} className="bg-warmgray-50 dark:bg-warmgray-700 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-headline font-bold text-warmgray-900 dark:text-white leading-tight">
                        {g.course}
                      </h3>
                      <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                        {g.graded_tasks} {t.gradedTasks}
                      </span>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-warmgray-200 dark:text-warmgray-600 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                        <circle
                          className="text-lemon-500 stroke-current"
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
                )
              })}
            </div>
          </div>

        </section>
      </main>
    </div>
  )
}