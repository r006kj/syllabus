import { useState } from 'react'
import { useTutorial } from '../hooks/useTutorial'

type Tip = { icon: string; text: string }

type Props = {
  section: string
  title: string
  tips: Tip[]
}

export const TutorialBanner = ({ section, title, tips }: Props) => {
  const { visible, dismiss } = useTutorial(section)
  const [collapsed, setCollapsed] = useState(false)

  if (!visible) return null

  return (
    <div className={`relative rounded-2xl border border-pink-200 dark:border-pink-800/50 bg-pink-50 dark:bg-pink-950/40 overflow-hidden transition-all ${collapsed ? 'py-2' : 'py-4'}`}>

      {/* Header row */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-pink-500">lightbulb</span>
          <span className="text-xs font-bold text-pink-600 dark:text-pink-400">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-pink-400 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            <span className="material-symbols-outlined text-[14px]">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
          <button
            onClick={dismiss}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-pink-400 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
            title="No mostrar más"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tips */}
      {!collapsed && (
        <div className="mt-3 px-4 flex flex-col gap-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[14px] text-pink-400 mt-0.5 flex-shrink-0">{tip.icon}</span>
              <p className="text-xs text-pink-700 dark:text-pink-300 leading-relaxed">{tip.text}</p>
            </div>
          ))}
          <button
            onClick={dismiss}
            className="self-start mt-1 text-[10px] font-bold text-pink-400 hover:text-pink-600 transition-colors"
          >
            Entendido, no mostrar más →
          </button>
        </div>
      )}
    </div>
  )
}
