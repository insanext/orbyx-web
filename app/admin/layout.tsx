'use client'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, KeyRound, X } from 'lucide-react'
import { PasswordVisibilityToggle } from '@/components/ui/password-visibility-toggle'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

const NAV_ITEMS = [
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/planes', label: 'Planes' },
  { href: '/admin/estadisticas', label: 'Estadísticas' },
  { href: '/admin/tenants', label: 'Tenants' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  const [changePwdOpen, setChangePwdOpen] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdIsError, setPwdIsError] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  // /admin/login maneja su propia autenticacion (es la pantalla que la
  // resuelve); si este layout tambien la exigiera ahi, un usuario sin
  // sesion quedaria en un loop de redirects hacia si mismo.
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) { setChecked(true); return }
    let cancelled = false
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const token = await getToken()
      if (!token) { router.push('/admin/login'); return }
      // No hay un endpoint generico "quien soy" bajo requireAdminAuth todavia;
      // reusamos /admin/tickets (mismo patron que ya usa admin/login/page.tsx
      // tras verificar el TOTP) solo para confirmar que el token es de un
      // admin activo con MFA verificado.
      const res = await fetch(`${BACKEND_URL}/admin/tickets?status=open`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (!cancelled) {
        setAdminEmail(user?.email || '')
        setChecked(true)
      }
    }
    checkAuth()
    return () => { cancelled = true }
  }, [isLoginPage, getToken, router])

  // Mismo mecanismo de sesion que el dashboard de tenants (misma sesion de
  // Supabase Auth para ambos, ver requireAdminAuth en server.js): cerrar
  // sesion es solo invalidar esa sesion compartida y volver a /admin/login,
  // sin tocar requireAdminAuth ni el chequeo de MFA.
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  function resetChangePwdForm() {
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setShowCurrentPwd(false)
    setShowNewPwd(false)
    setShowConfirmPwd(false)
    setPwdMsg('')
    setPwdIsError(false)
  }

  async function handleChangePassword() {
    if (newPwd !== confirmPwd) {
      setPwdIsError(true)
      setPwdMsg('Las contraseñas no coinciden.')
      return
    }
    if (newPwd.length < 8) {
      setPwdIsError(true)
      setPwdMsg('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setPwdLoading(true)
    setPwdMsg('')
    try {
      const token = await getToken()
      const res = await fetch(`${BACKEND_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwdIsError(true)
        setPwdMsg(data?.error || 'Error actualizando la contraseña.')
        return
      }
      setPwdIsError(false)
      setPwdMsg('✓ Contraseña actualizada correctamente.')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => {
        setChangePwdOpen(false)
        resetChangePwdForm()
      }, 1500)
    } catch {
      setPwdIsError(true)
      setPwdMsg('Error de conexión. Intenta nuevamente.')
    } finally {
      setPwdLoading(false)
    }
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060a14' }}>
        <p className="text-sm text-blue-300/50">Verificando acceso...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#060a14' }}>
      <aside className="w-56 shrink-0 border-r border-blue-900/30 p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-white mb-6 px-2">Orbyx Admin</h2>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href)
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-blue-300/50 hover:text-blue-200 hover:bg-blue-900/20'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-blue-900/30 pt-3 mt-3 space-y-1">
          {adminEmail ? (
            <p className="px-3 pb-1 text-[11px] text-blue-300/40 truncate" title={adminEmail}>
              {adminEmail}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setChangePwdOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-blue-300/50 hover:text-blue-200 hover:bg-blue-900/20 transition-colors"
          >
            <KeyRound size={15} />
            Cambiar contraseña
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-blue-300/50 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>

      {changePwdOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          onClick={() => { setChangePwdOpen(false); resetChangePwdForm() }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-blue-900/40 p-5"
            style={{ background: '#0b1220' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Cambiar contraseña</h3>
              <button
                type="button"
                onClick={() => { setChangePwdOpen(false); resetChangePwdForm() }}
                className="text-blue-300/50 hover:text-blue-200"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-blue-300/50 mb-4">
              Ingresa tu contraseña actual y la nueva contraseña (mínimo 8 caracteres).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-blue-300/60 mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    type={showCurrentPwd ? 'text' : 'password'}
                    className="w-full rounded-xl border border-blue-900/40 bg-[#060a14] px-3 py-2 pr-10 text-sm text-white outline-none focus:border-blue-500/60"
                  />
                  <PasswordVisibilityToggle
                    visible={showCurrentPwd}
                    onToggle={() => setShowCurrentPwd((v) => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300/60 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    type={showNewPwd ? 'text' : 'password'}
                    className="w-full rounded-xl border border-blue-900/40 bg-[#060a14] px-3 py-2 pr-10 text-sm text-white outline-none focus:border-blue-500/60"
                  />
                  <PasswordVisibilityToggle
                    visible={showNewPwd}
                    onToggle={() => setShowNewPwd((v) => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300/60 mb-1">Repetir nueva contraseña</label>
                <div className="relative">
                  <input
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="w-full rounded-xl border border-blue-900/40 bg-[#060a14] px-3 py-2 pr-10 text-sm text-white outline-none focus:border-blue-500/60"
                  />
                  <PasswordVisibilityToggle
                    visible={showConfirmPwd}
                    onToggle={() => setShowConfirmPwd((v) => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>

              {pwdMsg ? (
                <p className={`text-xs ${pwdIsError ? 'text-rose-400' : 'text-emerald-400'}`}>{pwdMsg}</p>
              ) : null}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pwdLoading ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
