import { useState, useEffect, type ReactNode } from 'react'
import { ThemeContext } from './theme-context'

export type ThemeContextType = {
  darkMode: boolean
  toggleTheme: () => void
  fontSize: 'sm' | 'md' | 'lg'
  setFontSize: (s: 'sm' | 'md' | 'lg') => void
  accentColor: string
  setAccentColor: (c: string) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
}

const FONT_MAP: Record<string, string> = { sm: '13px', md: '15px', lg: '17px' }

type Shades = Record<string, string>
const ACCENTS: Record<string, Shades> = {
  pink:    { '50':'#FDF4F5','100':'#FAE6E9','300':'#E8A9B2','400':'#DB7E8B','500':'#C75E6E','600':'#A8475A','900':'#4A1F28' },
  violet:  { '50':'#f5f3ff','100':'#ede9fe','300':'#c4b5fd','400':'#a78bfa','500':'#8b5cf6','600':'#7c3aed','900':'#2e1065' },
  blue:    { '50':'#eff6ff','100':'#dbeafe','300':'#93c5fd','400':'#60a5fa','500':'#3b82f6','600':'#2563eb','900':'#1e3a8a' },
  emerald: { '50':'#ecfdf5','100':'#d1fae5','300':'#6ee7b7','400':'#34d399','500':'#10b981','600':'#059669','900':'#064e3b' },
  amber:   { '50':'#fffbeb','100':'#fef3c7','300':'#fcd34d','400':'#fbbf24','500':'#f59e0b','600':'#d97706','900':'#78350f' },
}

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r} ${g} ${b}`
}

const buildAccentCSS = (name: string): string => {
  if (name === 'pink') return ''
  const c = ACCENTS[name] ?? ACCENTS.violet
  return `
    .bg-pink-50{background-color:${c['50']}!important}
    .bg-pink-100{background-color:${c['100']}!important}
    .text-pink-300{color:${c['300']}!important}
    .text-pink-400{color:${c['400']}!important}
    .text-pink-500{color:${c['500']}!important}
    .text-pink-600{color:${c['600']}!important}
    .text-pink-700{color:${c['600']}!important}
    .bg-pink-500{background-color:${c['500']}!important}
    .bg-pink-600{background-color:${c['600']}!important}
    .hover\\:bg-pink-500:hover{background-color:${c['500']}!important}
    .hover\\:bg-pink-600:hover{background-color:${c['600']}!important}
    .border-pink-400{border-color:${c['400']}!important}
    .border-pink-500{border-color:${c['500']}!important}
    .ring-pink-400{--tw-ring-color:${c['400']}!important}
    .focus\\:ring-pink-400:focus{--tw-ring-color:${c['400']}!important}
    .stroke-pink-500{stroke:${c['500']}!important}
    .accent-pink-500{accent-color:${c['500']}!important}
    .bg-pink-500\\/15{background-color:rgb(${hexToRgb(c['500'])} / 0.15)!important}
    .bg-pink-500\\/20{background-color:rgb(${hexToRgb(c['500'])} / 0.2)!important}
    .bg-pink-900\\/20{background-color:rgb(${hexToRgb(c['900'])} / 0.2)!important}
    .bg-pink-900\\/30{background-color:rgb(${hexToRgb(c['900'])} / 0.3)!important}
    .dark .dark\\:bg-pink-900\\/20{background-color:rgb(${hexToRgb(c['900'])} / 0.2)!important}
    .dark .dark\\:bg-pink-900\\/30{background-color:rgb(${hexToRgb(c['900'])} / 0.3)!important}
    .dark .dark\\:text-pink-300{color:${c['300']}!important}
    .dark .dark\\:text-pink-400{color:${c['400']}!important}
    .dark .dark\\:border-pink-500{border-color:${c['500']}!important}
  `
}

const injectAccentStyle = (name: string) => {
  let el = document.getElementById('accent-override')
  if (!el) { el = document.createElement('style'); el.id = 'accent-override'; document.head.appendChild(el) }
  el.textContent = buildAccentCSS(name)
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode]          = useState(() => localStorage.getItem('theme') === 'dark')
  const [fontSize, setFontSizeRaw]       = useState<'sm'|'md'|'lg'>(() => (localStorage.getItem('fontSize') as 'sm'|'md'|'lg') || 'md')
  const [accentColor, setAccentColorRaw] = useState(() => localStorage.getItem('accentColor') || 'pink')
  const [reduceMotion, setReduceMotionRaw] = useState(() => localStorage.getItem('reduceMotion') === 'true')

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_MAP[fontSize]
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    localStorage.setItem('reduceMotion', String(reduceMotion))
  }, [reduceMotion])

  useEffect(() => {
    injectAccentStyle(accentColor)
    localStorage.setItem('accentColor', accentColor)
  }, [accentColor])

  const toggleTheme     = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem('theme', n ? 'dark' : 'light') }
  const setFontSize     = (s: 'sm'|'md'|'lg') => setFontSizeRaw(s)
  const setAccentColor  = (c: string) => setAccentColorRaw(c)
  const setReduceMotion = (v: boolean) => setReduceMotionRaw(v)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, fontSize, setFontSize, accentColor, setAccentColor, reduceMotion, setReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  )
}
