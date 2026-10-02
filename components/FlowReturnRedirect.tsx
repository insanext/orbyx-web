"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { consumeFlowReturn } from "@/lib/flow-return";

// Si el usuario cae en la home pública poco después de salir hacia Flow
// (botón "Volver" de Flow), lo devolvemos a su panel de facturación.
export default function FlowReturnRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;
    const referrer = document.referrer || "";
    const fromPaymentSite = /flow\.cl|transbank|webpay/i.test(referrer);
    // Sin referrer también vale (Flow puede ocultarlo); un referrer propio u
    // otro sitio significa que navegó él mismo a la home.
    if (referrer && !fromPaymentSite) return;
    const target = consumeFlowReturn();
    if (target) router.replace(target);
  }, [pathname, router]);

  return null;
}
