import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type SidebarContextType = { collapsed: boolean; toggle: () => void }

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} })

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => { localStorage.setItem('sidebar_collapsed', String(collapsed)) }, [collapsed])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
