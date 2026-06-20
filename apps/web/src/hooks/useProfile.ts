import { useState } from 'react'

export const useProfile = () => {
  const [profile] = useState(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return null

    const user = JSON.parse(stored)
    return {
      name: user.user_metadata?.name ?? user.email?.split('@')[0],
      email: user.email
    }
  })

  return profile
}