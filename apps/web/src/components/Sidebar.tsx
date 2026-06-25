import { Link, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { Logo } from './Logo'
import { useSidebar } from '../context/SidebarContext'

const links = [
  { to: '/dashboard', icon: 'dashboard',      label: 'Resumen',        soon: false },
  { to: '/courses',   icon: 'menu_book',       label: 'Cursos',         soon: false },
  { to: '/calendar',  icon: 'calendar_today',  label: 'Planner',        soon: false },
  { to: '/groups',    icon: 'groups',          label: 'Grupos',         soon: true  },
  { to: '/settings',  icon: 'settings',        label: 'Configuración',  soon: false },
]

export const Sidebar = () => {
  const location   = useLocation()
  const profile    = useProfile()
  const { collapsed, toggle } = useSidebar()

  return (
    <nav className={`hidden md:flex flex-col h-screen fixed left-0 top-0
      bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800
      z-50 transition-[width] duration-200 ease-in-out overflow-hidden
      ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo — click to collapse/expand */}
      <button
        onClick={toggle}
        className={`flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity
          ${collapsed ? 'px-3 py-4' : 'px-4 pt-4 pb-4'}`}
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        <Logo className="w-14 h-14 flex-shrink-0" />
      </button>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-1 px-2">
        {links.map(link => {
          const active = location.pathname === link.to
          if (link.soon) {
            return (
              <div key={link.to} title={collapsed ? `${link.label} · Próximamente` : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium cursor-default select-none opacity-40
                  ${collapsed ? 'p-3 justify-center' : 'px-3 py-3'}`}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-neutral-400 dark:text-neutral-500">
                    {link.label}
                    <span className="text-[9px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pronto</span>
                  </span>
                )}
              </div>
            )
          }
          return (
            <Link
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
                ${collapsed ? 'p-3 justify-center' : 'px-3 py-3'}
                ${active
                  ? 'bg-primary-container/40 text-primary'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">{link.icon}</span>
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{link.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Profile footer */}
      {profile && (
        <Link
          to="/settings"
          title={collapsed ? profile.name ?? undefined : undefined}
          className={`flex items-center gap-3 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800
            ${collapsed ? 'p-3 justify-center' : 'px-5 py-4'}`}
        >
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                {profile.name}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {profile.email}
              </span>
            </div>
          )}
        </Link>
      )}
    </nav>
  )
}
