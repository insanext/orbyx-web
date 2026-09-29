"use client";

import { createContext, useContext } from "react";
import type { AccountStatus } from "../components/billing/AccountStatusWidget";

// Estado de cuenta que dashboard/[slug]/layout.tsx YA carga una vez
// (useAccountStatus -> GET /billing/account-status) para el banner de
// prueba, el bloqueo y el botón Activaciones. Se expone por contexto para
// que las páginas lo reutilicen sin volver a pedirlo al backend.
// null mientras carga (o si falló).
const AccountStatusContext = createContext<AccountStatus | null>(null);

export function AccountStatusProvider({
  value,
  children,
}: {
  value: AccountStatus | null;
  children: React.ReactNode;
}) {
  return <AccountStatusContext.Provider value={value}>{children}</AccountStatusContext.Provider>;
}

export function useLayoutAccountStatus() {
  return useContext(AccountStatusContext);
}
