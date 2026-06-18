import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(email, password, name)
      navigate('/login')
    } catch {
      // el error ya se muestra desde el hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">Únete a Syllabus</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          required
        />
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
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600">Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}