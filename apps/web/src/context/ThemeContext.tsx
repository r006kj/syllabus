import { useState } from 'react'
import { ThemeContext } from './theme-context'

export type ThemeContextType = {
  darkMode: boolean
  toggleTheme: () => void
}

export const ThemeProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  )

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)

    document.documentElement.classList.toggle('dark', next)

    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}