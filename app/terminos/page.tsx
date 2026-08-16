"use client";

import type { ReactNode } from "react";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

// Fecha real de publicación de esta versión (1.0), fijada al momento del deploy.
const FECHA_PUBLICACION = "16 de agosto de 2026";

type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
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
  { t: "p", text: "Antes del detalle, lo esencial:" },
  {
    t: "ul",
    items: [
      "Estos Términos son el contrato entre Orbyx y tu negocio.",
      "Orbyx te entrega una plataforma para gestionar reservas, clientes y comunicaciones. Tú decides cómo usarla.",
      "Los datos de tus clientes son **tuyos**. Orbyx los procesa por encargo tuyo, según el Anexo A.",
      "Puedes cancelar cuando quieras, sin penalización.",
      "Si cambiamos estos Términos de forma relevante, te avisamos con 30 días de anticipación y puedes terminar el contrato sin costo.",
      "Puedes descargar una copia de este contrato en cualquier momento, y te enviamos una al contratar.",
    ],
  },
  { t: "p", text: "Este resumen no reemplaza el texto completo ni modifica su contenido." },
  { t: "hr" },

  { t: "h2", text: "1. Identificación del prestador" },
  {
    t: "table",
    headers: ["", ""],
    rows: [
      ["**Razón social**", "Orbyx Soluciones Digitales SpA"],
      ["**RUT**", "78.453.137-6"],
      ["**Domicilio**", "PJE 21, 511, Comuna: TALCAHUANO, Región del Bíobio"],
      ["**Correo de contacto**", "contacto@orbyx.cl"],
      ["**Sitio web**", "orbyx.cl"],
    ],
  },
  { t: "hr" },

  { t: "h2", text: "2. Definiciones" },
  {
    t: "ul",
    items: [
      "**Orbyx**: Orbyx Soluciones Digitales SpA.",
      "**Cliente** o **Negocio**: la persona natural o jurídica que contrata el Servicio.",
      "**Servicio** o **Plataforma**: el software de gestión de reservas y clientes provisto por Orbyx.",
      "**Cliente Final**: la persona atendida por el Cliente y cuyos datos este registra en la Plataforma.",
      "**Cuenta**: el espacio lógico asignado al Cliente dentro de la Plataforma.",
      "**Datos del Cliente**: la información que el Cliente o sus Clientes Finales incorporan a la Plataforma.",
      "**Plan**: la modalidad de suscripción contratada.",
      "**Anexo A**: el Acuerdo de Tratamiento de Datos que forma parte integrante de estos Términos.",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "3. Objeto y aceptación" },
  { t: "h3", text: "3.1 Objeto" },
  {
    t: "p",
    text: "Orbyx otorga al Cliente una licencia de uso, no exclusiva, intransferible y revocable, para acceder y utilizar la Plataforma durante la vigencia de la suscripción, conforme a estos Términos.",
  },
  { t: "h3", text: "3.2 Aceptación" },
  {
    t: "p",
    text: "Estos Términos se aceptan de forma electrónica al momento de crear una cuenta o contratar un Plan, mediante una acción afirmativa e inequívoca del Cliente.",
  },
  {
    t: "p",
    text: "Antes de aceptar, el Cliente tiene acceso al texto íntegro de estos Términos, de su Anexo A y de la Política de Privacidad, con la posibilidad de **almacenarlos e imprimirlos**. La sola visita al sitio web de Orbyx no genera obligación alguna para el Cliente.",
  },
  {
    t: "p",
    text: "Una vez perfeccionado el contrato, Orbyx enviará al Cliente, por correo electrónico, **confirmación escrita con una copia íntegra, clara y legible** de estos Términos y su Anexo A, indicando la versión y la fecha de aceptación.",
  },
  { t: "h3", text: "3.3 Capacidad" },
  {
    t: "p",
    text: "Quien acepta estos Términos declara tener facultades suficientes para obligar al Cliente. El Servicio está dirigido exclusivamente a personas mayores de edad que actúan en el ejercicio de una actividad comercial o profesional.",
  },
  { t: "hr" },

  { t: "h2", text: "4. Descripción del Servicio" },
  { t: "p", text: "La Plataforma permite al Cliente, según el Plan contratado:" },
  {
    t: "ul",
    items: [
      "Gestionar agenda, horarios y disponibilidad.",
      "Recibir y administrar reservas de sus propios clientes.",
      "Mantener una base de datos de clientes e historial de atenciones.",
      "Administrar servicios, precios, profesionales y sucursales.",
      "Registrar información de atención según el rubro, incluyendo fichas clínicas cuando corresponda.",
      "Enviar comunicaciones a sus clientes por correo electrónico y, cuando esté habilitado, por WhatsApp.",
      "Acceder a reportes y estadísticas de su operación.",
    ],
  },
  {
    t: "p",
    text: "Las funcionalidades específicas de cada Plan se detallan en orbyx.cl y pueden variar conforme a la sección 9.",
  },
  { t: "hr" },

  { t: "h2", text: "5. Registro y cuenta" },
  { t: "h3", text: "5.1 Información veraz" },
  {
    t: "p",
    text: "El Cliente debe proporcionar información veraz, completa y actualizada al registrarse, y mantenerla actualizada.",
  },
  { t: "h3", text: "5.2 Credenciales" },
  {
    t: "p",
    text: "El Cliente es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada bajo su Cuenta. Debe notificar a Orbyx sin demora ante cualquier uso no autorizado.",
  },
  { t: "h3", text: "5.3 Usuarios internos" },
  {
    t: "p",
    text: "Si el Plan lo permite, el Cliente puede crear usuarios adicionales. El Cliente es responsable de la gestión de esos usuarios, de sus permisos y de su conducta dentro de la Plataforma.",
  },
  { t: "hr" },

  { t: "h2", text: "6. Planes, precios y pagos" },
  { t: "h3", text: "6.1 Planes vigentes" },
  {
    t: "table",
    headers: ["Plan", "Precio mensual"],
    rows: [
      ["Pro", "$12.990"],
      ["Premium", "$29.990"],
      ["VIP", "$54.990"],
      ["Platinum", "$149.990"],
    ],
  },
  {
    t: "p",
    text: "Los precios se expresan en pesos chilenos e incluyen los impuestos aplicables, salvo indicación distinta al momento de contratar.",
  },
  { t: "p", text: "Se aplican descuentos por pago semestral (10%) y anual (15%)." },
  { t: "h3", text: "6.2 Complementos" },
  {
    t: "p",
    text: "Determinados Planes permiten contratar complementos (paquetes de mensajes, usuarios o sucursales adicionales). Los complementos se facturan mensualmente con independencia del ciclo del Plan base y **no son acumulables**: las cuotas no utilizadas se reinician cada mes y no se traspasan al mes siguiente.",
  },
  { t: "h3", text: "6.3 Medio de pago" },
  {
    t: "p",
    text: "Los pagos se procesan a través de Flow, proveedor de servicios de pago. Orbyx no almacena los datos completos de las tarjetas.",
  },
  { t: "h3", text: "6.4 Cobro y renovación" },
  {
    t: "p",
    text: "La suscripción se renueva automáticamente al término de cada ciclo, cobrándose el medio de pago registrado, salvo que el Cliente la cancele antes de la fecha de renovación.",
  },
  {
    t: "p",
    text: "Orbyx informará al Cliente con anticipación razonable la fecha y el monto de cada renovación.",
  },
  { t: "h3", text: "6.5 Mora" },
  {
    t: "p",
    text: "El impago de una suscripción faculta a Orbyx para suspender el acceso al Servicio, previa notificación al Cliente y otorgándole un plazo razonable para regularizar. La suspensión no implica eliminación de los Datos del Cliente, que se rigen por la sección 14.",
  },
  { t: "hr" },

  { t: "h2", text: "7. Periodo de prueba" },
  { t: "p", text: "Orbyx puede ofrecer un periodo de prueba gratuito. Durante ese periodo:" },
  {
    t: "ul",
    items: [
      "El Cliente accede a las funcionalidades que Orbyx determine.",
      "No se realizan cobros mientras el periodo esté vigente.",
      "Orbyx informará con anticipación la fecha de término del periodo de prueba.",
      "El periodo de prueba **no otorga automáticamente beneficios de los Planes pagados**, tales como paquetes de mensajes.",
    ],
  },
  {
    t: "p",
    text: "Al término del periodo de prueba, el Cliente puede contratar un Plan o dejar de usar el Servicio. No se generan cobros sin una contratación expresa del Cliente.",
  },
  { t: "hr" },

  { t: "h2", text: "8. Cancelación" },
  { t: "h3", text: "8.1 Cancelación por el Cliente" },
  {
    t: "p",
    text: "El Cliente puede cancelar su suscripción **en cualquier momento y sin expresión de causa**, desde la propia Plataforma o escribiendo a contacto@orbyx.cl. La cancelación no genera penalización alguna.",
  },
  {
    t: "p",
    text: "La cancelación surte efecto al término del ciclo de facturación en curso. El Cliente mantiene acceso al Servicio hasta esa fecha.",
  },
  { t: "h3", text: "8.2 Efectos" },
  {
    t: "p",
    text: "Tras la cancelación, los Datos del Cliente se conservan y eliminan conforme a la sección 14 y al Anexo A.",
  },
  { t: "hr" },

  { t: "h2", text: "9. Modificaciones" },
  { t: "h3", text: "9.1 Modificaciones al Servicio" },
  {
    t: "p",
    text: "Orbyx puede incorporar, modificar o descontinuar funcionalidades. Cuando una modificación reduzca de forma sustancial las funcionalidades del Plan contratado, Orbyx lo comunicará al Cliente con **al menos 30 días corridos de anticipación**, y el Cliente podrá poner término al contrato sin penalización dentro de ese plazo, con derecho a la devolución proporcional de lo pagado y no utilizado.",
  },
  { t: "h3", text: "9.2 Modificaciones a estos Términos" },
  { t: "p", text: "Orbyx puede modificar estos Términos. Cuando la modificación sea sustancial:" },
  {
    t: "ul",
    items: [
      "Se comunicará al Cliente por correo electrónico y dentro de la Plataforma con **al menos 30 días corridos de anticipación** a su entrada en vigencia.",
      "El Cliente podrá **poner término al contrato sin penalización** dentro de ese plazo, con derecho a la devolución proporcional de lo pagado y no utilizado.",
      "Las modificaciones no se aplican retroactivamente.",
    ],
  },
  {
    t: "p",
    text: "**Orbyx no modificará unilateralmente el precio del Plan durante un ciclo ya pagado.** Los cambios de precio se comunicarán con al menos 30 días corridos de anticipación y regirán a partir del ciclo siguiente, pudiendo el Cliente cancelar sin penalización antes de esa fecha.",
  },
  { t: "hr" },

  { t: "h2", text: "10. Uso aceptable" },
  { t: "p", text: "El Cliente se obliga a no utilizar la Plataforma para:" },
  {
    t: "ul",
    items: [
      "Actividades ilícitas o contrarias al orden público.",
      "Almacenar o tratar información que no esté legalmente facultado para tratar.",
      "Enviar comunicaciones no solicitadas, engañosas o que infrinjan la normativa aplicable.",
      "Vulnerar derechos de terceros, incluidos derechos de propiedad intelectual y de protección de datos.",
      "Intentar acceder a datos, cuentas o entornos de otros clientes de Orbyx.",
      "Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma.",
      "Sobrecargar deliberadamente la infraestructura o eludir límites técnicos o de cuota.",
      "Revender o sublicenciar el Servicio sin autorización escrita de Orbyx.",
    ],
  },
  { t: "hr" },

  { t: "h2", text: "11. Obligaciones del Cliente respecto de sus propios clientes" },
  {
    t: "p",
    text: "El Cliente reconoce y acepta que, respecto de los datos personales de sus Clientes Finales:",
  },
  {
    t: "ul",
    items: [
      "**El Cliente es el responsable del tratamiento.** Determina las finalidades y los medios.",
      "Debe contar con un fundamento jurídico válido para recopilar y tratar dichos datos.",
      "Debe informar adecuadamente a sus Clientes Finales sobre el tratamiento de sus datos.",
      "Debe obtener las autorizaciones que la ley exija, especialmente respecto de **datos sensibles** y de **niños, niñas y adolescentes**.",
      "Es responsable del contenido, la legitimidad y los destinatarios de las campañas y comunicaciones que envíe.",
      "Debe atender los derechos que sus Clientes Finales ejerzan sobre sus datos.",
      "Debe cumplir la normativa sectorial aplicable a su rubro, incluida la normativa sanitaria cuando corresponda.",
    ],
  },
  {
    t: "p",
    text: "El detalle del tratamiento que Orbyx realiza por encargo del Cliente se regula en el **Anexo A**.",
  },
  { t: "hr" },

  { t: "h2", text: "12. Comunicaciones por WhatsApp y correo electrónico" },
  { t: "h3", text: "12.1 Naturaleza del servicio" },
  {
    t: "p",
    text: "Orbyx provee la funcionalidad técnica que permite al Cliente enviar comunicaciones a sus Clientes Finales. Orbyx actúa como intermediario tecnológico y **no es el emisor** del contenido de dichas comunicaciones.",
  },
  { t: "h3", text: "12.2 Proveedores" },
  {
    t: "p",
    text: "Los mensajes de WhatsApp se envían a través de Twilio y de la plataforma WhatsApp Business operada por Meta. El uso de este canal está sujeto a las políticas de dichos proveedores, que pueden cambiar sin intervención de Orbyx.",
  },
  { t: "h3", text: "12.3 Cuotas" },
  {
    t: "p",
    text: "Los Planes incluyen cuotas mensuales de mensajes. Alcanzada la cuota, el envío puede suspenderse hasta el siguiente ciclo o hasta la contratación de un complemento. Orbyx notificará al Cliente cuando se aproxime al límite.",
  },
  { t: "h3", text: "12.4 Responsabilidad del contenido" },
  {
    t: "p",
    text: "El Cliente es el único responsable del contenido de los mensajes que envía y de contar con las autorizaciones necesarias de sus destinatarios. Orbyx puede suspender el envío ante usos manifiestamente ilícitos o abusivos, previa notificación al Cliente salvo que la urgencia lo impida.",
  },
  { t: "h3", text: "12.5 Limitaciones del canal" },
  {
    t: "p",
    text: "El Cliente reconoce que la entrega de mensajes depende de terceros (Meta, Twilio, operadores móviles) y que Orbyx no puede garantizar la entrega, el momento de entrega ni la lectura de cada mensaje.",
  },
  { t: "hr" },

  { t: "h2", text: "13. Disponibilidad y soporte" },
  { t: "h3", text: "13.1 Disponibilidad" },
  {
    t: "p",
    text: "Orbyx procura mantener el Servicio disponible de forma continua y adopta medidas razonables para ello. No obstante, el Servicio puede experimentar interrupciones por mantenimiento, actualizaciones, fallas de proveedores de infraestructura o eventos fuera del control de Orbyx.",
  },
  {
    t: "p",
    text: "Orbyx comunicará con anticipación razonable las mantenciones programadas que impliquen indisponibilidad relevante, salvo urgencias de seguridad.",
  },
  {
    t: "p",
    text: "**Orbyx no ofrece actualmente un acuerdo de nivel de servicio (SLA) con compromisos de disponibilidad garantizada.** Si lo incorpora, lo informará y actualizará estos Términos conforme a la sección 9.",
  },
  { t: "h3", text: "13.2 Soporte" },
  {
    t: "p",
    text: "El soporte se presta por correo electrónico a contacto@orbyx.cl, en días hábiles. El alcance y los tiempos de respuesta pueden variar según el Plan contratado.",
  },
  { t: "hr" },

  { t: "h2", text: "14. Datos del Cliente" },
  { t: "h3", text: "14.1 Titularidad" },
  {
    t: "p",
    text: "**Los Datos del Cliente son de su exclusiva titularidad.** Orbyx no adquiere derecho de propiedad alguno sobre ellos y no los utiliza para finalidades ajenas a la prestación del Servicio.",
  },
  { t: "h3", text: "14.2 Exportación" },
  {
    t: "p",
    text: "El Cliente puede solicitar una copia de la información asociada a su Cuenta, en formato estructurado y de uso común, escribiendo a contacto@orbyx.cl, sujeto a factibilidad técnica y a los derechos de terceros.",
  },
  { t: "h3", text: "14.3 Conservación tras la cancelación" },
  {
    t: "p",
    text: "Tras la cancelación de la Cuenta, los Datos del Cliente se conservan durante **12 meses**, plazo destinado a permitir la eventual reactivación, la recuperación o exportación de información y la resolución de controversias. Transcurrido ese plazo, son eliminados o anonimizados.",
  },
  {
    t: "p",
    text: "La documentación tributaria y contable se conserva por los plazos que exige la normativa aplicable.",
  },
  {
    t: "p",
    text: "El Cliente puede solicitar la eliminación anticipada de sus datos escribiendo a contacto@orbyx.cl, sin perjuicio de la información que Orbyx deba conservar por mandato legal.",
  },
  { t: "hr" },

  { t: "h2", text: "15. Propiedad intelectual" },
  { t: "h3", text: "15.1 De Orbyx" },
  {
    t: "p",
    text: "La Plataforma, su código, diseño, marcas, documentación y todo elemento que la compone son de propiedad de Orbyx o de sus licenciantes. Estos Términos no transfieren al Cliente derecho de propiedad intelectual alguno, salvo la licencia de uso descrita en la sección 3.1.",
  },
  { t: "h3", text: "15.2 Del Cliente" },
  {
    t: "p",
    text: "El Cliente conserva todos los derechos sobre su marca, logotipos, contenidos y Datos del Cliente. Otorga a Orbyx una licencia limitada para alojarlos, procesarlos y mostrarlos exclusivamente en la medida necesaria para prestar el Servicio.",
  },
  { t: "h3", text: "15.3 Sugerencias" },
  {
    t: "p",
    text: "Si el Cliente propone mejoras o funcionalidades, Orbyx puede implementarlas libremente, sin que ello genere obligación de pago ni derecho de propiedad a favor del Cliente.",
  },
  { t: "hr" },

  { t: "h2", text: "16. Confidencialidad" },
  {
    t: "p",
    text: "Cada parte se obliga a mantener en reserva la información confidencial de la otra a la que acceda con ocasión de este contrato, y a no divulgarla ni utilizarla para fines distintos de la ejecución del contrato.",
  },
  {
    t: "p",
    text: "Esta obligación subsiste durante la vigencia del contrato y por **cinco años** contados desde su término. No aplica a información que sea pública, que la parte receptora ya poseyera legítimamente, o cuya divulgación sea exigida por autoridad competente.",
  },
  { t: "hr" },

  { t: "h2", text: "17. Protección de datos personales" },
  { t: "p", text: "El tratamiento de datos personales se rige por:" },
  {
    t: "ul",
    items: [
      "La **Política de Privacidad** de Orbyx, publicada en orbyx.cl/privacidad.",
      "El **Anexo A — Acuerdo de Tratamiento de Datos**, que forma parte integrante de estos Términos.",
    ],
  },
  {
    t: "p",
    text: "En caso de discrepancia entre estos Términos y el Anexo A en materia de tratamiento de datos personales, **prevalece el Anexo A**.",
  },
  { t: "hr" },

  { t: "h2", text: "18. Responsabilidad" },
  { t: "h3", text: "18.1 Responsabilidad de Orbyx" },
  {
    t: "p",
    text: "Orbyx responde de los perjuicios que cause al Cliente por el incumplimiento de sus obligaciones bajo estos Términos, conforme a las reglas generales del derecho chileno.",
  },
  {
    t: "p",
    text: "**Orbyx no excluye ni limita su responsabilidad** por dolo, culpa grave, daños a las personas, ni en aquellos casos en que la ley no permita limitarla.",
  },
  { t: "h3", text: "18.2 Limitación" },
  {
    t: "p",
    text: "Fuera de los casos señalados en el párrafo anterior, y en la medida en que la ley lo permita, la responsabilidad de Orbyx por perjuicios derivados de la prestación del Servicio se limita al monto efectivamente pagado por el Cliente durante los doce meses anteriores al hecho que origina la responsabilidad.",
  },
  {
    t: "p",
    text: "Esta limitación no resulta aplicable cuando el Cliente sea una micro o pequeña empresa y la ley disponga su improcedencia.",
  },
  { t: "h3", text: "18.3 Responsabilidad del Cliente" },
  {
    t: "p",
    text: "El Cliente responde frente a Orbyx por los perjuicios derivados del uso de la Plataforma en infracción a estos Términos, en particular por el tratamiento ilícito de datos de sus Clientes Finales y por el contenido de las comunicaciones que envíe.",
  },
  { t: "h3", text: "18.4 Terceros" },
  {
    t: "p",
    text: "Orbyx no responde por interrupciones, fallas o cambios de política de proveedores de terceros (Meta, Twilio, Flow, proveedores de infraestructura), sin perjuicio de su deber de elegirlos con diligencia y de adoptar medidas razonables ante incidencias.",
  },
  { t: "hr" },

  { t: "h2", text: "19. Suspensión y término por Orbyx" },
  { t: "h3", text: "19.1 Causales" },
  { t: "p", text: "Orbyx puede suspender o terminar el Servicio cuando el Cliente:" },
  {
    t: "ul",
    items: [
      "Incumpla gravemente estos Términos.",
      "Utilice la Plataforma para fines ilícitos.",
      "No pague la suscripción en los términos de la sección 6.5.",
      "Ponga en riesgo la seguridad o el funcionamiento de la Plataforma o de otros clientes.",
    ],
  },
  { t: "h3", text: "19.2 Procedimiento" },
  {
    t: "p",
    text: "Salvo casos de ilicitud manifiesta o riesgo grave e inminente de seguridad, Orbyx **notificará previamente** al Cliente, describiendo el incumplimiento y otorgándole un plazo razonable, no inferior a **10 días corridos**, para subsanarlo.",
  },
  { t: "h3", text: "19.3 Efectos" },
  {
    t: "p",
    text: "Terminado el contrato por esta causa, el Cliente mantiene el derecho a exportar sus datos conforme a la sección 14.2 durante el plazo de conservación establecido en la sección 14.3.",
  },
  { t: "hr" },

  { t: "h2", text: "20. Fuerza mayor" },
  {
    t: "p",
    text: "Ninguna parte responde por el incumplimiento de sus obligaciones cuando este se deba a caso fortuito o fuerza mayor, en los términos del artículo 45 del Código Civil. La parte afectada deberá informarlo a la otra tan pronto como sea posible.",
  },
  { t: "hr" },

  { t: "h2", text: "21. Cesión" },
  { t: "p", text: "El Cliente no puede ceder este contrato sin autorización escrita de Orbyx." },
  {
    t: "p",
    text: "Orbyx puede ceder este contrato en caso de reorganización societaria, fusión o venta de activos, informando al Cliente con anticipación razonable. Si la cesión implica un cambio sustancial en las condiciones del Servicio, el Cliente puede terminar el contrato sin penalización, con devolución proporcional de lo pagado y no utilizado.",
  },
  { t: "hr" },

  { t: "h2", text: "22. Comunicaciones" },
  {
    t: "p",
    text: "Las comunicaciones de Orbyx al Cliente se realizarán al correo electrónico registrado en la Cuenta o mediante avisos dentro de la Plataforma. Es responsabilidad del Cliente mantener actualizado su correo.",
  },
  { t: "p", text: "Las comunicaciones del Cliente a Orbyx se dirigirán a **contacto@orbyx.cl**." },
  { t: "hr" },

  { t: "h2", text: "23. Nulidad parcial" },
  {
    t: "p",
    text: "Si alguna disposición de estos Términos fuere declarada nula o inaplicable, las demás mantendrán su plena vigencia, y la disposición afectada se entenderá reemplazada por aquella que más se aproxime a su finalidad dentro del marco legal.",
  },
  { t: "hr" },

  { t: "h2", text: "24. Legislación aplicable y competencia" },
  { t: "p", text: "Estos Términos se rigen por las leyes de la República de Chile." },
  {
    t: "p",
    text: "Cualquier controversia será sometida a los tribunales ordinarios de justicia competentes conforme a las reglas generales.",
  },
  {
    t: "p",
    text: "**Cuando el Cliente sea una micro o pequeña empresa**, en los términos de la Ley N° 20.416, le resultan aplicables las normas establecidas en su favor por la Ley N° 19.496 en las materias que dicha ley señala. **Esta protección es irrenunciable anticipadamente**, y nada en estos Términos podrá interpretarse como una renuncia a ella ni como una alteración de las reglas de competencia que la ley establezca en su favor.",
  },
  { t: "hr" },

  { t: "h2", text: "25. Vigencia y versiones" },
  {
    t: "p",
    text: "Estos Términos entran en vigencia en la fecha indicada al inicio y permanecen vigentes mientras el Cliente mantenga una Cuenta activa.",
  },
  {
    t: "p",
    text: "Orbyx conserva el registro de la versión aceptada por cada Cliente y la fecha de aceptación. El Cliente puede solicitar copia de la versión que aceptó escribiendo a contacto@orbyx.cl.",
  },
  { t: "hr" },

  { t: "h2", text: "ANEXO A — Acuerdo de Tratamiento de Datos (DPA)" },
  {
    t: "p",
    text: "**Forma parte integrante de los Términos de Servicio de Orbyx Soluciones Digitales SpA.**",
  },
  { t: "h3", text: "A.1 Partes y ámbito" },
  {
    t: "p",
    text: "Este Acuerdo regula el tratamiento de datos personales que **Orbyx Soluciones Digitales SpA** (\"Orbyx\") realiza **por encargo del Cliente**, en el marco de la prestación del Servicio.",
  },
  {
    t: "p",
    text: "Se aplica exclusivamente a los datos personales de los **Clientes Finales** y demás titulares cuyos datos el Cliente incorpore a la Plataforma.",
  },
  {
    t: "p",
    text: "No se aplica a los datos respecto de los cuales Orbyx actúa como responsable, regulados en la Política de Privacidad.",
  },
  { t: "h3", text: "A.2 Rol de las partes" },
  {
    t: "table",
    headers: ["Parte", "Rol"],
    rows: [
      ["**El Cliente**", "Responsable de datos. Determina las finalidades y los medios del tratamiento."],
      ["**Orbyx**", "Tercero mandatario o encargado. Trata los datos conforme al encargo y a las instrucciones del Cliente."],
    ],
  },
  { t: "h3", text: "A.3 Elementos del encargo" },
  {
    t: "p",
    text: "Conforme a la legislación chilena aplicable, el encargo queda definido en los siguientes términos:",
  },
  { t: "h3", text: "A.3.1 Objeto" },
  {
    t: "p",
    text: "La prestación del Servicio descrito en los Términos: alojamiento, procesamiento y puesta a disposición de la información necesaria para que el Cliente gestione su agenda, sus reservas, su base de clientes y sus comunicaciones.",
  },
  { t: "h3", text: "A.3.2 Duración" },
  {
    t: "p",
    text: "Desde la aceptación de los Términos y mientras la Cuenta permanezca activa, extendiéndose por el plazo de conservación establecido en la cláusula A.10.",
  },
  { t: "h3", text: "A.3.3 Finalidad" },
  {
    t: "p",
    text: "Exclusivamente la ejecución del Servicio contratado. Orbyx **no tratará estos datos para finalidades propias** ni distintas de las convenidas.",
  },
  { t: "p", text: "En particular, Orbyx **no utilizará** los datos de los Clientes Finales para:" },
  {
    t: "ul",
    items: [
      "Promocionar sus propios servicios a dichas personas.",
      "Comercializarlos ni cederlos a terceros con fines publicitarios o de perfilamiento.",
      "Entrenar modelos generales de inteligencia artificial de terceros para fines propios de dichos terceros.",
    ],
  },
  { t: "h3", text: "A.3.4 Tipos de datos" },
  {
    t: "p",
    text: "Según el rubro del Cliente y las funcionalidades que utilice, el tratamiento puede comprender:",
  },
  {
    t: "table",
    headers: ["Categoría", "Contenido"],
    rows: [
      ["Identificación", "Nombre, apellido, RUT, fecha de nacimiento"],
      ["Contacto", "Teléfono, correo electrónico, dirección"],
      ["Agenda", "Historial de reservas, horarios, profesional asignado, estado"],
      ["Comerciales", "Historial de servicios, preferencias, notas internas"],
      ["Mascotas", "Especie, raza, edad, historial, vinculados a su tutor"],
      ["**Sensibles (según rubro)**", "Fichas clínicas veterinarias, fichas médicas humanas, notas clínicas"],
      ["Archivos", "Fotografías y documentos adjuntos"],
    ],
  },
  { t: "h3", text: "A.3.5 Categorías de titulares" },
  {
    t: "ul",
    items: [
      "Clientes Finales del Cliente, incluidos eventualmente niños, niñas y adolescentes.",
      "Tutores o responsables de mascotas.",
      "Personal y profesionales del Cliente registrados en la Plataforma.",
      "Terceros cuyos datos el Cliente incorpore legítimamente.",
    ],
  },
  { t: "hr" },

  { t: "h3", text: "A.4 Instrucciones del Cliente" },
  {
    t: "p",
    text: "Orbyx trata los datos únicamente conforme a las instrucciones documentadas del Cliente, las que se entienden constituidas por:",
  },
  {
    t: "ul",
    items: [
      "Los Términos de Servicio y este Anexo.",
      "La configuración que el Cliente establece en la Plataforma.",
      "Las instrucciones adicionales que el Cliente comunique por escrito y que sean técnicamente factibles y jurídicamente admisibles.",
    ],
  },
  {
    t: "p",
    text: "Si Orbyx estima que una instrucción del Cliente infringe la legislación aplicable, se lo informará y podrá abstenerse de ejecutarla.",
  },
  {
    t: "p",
    text: "**Si Orbyx tratara los datos con un objeto distinto del encargo convenido, o los comunicara sin autorización, será considerado responsable de datos para todos los efectos legales**, respondiendo personalmente por las infracciones y solidariamente con el Cliente por los daños ocasionados.",
  },
  { t: "hr" },

  { t: "h3", text: "A.5 Obligaciones de Orbyx" },
  { t: "p", text: "Orbyx se obliga a:" },
  {
    t: "ol",
    items: [
      "Tratar los datos exclusivamente conforme al encargo.",
      "Guardar **secreto o confidencialidad** sobre los datos, obligación que subsiste tras el término de la relación.",
      "Adoptar las medidas de seguridad descritas en la cláusula A.7.",
      "Asegurar que su personal con acceso a los datos esté sujeto a deber de confidencialidad.",
      "No comunicar ni ceder los datos a terceros, salvo autorización del Cliente, lo previsto en la cláusula A.8, o mandato legal.",
      "Asistir al Cliente conforme a las cláusulas A.9 y A.11.",
      "Suprimir o devolver los datos conforme a la cláusula A.10.",
      "Poner a disposición del Cliente la información razonable que acredite el cumplimiento de estas obligaciones.",
    ],
  },
  { t: "hr" },

  { t: "h3", text: "A.6 Obligaciones del Cliente" },
  { t: "p", text: "El Cliente se obliga a:" },
  {
    t: "ol",
    items: [
      "Contar con un fundamento jurídico válido para el tratamiento de los datos que incorpore.",
      "Informar adecuadamente a sus Clientes Finales.",
      "Obtener las autorizaciones exigidas por ley, especialmente respecto de **datos sensibles** y de **niños, niñas y adolescentes**.",
      "No incorporar datos que no esté facultado para tratar.",
      "Configurar adecuadamente los permisos de sus usuarios internos.",
      "Atender los derechos que ejerzan sus Clientes Finales.",
      "Comunicar a Orbyx cualquier circunstancia que afecte el encargo.",
    ],
  },
  { t: "hr" },

  { t: "h3", text: "A.7 Medidas de seguridad" },
  { t: "p", text: "Orbyx aplica las siguientes medidas:" },
  {
    t: "ul",
    items: [
      "**Aislamiento multi-tenant**: separación lógica de los datos de cada Cliente, mediante validación de pertenencia en cada operación de lectura y escritura.",
      "**Control de acceso**: autenticación de usuarios y gestión de permisos.",
      "**Mínimo privilegio**: acceso limitado a lo necesario para cada función.",
      "**Protección de credenciales**: las contraseñas no se almacenan en texto plano.",
      "**Comunicaciones cifradas** mediante HTTPS/TLS.",
      "**Respaldos** periódicos para recuperación ante incidentes.",
      "**Registro de actividad** de operaciones dentro de la Plataforma.",
      "**Actualización de componentes** y corrección de vulnerabilidades detectadas.",
    ],
  },
  {
    t: "p",
    text: "Orbyx no declara contar con certificaciones ISO 27001, SOC 2, auditorías externas periódicas ni programas de pruebas de penetración permanentes. Si las incorpora, lo informará al Cliente.",
  },
  { t: "h3", text: "A.7.1 Acceso administrativo" },
  {
    t: "p",
    text: "Orbyx no dispone de una funcionalidad que permita a su personal iniciar sesión en la Cuenta del Cliente y navegar sus datos como si fuera este.",
  },
  {
    t: "p",
    text: "Existe, no obstante, la posibilidad técnica de acceder a la información a través de la infraestructura de base de datos. Dicho acceso queda restringido a personal autorizado, limitado a una necesidad legítima de soporte, seguridad, mantenimiento o cumplimiento legal, sujeto a mínimo privilegio y a deber de confidencialidad.",
  },
  { t: "hr" },

  { t: "h3", text: "A.8 Subencargados" },
  { t: "p", text: "El Cliente autoriza a Orbyx a recurrir a los siguientes subencargados:" },
  {
    t: "table",
    headers: ["Subencargado", "Función", "País"],
    rows: [
      ["**Supabase Inc.**", "Base de datos y autenticación", "Estados Unidos"],
      ["**Vercel Inc.**", "Alojamiento del frontend", "Estados Unidos"],
      ["**Render Services Inc.**", "Alojamiento del backend", "Estados Unidos"],
      ["**Twilio Inc.**", "Mensajería WhatsApp", "Estados Unidos"],
      ["**Meta Platforms Inc.**", "Plataforma WhatsApp Business", "Estados Unidos"],
      ["**Resend Inc.**", "Correo transaccional", "Estados Unidos"],
      ["**Flow S.A.**", "Procesamiento de pagos", "Chile"],
    ],
  },
  {
    t: "p",
    text: "Orbyx procura que los subencargados queden sujetos a obligaciones de protección de datos equivalentes a las de este Anexo.",
  },
  {
    t: "p",
    text: "Orbyx informará al Cliente con **al menos 30 días corridos de anticipación** la incorporación o sustitución de un subencargado. Si el Cliente se opone fundadamente, podrá terminar el contrato sin penalización, con devolución proporcional de lo pagado y no utilizado.",
  },
  { t: "hr" },

  { t: "h3", text: "A.9 Transferencias internacionales" },
  {
    t: "p",
    text: "Como consecuencia de lo anterior, determinados datos pueden ser procesados o almacenados fuera de Chile.",
  },
  {
    t: "p",
    text: "Orbyx adoptará las medidas y bases jurídicas que la legislación chilena exija para dichas transferencias, incluyendo la suscripción de cláusulas contractuales apropiadas con sus subencargados.",
  },
  { t: "hr" },

  { t: "h3", text: "A.10 Supresión o devolución" },
  {
    t: "p",
    text: "Terminada la prestación del Servicio, Orbyx conservará los datos durante **12 meses**, plazo destinado a permitir la eventual reactivación de la Cuenta, la recuperación o exportación de información y la resolución de controversias.",
  },
  { t: "p", text: "Durante ese plazo, el Cliente puede solicitar:" },
  {
    t: "ul",
    items: [
      "La **devolución** de los datos en formato estructurado y de uso común, o",
      "Su **supresión anticipada**.",
    ],
  },
  {
    t: "p",
    text: "Transcurrido el plazo, Orbyx suprimirá o anonimizará los datos, salvo aquellos que deba conservar por mandato legal.",
  },
  {
    t: "p",
    text: "Los respaldos técnicos pueden mantener copias durante un periodo adicional acotado, tras el cual son sobrescritos conforme al ciclo de respaldos.",
  },
  { t: "hr" },

  { t: "h3", text: "A.11 Derechos de los titulares" },
  {
    t: "p",
    text: "Los Clientes Finales ejercen sus derechos **ante el Cliente**, en su calidad de responsable.",
  },
  { t: "p", text: "Si un titular dirige una solicitud a Orbyx, este:" },
  {
    t: "ul",
    items: [
      "Le informará que debe dirigirse al Cliente responsable.",
      "Comunicará la solicitud al Cliente sin dilaciones indebidas.",
      "Prestará al Cliente la asistencia razonable para responderla, dentro de las capacidades técnicas de la Plataforma.",
    ],
  },
  {
    t: "p",
    text: "Orbyx no atenderá directamente solicitudes de supresión o rectificación sobre datos de Clientes Finales sin instrucción del Cliente, salvo mandato legal u orden de autoridad competente.",
  },
  { t: "hr" },

  { t: "h3", text: "A.12 Vulneraciones de seguridad" },
  {
    t: "p",
    text: "Ante una vulneración de las medidas de seguridad que ocasione destrucción, filtración, pérdida o alteración accidental o ilícita de los datos, o el acceso o comunicación no autorizados a estos, Orbyx:",
  },
  {
    t: "ol",
    items: [
      "**Notificará al Cliente** por los medios más expeditos posibles y **sin dilaciones indebidas**.",
      "Le entregará la información disponible sobre la naturaleza de la vulneración, las categorías de datos y de titulares afectados, sus efectos y las medidas adoptadas.",
      "Prestará la asistencia razonable para que el Cliente cumpla sus propias obligaciones de reporte y comunicación.",
    ],
  },
  {
    t: "p",
    text: "**Corresponde al Cliente**, como responsable, efectuar las notificaciones que la ley le imponga ante la autoridad de control y ante los titulares afectados.",
  },
  { t: "p", text: "Orbyx mantendrá registro de estas comunicaciones." },
  { t: "hr" },

  { t: "h3", text: "A.13 Datos sensibles" },
  {
    t: "p",
    text: "Cuando el Cliente pertenezca a un rubro que implique el tratamiento de datos relativos a la salud u otros datos sensibles:",
  },
  {
    t: "ul",
    items: [
      "El Cliente reconoce que la ley somete estos datos a un régimen más estricto y asume la responsabilidad de cumplirlo.",
      "Orbyx aplicará las medidas de seguridad de la cláusula A.7 con especial diligencia sobre estos datos.",
      "Orbyx **no utilizará información clínica para finalidad alguna distinta** de la prestación del Servicio.",
      "Las funcionalidades automatizadas que Orbyx incorpore en el futuro operarán bajo restricciones reforzadas respecto de esta información, conforme a su Política de Privacidad.",
    ],
  },
  { t: "hr" },

  { t: "h3", text: "A.14 Responsabilidad" },
  {
    t: "p",
    text: "Cada parte responde por el incumplimiento de las obligaciones que este Anexo le impone, conforme a la legislación aplicable.",
  },
  { t: "hr" },

  { t: "h3", text: "A.15 Vigencia y prevalencia" },
  {
    t: "p",
    text: "Este Anexo rige desde la aceptación de los Términos de Servicio y mientras Orbyx trate datos por encargo del Cliente.",
  },
  {
    t: "p",
    text: "En materia de tratamiento de datos personales, **prevalece por sobre cualquier disposición contraria** de los Términos de Servicio.",
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

export default function TerminosPage() {
  return (
    <PublicThemeProvider>
      <TerminosContent />
    </PublicThemeProvider>
  );
}

function TerminosContent() {
  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      className="min-h-screen bg-[var(--pub-bg)] text-[var(--pub-text)]"
    >
      <style>{`
        @media print {
          .pub-print-hide {
            display: none !important;
          }
          body, main {
            background: #ffffff !important;
          }
          .pub-print-content, .pub-print-content * {
            color: #000000 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .pub-print-content a {
            color: #000000 !important;
            text-decoration: underline !important;
          }
        }
      `}</style>

      <div className="pub-print-hide mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 lg:px-10">
        <PublicHeader />
      </div>

      <section className="pub-print-content px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            style={serif}
            className="text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--pub-text)] sm:text-[42px]"
          >
            Términos de Servicio
          </h1>
          <p className="mt-3 text-base text-[var(--pub-text-muted)]">Orbyx Soluciones Digitales SpA</p>

          <div className="mx-auto mt-6 inline-flex flex-col items-start gap-1 rounded-xl border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] px-5 py-4 text-left text-sm text-[var(--pub-text-muted)]">
            <p>{renderInline("**Versión:** 1.0")}</p>
            <p>{renderInline(`**Última actualización:** ${FECHA_PUBLICACION}`)}</p>
            <p>{renderInline("**Publicados en:** orbyx.cl/terminos")}</p>
          </div>

          <div className="pub-print-hide mt-6">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--pub-accent)] px-5 py-2.5 text-sm font-bold text-[var(--pub-accent-text)] shadow-[0_0_20px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              🖨️ Imprimir o guardar como PDF
            </button>
          </div>
        </div>
      </section>

      <article className="pub-print-content px-4 pb-20 sm:px-6 lg:px-10">
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

      <div className="pub-print-hide">
        <PublicFooter />
      </div>
    </main>
  );
}
