import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loginWithGoogle, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      // el error ya se muestra desde el hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">Bienvenida de nuevo</h1>
        <p className="text-sm text-gray-500 mb-6">Inicia sesión en Syllabus</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        <input
          type="email"
          placeholder="Correo institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
          Continuar con Google
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          ¿No tienes cuenta? <Link to="/register" className="text-indigo-600">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}