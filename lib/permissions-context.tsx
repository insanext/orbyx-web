"use client";

import { createContext, useContext } from "react";

export type ModuleAccess = false | "view" | "edit";
export type ModulePermissions = Record<string, ModuleAccess>;

type PermissionsContextValue = {
  role: string;
  permissions: ModulePermissions | null;
  loaded: boolean;
  isOwnerOrAdmin: boolean;
};

const defaultValue: PermissionsContextValue = {
  role: "",
  permissions: null,
  loaded: false,
  isOwnerOrAdmin: true,
};

const PermissionsContext = createContext<PermissionsContextValue>(defaultValue);

export const ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  operator: "Operador",
  branch: "Sucursal",
  readonly: "Solo lectura",
  staff: "Staff",
  manager: "Manager",
};

export function PermissionsProvider({
  value,
  children,
}: {
  value: PermissionsContextValue;
  children: React.ReactNode;
}) {
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

// Mismo criterio que requireWriteAccess en server.js: owner/admin siempre
// pueden todo; si el módulo no tiene entrada en permissions, no se restringe
// (cuentas legacy sin permisos granulares configurados).
export function usePermissions() {
  const ctx = useContext(PermissionsContext);

  function getModuleAccess(moduleKey: string): ModuleAccess {
    if (ctx.isOwnerOrAdmin) return "edit";
    const value = ctx.permissions ? ctx.permissions[moduleKey] : undefined;
    if (value === undefined || value === null) return "edit";
    return value;
  }

  function canEdit(moduleKey: string) {
    return getModuleAccess(moduleKey) === "edit";
  }

  function canView(moduleKey: string) {
    return getModuleAccess(moduleKey) !== false;
  }

  return { ...ctx, getModuleAccess, canEdit, canView };
}
