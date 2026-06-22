'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factorId, setFactorId] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setError('Credenciales inválidas')
        setLoading(false)
        return
      }

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find(f => f.status === 'verified')

      if (!totp) {
        setError('MFA no configurado en esta cuenta')
        setLoading(false)
        return
      }

      setFactorId(totp.id)
      setStep('totp')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleTotp = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeErr) {
        setError('Error iniciando verificación MFA')
        setLoading(false)
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: totpCode,
      })
      if (verifyErr) {
        setError('Código incorrecto')
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/admin/tickets?status=open`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.status === 403) {
        const body = await res.json()
        setError(body.error === 'mfa_required' ? 'MFA no verificado' : 'Acceso denegado')
        setLoading(false)
        return
      }

      router.push('/admin/tickets')
    } catch {
      setError('Error de verificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060a14' }}>
      <div className="w-full max-w-sm rounded-2xl border border-blue-900/30 p-6" style={{ background: '#0f1729' }}>
        <h1 className="text-lg font-semibold text-white mb-1">Admin Panel</h1>
        <p className="text-sm text-blue-300/50 mb-6">Acceso restringido</p>

        {step === 'credentials' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-blue-300/60 mb-1 block">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-blue-300/60 mb-1 block">Contraseña</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </div>
        )}

        {step === 'totp' && (
          <div className="space-y-4">
            <p className="text-sm text-blue-300/60">Ingresa el código de tu app de autenticación</p>
            <input
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && totpCode.length === 6 && handleTotp()}
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-3 text-center text-lg tracking-[0.3em] text-white font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleTotp}
              disabled={loading || totpCode.length !== 6}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              onClick={() => { setStep('credentials'); setError(''); setTotpCode('') }}
              className="w-full text-sm text-blue-400/60 hover:text-blue-300 transition-colors"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
