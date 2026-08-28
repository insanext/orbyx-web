'use client'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      if (!cancelled) setChecked(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [isLoginPage, getToken, router])

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
      <aside className="w-56 shrink-0 border-r border-blue-900/30 p-4">
        <h2 className="text-sm font-semibold text-white mb-6 px-2">Orbyx Admin</h2>
        <nav className="space-y-1">
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
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
