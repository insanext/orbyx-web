// Pantalla de bienvenida animada de la PWA instalada (se ve justo después
// del splash estático del sistema operativo, que es blanco con el ícono —
// background_color del manifest — por eso este fondo también es blanco).
//
// Es CSS puro, sin JS de React: el <div> se renderiza siempre oculto y
// solo se muestra si el script de arranque (PWA_BOOT_SCRIPT, en el <head>)
// agrega la clase "orbyx-welcome" al <html>. Eso pasa únicamente cuando la
// app corre instalada (display-mode standalone) y una vez por apertura
// (sessionStorage). La app real carga detrás mientras tanto; a los ~3,4 s
// la capa se desvanece y queda con visibility:hidden (no captura toques).

export const PWA_BOOT_SCRIPT = `(function(){try{
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__orbyxInstallPrompt=e;window.dispatchEvent(new Event('orbyx-install-available'));});
var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(s&&!sessionStorage.getItem('orbyx_welcome_shown')){sessionStorage.setItem('orbyx_welcome_shown','1');document.documentElement.classList.add('orbyx-welcome');}
}catch(e){}})();`;

// Las 3 piezas del isotipo (public/welcome/logo-{orbit,arc,crescent}.png)
// son capas recortadas del mismo lienzo 512x512 que public/orbyx-mark.png:
// sin transform quedan exactamente superpuestas y forman el logo original
// (verificado pixel a pixel).
//
// Continuidad con el splash del sistema: en Android 12+ el splash de la PWA
// es fondo blanco (background_color) + el ícono maskable a 240dp centrado;
// en icon-maskable-512 el logo mide 304/512 -> ~142px de ancho en pantalla.
// En orbyx-mark el logo ocupa 481/512 del lienzo, así que la caja de 152px
// deja el logo a ~143px: el PRIMER cuadro (logo armado, quieto, centrado,
// sin texto, fondo blanco) coincide con el splash y la animación "toma el
// control" desde ahí.
//
// Línea de tiempo (~3,4 s):
//   0 - 0,25 s   quieto, idéntico al splash
//   0,25 - 1,55  las piezas se separan hacia lados distintos y vuelven a
//                unirse en un solo movimiento continuo (ease-in-out)
//   1,3 - 1,8    el logo sube un poco y aparece "Orbyx, tu agenda ordenada"
//   1,8 - 3,05   estado final quieto (>1 s para leer la frase)
//   3,05 - 3,4   se desvanece
// Van como background-image (no <img>): un elemento con display:none no
// descarga su fondo, así el resto del sitio no paga estos bytes.
const WELCOME_CSS = `
#orbyx-welcome{display:none}
html.orbyx-welcome #orbyx-welcome{
  display:flex;position:fixed;inset:0;z-index:2147483000;overflow:hidden;
  align-items:center;justify-content:center;
  background:#ffffff;
  animation:ow-out .35s ease-in-out 3.05s forwards;
}
#orbyx-welcome .ow-stage{position:relative;animation:ow-lift .5s ease-in-out 1.3s both}
#orbyx-welcome .ow-mark{position:relative;width:152px;height:152px}
#orbyx-welcome .ow-piece{
  position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center;
  will-change:transform;
  animation:ow-regroup 1.3s cubic-bezier(.45,0,.25,1) .25s both;
}
html.orbyx-welcome #orbyx-welcome .ow-orbit{background-image:url(/welcome/logo-orbit.png);--ow-away:translate(-34vw,14vh) rotate(-28deg) scale(1.12)}
html.orbyx-welcome #orbyx-welcome .ow-arc{background-image:url(/welcome/logo-arc.png);--ow-away:translate(30vw,-20vh) rotate(38deg) scale(.9)}
html.orbyx-welcome #orbyx-welcome .ow-crescent{background-image:url(/welcome/logo-crescent.png);--ow-away:translate(22vw,22vh) rotate(-46deg) scale(.9)}
#orbyx-welcome .ow-text{
  position:absolute;top:100%;left:50%;margin:18px 0 0;white-space:nowrap;
  font-family:var(--font-dm-sans),system-ui,sans-serif;
  font-size:18px;font-weight:600;letter-spacing:-.01em;color:#0B1428;
  opacity:0;transform:translate(-50%,8px);
  animation:ow-text-in .5s ease-in-out 1.3s forwards;
}
#orbyx-welcome .ow-text span{color:#1E6FD9}
@keyframes ow-regroup{
  0%{transform:none}
  48%{transform:var(--ow-away)}
  100%{transform:none}
}
@keyframes ow-lift{to{transform:translateY(-22px)}}
@keyframes ow-text-in{to{opacity:1;transform:translate(-50%,0)}}
@keyframes ow-out{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){
  html.orbyx-welcome #orbyx-welcome{animation-delay:2.4s}
  #orbyx-welcome .ow-stage{animation:none;transform:translateY(-22px)}
  #orbyx-welcome .ow-piece{animation:none}
  #orbyx-welcome .ow-text{animation:none;opacity:1;transform:translate(-50%,0)}
}
`;

export default function WelcomeSplash() {
  return (
    <div id="orbyx-welcome" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: WELCOME_CSS }} />
      {/* El texto va en absoluto bajo el logo: así el logo queda centrado
          exacto en el primer cuadro (como el splash) y el texto no lo empuja. */}
      <div className="ow-stage">
        <div className="ow-mark">
          <div className="ow-piece ow-orbit" />
          <div className="ow-piece ow-arc" />
          <div className="ow-piece ow-crescent" />
        </div>
        <p className="ow-text">
          Orbyx, <span>tu agenda ordenada</span>
        </p>
      </div>
    </div>
  );
}
