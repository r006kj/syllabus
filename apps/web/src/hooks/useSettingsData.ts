import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type SettingsData = {
  canvas_connected: boolean
  canvas_domain: string | null
  google_connected: boolean
  notify_hours_before: number
  notifications_enabled: boolean
}

export const useSettingsData = () => {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/profile')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}