'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminViewTenantPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const slug = params.get('slug')

    if (!access_token || !refresh_token || !slug) {
      setError('Faltan datos de sesión. Vuelve a intentarlo desde la ficha del tenant.')
      return
    }

    // Limpia el hash de la URL cuanto antes para no dejar los tokens visibles.
    window.history.replaceState(null, '', window.location.pathname)

    const supabase = createClient()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message || 'No se pudo iniciar la sesión de vista.')
        return
      }
      router.replace(`/dashboard/${slug}`)
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0f1e' }}>
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-rose-300 mb-2">{error}</p>
            <button onClick={() => router.push('/admin/tenants')} className="text-sm text-blue-300/60 hover:text-blue-200">
              ← Volver al directorio
            </button>
          </>
        ) : (
          <p className="text-sm text-blue-300/50">Cargando dashboard del tenant...</p>
        )}
      </div>
    </div>
  )
}
