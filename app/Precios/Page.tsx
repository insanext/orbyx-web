export default function Precios() {
  return (
    <main style={{fontFamily:"Arial", padding:"60px", maxWidth:"1000px", margin:"auto"}}>

      <h1 style={{fontSize:"42px", marginBottom:"40px"}}>
        Planes Orbyx
      </h1>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"30px"}}>

        <div style={{border:"1px solid #ddd", padding:"30px"}}>
          <h2>Starter</h2>
          <h3>$19.000 / mes</h3>
          <p>1 calendario</p>
          <p>Reservas automáticas</p>
          <p>Integración WhatsApp</p>
        </div>

        <div style={{border:"1px solid #ddd", padding:"30px"}}>
          <h2>Pro</h2>
          <h3>$39.000 / mes</h3>
          <p>Múltiples calendarios</p>
          <p>IA para agendamiento</p>
          <p>Cancelaciones automáticas</p>
        </div>

        <div style={{border:"1px solid #ddd", padding:"30px"}}>
          <h2>Enterprise</h2>
          <h3>$99.000 / mes</h3>
          <p>Multi sucursal</p>
          <p>API acceso</p>
          <p>Soporte prioritario</p>
        </div>

      </div>

    </main>
  )
}