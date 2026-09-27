// Pantalla de bienvenida animada de la PWA instalada (se ve justo después
// del splash estático del sistema operativo, que es blanco con el ícono —
// background_color del manifest — por eso este fondo también es blanco).
//
// Es CSS/SVG puro, sin JS de React: el <div> se renderiza siempre oculto y
// solo se muestra si el script de arranque (PWA_BOOT_SCRIPT, en el <head>)
// agrega la clase "orbyx-welcome" al <html>. Eso pasa únicamente cuando la
// app corre instalada (display-mode standalone) y una vez por apertura
// (sessionStorage). La app real carga detrás mientras tanto; a los ~1,9 s
// la capa se desvanece y queda con visibility:hidden (no captura toques).

export const PWA_BOOT_SCRIPT = `(function(){try{
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__orbyxInstallPrompt=e;window.dispatchEvent(new Event('orbyx-install-available'));});
var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(s&&!sessionStorage.getItem('orbyx_welcome_shown')){sessionStorage.setItem('orbyx_welcome_shown','1');document.documentElement.classList.add('orbyx-welcome');}
}catch(e){}})();`;

const WELCOME_CSS = `
#orbyx-welcome{display:none}
html.orbyx-welcome #orbyx-welcome{
  display:flex;position:fixed;inset:0;z-index:2147483000;
  flex-direction:column;align-items:center;justify-content:center;gap:20px;
  background:#ffffff;
  animation:ow-out .35s ease-in 1.55s forwards;
}
#orbyx-welcome .ow-mark{position:relative;width:150px;height:150px}
#orbyx-welcome .ow-mark svg,#orbyx-welcome .ow-mark img{position:absolute;inset:0;width:100%;height:100%}
#orbyx-welcome .ow-line{fill:none;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1}
#orbyx-welcome .ow-orbit{animation:ow-draw .85s cubic-bezier(.65,0,.35,1) forwards}
#orbyx-welcome .ow-planet{animation:ow-draw .75s cubic-bezier(.65,0,.35,1) .15s forwards}
#orbyx-welcome svg{animation:ow-fade-out .25s ease .95s forwards}
#orbyx-welcome img{opacity:0;animation:ow-fade-in .3s ease .85s forwards}
#orbyx-welcome .ow-text{
  margin:0;font-family:var(--font-dm-sans),system-ui,sans-serif;
  font-size:17px;font-weight:600;letter-spacing:-.01em;color:#0B1428;
  opacity:0;transform:translateY(6px);
  animation:ow-text-in .4s ease .7s forwards;
}
#orbyx-welcome .ow-text span{color:#1E6FD9}
@keyframes ow-draw{to{stroke-dashoffset:0}}
@keyframes ow-fade-in{to{opacity:1}}
@keyframes ow-fade-out{to{opacity:0}}
@keyframes ow-text-in{to{opacity:1;transform:none}}
@keyframes ow-out{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){
  html.orbyx-welcome #orbyx-welcome{animation-delay:.9s}
  #orbyx-welcome svg{display:none}
  #orbyx-welcome img,#orbyx-welcome .ow-text{animation:none;opacity:1;transform:none}
}
`;

export default function WelcomeSplash() {
  return (
    <div id="orbyx-welcome" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: WELCOME_CSS }} />
      <div className="ow-mark">
        {/* Trazo simplificado del isotipo (órbita + planeta) sobre la
            misma caja 512x512 que public/orbyx-mark.png, que aparece
            encima al terminar el dibujo. */}
        <svg viewBox="0 0 512 512">
          <defs>
            <linearGradient id="ow-planet-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0B1F4B" />
              <stop offset="1" stopColor="#1E6FD9" />
            </linearGradient>
          </defs>
          <path
            className="ow-line ow-planet"
            pathLength={1}
            d="M340.8 315.4 A125 125 0 1 1 365.7 202.6"
            stroke="url(#ow-planet-grad)"
            strokeWidth={30}
          />
          <path
            className="ow-line ow-orbit"
            pathLength={1}
            d="M35.2 342.4 A235 78 -20 1 1 476.8 181.6 A235 78 -20 1 1 35.2 342.4"
            stroke="#0B1F4B"
            strokeWidth={22}
          />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/orbyx-mark.png" alt="" />
      </div>
      <p className="ow-text">
        Orbyx, <span>tu agenda ordenada</span>
      </p>
    </div>
  );
}
