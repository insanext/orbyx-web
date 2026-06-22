'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetupMFAPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [qrUri, setQrUri] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'login' | 'qr' | 'done'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError('Credenciales inválidas'); setLoading(false); return }

      const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Orbyx Admin TOTP',
      })
      if (enrollErr) { setError('Error enrollando MFA: ' + enrollErr.message); setLoading(false); return }

      setQrUri(enroll.totp.qr_code)
      setSecret(enroll.totp.secret)
      setFactorId(enroll.id)
      setStep('qr')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chErr) { setError('Error de challenge'); setLoading(false); return }

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (vErr) { setError('Código incorrecto, intenta de nuevo'); setLoading(false); return }

      setStep('done')
    } catch {
      setError('Error de verificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060a14' }}>
      <div className="w-full max-w-sm rounded-2xl border border-blue-900/30 p-6" style={{ background: '#0f1729' }}>
        <h1 className="text-lg font-semibold text-white mb-1">Configurar 2FA</h1>
        <p className="text-sm text-blue-300/50 mb-6">Paso único — escanea el QR con tu app de autenticación</p>

        {step === 'login' && (
          <div className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email"
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50">
              {loading ? 'Configurando...' : 'Configurar MFA'}
            </button>
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-4">
            <div className="flex justify-center bg-white rounded-xl p-4">
              <img src={qrUri} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-300/40 mb-1">O ingresa este código manualmente:</p>
              <code className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded select-all break-all">{secret}</code>
            </div>
            <p className="text-sm text-blue-300/60">Escanea el QR con Google Authenticator, Authy, o cualquier app TOTP. Luego ingresa el código de 6 dígitos:</p>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text" inputMode="numeric" placeholder="000000" maxLength={6}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-3 text-center text-lg tracking-[0.3em] text-white font-mono focus:outline-none focus:border-blue-500/50" />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleVerify} disabled={loading || code.length !== 6}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50">
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <p className="text-green-400 text-lg font-semibold">✓ 2FA configurado</p>
            <p className="text-sm text-blue-300/60">Ahora puedes ir al login del admin panel.</p>
            <a href="/admin/login" className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all text-center">
              Ir al Admin Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
