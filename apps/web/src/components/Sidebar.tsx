import { Link, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { Logo } from './Logo'
import { useSidebar } from '../context/SidebarContext'

const links = [
  { to: '/dashboard',  icon: 'dashboard',      label: 'Resumen',       soon: false },
  { to: '/courses',    icon: 'menu_book',       label: 'Cursos',        soon: false },
  { to: '/calendar',   icon: 'calendar_today',  label: 'Planner',       soon: false },
  { to: '/attendance', icon: 'fact_check',      label: 'Asistencias',   soon: false },
  { to: '/groups',     icon: 'groups',          label: 'Grupos',        soon: true  },
  { to: '/settings',   icon: 'settings',        label: 'Configuración', soon: false },
]

export const Sidebar = () => {
  const location = useLocation()
  const profile  = useProfile()
  const { collapsed, toggle } = useSidebar()

  return (
    <nav className={`hidden md:flex flex-col h-screen fixed left-0 top-0
      bg-white dark:bg-warmgray-900
      border-r border-warmgray-100 dark:border-warmgray-800
      z-50 transition-[width] duration-200 ease-in-out overflow-hidden
      ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo — click to collapse/expand */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        className={`flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity
          ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}
      >
        <Logo className="w-12 h-12 flex-shrink-0" />
      </button>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-0.5 px-2 pt-1">
        {links.map(link => {
          const active = location.pathname === link.to

          if (link.soon) {
            return (
              <div
                key={link.to}
                title={collapsed ? `${link.label} · Próximamente` : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm cursor-default select-none opacity-35
                  ${collapsed ? 'p-3 justify-center' : 'px-3 py-2.5'}`}
              >
                <span className="material-symbols-outlined text-[19px] flex-shrink-0 text-warmgray-400">{link.icon}</span>
                {!collapsed && (
                  <span className="flex items-center gap-2 whitespace-nowrap text-warmgray-400 text-sm">
                    {link.label}
                    <span className="text-[9px] font-bold bg-warmgray-100 dark:bg-warmgray-700 text-warmgray-400 dark:text-warmgray-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      Pronto
                    </span>
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
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all
                ${collapsed ? 'p-3 justify-center' : 'px-3 py-2.5'}
                ${active
                  ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400'
                  : 'text-warmgray-500 dark:text-warmgray-400 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 hover:text-warmgray-900 dark:hover:text-white'
                }`}
            >
              <span className={`material-symbols-outlined text-[19px] flex-shrink-0 transition-colors
                ${active ? 'text-pink-500 dark:text-pink-400' : ''}`}>
                {link.icon}
              </span>
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden">{link.label}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Profile footer */}
      {profile && (
        <Link
          to="/settings"
          title={collapsed ? (profile.name ?? undefined) : undefined}
          className={`flex items-center gap-3 border-t border-warmgray-100 dark:border-warmgray-800
            flex-shrink-0 transition-colors hover:bg-warmgray-50 dark:hover:bg-warmgray-800
            ${collapsed ? 'p-3 justify-center' : 'px-4 py-3.5'}`}
        >
          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-sm flex-shrink-0">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-semibold text-warmgray-900 dark:text-warmgray-50 truncate leading-tight">
                {profile.name}
              </span>
              <span className="text-xs text-warmgray-400 dark:text-warmgray-500 truncate">
                {profile.email}
              </span>
            </div>
          )}
        </Link>
      )}
    </nav>
  )
}
