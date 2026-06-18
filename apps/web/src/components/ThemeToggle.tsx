import { useTheme } from '../hooks/useTheme'

export const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 bg-white dark:bg-neutral-950 border-neutral-800 rounded-lg px-3 py-2 shadow"
    >
      {darkMode ? "Light" : 'Dark'}
    </button>
  )
}