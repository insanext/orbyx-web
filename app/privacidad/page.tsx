"use client";

import type { ReactNode } from "react";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

// Fecha real de publicación de esta versión (3.0), fijada al momento del deploy.
const FECHA_PUBLICACION = "10 de septiembre de 2026";

type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "table"; headers: string[]; rows: string[][] }
  | { t: "hr" };

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-[var(--pub-text)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

const content: Block[] = [
  { t: "h2", text: "Resumen breve" },
  { t: "p", text: "Antes del detalle, lo esencial en pocas líneas:" },
  {
    t: "ul",
    items: [
      "Orbyx es una plataforma que los negocios usan para gestionar sus reservas y sus clientes.",
      "Respecto de los datos de **tu negocio**, Orbyx es responsable. Respecto de los datos de **los clientes de ese negocio**, el responsable es el negocio; Orbyx solo provee la tecnología y procesa esos datos siguiendo sus instrucciones.",
      "Si eres cliente de un negocio que usa Orbyx y quieres ejercer tus derechos, debes dirigirte **a ese negocio**.",
      "No vendemos datos personales.",
      "La plataforma puede almacenar datos de salud cuando el negocio pertenece a un rubro clínico o veterinario. Esos datos reciben protección reforzada.",
      "Orbyx no utiliza inteligencia artificial para tratar datos personales. Si lo hace en el futuro, actualizará esta política antes de activarla.",
    ],
  },
  { t: "p", text: "Este resumen no reemplaza el texto completo." },
  { t: "hr" },

  { t: "h2", text: "1. Identificación del responsable" },
  {
    t: "table",
    headers: ["", ""],
    rows: [
      ["**Razón social**", "Orbyx Soluciones Digitales SpA"],
      ["**RUT**", "78.453.137-6"],
      ["**Domicilio**", "Pje. 21 N° 511, Talcahuano, Región del Biobío"],
      ["**Correo para materias de privacidad**", "contacto@orbyx.cl"],
      ["**Sitio web**", "orbyx.cl"],
    ],
  },
  {
    t: "p",
    text: "Todas las solicitudes, consultas y reclamos relacionados con esta política deben dirigirse a **contacto@orbyx.cl**.",
  },
  { t: "hr" },

  { t: "h2", text: "2. Alcance de esta política" },
  { t: "h3", text: "2.1 Qué es Orbyx" },
  {
    t: "p",
    text: "Orbyx es una plataforma de software como servicio (SaaS) que permite a negocios de servicios gestionar su agenda, sus reservas, sus clientes, sus comunicaciones y su información operacional. Está diseñada para rubros como peluquerías, barberías, centros de estética, veterinarias, clínicas, centros médicos, centros dentales, profesionales de la salud, talleres mecánicos y otros negocios de servicios.",
  },
  { t: "h3", text: "2.2 A quiénes aplica" },
  {
    t: "ul",
    items: [
      "**Negocios clientes**: empresas o profesionales que contratan la plataforma.",
      "**Clientes finales**: personas que reservan una hora o son registradas en el sistema por el negocio que las atiende.",
      "**Visitantes** del sitio web de Orbyx.",
    ],
  },
  { t: "h3", text: "2.3 Arquitectura multi-negocio" },
  {
    t: "p",
    text: "Cada negocio que usa Orbyx opera dentro de un entorno separado del de los demás: a través de la plataforma, un negocio no puede acceder a los clientes, reservas ni información de otro negocio. Este aislamiento es un principio central del diseño de Orbyx y una de sus medidas de seguridad fundamentales (ver sección 17).",
  },
  { t: "hr" },

  { t: "h2", text: "3. Definiciones" },
  {
    t: "ul",
    items: [
      "**Dato personal**: cualquier información vinculada o referida a una persona natural identificada o identificable.",
      "**Dato personal sensible**: aquel que revela, entre otros, datos relativos a la salud, al perfil biológico humano o datos biométricos.",
      "**Titular**: la persona natural a quien se refieren los datos.",
      "**Responsable de datos**: quien decide sobre los fines y medios del tratamiento.",
      "**Encargado del tratamiento**: quien trata datos conforme al encargo y a las instrucciones del responsable, sin decidir las finalidades por su cuenta.",
      "**Tratamiento**: cualquier operación realizada sobre datos personales.",
      "**Anonimización**: procedimiento irreversible por el cual un dato ya no puede vincularse a una persona determinada.",
      "**Negocio (o tenant)**: empresa o profesional que contrata Orbyx.",
      "**Cliente final**: persona atendida por un negocio que usa Orbyx.",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "4. ¿Qué datos recopilamos?" },
  {
    t: "p",
    text: "Las categorías efectivamente tratadas dependen del rubro del negocio, el plan contratado y las funcionalidades que ese negocio decida utilizar. No todos los datos listados se solicitan siempre.",
  },
  { t: "h3", text: "4.1 Datos de negocios clientes y su personal" },
  {
    t: "p",
    text: "Identificación (nombre, RUT, razón social), contacto (correo, teléfono), configuración del negocio (servicios, precios, horarios, sucursales, staff), rol y permisos dentro del panel de administración, datos de suscripción y facturación, y credenciales de acceso almacenadas mediante mecanismos de protección.",
  },
  { t: "h3", text: "4.2 Datos de clientes finales" },
  {
    t: "table",
    headers: ["Categoría", "Ejemplos"],
    rows: [
      ["Identificación", "Nombre, apellido, RUT, fecha de nacimiento"],
      ["Contacto", "Teléfono, correo electrónico, dirección"],
      ["Agenda y reservas", "Historial de citas, horarios, profesional asignado, estado"],
      ["Comerciales", "Historial de servicios, preferencias, notas internas del negocio"],
      ["Mascotas", "Especie, raza, edad, historial, vinculados a su tutor"],
      ["Salud (según rubro)", "Fichas clínicas veterinarias, fichas médicas, notas clínicas"],
      ["Archivos", "Fotografías, documentos y comprobantes de transferencia cargados por el cliente o el negocio"],
      ["Otros", "Campos configurables que el negocio decida incorporar"],
    ],
  },
  { t: "h3", text: "4.3 Datos técnicos" },
  {
    t: "p",
    text: "Dirección IP, tipo de dispositivo y navegador, y registros de acceso necesarios para seguridad, prevención de fraude y diagnóstico técnico.",
  },
  { t: "hr" },

  { t: "h2", text: "5. Cómo obtenemos estos datos" },
  {
    t: "p",
    text: "Los datos descritos se obtienen directamente de los negocios y de los clientes finales cuando completan formularios en la plataforma (registro, reserva, ficha de cliente, campos personalizados, carga de archivos), o de forma automática cuando usan funcionalidades del sistema (por ejemplo, el registro de una reserva o el envío de un mensaje de WhatsApp asociado a ella).",
  },
  { t: "hr" },

  { t: "h2", text: "6. Finalidades del tratamiento" },
  { t: "h3", text: "6.1 Como responsable" },
  {
    t: "p",
    text: "Crear, administrar y dar soporte a cuentas de negocios; prestar el servicio contratado; gestionar suscripciones, cobros y facturación; mantener la seguridad de la plataforma y prevenir fraude; diagnosticar y resolver errores técnicos; mantener respaldos y continuidad operacional; comunicar información sobre el servicio; mejorar la plataforma; generar estadísticas agregadas o anonimizadas; y cumplir obligaciones legales y contractuales.",
  },
  { t: "h3", text: "6.2 Como encargado, por cuenta del negocio" },
  {
    t: "p",
    text: "Gestión de agenda y reservas, gestión de la base de clientes del negocio, administración de staff y servicios, historiales de atención, envío de confirmaciones y recordatorios, comunicación del negocio con sus clientes, campañas de recuperación y comunicaciones comerciales del negocio.",
  },
  { t: "h3", text: "6.3 Lo que Orbyx no hace" },
  {
    t: "p",
    text: "No vendemos datos personales. No usamos los datos de clientes finales de un negocio para promocionar Orbyx a esas personas. No usamos datos de un negocio para beneficiar a otro negocio. No usamos información clínica para finalidades ajenas al servicio.",
  },
  { t: "hr" },

  { t: "h2", text: "7. Fundamento jurídico" },
  {
    t: "p",
    text: "Según el caso, el tratamiento se fundamenta en la ejecución del contrato de servicio (relación con el negocio), el consentimiento del titular cuando la ley lo exija (libre, informado y revocable en cualquier momento), el cumplimiento de obligaciones legales (tributarias, contables), u otras bases de licitud contempladas en la legislación aplicable.",
  },
  {
    t: "p",
    text: "Respecto de los datos de clientes finales, es el negocio quien debe determinar y poder acreditar el fundamento jurídico del tratamiento e informar adecuadamente a sus propios clientes.",
  },
  { t: "hr" },

  { t: "h2", text: "8. Rol de Orbyx: responsable vs. encargado del tratamiento" },
  { t: "p", text: "Esta sección determina a quién debes dirigirte para ejercer tus derechos." },
  {
    t: "p",
    text: "**Cuando Orbyx es responsable**: respecto de los datos de cuenta del negocio, sus comunicaciones con Orbyx, sus datos de suscripción/facturación, y de los visitantes del sitio web de Orbyx, es Orbyx quien decide las finalidades y medios del tratamiento.",
  },
  {
    t: "p",
    text: "**Cuando Orbyx es encargado**: respecto de los datos que un negocio incorpora sobre sus propios clientes finales, el negocio es el responsable y decide qué datos pide, para qué los usa y con qué fundamento. Orbyx provee la herramienta y procesa esos datos siguiendo ese encargo, sin decidir por el negocio qué clientes debe tener ni qué información debe registrar.",
  },
  {
    t: "p",
    text: "En su rol de encargado, Orbyx: trata los datos únicamente conforme al encargo y las instrucciones del negocio; no los usa para un objeto distinto; no los cede a terceros sin autorización del negocio, salvo mandato legal; mantiene el deber de confidencialidad incluso después de terminada la relación; adopta medidas de seguridad razonables; informa al negocio ante cualquier vulneración que afecte sus datos (sección 19); y, al término del servicio, suprime o devuelve los datos según corresponda.",
  },
  {
    t: "p",
    text: "Si Orbyx tratara los datos con un objeto distinto del encargo o los cediera sin autorización, la ley lo consideraría responsable para todos los efectos legales — por eso limitamos nuestros tratamientos a las finalidades del servicio contratado.",
  },
  {
    t: "p",
    text: "La relación entre Orbyx y cada negocio se complementa con los Términos de Servicio y, cuando corresponda, un Acuerdo de Tratamiento de Datos (DPA), disponible solicitándolo a contacto@orbyx.cl.",
  },
  { t: "hr" },

  { t: "h2", text: "9. Datos sensibles y datos relativos a la salud" },
  {
    t: "p",
    text: "La plataforma puede almacenar datos personales sensibles, en particular datos de salud, cuando el negocio pertenece a un rubro clínico o veterinario. La ley chilena somete estos datos a un régimen más estricto.",
  },
  {
    t: "p",
    text: "El negocio decide qué información de salud recopila, con qué finalidad y bajo qué fundamento jurídico, y debe cumplir las exigencias reforzadas que le correspondan respecto de sus propios pacientes o clientes.",
  },
  {
    t: "p",
    text: "Orbyx procesa esa información únicamente para las funcionalidades contratadas (fichas, historial de atención, agenda y adjuntos), no la usa para fines incompatibles con el servicio, y no la comercializa ni la cede con fines publicitarios o de perfilamiento.",
  },
  {
    t: "p",
    text: "Un punto que suele pasarse por alto: en rubros de salud, el solo hecho de que una persona tenga una hora agendada con un profesional puede constituir por sí mismo un dato relativo a la salud, aunque no se acceda a ninguna ficha clínica. Por eso las comunicaciones automáticas en estos rubros se manejan con criterio conservador (sección 11), y recomendamos a estos negocios revisar el contenido de los mensajes que envían a sus pacientes.",
  },
  { t: "hr" },

  { t: "h2", text: "10. Niños, niñas y adolescentes" },
  {
    t: "p",
    text: "Orbyx puede ser utilizado por negocios cuyos clientes finales sean menores de edad. Con transparencia: Orbyx no cuenta con un mecanismo universal que verifique automáticamente la edad de cada persona registrada por un negocio. Corresponde al negocio cliente determinar cuándo trata datos de menores de edad y obtener las autorizaciones de sus padres, madres o representantes legales cuando la ley lo exija.",
  },
  {
    t: "p",
    text: "Cuando Orbyx tenga conocimiento de que trata datos de un menor de edad, aplicará las salvaguardas correspondientes. Los datos sensibles de menores reciben protección especialmente reforzada, y la legislación aplicable contempla obligaciones adicionales de notificación cuando una vulneración de seguridad afecta a niños y niñas menores de catorce años.",
  },
  { t: "hr" },

  { t: "h2", text: "11. Comunicaciones por WhatsApp y correo electrónico" },
  {
    t: "p",
    text: "Orbyx permite a los negocios enviar a sus clientes confirmaciones de reserva, recordatorios, avisos de cambio de horario, cancelaciones y otras comunicaciones vinculadas al servicio, por correo electrónico y, cuando el negocio lo habilita, por WhatsApp.",
  },
  {
    t: "p",
    text: "Para WhatsApp, Orbyx utiliza la plataforma WhatsApp Business operada por Meta, a través de Twilio como proveedor tecnológico. Estos mensajes se envían mediante plantillas fijas, previamente aprobadas por Meta, completando automáticamente variables como nombre, fecha, hora o negocio.",
  },
  {
    t: "p",
    text: "Un mensaje enviado a un teléfono puede ser visto por quien tenga acceso a ese dispositivo. En rubros de salud, un recordatorio que identifique la especialidad o el motivo de la atención puede revelar información sensible; por eso recomendamos a los negocios de estos rubros usar contenidos genéricos y aplicamos un criterio conservador en las plantillas utilizadas.",
  },
  {
    t: "p",
    text: "Los clientes finales pueden responder a estos mensajes; esas respuestas llegan al canal de WhatsApp del negocio y son gestionadas por él. Orbyx no almacena de forma permanente el contenido de las conversaciones de WhatsApp entre un negocio y sus clientes, y no utiliza inteligencia artificial ni chatbots para generar o responder estas comunicaciones (ver sección 13).",
  },
  { t: "hr" },

  { t: "h2", text: "12. Marketing y campañas" },
  {
    t: "p",
    text: "Orbyx entrega la herramienta que permite a un negocio enviar campañas, promociones y mensajes de recuperación a sus propios clientes. El negocio es el único responsable de la legitimidad de la campaña, su contenido, la selección de destinatarios, contar con las autorizaciones que la ley exija y respetar las solicitudes de desuscripción. Orbyx no revisa ni aprueba previamente el contenido de las campañas, sin perjuicio de poder actuar frente a usos manifiestamente ilícitos o abusivos de la plataforma.",
  },
  {
    t: "p",
    text: "Orbyx también puede enviar a sus negocios clientes comunicaciones sobre el funcionamiento del servicio, soporte, seguridad, cambios en planes o en esta política, y novedades de producto. Las comunicaciones comerciales incluyen mecanismo de desuscripción; los avisos esenciales de servicio, seguridad o cambios contractuales no son desuscribibles mientras la cuenta esté activa.",
  },
  { t: "hr" },

  { t: "h2", text: "13. Automatización e inteligencia artificial" },
  {
    t: "p",
    text: "Orbyx no utiliza inteligencia artificial para generar, interpretar o responder comunicaciones con clientes finales, ni para tomar decisiones automatizadas sobre las personas. Las funcionalidades automatizadas actuales (como el envío de recordatorios) se basan en reglas y eventos predefinidos, no en modelos de inteligencia artificial.",
  },
  {
    t: "p",
    text: "Si en el futuro Orbyx incorporara este tipo de tecnología, actualizará esta política de forma previa para informarlo adecuadamente, antes de su implementación.",
  },
  { t: "hr" },

  { t: "h2", text: "14. Pagos y comprobantes de depósito" },
  {
    t: "p",
    text: "Las suscripciones de los negocios a Orbyx se procesan a través de Flow, nuestra pasarela de pagos. Orbyx no almacena directamente números completos de tarjetas; ese procesamiento lo realiza Flow conforme a sus propias políticas de seguridad.",
  },
  {
    t: "p",
    text: "Algunos negocios pueden solicitar a sus clientes finales el pago de un anticipo o depósito para confirmar una reserva. En esos casos, el cliente final puede cargar en la plataforma un comprobante de la transferencia realizada directamente al negocio, quien lo revisa, aprueba o rechaza. Orbyx no es intermediario financiero de esa transferencia: únicamente facilita la carga y visualización del comprobante entre el cliente final y el negocio.",
  },
  { t: "hr" },

  { t: "h2", text: "15. Proveedores y terceros que pueden tratar datos" },
  {
    t: "table",
    headers: ["Proveedor", "Uso"],
    rows: [
      ["**Supabase**", "Base de datos, autenticación de usuarios y almacenamiento de archivos"],
      ["**Vercel**", "Alojamiento del sitio y la aplicación web"],
      ["**Render**", "Alojamiento del servidor/backend"],
      ["**Twilio**", "Proveedor tecnológico (BSP) para el envío de mensajes de WhatsApp"],
      ["**Meta / WhatsApp Business Platform**", "Plataforma de mensajería para comunicaciones relacionadas con reservas"],
      ["**Flow**", "Procesamiento de pagos de suscripciones"],
      ["**Google Calendar** (integración opcional)", "Sincronización de agenda por profesional, mediante OAuth, solo si el profesional la habilita"],
      ["**Google Maps**", "Visualización del mapa de ubicación en la página pública del negocio"],
      ["**Cloudflare Turnstile**", "Protección contra bots y uso abusivo en determinados formularios"],
      ["**Resend / Zoho Mail**", "Envío de correos transaccionales (confirmaciones, notificaciones, recuperación de contraseña)"],
    ],
  },
  {
    t: "p",
    text: "Estos proveedores pueden actuar como encargados o subencargados tecnológicos. Orbyx procura que queden sujetos a obligaciones apropiadas de confidencialidad, seguridad y tratamiento limitado a las finalidades del servicio.",
  },
  { t: "hr" },

  { t: "h2", text: "16. Transferencias internacionales" },
  {
    t: "p",
    text: "Varios de estos proveedores operan infraestructura fuera de Chile, por lo que determinados datos pueden ser procesados o almacenados en el extranjero. Orbyx adoptará los mecanismos y garantías que correspondan conforme a la legislación aplicable. Si quieres conocer la ubicación de procesamiento asociada a un proveedor determinado, puedes solicitarla escribiendo a contacto@orbyx.cl.",
  },
  { t: "hr" },

  { t: "h2", text: "17. Seguridad de la información" },
  {
    t: "p",
    text: "Orbyx aplica medidas razonables para proteger los datos que trata, entre ellas: separación de los datos de cada negocio para que ninguno pueda acceder a la información de otro; autenticación y control de acceso basado en roles y permisos; acceso limitado al mínimo necesario para cada función; protección de credenciales (las contraseñas no se almacenan en texto plano); comunicaciones cifradas (HTTPS/TLS); respaldos periódicos; y actualización continua de componentes para corregir vulnerabilidades.",
  },
  {
    t: "p",
    text: "Somos deliberadamente precisos: **Orbyx no declara contar actualmente con certificaciones ISO 27001, SOC 2, auditorías externas periódicas ni autenticación multifactor obligatoria.** Nuestros controles son proporcionales al tamaño actual de la empresa, sin perjuicio de las exigencias reforzadas aplicables a los datos sensibles que la plataforma pueda alojar. Ningún sistema puede garantizar seguridad absoluta; trabajamos de forma continua para mantener y mejorar estas medidas.",
  },
  { t: "hr" },

  { t: "h2", text: "18. Acceso interno de Orbyx a los datos" },
  {
    t: "p",
    text: "El personal de Orbyx no navega libremente los datos de un negocio como si fuera ese negocio. El acceso interno a la información, cuando es necesario, se limita a fines legítimos como soporte técnico, resolución de incidentes, mantenimiento, seguridad o cumplimiento de una obligación legal, y se rige por acceso restringido a personal autorizado, mínimo privilegio, deber de confidencialidad y prohibición de uso para fines ajenos al servicio.",
  },
  { t: "hr" },

  { t: "h2", text: "19. Incidentes de seguridad" },
  {
    t: "p",
    text: "Orbyx mantiene procedimientos para detectar, contener, investigar, mitigar y documentar incidentes de seguridad.",
  },
  {
    t: "p",
    text: "Respecto de los datos en que Orbyx es responsable (sección 8), reportamos a la autoridad competente en los términos que establezca la legislación aplicable.",
  },
  {
    t: "p",
    text: "Respecto de los datos de clientes finales, en que Orbyx es encargado, notificaremos al negocio cliente afectado sin dilaciones indebidas, para que este cumpla sus propias obligaciones de reporte y de comunicación a sus clientes.",
  },
  {
    t: "p",
    text: "Cuando una vulneración afecte datos sensibles o datos de niños y niñas menores de catorce años, existen obligaciones adicionales de comunicación a los titulares afectados, que nuestros procedimientos consideran expresamente.",
  },
  { t: "hr" },

  { t: "h2", text: "20. Conservación de los datos" },
  {
    t: "p",
    text: "Orbyx conserva los datos personales durante el tiempo necesario para cumplir las finalidades descritas en esta Política, las obligaciones legales aplicables, y para la seguridad y resolución de eventuales controversias. Cuando un negocio cancela su cuenta, sus datos no se eliminan de inmediato, para permitir una eventual reactivación, exportación de información o resolución de controversias; el plazo exacto de este ciclo de retención está siendo validado internamente y se precisará en una próxima actualización de esta política.",
  },
  {
    t: "p",
    text: "Los datos de facturación y pago se conservan durante los plazos que exige la normativa tributaria y contable chilena. Los respaldos técnicos pueden mantener copias durante un período adicional acotado por razones de seguridad y continuidad.",
  },
  { t: "hr" },

  { t: "h2", text: "21. Exportación y portabilidad" },
  {
    t: "p",
    text: "Un negocio puede solicitar la exportación de la información asociada a su cuenta, sujeto a factibilidad técnica y a obligaciones legales. Un titular tiene además el derecho legal de portabilidad de sus propios datos personales (ver sección 22). Las solicitudes pueden dirigirse a contacto@orbyx.cl.",
  },
  { t: "hr" },

  { t: "h2", text: "22. Derechos de los titulares" },
  {
    t: "table",
    headers: ["Derecho", "En qué consiste"],
    rows: [
      ["**Acceso**", "Confirmar si tus datos están siendo tratados y acceder a ellos"],
      ["**Rectificación**", "Solicitar que se corrijan datos inexactos o desactualizados"],
      ["**Supresión**", "Solicitar la eliminación de tus datos conforme a las causales legales"],
      ["**Oposición**", "Solicitar que no se lleve a cabo un tratamiento determinado"],
      ["**Bloqueo**", "Solicitar la suspensión temporal del tratamiento mientras se resuelve una solicitud"],
      ["**Portabilidad**", "Obtener una copia de tus datos en formato electrónico estructurado y de uso común"],
      ["**Información**", "Conocer quién trata tus datos, con qué finalidad y bajo qué condiciones"],
    ],
  },
  {
    t: "p",
    text: "Si eres cliente final de un negocio que usa Orbyx (por ejemplo, paciente de una veterinaria o cliente de una peluquería), el responsable de tus datos es ese negocio, no Orbyx: debes dirigir tu solicitud directamente a él. Si nos escribes a nosotros, te orientaremos sobre cómo contactarlo y, cuando sea procedente, canalizaremos tu solicitud. Orbyx no puede eliminar por su cuenta datos que pertenecen a la base de clientes de un negocio, salvo instrucción de este u orden de autoridad competente.",
  },
  {
    t: "p",
    text: "Si eres un negocio cliente de Orbyx, o respecto de los tratamientos en que Orbyx actúa como responsable (sección 8), puedes ejercer tus derechos directamente ante nosotros escribiendo a contacto@orbyx.cl. Si tu solicitud es denegada o no recibes respuesta dentro del plazo legal, puedes reclamar ante la autoridad de control competente.",
  },
  { t: "hr" },

  { t: "h2", text: "23. Procedimiento para ejercer derechos" },
  {
    t: "p",
    text: "Escríbenos a contacto@orbyx.cl indicando quién eres, qué dato o derecho quieres ejercer, y una descripción clara de tu solicitud. Podremos pedirte información razonable para verificar tu identidad y evitar accesos indebidos a datos de terceros. El ejercicio de estos derechos es gratuito, y responderemos dentro de los plazos que establezca la legislación vigente.",
  },
  { t: "hr" },

  { t: "h2", text: "24. Cookies y tecnologías similares" },
  {
    t: "p",
    text: "Orbyx utiliza cookies y tecnologías similares con fines estrictamente funcionales: mantener la sesión iniciada y la autenticación de usuarios, recordar preferencias de uso de la plataforma, y fines de seguridad, incluyendo la protección contra bots y abusos mediante Cloudflare Turnstile en determinados formularios. Orbyx no utiliza estas tecnologías con fines de publicidad ni de seguimiento comercial.",
  },
  { t: "hr" },

  { t: "h2", text: "25. Datos de terceros ingresados por los usuarios" },
  {
    t: "p",
    text: "Los negocios pueden incorporar en la plataforma datos de personas distintas de ellos mismos: clientes, familiares, tutores o responsables de mascotas. En esos casos, el negocio garantiza contar con un fundamento legítimo para tratar esos datos y haber entregado a esas personas la información que corresponda.",
  },
  { t: "hr" },

  { t: "h2", text: "26. Mascotas" },
  {
    t: "p",
    text: "Orbyx permite registrar información de mascotas (nombre, especie, raza, edad, historial). Esta información suele estar vinculada a una persona identificable (su tutor o responsable), por lo que se trata con las mismas garantías aplicables al resto de los datos. Las fichas clínicas veterinarias reciben el tratamiento reforzado descrito en la sección 9.",
  },
  { t: "hr" },

  { t: "h2", text: "27. Responsabilidades del negocio cliente" },
  {
    t: "p",
    text: "Los negocios que usan Orbyx son responsables de utilizar la plataforma de forma lícita, recopilar datos de sus clientes de manera legítima y proporcional, informarles adecuadamente, obtener las autorizaciones que la ley exija (especialmente respecto de datos sensibles y de menores de edad), proteger sus credenciales, gestionar correctamente los permisos de su personal, y cumplir la normativa aplicable a su rubro. Estas obligaciones se complementan con los Términos de Servicio de Orbyx.",
  },
  {
    t: "p",
    text: "Cuando Orbyx actúa como encargado, no decide qué clientes debe tener un negocio, qué datos debe recopilar, ni qué información clínica debe registrar — esas decisiones corresponden al negocio dentro de sus propias responsabilidades legales.",
  },
  { t: "hr" },

  { t: "h2", text: "28. Cambios en la plataforma y en esta Política" },
  {
    t: "p",
    text: "Orbyx podrá incorporar nuevas funcionalidades o integraciones a su plataforma. Cuando un cambio implique una modificación material en el tratamiento de datos, actualizaremos esta Política y recabaremos las autorizaciones que correspondan antes de activarlo. Cada nueva versión indicará su fecha de actualización y se publicará en orbyx.cl/privacidad; cuando los cambios sean relevantes, informaremos a los negocios clientes con antelación razonable.",
  },
  { t: "hr" },

  { t: "h2", text: "29. Legislación aplicable" },
  {
    t: "p",
    text: "Esta Política se elabora conforme a la Ley N° 19.628 sobre Protección de la Vida Privada, actualmente vigente en Chile, y considerando la Ley N° 21.719 sobre Protección de Datos Personales, publicada el 13 de diciembre de 2024. A la fecha de esta versión, la entrada en vigor de la Ley N° 21.719 está prevista para el 1 de diciembre de 2026, sin perjuicio de eventuales modificaciones legislativas en trámite. Si dicho plazo fuera modificado, esta Política será actualizada oportunamente.",
  },
  {
    t: "p",
    text: "Adicionalmente pueden resultar aplicables la normativa de protección de los derechos de los consumidores y la normativa sectorial correspondiente al rubro de cada negocio; corresponde a cada negocio cliente cumplir las obligaciones sectoriales propias de su actividad.",
  },
  { t: "hr" },

  { t: "h2", text: "30. Contacto" },
  {
    t: "p",
    text: "Para consultas relacionadas con esta Política de Privacidad, escríbenos a contacto@orbyx.cl.",
  },
  {
    t: "p",
    text: "**Orbyx Soluciones Digitales SpA** — RUT 78.453.137-6 — Pje. 21 N° 511, Talcahuano, Región del Biobío.",
  },
];

function Block({ block }: { block: Block }) {
  switch (block.t) {
    case "h2":
      return (
        <h2
          style={serif}
          className="mt-14 text-2xl tracking-[-0.01em] text-[var(--pub-text)] first:mt-0 sm:text-3xl"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-8 text-lg font-bold text-[var(--pub-text)] sm:text-xl">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="mt-4 text-base leading-7 text-[var(--pub-text-muted)]">
          {renderInline(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul className="mt-4 space-y-2 pl-5 text-base leading-7 text-[var(--pub-text-muted)]">
          {block.items.map((item, i) => (
            <li key={i} className="list-disc marker:text-[var(--pub-accent)]">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-4 space-y-2 pl-5 text-base leading-7 text-[var(--pub-text-muted)]">
          {block.items.map((item, i) => (
            <li key={i} className="list-decimal marker:font-semibold marker:text-[var(--pub-accent)]">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="mt-4 border-l-2 border-[var(--pub-accent)] pl-4 text-base italic leading-7 text-[var(--pub-text-muted)]">
          {renderInline(block.text)}
        </blockquote>
      );
    case "table": {
      const hasHeader = block.headers.some((h) => h.trim() !== "");
      return (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--pub-border)]">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            {hasHeader && (
              <thead>
                <tr className="border-b border-[var(--pub-border)] bg-[var(--pub-bg-soft)]">
                  {block.headers.map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold text-[var(--pub-text)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-[var(--pub-border)] last:border-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={
                        ci === 0
                          ? "whitespace-nowrap px-4 py-3 align-top font-medium text-[var(--pub-text)]"
                          : "px-4 py-3 align-top text-[var(--pub-text-muted)]"
                      }
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "hr":
      return <div className="mt-14 h-px w-full bg-[var(--pub-border)]" />;
  }
}

export default function PrivacidadPage() {
  return (
    <PublicThemeProvider>
      <PrivacidadContent />
    </PublicThemeProvider>
  );
}

function PrivacidadContent() {
  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      className="min-h-screen bg-[var(--pub-bg)] text-[var(--pub-text)]"
    >
      <div className="mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 lg:px-10">
        <PublicHeader />
      </div>

      <section className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            style={serif}
            className="text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--pub-text)] sm:text-[42px]"
          >
            Política de Privacidad y Protección de Datos Personales de Orbyx
          </h1>
          <p className="mt-3 text-base text-[var(--pub-text-muted)]">Orbyx Soluciones Digitales SpA</p>

          <div className="mx-auto mt-6 inline-flex flex-col items-start gap-1 rounded-xl border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] px-5 py-4 text-left text-sm text-[var(--pub-text-muted)]">
            <p>{renderInline("**Versión:** 3.0")}</p>
            <p>{renderInline(`**Última actualización:** ${FECHA_PUBLICACION}`)}</p>
            <p>{renderInline("**Publicada en:** orbyx.cl/privacidad")}</p>
          </div>
        </div>
      </section>

      <article className="px-4 pb-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {content.map((block, i) => (
            <Block key={i} block={block} />
          ))}

          <div className="mt-14 h-px w-full bg-[var(--pub-border)]" />
          <p className="mt-8 text-center text-sm italic text-[var(--pub-text-faint)]">
            Orbyx Soluciones Digitales SpA
          </p>
        </div>
      </article>

      <PublicFooter />
    </main>
  );
}
