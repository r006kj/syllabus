import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

type PendingBlock = {
  id: string
  course_name: string | null
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  date: string
  courses?: { name: string } | null
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const STORAGE_KEY = 'attendance_last_check'
// Re-check pending every 30 minutes at most
const CHECK_INTERVAL_MS = 30 * 60 * 1000

export const AttendancePopup = () => {
  const [queue, setQueue]     = useState<PendingBlock[]>([])
  const [current, setCurrent] = useState<PendingBlock | null>(null)
  const [saving, setSaving]   = useState(false)

  const fetchPending = useCallback(async () => {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0)
    if (Date.now() - last < CHECK_INTERVAL_MS) return
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    try {
      const { data } = await api.get('/attendance/pending')
      if (data.length > 0) {
        setQueue(data)
        setCurrent(data[0])
      }
    } catch { /* silent — don't block the app */ }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const advance = () => {
    const next = queue.slice(1)
    setQueue(next)
    setCurrent(next[0] ?? null)
  }

  const record = async (attended: boolean) => {
    if (!current) return
    setSaving(true)
    try {
      await api.post('/attendance', {
        schedule_block_id: current.id,
        date: current.date,
        attended,
      })
    } catch { /* record failed — still advance */ }
    finally {
      setSaving(false)
      advance()
    }
  }

  if (!current) return null

  const courseName = current.courses?.name ?? current.course_name ?? 'Clase'
  const isYesterday = current.date !== new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-warmgray-900 rounded-2xl shadow-2xl border border-warmgray-100 dark:border-warmgray-800 overflow-hidden">

        {/* Header */}
        <div className="bg-pink-500 px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-white text-[22px]">fact_check</span>
          <div>
            <p className="text-white font-headline font-bold text-sm">Registro de asistencia</p>
            <p className="text-pink-100 text-xs">
              {isYesterday ? 'Ayer' : 'Hoy'} · {DAY_LABELS[current.day_of_week]}
            </p>
          </div>
          {queue.length > 1 && (
            <span className="ml-auto text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
              {queue.length} pendientes
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="font-headline font-bold text-warmgray-900 dark:text-white text-base mb-0.5">
            {courseName}
          </p>
          <p className="text-xs text-warmgray-400 mb-1">
            {current.start_time.slice(0, 5)} – {current.end_time.slice(0, 5)}
            {current.location ? ` · ${current.location}` : ''}
          </p>
          <p className="text-sm text-warmgray-600 dark:text-warmgray-300 mt-3">
            ¿Asististe a esta clase?
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => record(true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl py-2.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Sí, asistí
          </button>
          <button
            onClick={() => record(false)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 border border-warmgray-200 dark:border-warmgray-700 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 font-bold text-sm rounded-xl py-2.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            No fui
          </button>
        </div>

        <button
          onClick={advance}
          className="w-full text-center text-xs text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-300 pb-4 transition-colors"
        >
          Recordar más tarde
        </button>
      </div>
    </div>
  )
}
