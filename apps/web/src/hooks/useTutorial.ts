import { useState, useCallback } from 'react'

const key = (section: string) => `tutorial_seen_${section}`

export const useTutorial = (section: string) => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(key(section)))

  const dismiss = useCallback(() => {
    localStorage.setItem(key(section), '1')
    setVisible(false)
  }, [section])

  return { visible, dismiss }
}
