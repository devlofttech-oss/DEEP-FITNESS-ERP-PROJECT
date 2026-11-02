import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'
import logoImage from '../assets/deep_fitness_logo.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, currentUser, inactiveGymError } = useAuth()
  const navigate = useNavigate()

  if (currentUser) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-900 p-4 font-['Plus_Jakarta_Sans']">
      <div className="bg-surface-container-lowest dark:bg-slate-950 w-full max-w-md p-8 md:p-10 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/30 flex flex-col items-center">
        
        <div className="w-24 h-24 mb-4 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 flex items-center justify-center shadow-lg">
          <img src={logoImage} alt="DEEP FITNESS" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface text-center mb-1 tracking-tight">DEEP FITNESS</h1>
        <p className="text-primary font-medium text-center text-sm mb-1">Management Portal</p>
        <p className="text-on-surface-variant text-center mb-8 text-sm mt-3">Sign in to your management dashboard</p>

        {inactiveGymError && (
          <div className="w-full p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl text-sm font-medium text-center flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-[16px]">block</span>
            Your gym account is currently inactive. Please contact support.
          </div>
        )}

        {error && (
          <div className="w-full p-3 mb-6 bg-error-container text-on-error-container rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold text-on-surface">Email address</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deepfitnessgym2025@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface dark:bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-sm font-semibold text-on-surface">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface dark:bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-on-surface-variant">
          Developed by Devloft Tech
        </div>
      </div>
    </div>
  )
}
