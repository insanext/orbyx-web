// Pantalla de bienvenida animada de la PWA instalada (se ve justo después
// del splash estático del sistema operativo, que es blanco con el ícono —
// background_color del manifest — por eso este fondo también es blanco).
//
// Es CSS puro, sin JS de React: el <div> se renderiza siempre oculto y
// solo se muestra si el script de arranque (PWA_BOOT_SCRIPT, en el <head>)
// agrega la clase "orbyx-welcome" al <html>. Eso pasa únicamente cuando la
// app corre instalada (display-mode standalone) y una vez por apertura
// (sessionStorage). La app real carga detrás mientras tanto; a los ~2 s
// la capa se desvanece y queda con visibility:hidden (no captura toques).

export const PWA_BOOT_SCRIPT = `(function(){try{
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__orbyxInstallPrompt=e;window.dispatchEvent(new Event('orbyx-install-available'));});
var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(s&&!sessionStorage.getItem('orbyx_welcome_shown')){sessionStorage.setItem('orbyx_welcome_shown','1');document.documentElement.classList.add('orbyx-welcome');}
}catch(e){}})();`;

// Las 3 piezas del isotipo (public/welcome/logo-{orbit,arc,crescent}.png)
// son capas recortadas del mismo lienzo 512x512 que public/orbyx-mark.png:
// sin transform quedan exactamente superpuestas y forman el logo original
// (verificado pixel a pixel), así que no hay fundido final — las piezas
// simplemente llegan a su lugar. Cada una entra desde un borde distinto
// con la misma curva ease-in-out y terminan juntas.
// Van como background-image (no <img>): un elemento con display:none no
// descarga su fondo, así el resto del sitio no paga estos bytes.
const WELCOME_CSS = `
#orbyx-welcome{display:none}
html.orbyx-welcome #orbyx-welcome{
  display:flex;position:fixed;inset:0;z-index:2147483000;overflow:hidden;
  flex-direction:column;align-items:center;justify-content:center;gap:22px;
  background:#ffffff;
  animation:ow-out .35s ease-in-out 1.7s forwards;
}
#orbyx-welcome .ow-mark{position:relative;width:156px;height:156px;animation:ow-settle .5s ease-in-out 1.2s both}
#orbyx-welcome .ow-piece{
  position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center;
  will-change:transform,opacity;
  animation:ow-join 1.2s cubic-bezier(.45,0,.2,1) both;
}
html.orbyx-welcome #orbyx-welcome .ow-orbit{background-image:url(/welcome/logo-orbit.png);--ow-from:translate(-72vw,18vh) rotate(-35deg) scale(1.25)}
html.orbyx-welcome #orbyx-welcome .ow-arc{background-image:url(/welcome/logo-arc.png);--ow-from:translate(62vw,-46vh) rotate(55deg) scale(.8);animation-delay:.06s}
html.orbyx-welcome #orbyx-welcome .ow-crescent{background-image:url(/welcome/logo-crescent.png);--ow-from:translate(48vw,52vh) rotate(-70deg) scale(.8);animation-delay:.12s;animation-duration:1.08s}
#orbyx-welcome .ow-text{
  margin:0;font-family:var(--font-dm-sans),system-ui,sans-serif;
  font-size:17px;font-weight:600;letter-spacing:-.01em;color:#0B1428;
  opacity:0;transform:translateY(8px);
  animation:ow-text-in .45s ease-in-out 1.05s forwards;
}
#orbyx-welcome .ow-text span{color:#1E6FD9}
@keyframes ow-join{
  0%{transform:var(--ow-from);opacity:0}
  25%{opacity:1}
  100%{transform:none;opacity:1}
}
@keyframes ow-settle{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes ow-text-in{to{opacity:1;transform:none}}
@keyframes ow-out{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){
  html.orbyx-welcome #orbyx-welcome{animation-delay:1s}
  #orbyx-welcome .ow-mark,#orbyx-welcome .ow-piece,#orbyx-welcome .ow-text{animation:none;opacity:1;transform:none}
}
`;

export default function WelcomeSplash() {
  return (
    <div id="orbyx-welcome" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: WELCOME_CSS }} />
      <div className="ow-mark">
        <div className="ow-piece ow-orbit" />
        <div className="ow-piece ow-arc" />
        <div className="ow-piece ow-crescent" />
      </div>
      <p className="ow-text">
        Orbyx, <span>tu agenda ordenada</span>
      </p>
    </div>
  );
}
