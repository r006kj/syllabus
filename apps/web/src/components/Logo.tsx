import { useTheme } from '../hooks/useTheme'
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'

export const Logo = ({ className = 'w-8 h-8' }: { className?: string }) => {
  const { darkMode } = useTheme()
  return <img src={darkMode ? logoDark : logoLight} alt="Syllabus" className={className} />
}