"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ButtonHTMLAttributes, ChangeEvent, CSSProperties, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// Select reutilizable de Orbyx.
//
// Reemplazo directo de <select>: se usa igual (`<Select value onChange>` con
// <option>/<optgroup> como hijos) y `onChange` recibe un evento con
// `e.target.value`, así que los formularios existentes no cambian.
//
// - El menú es propio (no el desplegable nativo del navegador): usa las
//   variables del tema (clasico/nocturno) y se ve bien en claro y oscuro:
//   fondo, opción con el mouse encima, opción seleccionada (con check) y
//   opción deshabilitada.
// - Teclado: flechas, Home/End, Enter/Espacio, Escape, Tab y escribir para
//   saltar a una opción. Clic afuera lo cierra.
// - El menú se dibuja en un portal (position: fixed): no lo corta ningún
//   panel/modal con overflow ni scroll interno.
// - Celular: se abre como hoja inferior con opciones grandes.
// - `name` / `required` se conservan con un <select> nativo oculto, para que
//   la validación y el envío de formularios sigan funcionando.

type SelectProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "defaultValue" | "children" | "type"
> & {
  value?: string | number | null;
  defaultValue?: string | number | null;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  required?: boolean;
  children?: ReactNode;
  // Clases extra para el menú desplegable (opcional).
  menuClassName?: string;
  // Oculta la flecha propia (cuando el contenedor ya dibuja una). También se
  // oculta sola si el control usa appearance-none / appearance: none.
  hideChevron?: boolean;
};

type OptionItem = {
  kind: "option";
  key: string;
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
};
type GroupItem = { kind: "group"; key: string; label: string };
type ListItem = OptionItem | GroupItem;

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children);
  return "";
}

// Convierte <option>/<optgroup> (incluye fragments y arrays del .map) en una lista plana.
function parseChildren(children: ReactNode, out: ListItem[] = [], prefix = "o"): ListItem[] {
  Children.toArray(children).forEach((child, i) => {
    if (!isValidElement(child)) return;
    const key = `${prefix}-${i}`;
    const el = child as ReactElement<{
      value?: string | number;
      disabled?: boolean;
      label?: string;
      children?: ReactNode;
    }>;

    if (el.type === Fragment) {
      parseChildren(el.props.children, out, key);
      return;
    }
    if (el.type === "optgroup") {
      out.push({ kind: "group", key, label: String(el.props.label ?? "") });
      parseChildren(el.props.children, out, key);
      return;
    }
    if (el.type === "option") {
      const text = nodeText(el.props.children);
      const value = el.props.value !== undefined ? String(el.props.value) : text;
      out.push({
        kind: "option",
        key,
        value,
        label: el.props.children ?? text,
        text,
        disabled: Boolean(el.props.disabled),
      });
    }
  });
  return out;
}

// ---- tono claro/oscuro del control (para que el menú combine con la pantalla)
function parseRgb(color: string): { r: number; g: number; b: number; a: number } | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

function detectTone(el: HTMLElement): "light" | "dark" {
  let node: HTMLElement | null = el;
  while (node) {
    // El CSS global anima background-color: se lee sin transición para obtener
    // el color final y no uno intermedio (p. ej. recién cambiado el tema).
    const prevTransition = node.style.transition;
    node.style.transition = "none";
    const bg = getComputedStyle(node).backgroundColor;
    node.style.transition = prevTransition;
    const rgb = parseRgb(bg);
    if (rgb && rgb.a > 0.5) {
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      return lum < 0.5 ? "dark" : "light";
    }
    node = node.parentElement;
  }
  return "light";
}

function themeTone(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "nocturno" ? "dark" : "light";
}

const MENU_GAP = 6;
const EDGE = 8;

