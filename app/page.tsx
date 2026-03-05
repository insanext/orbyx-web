export default function Home() {
  return (
    <main style={{fontFamily:"Arial", padding:"60px", maxWidth:"900px", margin:"auto"}}>
      
      <h1 style={{fontSize:"48px", marginBottom:"20px"}}>
        Orbyx
      </h1>

      <p style={{fontSize:"20px", marginBottom:"40px"}}>
        Automatiza las reservas de tu negocio con IA y WhatsApp.
      </p>

      <h2>¿Qué hace Orbyx?</h2>
      <p>
        Orbyx conecta tu calendario con inteligencia artificial para que tus
        clientes puedan agendar citas automáticamente por WhatsApp o web.
      </p>

      <h2 style={{marginTop:"40px"}}>Cómo funciona</h2>

      <ol>
        <li>Conecta tu Google Calendar</li>
        <li>Define tus horarios disponibles</li>
        <li>Recibe reservas automáticas</li>
      </ol>

      <h2 style={{marginTop:"40px"}}>Planes</h2>

      <p><b>Start</b> — Negocios pequeños</p>
      <p><b>Pro</b> — Automatización completa</p>
      <p><b>Enterprise</b> — Multi sucursal</p>

      <div style={{marginTop:"40px"}}>
        <a href="https://app.orbyx.cl">
          <button style={{padding:"12px 24px", fontSize:"16px", cursor:"pointer"}}>
            Ir al panel
          </button>
        </a>
      </div>

    </main>
  )
}