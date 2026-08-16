"use client";

import type { ReactNode } from "react";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

// Fecha real de publicación de esta versión (2.0), fijada al momento del deploy.
const FECHA_PUBLICACION = "15 de agosto de 2026";

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
      "Respecto de los datos de **tu negocio**, Orbyx es responsable.",
      "Respecto de los datos de **los clientes de ese negocio**, el responsable es el negocio; Orbyx solo provee la tecnología y procesa esos datos siguiendo sus instrucciones.",
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
      ["**Domicilio**", "PJE 21, 511, Comuna: TALCAHUANO, Región del Bíobio"],
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
    text: "Orbyx es una plataforma de software como servicio (SaaS) que permite a negocios de servicios gestionar su agenda, sus reservas, sus clientes, sus comunicaciones y su información operacional.",
  },
  {
    t: "p",
    text: "Está diseñada para rubros como peluquerías, barberías, centros de estética, veterinarias, clínicas, centros médicos, centros dentales, profesionales de la salud, talleres mecánicos y otros negocios de servicios.",
  },
  { t: "h3", text: "2.2 A quiénes aplica" },
  {
    t: "ul",
    items: [
      "**Negocios clientes** (\"tenants\"): empresas o profesionales que contratan la plataforma.",
      "**Clientes finales**: personas que reservan una hora o son registradas en el sistema por el negocio que las atiende.",
      "**Visitantes** del sitio web de Orbyx.",
    ],
  },
  { t: "h3", text: "2.3 Arquitectura multi-tenant" },
  {
    t: "p",
    text: "Orbyx opera bajo arquitectura **multi-tenant**: cada negocio trabaja dentro de su propio entorno lógico separado.",
  },
  {
    t: "p",
    text: "A través de la interfaz de la plataforma, un negocio no puede acceder a los clientes, reservas ni información operacional de otro negocio. El aislamiento entre negocios es un principio central del diseño de Orbyx y una de nuestras medidas de seguridad fundamentales, cuyo refuerzo técnico se describe en la sección 16.",
  },
  { t: "hr" },

  { t: "h2", text: "3. Definiciones" },
  {
    t: "ul",
    items: [
      "**Dato personal**: cualquier información vinculada o referida a una persona natural identificada o identificable.",
      "**Dato personal sensible**: aquel referido a características físicas o morales, o a hechos o circunstancias de la vida privada o intimidad, que revele, entre otros, datos relativos a la salud, al perfil biológico humano o datos biométricos.",
      "**Titular**: la persona natural a quien se refieren los datos.",
      "**Responsable de datos**: quien decide sobre los fines y medios del tratamiento.",
      "**Tercero mandatario o encargado**: quien trata datos conforme al encargo y a las instrucciones del responsable, sin decidir las finalidades por su cuenta.",
      "**Tratamiento**: cualquier operación sobre datos personales.",
      "**Anonimización**: procedimiento irreversible por el cual un dato ya no puede vincularse a una persona determinada.",
      "**Seudonimización**: tratamiento que impide atribuir los datos a un titular sin información adicional mantenida por separado.",
      "**Tenant o negocio cliente**: empresa o profesional que contrata Orbyx.",
      "**Cliente final**: persona atendida por un negocio que usa Orbyx.",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "4. Modelo de responsabilidad" },
  {
    t: "p",
    text: "Esta sección determina a quién debes dirigirte para ejercer tus derechos. Es probablemente la parte más importante de este documento.",
  },
  { t: "h3", text: "4.1 Cuándo Orbyx es responsable" },
  { t: "p", text: "Orbyx actúa como **responsable de datos** respecto de:" },
  {
    t: "ul",
    items: [
      "Datos de cuenta del negocio cliente (nombre, correo, teléfono, RUT).",
      "Comunicaciones entre Orbyx y el negocio.",
      "Datos de suscripción, facturación y pagos a Orbyx.",
      "Datos técnicos de uso de la plataforma tratados con fines de seguridad, soporte y mejora del servicio.",
      "Datos de visitantes del sitio web de Orbyx.",
    ],
  },
  { t: "h3", text: "4.2 Cuándo Orbyx es encargado" },
  {
    t: "p",
    text: "Respecto de los datos que un negocio incorpora sobre **sus propios clientes finales**, el negocio es el **responsable** y Orbyx actúa como **tercero mandatario o encargado**.",
  },
  { t: "p", text: "Ejemplo concreto:" },
  {
    t: "quote",
    text: "Una veterinaria usa Orbyx para gestionar sus pacientes. **La veterinaria** decide qué datos pide, para qué los usa y con qué fundamento legal. **Orbyx** provee la herramienta y procesa esos datos conforme a ese encargo. Orbyx no decide qué clientes debe tener la veterinaria ni qué fichas debe registrar.",
  },
  {
    t: "p",
    text: "En su rol de encargado, Orbyx asume las siguientes obligaciones, que la ley impone al encargado:",
  },
  {
    t: "ul",
    items: [
      "Tratar los datos únicamente conforme al encargo y a las instrucciones del responsable.",
      "**No tratarlos para un objeto distinto del convenido** con el negocio.",
      "No cederlos ni entregarlos a terceros sin autorización expresa y específica del negocio, salvo mandato legal.",
      "Cumplir el **deber de secreto o confidencialidad**, que subsiste incluso después de terminada la relación.",
      "**Adoptar medidas de seguridad** conforme a la legislación aplicable.",
      "**Reportar al negocio responsable** cualquier vulneración de las medidas de seguridad que afecte sus datos (ver sección 18).",
      "Al término de la prestación del servicio, **suprimir o devolver** los datos según corresponda y conforme a los plazos de retención aplicables.",
    ],
  },
  { t: "h3", text: "4.3 Consecuencia legal de excederse del encargo" },
  {
    t: "p",
    text: "Somos explícitos en esto porque es una obligación que nos vincula: si Orbyx tratara los datos con un objeto distinto del encargo convenido, o los cediera sin autorización, **la ley lo consideraría responsable de datos para todos los efectos legales**, debiendo responder personalmente por las infracciones y solidariamente con el negocio por los daños ocasionados.",
  },
  {
    t: "p",
    text: "Esta es precisamente la razón por la que Orbyx limita sus tratamientos a las finalidades del servicio contratado.",
  },
  { t: "h3", text: "4.4 Acuerdo de Tratamiento de Datos (DPA)" },
  {
    t: "p",
    text: "La relación entre Orbyx y cada negocio cliente debe complementarse mediante los Términos de Servicio y un **Acuerdo de Tratamiento de Datos (DPA)** que defina objeto, duración, finalidad, tipos de datos y categorías de titulares involucrados.",
  },
  {
    t: "p",
    text: "Orbyx pone este instrumento a disposición de los negocios clientes que lo requieran, solicitándolo a contacto@orbyx.cl.",
  },
  { t: "hr" },

  { t: "h2", text: "5. Categorías de datos tratados" },
  {
    t: "p",
    text: "Las categorías efectivamente tratadas dependen del **rubro del negocio, el plan contratado y las funcionalidades que ese negocio decida utilizar**. No todos los datos listados se solicitan siempre.",
  },
  { t: "h3", text: "5.1 Datos de negocios clientes" },
  {
    t: "p",
    text: "Identificación (nombre, RUT, razón social), contacto (correo, teléfono), configuración del negocio (servicios, precios, horarios, sucursales, staff), datos de suscripción y facturación, y credenciales de acceso almacenadas mediante mecanismos de protección.",
  },
  { t: "h3", text: "5.2 Datos de clientes finales" },
  {
    t: "table",
    headers: ["Categoría", "Ejemplos"],
    rows: [
      ["Identificación", "Nombre, apellido, RUT, fecha de nacimiento"],
      ["Contacto", "Teléfono, correo electrónico, dirección"],
      ["Agenda y reservas", "Historial de citas, horarios, profesional asignado, estado"],
      ["Comerciales", "Historial de servicios, preferencias, notas internas del negocio"],
      ["Mascotas", "Especie, raza, edad, historial, vinculados a su tutor"],
      ["Salud (según rubro)", "Fichas clínicas veterinarias, fichas médicas humanas, notas clínicas"],
      ["Archivos", "Fotografías y documentos adjuntos cargados por el negocio"],
      ["Otros", "Datos que el negocio incorpore legítimamente al sistema"],
    ],
  },
  { t: "h3", text: "5.3 Datos técnicos" },
  {
    t: "p",
    text: "Dirección IP, tipo de dispositivo y navegador, registros de acceso y actividad en la plataforma, e información necesaria para seguridad, prevención de fraude y diagnóstico técnico.",
  },
  { t: "hr" },

  { t: "h2", text: "6. Datos sensibles y datos relativos a la salud" },
  {
    t: "p",
    text: "Reconocemos expresamente que **la plataforma puede almacenar datos personales sensibles**, en particular datos relativos a la salud, cuando el negocio pertenece a un rubro clínico o veterinario.",
  },
  {
    t: "p",
    text: "La ley chilena somete estos datos a un régimen más estricto y califica como infracción gravísima su tratamiento indebido.",
  },
  { t: "p", text: "Nuestro criterio:" },
  {
    t: "ol",
    items: [
      "**El negocio cliente decide** qué información de salud recopila, con qué finalidad y bajo qué fundamento jurídico. Corresponde al negocio cumplir las exigencias reforzadas aplicables a datos sensibles respecto de sus propios pacientes o clientes.",
      "**Orbyx procesa esa información únicamente** para proporcionar las funcionalidades contratadas: registro de fichas, historial de atención, agenda y adjuntos.",
      "**Orbyx no utiliza información clínica para finalidades incompatibles** con la prestación del servicio.",
      "**Orbyx no comercializa datos de salud** ni los cede a terceros con fines publicitarios, comerciales o de perfilamiento.",
      "**Restricciones reforzadas para futuras funcionalidades automatizadas e IA** (sección 12).",
      "Documentos y fotografías pueden contener datos sensibles y reciben el mismo criterio de protección reforzada.",
    ],
  },
  { t: "h3", text: "6.1 Advertencia sobre información de agenda en rubros clínicos" },
  { t: "p", text: "Queremos ser transparentes sobre un punto que suele pasarse por alto:" },
  {
    t: "p",
    text: "En rubros de salud, **el solo hecho de que una persona tenga una hora agendada con un determinado profesional puede constituir por sí mismo un dato relativo a la salud**, aunque no se acceda a ninguna ficha clínica.",
  },
  {
    t: "p",
    text: "Por esa razón, las comunicaciones automáticas en rubros clínicos se configuran de manera restringida (sección 10), y recomendamos a los negocios de estos rubros revisar cuidadosamente el contenido de los mensajes que envían a sus pacientes.",
  },
  { t: "hr" },

  { t: "h2", text: "7. Niños, niñas y adolescentes" },
  { t: "p", text: "Orbyx puede ser utilizado por negocios cuyos clientes sean menores de edad." },
  { t: "p", text: "Con transparencia:" },
  {
    t: "ul",
    items: [
      "**Orbyx no cuenta con un mecanismo universal que verifique automáticamente la edad de cada persona registrada por un negocio.** La plataforma puede utilizar la fecha de nacimiento o el RUT cuando el negocio los haya registrado, pero no podemos afirmar que siempre identificaremos a un menor de edad.",
      "Corresponde al **negocio cliente** determinar cuándo trata datos de niños, niñas o adolescentes y obtener las autorizaciones de padres, madres o representantes legales cuando la ley lo exija.",
      "Cuando Orbyx **tenga conocimiento** de que trata datos de un menor de edad, aplicará las salvaguardas correspondientes, incluyendo restricciones reforzadas de acceso por parte de funcionalidades automatizadas.",
      "Los datos sensibles de menores reciben protección especialmente reforzada.",
    ],
  },
  {
    t: "p",
    text: "La ley chilena establece deberes especiales para el tratamiento de datos de niños, niñas y adolescentes, y contempla obligaciones adicionales de notificación cuando una vulneración de seguridad afecta a niños y niñas menores de catorce años.",
  },
  {
    t: "p",
    text: "Cuando la plataforma cuente con la fecha de nacimiento registrada por el negocio, Orbyx podrá aplicar las salvaguardas correspondientes.",
  },
  { t: "hr" },

  { t: "h2", text: "8. Finalidades del tratamiento" },
  { t: "h3", text: "8.1 Como responsable" },
  {
    t: "ul",
    items: [
      "Crear, administrar y dar soporte a cuentas de negocios clientes.",
      "Prestar el servicio SaaS contratado.",
      "Gestionar suscripciones, cobros y facturación.",
      "Mantener la seguridad de la plataforma y prevenir fraude y usos indebidos.",
      "Diagnosticar y resolver errores técnicos.",
      "Mantener respaldos y continuidad operacional.",
      "Comunicar información sobre servicio, cambios, seguridad y soporte.",
      "Mejorar la plataforma y desarrollar nuevas funcionalidades.",
      "Generar estadísticas y análisis agregados o anonimizados.",
      "Cumplir obligaciones legales y contractuales.",
    ],
  },
  { t: "h3", text: "8.2 Como encargado, por cuenta del negocio" },
  {
    t: "p",
    text: "Gestión de agenda y reservas, gestión de la base de clientes del negocio, administración de staff y servicios, historiales de atención, envío de confirmaciones y recordatorios, comunicación del negocio con sus clientes, campañas de recuperación y comunicaciones comerciales del negocio, y gestión de su información operacional.",
  },
  { t: "h3", text: "8.3 Lo que Orbyx no hace" },
  {
    t: "ul",
    items: [
      "**No vendemos datos personales.**",
      "**No usamos los datos de clientes finales de un negocio para promocionar Orbyx a esas personas.**",
      "**No usamos datos de un negocio para beneficiar a otro negocio.**",
      "**No usamos información clínica para finalidades ajenas al servicio.**",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "9. Fundamento jurídico" },
  { t: "p", text: "Según el caso, el tratamiento se fundamenta en:" },
  {
    t: "ul",
    items: [
      "**Ejecución de un contrato**: prestación del servicio contratado por el negocio.",
      "**Consentimiento del titular**: libre, informado, específico, previo e inequívoco, cuando la ley lo exija. Es **revocable en cualquier momento**, sin afectar la licitud del tratamiento previo.",
      "**Cumplimiento de obligaciones legales**: tributarias, contables y de conservación.",
      "**Otras fuentes de licitud** contempladas en la legislación aplicable.",
    ],
  },
  {
    t: "p",
    text: "Respecto de los datos de clientes finales, **es el negocio quien debe determinar y poder acreditar el fundamento jurídico** del tratamiento e informar adecuadamente a sus propios clientes. La ley radica la carga de acreditar la licitud del tratamiento en quien lo realiza.",
  },
  { t: "hr" },

  { t: "h2", text: "10. Comunicaciones: correo electrónico y WhatsApp" },
  { t: "h3", text: "10.1 Mensajes operacionales" },
  {
    t: "p",
    text: "Orbyx permite a los negocios enviar a sus clientes confirmaciones de reserva, recordatorios, avisos de cambio de horario, cancelaciones y otras comunicaciones vinculadas al servicio, por correo electrónico y, cuando el negocio lo habilita, por WhatsApp.",
  },
  { t: "h3", text: "10.2 WhatsApp, Meta y Twilio" },
  {
    t: "p",
    text: "Para la mensajería por WhatsApp, Orbyx utiliza la plataforma **WhatsApp Business**, operada por **Meta**, a través de **Twilio** como proveedor tecnológico.",
  },
  {
    t: "p",
    text: "Esto implica que Meta y Twilio actúan como proveedores externos y que sus propias políticas y términos pueden resultar aplicables a determinados tratamientos asociados al canal. El envío de mensajes iniciados por el negocio fuera de una ventana de conversación activa está sujeto a los formatos y plantillas que Meta autoriza.",
  },
  { t: "h3", text: "10.3 Contenido de los mensajes y rubros clínicos" },
  {
    t: "p",
    text: "Un mensaje enviado a un teléfono puede ser visto por quien tenga acceso a ese dispositivo. En rubros de salud, un recordatorio que identifique la especialidad o el motivo de la atención puede revelar información sensible.",
  },
  {
    t: "p",
    text: "Por ello, Orbyx recomienda a los negocios de rubros clínicos utilizar contenidos genéricos en sus recordatorios y aplica un criterio conservador en el contenido de las plantillas de mensajería utilizadas en estos rubros.",
  },
  { t: "h3", text: "10.4 Conversaciones entrantes" },
  {
    t: "p",
    text: "Los clientes finales pueden responder a los mensajes que reciben. Estas respuestas llegan al canal de WhatsApp del negocio y son gestionadas por el propio negocio.",
  },
  {
    t: "p",
    text: "**Orbyx no almacena de forma permanente el contenido de las conversaciones de WhatsApp entre un negocio y sus clientes.** Si en el futuro Orbyx incorpora funcionalidades que requieran procesar o almacenar dichas conversaciones, actualizará esta política e informará a los negocios clientes antes de activarlas.",
  },
  { t: "hr" },

  { t: "h2", text: "11. Marketing y campañas" },
  { t: "h3", text: "11.1 Campañas del negocio hacia sus propios clientes" },
  {
    t: "p",
    text: "Orbyx entrega la herramienta que permite a un negocio enviar campañas, promociones, recordatorios y mensajes de recuperación a sus propios clientes.",
  },
  { t: "p", text: "**El negocio cliente es el único responsable de:**" },
  {
    t: "ul",
    items: [
      "La legitimidad y el fundamento jurídico de la campaña.",
      "El contenido de los mensajes.",
      "La selección de los destinatarios.",
      "Contar con las autorizaciones que la ley exija.",
      "Respetar las solicitudes de oposición o desuscripción de sus clientes.",
      "Cumplir la normativa aplicable en materia de comunicaciones comerciales y protección al consumidor.",
    ],
  },
  {
    t: "p",
    text: "Orbyx no revisa ni aprueba previamente el contenido de las campañas, sin perjuicio de poder adoptar medidas frente a usos manifiestamente ilícitos o abusivos de la plataforma.",
  },
  { t: "h3", text: "11.2 Comunicaciones de Orbyx hacia sus negocios clientes" },
  {
    t: "p",
    text: "Orbyx podrá enviar a los negocios comunicaciones sobre funcionamiento del servicio, soporte, seguridad e incidentes, cambios en planes, términos o esta política, nuevas funcionalidades e información comercial sobre Orbyx.",
  },
  {
    t: "p",
    text: "Las comunicaciones comerciales incluirán mecanismo de desuscripción. Los avisos esenciales de servicio, seguridad o cambios contractuales no son desuscribibles mientras la cuenta esté activa, por ser necesarios para la relación contractual.",
  },
  { t: "hr" },

  { t: "h2", text: "12. Inteligencia artificial" },
  {
    t: "p",
    text: "Orbyx contempla incorporar funcionalidades de inteligencia artificial a su plataforma en el futuro, principalmente orientadas a la atención automatizada de consultas y a la gestión de reservas.",
  },
  {
    t: "p",
    text: "**Estas funcionalidades no se encuentran operativas actualmente y no se realiza ningún tratamiento de datos personales mediante inteligencia artificial.**",
  },
  {
    t: "p",
    text: "Orbyx asume desde ya los siguientes compromisos, que regirán su implementación:",
  },
  {
    t: "ul",
    items: [
      "**Acceso limitado.** Cualquier asistente conversacional dirigido a clientes finales operará bajo una autorización explícita y acotada de qué información puede consultar. No tendrá acceso indiscriminado a la base de datos del negocio ni a fichas médicas humanas, fichas clínicas veterinarias, diagnósticos, notas clínicas, documentos sensibles ni información de otros clientes.",
      "**Configuración reforzada en rubros sensibles.** En rubros clínicos y veterinarios, las funcionalidades automatizadas operarán de forma más restringida, limitando el detalle de la información que pueden exponer.",
      "**No entrenamiento con datos identificables.** Los datos personales identificables de los negocios y de sus clientes finales no se destinarán al entrenamiento de modelos generales de inteligencia artificial de terceros para fines propios de dichos terceros, salvo que exista base jurídica válida, información clara al titular y las autorizaciones que la ley exija. Orbyx podrá utilizar información efectivamente anonimizada o agregada, cuando jurídicamente corresponda, para estadísticas y mejora del servicio. La ley define la anonimización como un procedimiento irreversible; la seudonimización no equivale a anonimización.",
      "**Sin decisiones automatizadas de efectos significativos.** Las funcionalidades previstas no están diseñadas para evaluar créditos, contratar o desvincular personas, evaluar seguros, diagnosticar enfermedades, determinar tratamientos médicos, ni adoptar decisiones jurídicas, financieras o que produzcan efectos jurídicos significativos sobre una persona. La ley chilena reconoce al titular el derecho a no ser objeto de decisiones basadas exclusivamente en tratamiento automatizado que le produzcan efectos jurídicos o le afecten significativamente, y a solicitar intervención humana, una explicación y su revisión.",
      "**Orbyx no es un prestador de servicios de salud**, no emite diagnósticos y no sustituye al profesional tratante.",
    ],
  },
  {
    t: "p",
    text: "**Antes de activar cualquier funcionalidad de inteligencia artificial, Orbyx actualizará esta política, identificará al proveedor utilizado e informará a los negocios clientes.**",
  },
  { t: "hr" },

  { t: "h2", text: "13. Pagos" },
  { t: "h3", text: "13.1 Suscripción a Orbyx" },
  {
    t: "p",
    text: "Los negocios pagan su suscripción a Orbyx. Utilizamos **Flow** como proveedor de servicios de pago. Orbyx no almacena los datos completos de tarjetas; son procesados por el proveedor conforme a sus propios estándares.",
  },
  { t: "h3", text: "13.2 Pago previo asociado a una reserva" },
  {
    t: "p",
    text: "Algunos negocios pueden exigir un pago o abono previo para confirmar una reserva. En ese caso, el cliente final puede cargar un comprobante y el negocio confirma o rechaza el pago dentro de la plataforma.",
  },
  {
    t: "p",
    text: "**Orbyx no actúa como intermediario financiero ni como procesador de los pagos que los clientes finales realizan a los negocios.** La relación económica es entre el cliente final y el negocio. Orbyx provee únicamente la funcionalidad para registrar y revisar ese comprobante.",
  },
  { t: "hr" },

  { t: "h2", text: "14. Proveedores tecnológicos" },
  {
    t: "table",
    headers: ["Proveedor", "Función"],
    rows: [
      ["**Supabase**", "Base de datos y autenticación"],
      ["**Vercel**", "Alojamiento del frontend"],
      ["**Render**", "Alojamiento del backend"],
      ["**Flow**", "Procesamiento de pagos de suscripciones"],
      ["**Twilio**", "Mensajería WhatsApp"],
      ["**Meta / WhatsApp**", "Plataforma WhatsApp Business"],
      ["**Resend**", "Envío de correos transaccionales del servicio"],
    ],
  },
  { t: "p", text: "Estos proveedores pueden actuar como encargados o subencargados tecnológicos." },
  {
    t: "p",
    text: "Orbyx procura que queden sujetos a obligaciones apropiadas de confidencialidad, seguridad, tratamiento limitado a las finalidades del servicio, protección de datos, retención y eliminación, y subcontratación autorizada.",
  },
  { t: "hr" },

  { t: "h2", text: "15. Transferencias internacionales" },
  {
    t: "p",
    text: "Con transparencia: **no todos los datos tratados por Orbyx se almacenan necesariamente en Chile.**",
  },
  {
    t: "p",
    text: "Varios proveedores operan infraestructura fuera del territorio nacional, por lo que determinados datos pueden ser procesados o almacenados en el extranjero.",
  },
  {
    t: "p",
    text: "Cuando el titular desee conocer la ubicación de procesamiento asociada a un proveedor determinado, puede solicitarla escribiendo a contacto@orbyx.cl.",
  },
  {
    t: "p",
    text: "La legislación chilena permite las transferencias internacionales cuando se cumplen los requisitos legales y existen garantías y niveles de protección suficientes. Orbyx adoptará las medidas y bases jurídicas correspondientes, incluyendo cláusulas contractuales apropiadas.",
  },
  { t: "p", text: "Cuando definamos las regiones de procesamiento, actualizaremos esta sección." },
  { t: "hr" },

  { t: "h2", text: "16. Seguridad de la información" },
  { t: "p", text: "Orbyx implementa las siguientes medidas:" },
  {
    t: "ul",
    items: [
      "**Aislamiento multi-tenant**: separación lógica de los datos de cada negocio, aplicada mediante validación de pertenencia en cada operación de lectura y escritura.",
      "**Control de acceso**: autenticación y gestión de permisos dentro de la plataforma.",
      "**Mínimo privilegio**: acceso limitado a lo necesario para cada función.",
      "**Protección de credenciales**: las contraseñas no se almacenan en texto plano.",
      "**Comunicaciones cifradas** (HTTPS/TLS) entre el usuario y la plataforma.",
      "**Respaldos** para recuperación ante incidentes.",
      "**Registro de actividad** de operaciones realizadas dentro de la plataforma, sin perjuicio de lo señalado en la sección 17 respecto del acceso administrativo.",
      "**Actualización de componentes** y corrección de vulnerabilidades detectadas.",
      "**Confidencialidad** sobre la información tratada.",
    ],
  },
  { t: "h3", text: "16.1 Lo que Orbyx no afirma" },
  {
    t: "p",
    text: "Somos deliberadamente precisos: **Orbyx no declara contar actualmente con certificaciones ISO 27001, SOC 2, auditorías externas periódicas, programas de pentesting permanente, ni autenticación multifactor obligatoria.**",
  },
  {
    t: "p",
    text: "La ley chilena contempla que los estándares mínimos de cumplimiento en materia de información y seguridad se determinen considerando, entre otros factores, el tipo de dato tratado y las características del responsable. Orbyx es una empresa de menor tamaño y sus controles son proporcionales a esa realidad, sin perjuicio de las exigencias reforzadas aplicables a los datos sensibles que la plataforma pueda alojar.",
  },
  {
    t: "p",
    text: "Ninguna plataforma puede garantizar seguridad absoluta. Orbyx se compromete a mantener estándares adecuados y mejorarlos de forma continua.",
  },
  { t: "hr" },

  { t: "h2", text: "17. Acceso interno de Orbyx a los datos" },
  { t: "p", text: "Preferimos ser honestos antes que tranquilizadores." },
  {
    t: "p",
    text: "**Orbyx no dispone de una funcionalidad dentro de la plataforma que permita a su personal iniciar sesión en la cuenta de un negocio y navegar sus datos como si fuera ese negocio.**",
  },
  {
    t: "p",
    text: "Sin embargo, **sí existe la posibilidad técnica de acceder a la información a través de la infraestructura de base de datos** (por ejemplo, mediante herramientas de administración o consultas directas), como ocurre en prácticamente cualquier plataforma SaaS. Sería falso afirmar lo contrario.",
  },
  { t: "p", text: "Ese acceso se rige por:" },
  {
    t: "ul",
    items: [
      "**Acceso restringido** a personal autorizado.",
      "**Necesidad legítima**: soporte técnico, resolución de incidentes, mantenimiento, seguridad o cumplimiento de una obligación legal.",
      "**Mínimo privilegio**: acceso al mínimo de información necesaria.",
      "**Confidencialidad**: deber de secreto sobre la información conocida.",
      "**Prohibición de uso para finalidades ajenas** al servicio.",
      "**Trazabilidad** cuando técnicamente esté disponible.",
    ],
  },
  {
    t: "p",
    text: "Orbyx mantiene estos criterios como reglas internas de operación aplicables a todo acceso administrativo.",
  },
  { t: "hr" },

  { t: "h2", text: "18. Incidentes de seguridad" },
  {
    t: "p",
    text: "Orbyx mantiene procedimientos orientados a detectar, contener, investigar, mitigar, recuperar y documentar incidentes de seguridad.",
  },
  { t: "h3", text: "18.1 Obligaciones aplicables" },
  {
    t: "p",
    text: "La ley chilena exige reportar las vulneraciones de las medidas de seguridad que ocasionen destrucción, filtración, pérdida o alteración accidental o ilícita de datos personales, o el acceso o comunicación no autorizados a dichos datos, **cuando exista un riesgo razonable para los derechos y libertades de los titulares**. El reporte debe efectuarse **por los medios más expeditos posibles y sin dilaciones indebidas** — la ley no fija un plazo en horas.",
  },
  {
    t: "p",
    text: "Asimismo, exige llevar un registro de estas comunicaciones describiendo la naturaleza de la vulneración, sus efectos, las categorías de datos, el número aproximado de titulares afectados y las medidas adoptadas.",
  },
  { t: "h3", text: "18.2 Cómo opera esto en Orbyx" },
  { t: "p", text: "Esta distinción es importante:" },
  {
    t: "ul",
    items: [
      "Respecto de los datos en que **Orbyx es responsable** (sección 4.1), Orbyx reporta a la autoridad de control en los términos y desde la entrada en vigencia que establezca la legislación aplicable.",
      "Respecto de los datos de clientes finales, en que **Orbyx es encargado**, la ley establece que el encargado **debe reportar la vulneración al responsable**. Orbyx notificará al negocio cliente afectado sin dilaciones indebidas, para que este cumpla sus propias obligaciones de reporte y de comunicación a sus titulares.",
    ],
  },
  {
    t: "p",
    text: "Cuando la vulneración afecte **datos sensibles** o **datos de niños y niñas menores de catorce años**, la ley contempla obligaciones adicionales de comunicación a los titulares afectados. Dado que la plataforma puede alojar ambos tipos de datos, este escenario está expresamente considerado en nuestros procedimientos.",
  },
  { t: "hr" },

  { t: "h2", text: "19. Retención de datos" },
  {
    t: "p",
    text: "Cuando un negocio cancela su cuenta, **los datos no se eliminan de forma inmediata**, para permitir eventual reactivación, recuperación o exportación de información, resolución de controversias, cumplimiento de obligaciones legales y continuidad de respaldos.",
  },
  {
    t: "p",
    text: "**Plazo de retención:** los datos operacionales asociados a la cuenta (clientes, reservas, historiales, fichas y archivos adjuntos) se conservan durante **12 meses** contados desde la cancelación de la cuenta. Transcurrido ese plazo, son eliminados o anonimizados.",
  },
  {
    t: "p",
    text: "**Excepción — documentación tributaria y contable:** los datos de facturación y pago se conservan durante los plazos que exige la normativa tributaria y contable chilena, que pueden ser superiores a 12 meses. Esta conservación se limita a la documentación exigida por ley.",
  },
  {
    t: "p",
    text: "Cumplida la finalidad y transcurridos los plazos aplicables, los datos podrán ser eliminados, anonimizados, bloqueados cuando corresponda, o conservados únicamente cuando exista fundamento legal.",
  },
  {
    t: "p",
    text: "Los respaldos técnicos pueden mantener copias durante un período adicional acotado por razones de seguridad y continuidad, tras el cual son sobrescritos o eliminados conforme al ciclo de respaldos.",
  },
  {
    t: "p",
    text: "Cumplida la prestación del servicio, y conforme a la ley, los datos tratados por Orbyx en calidad de encargado serán suprimidos o devueltos al negocio responsable según corresponda.",
  },
  { t: "hr" },

  { t: "h2", text: "20. Exportación y portabilidad" },
  {
    t: "p",
    text: "Un negocio puede solicitar la exportación de la información asociada a su cuenta, sujeto a factibilidad técnica, derechos de terceros, obligaciones legales y protección de la información de otros titulares.",
  },
  { t: "p", text: "Distinguimos dos cosas:" },
  {
    t: "ul",
    items: [
      "**Portabilidad de datos personales**: derecho legal del titular a obtener una copia de sus datos en formato electrónico estructurado, genérico y de uso común, que permita ser operado por distintos sistemas.",
      "**Exportación operacional de cuenta**: funcionalidad comercial que permite a un negocio obtener una copia de la información de su cuenta.",
    ],
  },
  { t: "p", text: "Las solicitudes de exportación pueden dirigirse a contacto@orbyx.cl." },
  { t: "hr" },

  { t: "h2", text: "21. Derechos de los titulares" },
  {
    t: "table",
    headers: ["Derecho", "En qué consiste"],
    rows: [
      ["**Acceso**", "Confirmar si sus datos están siendo tratados, acceder a ellos y obtener la información prevista en la ley"],
      ["**Rectificación**", "Solicitar que se modifiquen o completen datos inexactos, desactualizados o incompletos"],
      ["**Supresión**", "Solicitar la eliminación de sus datos conforme a las causales legales"],
      ["**Oposición**", "Solicitar que no se lleve a cabo un tratamiento determinado"],
      ["**Bloqueo**", "Solicitar la suspensión temporal del tratamiento mientras se resuelve una solicitud de rectificación, supresión u oposición"],
      ["**Portabilidad**", "Obtener una copia de sus datos en formato electrónico estructurado y de uso común"],
      ["**Información y transparencia**", "Conocer quién trata sus datos, con qué finalidad y bajo qué condiciones"],
      ["**Decisiones automatizadas**", "No ser objeto de decisiones basadas exclusivamente en tratamiento automatizado con efectos jurídicos o significativos, y solicitar intervención humana, explicación y revisión"],
    ],
  },
  { t: "h3", text: "21.1 A quién dirigir la solicitud" },
  {
    t: "p",
    text: "**Si eres cliente final de un negocio que usa Orbyx** (paciente de una veterinaria, cliente de una peluquería):",
  },
  {
    t: "p",
    text: "El **responsable de tus datos es ese negocio**, no Orbyx. Debes dirigir tu solicitud directamente al negocio que te atiende, porque es quien decide qué datos tiene sobre ti y para qué los usa.",
  },
  {
    t: "p",
    text: "Si nos escribes a nosotros: te orientaremos sobre cómo contactar al negocio y, cuando sea procedente, canalizaremos tu solicitud hacia el negocio responsable. Orbyx, como encargado, prestará al negocio la asistencia razonable para responder.",
  },
  {
    t: "p",
    text: "Debes saber que **Orbyx no puede eliminar por su cuenta datos que pertenecen a la base de clientes de un negocio**, porque esa decisión corresponde legalmente al negocio responsable, salvo instrucción de este, orden de autoridad competente o mandato legal.",
  },
  {
    t: "p",
    text: "**Si eres un negocio cliente de Orbyx**, o respecto de los tratamientos en que Orbyx actúa como responsable (sección 4.1), puedes ejercer tus derechos directamente ante nosotros.",
  },
  { t: "h3", text: "21.2 Reclamación ante la autoridad" },
  {
    t: "p",
    text: "Si tu solicitud es denegada total o parcialmente, o no recibes respuesta dentro del plazo legal, puedes reclamar ante la autoridad de control competente conforme al procedimiento que la legislación establezca.",
  },
  { t: "hr" },

  { t: "h2", text: "22. Procedimiento para ejercer derechos" },
  { t: "p", text: "**Canal:** contacto@orbyx.cl" },
  { t: "p", text: "Para gestionar tu solicitud podremos requerir:" },
  {
    t: "ul",
    items: [
      "Individualización del solicitante.",
      "Identificación de los datos respecto de los cuales ejerces el derecho.",
      "Descripción clara de la solicitud.",
      "Información razonable para **verificar tu identidad**, a fin de evitar accesos indebidos a datos de terceros.",
      "Antecedentes adicionales necesarios, cuando corresponda.",
    ],
  },
  {
    t: "p",
    text: "El ejercicio de estos derechos es **gratuito**. Responderemos dentro de los plazos que establezca la legislación vigente al momento de la solicitud. Si la solicitud fuera denegada total o parcialmente, informaremos los motivos y las vías de reclamación disponibles.",
  },
  { t: "hr" },

  { t: "h2", text: "23. Cookies y tecnologías similares" },
  {
    t: "p",
    text: "Orbyx utiliza cookies y tecnologías similares **necesarias para el funcionamiento del servicio**, en particular para:",
  },
  {
    t: "ul",
    items: [
      "Mantener la sesión iniciada y autenticar usuarios.",
      "Recordar preferencias básicas de la interfaz.",
      "Proteger la plataforma frente a accesos automatizados y abusos.",
    ],
  },
  { t: "p", text: "**Orbyx no utiliza cookies con fines publicitarios ni de perfilamiento comercial.**" },
  {
    t: "p",
    text: "Si en el futuro Orbyx incorporara cookies no esenciales, como herramientas de analítica de terceros, implementará el mecanismo de consentimiento que corresponda, con configuración de privacidad por defecto, y actualizará esta política.",
  },
  { t: "hr" },

  { t: "h2", text: "24. Datos de terceros ingresados por los usuarios" },
  {
    t: "p",
    text: "Los negocios pueden incorporar datos de personas distintas de ellos mismos: clientes, familiares, tutores, responsables de mascotas, profesionales o contactos.",
  },
  {
    t: "p",
    text: "En esos casos, **el negocio garantiza que cuenta con un fundamento legítimo** para tratar dichos datos y que ha entregado a esas personas la información que corresponda.",
  },
  { t: "hr" },

  { t: "h2", text: "25. Mascotas" },
  {
    t: "p",
    text: "Orbyx permite registrar información de mascotas (nombre, especie, raza, edad, historial, fichas veterinarias).",
  },
  {
    t: "p",
    text: "Distinguimos entre la **información relativa al animal**, que no siempre constituye por sí sola un dato personal, y los **datos personales del tutor o responsable**, que sí lo son.",
  },
  {
    t: "p",
    text: "En la práctica, la información de una mascota suele estar **vinculada a una persona identificable**, por lo que se trata con las mismas garantías aplicables al resto de los datos. Las fichas clínicas veterinarias reciben el tratamiento reforzado de la sección 6.",
  },
  { t: "hr" },

  { t: "h2", text: "26. Responsabilidades del negocio cliente" },
  { t: "p", text: "Los negocios que utilizan Orbyx son responsables de:" },
  {
    t: "ul",
    items: [
      "Utilizar la plataforma de forma lícita y conforme a los Términos de Servicio.",
      "Recopilar datos de sus clientes de manera legítima y proporcional.",
      "Informar adecuadamente a sus clientes sobre el tratamiento de sus datos.",
      "Obtener consentimientos o autorizaciones cuando la ley los exija, especialmente respecto de datos sensibles y de menores de edad.",
      "No cargar información que no estén autorizados a tratar.",
      "Proteger sus credenciales y no compartirlas indebidamente.",
      "Gestionar correctamente a sus usuarios internos y sus permisos.",
      "Respetar y atender los derechos de sus propios clientes.",
      "Utilizar las funcionalidades de comunicación y campañas conforme a la ley.",
      "Cumplir la normativa sectorial aplicable a su rubro.",
      "No utilizar Orbyx para actividades ilícitas.",
    ],
  },
  { t: "p", text: "Estas obligaciones se complementan con los **Términos de Servicio de Orbyx**." },
  { t: "hr" },

  { t: "h2", text: "27. Límites del rol de Orbyx" },
  {
    t: "p",
    text: "Cuando Orbyx actúa como encargado, **no decide** qué clientes debe tener un negocio, qué datos debe recopilar, qué tratamientos comerciales debe realizar, qué información clínica debe registrar, ni qué campañas debe enviar. Esas decisiones corresponden al negocio dentro de sus propias responsabilidades legales.",
  },
  {
    t: "p",
    text: "Sin perjuicio de ello, **Orbyx mantiene sus propias obligaciones** en materia de seguridad, confidencialidad, tratamiento conforme al encargo recibido y cumplimiento de la legislación aplicable, según lo señalado en las secciones 4.2 y 4.3.",
  },
  { t: "hr" },

  { t: "h2", text: "28. Cambios en la plataforma y en esta política" },
  { t: "h3", text: "28.1 Nuevas funcionalidades" },
  {
    t: "p",
    text: "Orbyx podrá incorporar nuevas funcionalidades, integraciones, herramientas de comunicación, capacidades de automatización o proveedores de IA.",
  },
  {
    t: "p",
    text: "Esta cláusula **no constituye una autorización general e ilimitada** para modificar las finalidades del tratamiento. Cuando una nueva funcionalidad implique un cambio material, Orbyx actualizará esta política y recabará las autorizaciones que correspondan.",
  },
  { t: "h3", text: "28.2 Modificaciones a esta política" },
  {
    t: "ul",
    items: [
      "Cada versión indicará su **fecha de última actualización**.",
      "Las nuevas versiones se publicarán en **orbyx.cl/privacidad**.",
      "Cuando los cambios sean relevantes, informaremos a los negocios clientes por los canales habituales con antelación razonable.",
      "Los cambios entrarán en vigencia en la fecha indicada en la versión publicada.",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "29. Legislación aplicable" },
  { t: "p", text: "**Situación normativa a la fecha de esta política (agosto de 2026):**" },
  {
    t: "ul",
    items: [
      "Rige actualmente la **Ley N° 19.628 sobre protección de la vida privada**, en su texto vigente.",
      "La **Ley N° 21.719**, publicada en el Diario Oficial el 13 de diciembre de 2024, reforma sustancialmente ese cuerpo legal y **entra en vigencia el 1 de diciembre de 2026**. Incorpora nuevos principios (finalidad, proporcionalidad, seguridad, responsabilidad, confidencialidad, entre otros), un catálogo ampliado de derechos, deberes reforzados para responsables y encargados, reglas específicas sobre datos sensibles, datos de salud, niños, niñas y adolescentes, decisiones automatizadas y transferencias internacionales, y crea la **Agencia de Protección de Datos Personales** con facultades de fiscalización y sanción.",
    ],
  },
  {
    t: "p",
    text: "Esta política ha sido redactada **anticipando el estándar de la Ley N° 21.719**, de modo que Orbyx pueda aplicarla desde ya y no deba rehacerla al entrar en vigor la nueva normativa. Algunos compromisos aquí asumidos exceden lo actualmente exigible y se adoptan voluntariamente.",
  },
  {
    t: "p",
    text: "Adicionalmente pueden resultar aplicables la normativa de protección de los derechos de los consumidores, la normativa sobre comunicaciones electrónicas y comerciales, y la normativa sectorial correspondiente al rubro de cada negocio.",
  },
  {
    t: "p",
    text: "**Corresponde a cada negocio cliente cumplir las obligaciones sectoriales aplicables a su actividad.** Orbyx no determina ni verifica el cumplimiento de la normativa sectorial de cada rubro.",
  },
  { t: "hr" },

  { t: "h2", text: "30. Contacto" },
  {
    t: "table",
    headers: ["", ""],
    rows: [
      ["**Correo**", "contacto@orbyx.cl"],
      ["**Razón social**", "Orbyx Soluciones Digitales SpA"],
      ["**RUT**", "78.453.137-6"],
      ["**Domicilio**", "PJE 21, 511, Comuna: TALCAHUANO, Región del Bíobio"],
    ],
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
            Política de Privacidad
          </h1>
          <p className="mt-3 text-base text-[var(--pub-text-muted)]">Orbyx Soluciones Digitales SpA</p>

          <div className="mx-auto mt-6 inline-flex flex-col items-start gap-1 rounded-xl border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] px-5 py-4 text-left text-sm text-[var(--pub-text-muted)]">
            <p>{renderInline("**Versión:** 2.0")}</p>
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