export default function Select({
  value,
  defaultValue,
  onChange,
  name,
  required,
  children,
  className = "",
  style,
  disabled,
  id,
  menuClassName = "",
  hideChevron = false,
  onKeyDown,
  onClick,
  ...rest
}: SelectProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef<{ text: string; t: number }>({ text: "", t: 0 });

  const [openState, setOpen] = useState(false);
  // Si el control se deshabilita mientras está abierto, se considera cerrado.
  const open = openState && !disabled;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue === undefined || defaultValue === null ? "" : String(defaultValue)
  );
  const [placement, setPlacement] = useState<{
    sheet: boolean;
    top?: number;
    bottom?: number;
    left?: number;
    width?: number;
    maxHeight?: number;
    tone: "light" | "dark";
    force: boolean;
  } | null>(null);

  const controlled = value !== undefined;
  const currentValue = controlled ? (value === null ? "" : String(value)) : internalValue;

  const items = useMemo(() => parseChildren(children), [children]);
  const options = useMemo(() => items.filter((i): i is OptionItem => i.kind === "option"), [items]);

  // Igual que el <select> nativo: si el valor no calza con ninguna opción, se
  // muestra la primera.
  const selected = options.find((o) => o.value === currentValue) ?? options[0] ?? null;

  const noChevron =
    hideChevron ||
    /\bappearance-none\b/.test(className) ||
    (style as (CSSProperties & { appearance?: string }) | undefined)?.appearance === "none";

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  function emitChange(next: string) {
    if (!controlled) setInternalValue(next);
    if (next === currentValue) return;
    const target = { value: next, name: name ?? "", id: id ?? "" };
    onChange?.({
      target,
      currentTarget: target,
      type: "change",
      preventDefault() {},
      stopPropagation() {},
    } as unknown as ChangeEvent<HTMLSelectElement>);
  }

  function openMenu() {
    if (disabled || options.length === 0) return;
    const idx = options.findIndex((o) => o.value === selected?.value && !o.disabled);
    setActiveIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));
    setOpen(true);
  }

  function chooseOption(opt: OptionItem) {
    if (opt.disabled) return;
    emitChange(opt.value);
    closeMenu(true);
  }

  function moveActive(delta: 1 | -1, from = activeIndex) {
    if (options.length === 0) return;
    let i = from;
    for (let step = 0; step < options.length; step++) {
      i = (i + delta + options.length) % options.length;
      if (!options[i].disabled) {
        setActiveIndex(i);
        return;
      }
    }
  }

  function jumpTo(edge: "first" | "last") {
    const list = edge === "first" ? options : [...options].reverse();
    const found = list.find((o) => !o.disabled);
    if (found) setActiveIndex(options.indexOf(found));
  }

  function handleTypeahead(char: string) {
    const now = Date.now();
    const state = typeaheadRef.current;
    state.text = now - state.t > 700 ? char : state.text + char;
    state.t = now;
    const q = state.text.toLowerCase();
    const start = Math.max(activeIndex, 0);
    const ordered = [...options.slice(start + (q.length === 1 ? 1 : 0)), ...options.slice(0, start + (q.length === 1 ? 1 : 0))];
    const hit = ordered.find((o) => !o.disabled && o.text.toLowerCase().startsWith(q));
    if (!hit) return;
    const idx = options.indexOf(hit);
    if (open) setActiveIndex(idx);
    else emitChange(hit.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) handleTypeahead(e.key);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        e.preventDefault();
        jumpTo("first");
        break;
      case "End":
        e.preventDefault();
        jumpTo("last");
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) chooseOption(opt);
        else closeMenu(true);
        break;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeMenu(true);
        break;
      case "Tab":
        closeMenu(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) handleTypeahead(e.key);
    }
  }

  // Posición del menú (debajo del control; arriba si no cabe; hoja inferior en celular).
  const computePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const tone = detectTone(trigger);
    const force = tone !== themeTone();

    if (window.matchMedia("(max-width: 639px)").matches) {
      setPlacement({ sheet: true, tone, force });
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const width = Math.min(Math.max(rect.width, 180), vw - EDGE * 2);
    const left = Math.max(EDGE, Math.min(rect.left, vw - width - EDGE));
    const spaceBelow = vh - rect.bottom - EDGE - MENU_GAP;
    const spaceAbove = rect.top - EDGE - MENU_GAP;
    const wanted = Math.min(320, menuRef.current?.scrollHeight ?? 320);
    const openUp = spaceBelow < Math.min(wanted, 200) && spaceAbove > spaceBelow;

    setPlacement(
      openUp
        ? { sheet: false, bottom: vh - rect.top + MENU_GAP, left, width, maxHeight: Math.min(320, spaceAbove), tone, force }
        : { sheet: false, top: rect.bottom + MENU_GAP, left, width, maxHeight: Math.min(320, spaceBelow), tone, force }
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePlacement();
  }, [open, computePlacement, options.length]);

  // Cerrar al hacer clic/tocar afuera; reposicionar al hacer scroll/resize.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onScrollOrResize(e: Event) {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      computePlacement();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, computePlacement]);

  // Mantener visible la opción activa.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = menuRef.current?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, placement]);

  const activeId = open && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined;

  // Índice de cada opción (sin grupos) para ids, teclado y resaltado.
  const optionIndexByKey = new Map(options.map((o, i) => [o.key, i] as const));

  return (
    <>
      <button
        {...rest}
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeId}
        aria-required={required || undefined}
        disabled={disabled}
        data-no-busy="true"
        className={`orbyx-select-trigger no-press ${className}`}
        style={style}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          if (open) closeMenu(false);
          else openMenu();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="orbyx-select-value min-w-0 flex-1 truncate text-left">
          {selected ? selected.label : " "}
        </span>
        {noChevron ? null : (
          <ChevronDown
            aria-hidden="true"
            className={`orbyx-select-chevron h-4 w-4 shrink-0 opacity-70 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Select nativo oculto SOLO si hay name/required: conserva la validación
          y el envío de formularios. El foco se reenvía al control visible. */}
      {name || required ? (
        <select
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          name={name}
          required={required}
          disabled={disabled}
          value={currentValue}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
        >
          {options.map((o) => (
            <option key={o.key} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      ) : null}

      {open && placement && typeof document !== "undefined"
        ? createPortal(
            <>
              {placement.sheet ? (
                <div
                  className="fixed inset-0 z-[10000] bg-slate-950/50"
                  data-orbyx-select-menu="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeMenu(false);
                  }}
                />
              ) : null}
              <div
                ref={menuRef}
                id={listId}
                role="listbox"
                aria-label={rest["aria-label"]}
                data-orbyx-select-menu="true"
                data-tone={placement.tone}
                data-force={placement.force ? "true" : "false"}
                data-sheet={placement.sheet ? "true" : "false"}
                className={`orbyx-select-menu z-[10001] overflow-y-auto ${menuClassName}`}
                style={{
                  position: "fixed",
                  colorScheme: placement.tone,
                  ...(placement.sheet
                    ? { left: 0, right: 0, bottom: 0, maxHeight: "60vh" }
                    : {
                        left: placement.left,
                        width: placement.width,
                        top: placement.top,
                        bottom: placement.bottom,
                        maxHeight: placement.maxHeight,
                      }),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                {items.map((item) => {
                  if (item.kind === "group") {
                    return (
                      <div key={item.key} className="orbyx-select-group" role="presentation">
                        {item.label}
                      </div>
                    );
                  }
                  const idx = optionIndexByKey.get(item.key) ?? -1;
                  const isSelected = item.value === selected?.value;
                  return (
                    <div
                      key={item.key}
                      id={`${uid}-opt-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={item.disabled || undefined}
                      data-option-index={idx}
                      data-active={idx === activeIndex ? "true" : "false"}
                      data-selected={isSelected ? "true" : "false"}
                      className="orbyx-select-option"
                      onMouseEnter={() => !item.disabled && setActiveIndex(idx)}
                      onClick={() => chooseOption(item)}
                    >
                      <span className="min-w-0 flex-1 break-words">{item.label}</span>
                      {isSelected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                    </div>
                  );
                })}
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
