"use client";

import { Eye, EyeOff } from "lucide-react";

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  className = "",
}: {
  visible: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      className={`absolute inset-y-0 right-0 flex items-center pr-3 transition-colors ${className}`}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}
