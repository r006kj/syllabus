import { useState, useEffect } from 'react'

const readProfile = () => {
  const stored = localStorage.getItem('user')
  if (!stored) return null
  const user = JSON.parse(stored)
  return {
    name:  user.user_metadata?.name ?? user.email?.split('@')[0],
    email: user.email,
  }
}

export const useProfile = () => {
  const [profile, setProfile] = useState(readProfile)

  useEffect(() => {
    const handler = () => setProfile(readProfile())
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

  return profile
}
