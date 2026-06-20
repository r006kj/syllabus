import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useCalendarData } from '../hooks/useCalendarData'
import { api } from '../lib/api'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const Calendar = () => {

  const { tasks, studyBlocks, loading, generating, generatePlan } = useCalendarData()
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0])
  const [uploading, setUploading] = useState(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const tasksByDate: Record<string, any[]> = {}
  tasks.forEach((t) => {
    if (!t.due_date) return
    const d = t.due_date.split('T')[0]
    if (!tasksByDate[d]) tasksByDate[d] = []
    tasksByDate[d].push(t)
  })

  const studyByDate: Record<string, any[]> = {}
  studyBlocks.forEach((s) => {
    const d = s.start_time.split('T')[0]
    if (!studyByDate[d]) studyByDate[d] = []
    studyByDate[d].push(s)
  })

  const cells: { date: string; day: number }[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ date: '', day: 0 })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0]
    cells.push({ date: dateStr, day: d })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      await api.post('/schedule/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } finally {
      setUploading(false)
    }
  }

  const dayTasks = tasksByDate[selectedDay] ?? []
  const dayStudy = studyByDate[selectedDay] ?? []

  return (
    <div className="flex min-h-screen bg-warmgray-50 dark:bg-warmgray-900">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-headline font-bold text-warmgray-900 dark:text-white">Calendario</h1>
          <div className="flex gap-2">
            <label className="bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-900 dark:text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
              {uploading ? 'Subiendo...' : 'Subir horario'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="bg-pink-500 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar plan de estudio'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-warmgray-500 dark:text-warmgray-400">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-headline font-bold text-warmgray-900 dark:text-white">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 text-warmgray-500 dark:text-warmgray-400">‹</button>
                  <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 text-warmgray-500 dark:text-warmgray-400">›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center">
                {dayNames.map((d) => (
                  <div key={d} className="text-warmgray-400 dark:text-warmgray-500 text-[11px] font-bold uppercase">{d}</div>
                ))}
                {cells.map((cell, i) => {
                  const hasTask = tasksByDate[cell.date]?.length > 0
                  const hasStudy = studyByDate[cell.date]?.length > 0
                  const isSelected = cell.date === selectedDay

                  return (
                    <button
                      key={i}
                      onClick={() => cell.date && setSelectedDay(cell.date)}
                      disabled={cell.day === 0}
                      className={`p-2 rounded-xl text-sm relative ${
                        isSelected
                          ? 'bg-pink-400 text-white font-bold'
                          : hasTask
                          ? 'bg-pink-50 dark:bg-pink-900/20 text-warmgray-900 dark:text-white'
                          : 'text-warmgray-700 dark:text-warmgray-300'
                      }`}
                    >
                      {cell.day !== 0 ? cell.day : ''}
                      {hasStudy && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lemon-500" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-warmgray-800 border border-warmgray-100 dark:border-warmgray-700 rounded-2xl p-6">
              <h2 className="text-lg font-headline font-bold text-warmgray-900 dark:text-white mb-4">
                {new Date(selectedDay).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>

              {dayTasks.length === 0 && dayStudy.length === 0 && (
                <p className="text-sm text-warmgray-400 dark:text-warmgray-500">Sin eventos este día.</p>
              )}

              {dayTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-2 border-b border-warmgray-100 dark:border-warmgray-700">
                  <span className="material-symbols-outlined text-pink-500 dark:text-pink-300 text-[18px]">event_note</span>
                  <span className="text-sm text-warmgray-900 dark:text-white">{t.title}</span>
                </div>
              ))}

              {dayStudy.map((s) => (
                <div key={s.id} className="flex items-center gap-2 py-2 border-b border-warmgray-100 dark:border-warmgray-700">
                  <span className="material-symbols-outlined text-lemon-600 dark:text-lemon-300 text-[18px]">menu_book</span>
                  <span className="text-sm text-warmgray-900 dark:text-white">
                    Estudio: {s.start_time.split('T')[1].slice(0, 5)} – {s.end_time.split('T')[1].slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}