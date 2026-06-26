import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import logoLight from '../assets/logoL.svg'
import logoDark from '../assets/logoD.svg'

const steps = [
  {
    icon: 'download',
    title: 'Instala la app en tu dispositivo',
    desc: 'Syllabus funciona como una Progressive Web App (PWA). No necesitas la App Store ni Google Play — se instala directo desde tu navegador.',
  },
  {
    icon: 'add_to_home_screen',
    title: 'Agrega al inicio',
    desc: 'En Chrome: menú ⋮ → "Instalar aplicación". En Safari (iOS): botón compartir → "Agregar a inicio". En Edge: menú ··· → "Aplicaciones" → "Instalar".',
  },
  {
    icon: 'notifications',
    title: 'Activa notificaciones (opcional)',
    desc: 'Recibe recordatorios de entregas, semanas de parciales y sesiones de estudio generadas automáticamente.',
  },
  {
    icon: 'offline_bolt',
    title: 'Funciona sin conexión',
    desc: 'Una vez instalada, puedes revisar tu calendario y tareas incluso sin internet. Los cambios se sincronizan cuando vuelves a conectarte.',
  },
]

const browsers = [
  { name: 'Chrome / Edge',  icon: 'laptop_chromebook', steps: ['Haz clic en el ícono de instalación en la barra de dirección', 'O ve a menú ⋮ → Instalar aplicación', 'Confirma y la app se añadirá al escritorio'] },
  { name: 'Safari (iOS)',   icon: 'phone_iphone',       steps: ['Abre Syllabus en Safari', 'Toca el botón de compartir (cuadro con flecha)', 'Selecciona "Agregar a pantalla de inicio"'] },
  { name: 'Firefox',        icon: 'open_in_browser',    steps: ['Busca el ícono de instalación en la barra de dirección', 'Si no aparece, ve a menú → Instalar', 'La app quedará en tu escritorio'] },
]

export const Installation = () => {
  const { darkMode } = useTheme()

  return (
    <div className="min-h-screen bg-warmgray-50 dark:bg-warmgray-950 font-body">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-warmgray-100 dark:border-warmgray-800 bg-white/80 dark:bg-warmgray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <Link to="/login" className="flex items-center gap-2.5">
          <img src={darkMode ? logoDark : logoLight} alt="Syllabus" className="w-8 h-8" />
          <span className="font-headline font-bold text-warmgray-900 dark:text-white text-lg">Syllabus</span>
        </Link>
        <Link
          to="/login"
          className="text-sm font-semibold text-pink-500 hover:text-pink-600 transition-colors"
        >
          Iniciar sesión →
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40 rounded-full px-4 py-1.5 mb-6">
            <span className="material-symbols-outlined text-pink-500 text-[14px]">star</span>
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest">Instala para más funciones</span>
          </div>
          <h1 className="font-headline text-4xl font-bold text-warmgray-900 dark:text-white leading-tight mb-4">
            Syllabus en tu pantalla<br />de inicio
          </h1>
          <p className="text-warmgray-500 dark:text-warmgray-400 text-[15px] leading-relaxed max-w-md mx-auto">
            Accede a tu organizador académico con un solo toque, recibe notificaciones y úsalo incluso sin internet.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {steps.map((s, i) => (
            <div
              key={i}
              className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-pink-500 text-[20px]">{s.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-warmgray-900 dark:text-white text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Browser guides */}
        <h2 className="font-headline text-xl font-bold text-warmgray-900 dark:text-white mb-5">
          Instrucciones por navegador
        </h2>
        <div className="flex flex-col gap-4 mb-14">
          {browsers.map((b, i) => (
            <div
              key={i}
              className="bg-white dark:bg-warmgray-900 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-pink-400 text-[20px]">{b.icon}</span>
                <h3 className="font-semibold text-warmgray-900 dark:text-white text-sm">{b.name}</h3>
              </div>
              <ol className="flex flex-col gap-2">
                {b.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <span className="text-xs text-warmgray-600 dark:text-warmgray-400 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-warmgray-950 dark:bg-warmgray-900 rounded-2xl p-8 text-center border border-warmgray-800">
          <h3 className="font-headline text-xl font-bold text-white mb-2">¿Listo para empezar?</h3>
          <p className="text-warmgray-400 text-sm mb-6">Crea tu cuenta gratis y empieza a organizar tu semestre hoy.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-colors"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to="/login"
              className="border border-warmgray-700 text-warmgray-300 hover:text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
