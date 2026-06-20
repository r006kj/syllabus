import { Link, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import {Logo} from './Logo'

const links = [
  { to: '/dashboard', icon: 'dashboard', label: 'Resumen' },
  { to: '/courses', icon: 'menu_book', label: 'Cursos' },
  { to: '/calendar', icon: 'calendar_today', label: 'Calendario' },
  { to: '/groups', icon: 'groups', label: 'Grupos' },
  { to: '/settings', icon: 'settings', label: 'Configuración' }
]

export const Sidebar = () => {
  const location = useLocation()
  const profile = useProfile()

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-5 gap-4 z-50">
      <div className="flex items-center gap-2 mb-8">
        <Logo className="w-24 h-24" />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {links.map((link) => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`p-3 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-container/40 text-primary'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </div>

      {profile && (
        <Link
          to="/settings"
          className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800"
        >
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
              {profile.name}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {profile.email}
            </span>
          </div>
        </Link>
      )}
    </nav>
  )
}