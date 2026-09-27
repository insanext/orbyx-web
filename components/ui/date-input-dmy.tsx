"use client";

import { CalendarDays } from "lucide-react";
import type { InputHTMLAttributes } from "react";

// El <input type="date"> nativo muestra la fecha en el orden que dicta el
// idioma del navegador (mm/dd/yyyy en un navegador en inglés). Este
// componente muestra SIEMPRE dd-mm-yyyy: pinta un texto propio y deja el
// input nativo transparente encima, así el valor (YYYY-MM-DD), onChange,
// min/max/required/disabled y el calendario del navegador siguen
// funcionando exactamente igual que antes.
//
// `className`/`style` son los mismos que tenía el <input> original: se
// aplican a la caja visible. Los `focus:` se convierten a `focus-within:`
// porque el foco lo recibe el input interno.
//
// Tailwind solo genera clases que ve escritas en el código: estas son las
// variantes focus-within que produce esa conversión para los campos que
// hoy usan este componente. Si un campo nuevo trae otro `focus:xxx`,
// agregar aquí su `focus-within:xxx`.
// focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500/50

type DateInputDMYProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & {
  value: string;
};

export function formatDateDMY(value?: string | null) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  return `${day}-${month}-${year}`;
}

export function DateInputDMY({
  value,
  className = "",
  style,
  placeholder = "dd-mm-aaaa",
  disabled,
  onClick,
  ...inputProps
}: DateInputDMYProps) {
  const display = formatDateDMY(value);

  return (
    <div
      className={`relative flex min-w-[8.5rem] items-center ${className.replace(/(^|\s)focus:/g, "$1focus-within:")}`}
      style={{ ...style, opacity: disabled ? 0.6 : style?.opacity }}
    >
      <span className="pointer-events-none min-w-0 flex-1 truncate" style={{ opacity: display ? 1 : 0.55 }}>
        {display || placeholder}
      </span>
      <CalendarDays aria-hidden="true" className="pointer-events-none ml-2 h-4 w-4 shrink-0 opacity-70" />
      <input
        {...inputProps}
        type="date"
        value={value}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          // Abre el calendario al hacer clic en cualquier parte de la caja
          // (sin esto, Chrome solo lo abre desde el ícono nativo, que acá
          // está oculto). showPicker puede lanzar en navegadores viejos.
          try {
            event.currentTarget.showPicker?.();
          } catch {
            /* el navegador igual permite editar con teclado */
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
