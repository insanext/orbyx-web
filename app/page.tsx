"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function OrbyxLandingPage() {
const navItems = [
{ label: "Inicio", href: "/" },
{ label: "Funcionalidades", href: "#funcionalidades" },
{ label: "Soluciones", href: "#soluciones" },
{ label: "Ver planes", href: "/planes" },
];

return ( <main className="min-h-screen bg-[#050816] text-white"> <section className="relative overflow-hidden">

```
    {/* IMAGEN */}
    <div className="absolute inset-0">
      <Image
        src="/images/hero-orbyx-final.png"
        alt="Hero"
        fill
        priority
        className="object-cover object-right"
      />
    </div>

    {/* DEGRADADO IZQUIERDA */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#050816] via-[#050816]/90 to-transparent" />

    {/* NAV */}
    <div className="relative z-20 mx-auto max-w-[1400px] px-6 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-semibold">
          Orbyx
        </Link>

        <nav className="hidden lg:flex items-center gap-10 mx-auto">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="font-semibold text-white/90 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Iniciar sesión
        </Link>
      </header>
    </div>

    {/* CONTENIDO */}
    <div className="relative z-20 mx-auto max-w-[1400px] px-6 py-20">
      <div className="flex items-center min-h-[700px]">
        
        {/* TEXTO IZQUIERDA */}
        <div className="max-w-[650px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Automatiza todo por WhatsApp
          </div>

          <h1 className="mt-8 text-[60px] leading-[1] font-semibold">
            Orbyx trabaja por ti:
            <br />
            responde, agenda y
            <br />
            recupera clientes
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              automáticamente
            </span>
          </h1>

          <p className="mt-6 text-slate-300 text-lg">
            Automatiza respuestas, agenda y seguimiento sin esfuerzo.
          </p>

          <div className="mt-8 flex gap-4">
            <Link href="/register" className="bg-emerald-500 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
              Probar gratis
            </Link>

            <Link href="/planes" className="border border-white/30 px-6 py-3 rounded-xl hover:bg-white/10 transition">
              Ver planes
            </Link>
          </div>
        </div>

        {/* DERECHA (CHATS + CARDS) */}
        <div className="hidden lg:block relative w-full h-[500px]">

          {/* CARDS */}
          <div className="absolute top-10 right-20 flex gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              +24<br /><span className="text-xs">agendamientos</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              +21<br /><span className="text-xs">confirmaciones</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              +22<br /><span className="text-xs">reagendados</span>
            </div>
          </div>

          {/* CHAT 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute right-40 top-40 bg-green-500 text-black px-4 py-2 rounded-xl text-sm"
          >
            ¿Tienen horas mañana?
          </motion.div>

          {/* CHAT 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute right-60 top-60 bg-white/10 px-4 py-2 rounded-xl text-sm"
          >
            Sí, tengo 10:00 y 11:00
          </motion.div>

          {/* CHAT 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="absolute right-32 top-80 bg-green-500 text-black px-4 py-2 rounded-xl text-sm"
          >
            Reserva 11:00
          </motion.div>

          {/* CHAT 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute right-52 top-[420px] bg-white/10 px-4 py-2 rounded-xl text-sm"
          >
            Listo ✔️
          </motion.div>

        </div>
      </div>
    </div>
  </section>
</main>
```

);
}
