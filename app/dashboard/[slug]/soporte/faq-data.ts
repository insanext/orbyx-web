// Preguntas frecuentes del panel (Soporte → Preguntas frecuentes).
// `answer`: cada string es un párrafo; los que empiezan con "- " se muestran
// como lista. Mantener las respuestas alineadas con cómo funciona el panel
// hoy (revisado 2026-10-26).

export type FaqItem = { question: string; answer: string[] }
export type FaqIconKey =
  | 'clock'
  | 'calendar'
  | 'users'
  | 'star'
  | 'megaphone'
  | 'briefcase'
  | 'staff'
  | 'card'
  | 'database'
  | 'globe'
  | 'building'
  | 'headset'
export type FaqCategory = {
  id: string
  title: string
  /** Clave de ícono (ver FAQ_ICONS en FaqAccordion.tsx). */
  icon: FaqIconKey
  description: string
  /** Temas importantes: se destacan arriba. */
  featured?: boolean
  items: FaqItem[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'horarios',
    title: 'Horarios y disponibilidad',
    icon: 'clock',
    description: 'Capas de horario, fechas especiales, bloqueos y reglas de reserva.',
    featured: true,
    items: [
      {
        question: '¿Cómo funcionan los horarios? ¿Por qué hay varias capas?',
        answer: [
          'Los horarios se arman de capa en capa, de lo general a lo particular. Cada capa siempre queda dentro de la anterior:',
          '- 1. Negocio: el horario general (Mi Negocio → Horarios). Es la base para todo.',
          '- 2. Sucursal: cada sucursal usa el horario del negocio o tiene uno propio (Mi Negocio → Sucursales).',
          '- 3. Profesional: cada profesional usa el horario de su sucursal o uno propio (Staff → Horarios).',
          'Un cliente solo puede reservar cuando las tres capas están abiertas al mismo tiempo. Por ejemplo, si el negocio abre de 10:00 a 19:00 y un profesional tiene horario de 9:00 a 14:00, ese profesional recibirá reservas solo de 10:00 a 14:00.',
        ],
      },
      {
        question: '¿Cómo cierro el negocio un feriado o un día especial?',
        answer: [
          'En Mi Negocio → Fechas especiales agrega la fecha (o un rango "desde / hasta") con un nombre, por ejemplo "Fiestas Patrias" o "Aniversario de la empresa".',
          'Puedes cerrar el día completo o solo unas horas (por ejemplo, abrir solo en la mañana).',
          'Las fechas especiales del negocio se aplican a todas las sucursales. Cada sucursal además puede tener sus propias fechas especiales: se suman al cierre general, no lo reemplazan.',
        ],
      },
      {
        question: '¿Cómo bloqueo las vacaciones o un permiso de un profesional?',
        answer: [
          'En Staff, abre al profesional y agrega una fecha especial: un día, un rango de días (vacaciones) o solo unas horas (por ejemplo, si pidió la mañana libre para un trámite).',
          'En ese tiempo no recibirá reservas, pero el resto del equipo sigue disponible con normalidad.',
          'Las reservas que ya existían en esas fechas no se cancelan solas: revísalas en la Agenda y reagéndalas o cancélalas.',
        ],
      },
      {
        question: '¿Qué es "Bloquear horario" en la Agenda?',
        answer: [
          'Es un bloqueo rápido para tapar un rato puntual sin tocar la configuración de horarios: una reunión, una urgencia o un almuerzo más largo.',
          'Toca un espacio libre de la grilla y elige "Bloquear horario". Puedes bloquear a un profesional o a toda la sucursal. Mientras el bloqueo exista, ese horario no aparece para reservar, y lo quitas desde la misma Agenda cuando quieras.',
        ],
      },
      {
        question: '¿Puedo evitar que me reserven con muy poca anticipación?',
        answer: [
          'Sí. En Mi Negocio → Horarios → Reglas de reserva eliges el "Tiempo mínimo antes de reservar". Por ejemplo, con 2 horas nadie podrá reservar algo que empieza en menos de 2 horas, así tienes tiempo de prepararte.',
          'Esta regla aplica a tu página pública. Las reservas que haces tú desde la Agenda no tienen esa restricción.',
        ],
      },
      {
        question: '¿Hasta cuántos días hacia adelante pueden reservar mis clientes?',
        answer: [
          'Lo defines en Mi Negocio → Horarios → Reglas de reserva, con "Máximo días hacia adelante". Por ejemplo, con 30 días tu calendario público solo muestra el próximo mes.',
          'Sirve para no comprometer fechas lejanas si todavía no tienes claros tus horarios. Tú sí puedes agendar más allá desde la Agenda.',
        ],
      },
      {
        question: '¿Puedo mostrar los horarios cada 15 minutos, cada media hora o cada hora?',
        answer: [
          'Sí. En Mi Negocio → Horarios → Intervalo de horarios eliges cada cuántos minutos se muestran las horas: 15, 30, 45, 60 minutos o un valor personalizado.',
          'Ese intervalo define qué horas de inicio ven tus clientes en la página de reservas y cómo se ve la grilla de tu Agenda. La duración real de cada reserva la da el servicio (más sus tiempos de preparación).',
        ],
      },
      {
        question: '¿Por qué un día aparece sin horas disponibles en mi página?',
        answer: [
          'Revisa, en este orden:',
          '- Que el negocio, la sucursal y el profesional tengan ese día abierto (las tres capas).',
          '- Que no haya una fecha especial o un bloqueo ese día.',
          '- Que el servicio tenga al menos un profesional asignado que trabaje ese día.',
          '- Que no esté todo ocupado, y que el día no quede fuera del tiempo mínimo antes de reservar o del máximo de días hacia adelante.',
        ],
      },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda y reservas',
    icon: 'calendar',
    description: 'Agendar, cancelar, reagendar y marcar asistencia.',
    items: [
      {
        question: '¿Puedo agendar yo mismo si un cliente me llama o me escribe?',
        answer: [
          'Sí. En la Agenda toca un espacio libre de la grilla y elige "Agendar cliente" (en el celular, usa el botón para agregar una reserva). Elige servicio, profesional, día y hora, y completa los datos del cliente.',
          'La reserva queda igual que una hecha desde tu página: bloquea el horario y al cliente le llega la confirmación por correo (y por WhatsApp, si lo tienes activado). Desde la Agenda puedes agendar aunque falte poco para la hora o sea muy lejos en el futuro.',
        ],
      },
      {
        question: '¿Puedo eliminar una reserva?',
        answer: [
          'Las reservas no se borran: se cancelan. Abre la reserva y toca "Cancelar reserva". El horario queda libre al instante para otro cliente y la reserva queda en el historial como "Cancelada".',
          'Así no pierdes el registro de lo que pasó con ese cliente.',
        ],
      },
      {
        question: '¿Cómo cambio el día u hora de una reserva?',
        answer: [
          'Crea la nueva reserva en el día y hora correctos y marca la anterior como "Reagendó" (o cancélala). Así queda el registro de que el cliente cambió su hora.',
        ],
      },
      {
        question: '¿Mis clientes pueden cancelar solos?',
        answer: [
          'Sí. En el correo de confirmación tienen un enlace para cancelar. Si lo usan, la reserva queda "Cancelada" y el horario se libera automáticamente.',
        ],
      },
      {
        question: '¿Qué significa el botón "N pendientes" de la Agenda?',
        answer: [
          'Son reservas que ya pasaron y todavía no marcas qué ocurrió. Ábrelas y marca "Asistió", "No asistió", "Reagendó" o "Cancelar".',
          'Mantenerlo al día hace que tus Indicadores y las categorías de Clientes (Activo, En riesgo, etc.) sean más exactos, y te deja ver qué clientes suelen faltar.',
        ],
      },
      {
        question: '¿Se envían recordatorios a mis clientes?',
        answer: [
          '- Por correo: un recordatorio automático unas 24 horas antes, para todos los negocios.',
          '- Por WhatsApp: confirmación al reservar y recordatorio 1 o 2 horas antes. Se activan en el botón del rayo (Activaciones), arriba a la derecha, y usan el cupo de mensajes de tu plan.',
          '- Manual: en el detalle de cada reserva tienes "Confirmar por WhatsApp" y "Recordatorio manual", que abren WhatsApp con el mensaje listo. No gastan cupo.',
        ],
      },
      {
        question: '¿Cómo veo la agenda de un solo profesional o de un día?',
        answer: [
          'Arriba de la Agenda cambias entre "Semana", "Día por profesional" (una columna por profesional) y "Lista". Con "Filtros" eliges profesional, servicio o estado, y con la búsqueda encuentras una reserva por nombre.',
        ],
      },
      {
        question: '¿Puedo pedir un abono o depósito antes de confirmar la reserva?',
        answer: [
          'Sí. En el botón del rayo (Activaciones) activa "Depósito previo" y completa tus datos bancarios. El cliente verá esos datos al reservar y deberá subir el comprobante de transferencia.',
          'La hora queda apartada 10 minutos mientras revisas. En la Agenda, el botón "Depósitos pendientes" te muestra los comprobantes para confirmar o rechazar. Orbyx no recibe ni maneja el dinero: la transferencia va directo a tu cuenta.',
        ],
      },
      {
        question: '¿Qué pasa si mi Google Calendar se desconecta?',
        answer: [
          'Tus reservas se siguen creando con normalidad en Orbyx. Solo se pausa la copia automática a Google Calendar hasta que vuelvas a conectar tu cuenta.',
        ],
      },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    icon: 'users',
    description: 'Ficha, categorías, importación y contactos bloqueados.',
    items: [
      {
        question: '¿De dónde salen mis clientes? ¿Tengo que crearlos?',
        answer: [
          'No hace falta. Cada vez que alguien reserva (en tu página o cuando agendas tú), el cliente se crea o se actualiza solo, identificado por su teléfono o correo.',
        ],
      },
      {
        question: '¿Qué significan Prospecto, Nuevo, Activo, En riesgo e Inactivo?',
        answer: [
          'Orbyx clasifica a cada cliente según sus visitas reales (las reservas a las que asistió):',
          '- Prospecto: todavía no tiene visitas.',
          '- Nuevo: tiene 1 visita reciente.',
          '- Activo: tiene 2 o más visitas y la última es reciente.',
          '- En riesgo: hace un tiempo que no viene.',
          '- Inactivo: hace mucho que no viene.',
          'Pasa el mouse (o toca la "i") sobre cada categoría para ver cuántos días usa cada una. Las inasistencias se cuentan aparte y no cambian la categoría.',
        ],
      },
      {
        question: '¿Cómo encuentro a los clientes que hace tiempo no vienen?',
        answer: [
          'Usa los botones de categoría (por ejemplo "En riesgo") o el filtro "Días sin venir". Puedes combinarlos, y con esa misma lista crear una campaña para invitarlos a volver.',
        ],
      },
      {
        question: '¿Puedo ver el historial de un cliente?',
        answer: [
          'Sí. Abre su ficha desde la lista: verás sus datos, sus reservas pasadas y futuras, inasistencias y notas. En veterinarias y clínicas la ficha incluye mascotas o datos del paciente y notas clínicas.',
        ],
      },
      {
        question: '¿Puedo cargar mis clientes desde un Excel?',
        answer: [
          'Sí, con "Importar clientes". Sube un Excel (.xlsx) o CSV con nombre y teléfono o correo. Antes de guardar verás una vista previa con los errores y duplicados, y si algo salió mal puedes deshacer la importación.',
          'Si vienes de otro sistema y también tienes reservas, usa mejor "Migrar mis datos" (ver Migración de datos).',
        ],
      },
      {
        question: '¿Puedo impedir que alguien reserve en mi página?',
        answer: [
          'Sí. En la lista de Clientes o en el detalle de una reserva toca "Bloquear". Esa persona ya no podrá reservar desde tu página (verá un aviso para contactarte directamente), pero tú sí puedes agendarle desde la Agenda.',
          'Para desbloquearla, entra a "Contactos bloqueados" en Clientes.',
        ],
      },
      {
        question: '¿Puedo eliminar un cliente?',
        answer: [
          'Por ahora no se eliminan clientes desde el panel, para no perder su historial de reservas. Puedes editar sus datos o bloquearlo. Si necesitas borrar los datos de una persona, escríbenos con un ticket.',
        ],
      },
    ],
  },
  {
    id: 'resenas',
    title: 'Reseñas',
    icon: 'star',
    description: 'Cómo llegan, cómo pedirlas y qué puedes hacer con ellas.',
    items: [
      {
        question: '¿Quién puede dejarme una reseña?',
        answer: [
          'Solo clientes que realmente se atendieron contigo: para opinar, la persona se identifica con el teléfono o correo de una reserva ya realizada. Así evitamos reseñas falsas.',
          'Califican de 1 a 5 estrellas y pueden dejar un comentario corto. Las reseñas visibles aparecen en tu página de reservas.',
        ],
      },
      {
        question: '¿Cómo le pido una reseña a un cliente?',
        answer: [
          'Desde el detalle de una reserva ya atendida, o desde Clientes, usa "Pedir reseña". Se abre WhatsApp con un mensaje y el enlace para opinar, listo para enviar.',
        ],
      },
      {
        question: '¿Puedo ocultar o borrar una reseña negativa?',
        answer: [
          'Puedes ocultar una reseña solo si es spam, tiene insultos o contenido inapropiado. Una mala calificación honesta no se puede ocultar: así tu página sigue siendo confiable para nuevos clientes.',
          'Lo que sí puedes hacer es responderla públicamente, explicando tu versión o cómo lo vas a solucionar.',
        ],
      },
      {
        question: '¿Qué es el comentario privado?',
        answer: [
          'Cuando un cliente califica con 3 estrellas o menos, puede dejarte además un comentario que solo ves tú en Reseñas. Te sirve para saber qué mejorar sin que quede público.',
        ],
      },
    ],
  },
  {
    id: 'campanas',
    title: 'Campañas',
    icon: 'megaphone',
    description: 'Correos y WhatsApp masivos a tus clientes.',
    items: [
      {
        question: '¿Qué es una campaña y a quién le llega?',
        answer: [
          'Es un mensaje que envías a varios clientes a la vez: una promoción, un aviso o una invitación a volver. Eliges a quién mandarla por categoría (por ejemplo "En riesgo" o "Inactivo") y por "Días sin venir", y antes de enviar ves cuántos clientes calzan con el filtro.',
        ],
      },
      {
        question: '¿Por qué canales puedo enviar campañas?',
        answer: [
          '- Correo: en todos los planes, con un límite de correos por envío según tu plan. Puedes agregar una imagen.',
          '- WhatsApp: desde el plan Business. El cupo disponible lo ves en la misma pantalla de Campañas.',
        ],
      },
      {
        question: '¿Qué significa "Prioridad de envío"?',
        answer: [
          'Si tu lista tiene más clientes que el límite de tu plan, la prioridad decide a quiénes les llega primero: por ejemplo, a los que llevan más tiempo sin venir o a los que tienen más visitas.',
        ],
      },
      {
        question: '¿Dónde veo las campañas que ya envié?',
        answer: [
          'En Campañas → "Ver historial" verás cada envío con su fecha, canal, filtro usado y cantidad de destinatarios.',
        ],
      },
    ],
  },
  {
    id: 'servicios',
    title: 'Servicios, categorías y extras',
    icon: 'briefcase',
    description: 'Cómo armar tu catálogo para que tus clientes reserven fácil.',
    items: [
      {
        question: '¿Para qué sirven las categorías de servicios?',
        answer: [
          'Agrupan tus servicios en tu página de reservas (por ejemplo "Manicure", "Pedicure", "Pestañas") para que el cliente encuentre rápido lo que busca.',
          'En Servicios puedes crear categorías, arrastrar servicios entre ellas o usar "Mover a…", y ordenarlas. Los servicios sin categoría quedan en "Sin categoría".',
        ],
      },
      {
        question: '¿Qué datos lleva un servicio?',
        answer: [
          '- Nombre y descripción (lo que ve el cliente).',
          '- Duración y precio.',
          '- Tiempo de preparación antes y/o después (opcional).',
          '- Los profesionales que lo realizan.',
          'Puedes desactivar un servicio cuando no lo ofrezcas por un tiempo, sin perderlo.',
        ],
      },
      {
        question: '¿Qué es el tiempo de preparación (antes/después)?',
        answer: [
          'Es tiempo extra que se bloquea junto al servicio para preparar o limpiar, sin que el cliente lo vea como parte de la duración. Por ejemplo, un servicio de 30 minutos con 10 minutos después ocupa 40 minutos en tu agenda, así nadie te reserva justo encima.',
        ],
      },
      {
        question: '¿Qué son los extras?',
        answer: [
          'Son agregados opcionales que el cliente puede sumar al reservar un servicio, por ejemplo "Diseño en uñas +$3.000 +15 min" o "Lavado de pelo".',
          'Creas el extra una vez (nombre, precio y minutos extra) y eliges en qué servicios aparece. Si el extra suma minutos, Orbyx busca un horario donde quepa el servicio completo. El cliente ve el total antes de confirmar.',
        ],
      },
      {
        question: '¿Por qué un servicio no aparece en mi página de reservas?',
        answer: [
          'Todo servicio necesita al menos un profesional activo asignado. Revisa si tiene la etiqueta "Sin profesional" en la lista de Servicios, o si está desactivado.',
          'Recuerda que los servicios son por sucursal: revisa que estés mirando la sucursal correcta.',
        ],
      },
      {
        question: '¿Puedo ofrecer clases o actividades grupales?',
        answer: [
          'Sí. Si tu negocio es de clases, talleres o eventos, al crear el servicio defines la capacidad (cupos). Varios clientes pueden reservar el mismo horario hasta completar los cupos, y tu página muestra cuántos quedan.',
        ],
      },
    ],
  },
  {
    id: 'staff',
    title: 'Staff (profesionales)',
    icon: 'staff',
    description: 'Crear y configurar a tu equipo.',
    items: [
      {
        question: '¿Cómo agrego un profesional?',
        answer: [
          'En Staff → crear profesional. Completa nombre, rol (por ejemplo "Manicurista"), y si quieres correo, teléfono y una foto. La foto y el rol se muestran en tu página de reservas.',
          'Luego marca los servicios que realiza. Solo aparecerá para reservar en esos servicios.',
        ],
      },
      {
        question: '¿El profesional tiene que tener cuenta en Orbyx?',
        answer: [
          'No. Un profesional en Staff es para recibir reservas, no necesita entrar al panel. Si quieres que alguien de tu equipo también use el panel, créale un usuario en Configuración → Equipo (ver Sucursales y equipo).',
        ],
      },
      {
        question: '¿Qué hace "Estado del staff" (Activo / Inactivo)?',
        answer: [
          'Un profesional inactivo deja de aparecer en tu página y no recibe nuevas reservas, pero conserva su historial. Útil si alguien se va por un tiempo. Ojo: los profesionales activos cuentan para el límite de tu plan.',
        ],
      },
      {
        question: '¿Cada profesional puede tener su propio horario?',
        answer: [
          'Sí. Por defecto usa el horario de su sucursal, pero puedes darle uno propio y agregarle fechas especiales (vacaciones, permisos, horas bloqueadas). Ver Horarios y disponibilidad.',
        ],
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Plan, pagos y add-ons',
    icon: 'card',
    description: 'Suscripción, tarjeta, boletas y mensajes adicionales.',
    featured: true,
    items: [
      {
        question: '¿Cómo funciona el cobro de mi plan?',
        answer: [
          'El plan se cobra mensualmente a la tarjeta que inscribes en Mi suscripción, a través de Flow. Ahí ves tu plan, la fecha de tu próximo cobro y el estado de tu suscripción.',
          'Puedes cambiar de plan, cambiar o eliminar tu tarjeta, o cancelar la suscripción cuando quieras.',
        ],
      },
      {
        question: '¿Qué pasa si elimino mi tarjeta o cancelo?',
        answer: [
          '- Si cancelas, mantienes el acceso hasta el fin del período que ya pagaste.',
          '- Si eliminas la tarjeta, tu acceso sigue activo, pero sin tarjeta no podremos cobrar la próxima renovación. Unos días antes te avisaremos en el panel.',
          '- Si un cobro falla, tienes unos días de gracia (te avisamos por correo) para actualizar tu tarjeta antes de que se pause la cuenta.',
        ],
      },
      {
        question: '¿Dónde descargo mis boletas?',
        answer: [
          'En Mi suscripción → Historial de pagos. Cada cobro muestra "Boleta disponible" con su botón de descarga, o "Boleta en proceso" mientras la emitimos. Si en un mismo día se cobró tu plan y un add-on, normalmente van en una sola boleta.',
        ],
      },
      {
        question: '¿Qué son los add-ons?',
        answer: [
          'Son extras que sumas a tu plan sin tener que cambiarlo, desde Mi suscripción → Add-ons:',
          '- Capacidad: profesionales o sucursales adicionales.',
          '- Mensajes: packs de WhatsApp de confirmación y recordatorio.',
          'Puedes pagarlos una sola vez o con renovación automática cada ~30 días, que cancelas cuando quieras.',
        ],
      },
      {
        question: '¿Los mensajes de WhatsApp que no uso se acumulan?',
        answer: [
          'Depende de dónde vienen:',
          '- Los mensajes que incluye tu plan NO se acumulan: son un cupo mensual que se reinicia cada mes. Si no los usas, se pierden.',
          '- Los mensajes que compras aparte (packs) SÍ se acumulan: se suman a tu saldo y no vencen.',
          'Orbyx usa primero el cupo mensual de tu plan y después tu saldo comprado.',
        ],
      },
      {
        question: '¿Confirmación y recordatorio gastan cupos distintos?',
        answer: [
          'No. La confirmación y el recordatorio por WhatsApp comparten el mismo cupo. Además, un mensaje solo se descuenta cuando WhatsApp confirma que llegó al teléfono del cliente; si falla, no se cobra.',
        ],
      },
      {
        question: '¿Por qué no puedo activar WhatsApp durante la prueba gratis?',
        answer: [
          'Los mensajes de WhatsApp tienen un costo real por envío, por eso se activan cuando comienza tu cobro mensual o si compras un pack de mensajes. El resto del sistema (incluidos los recordatorios por correo) funciona completo durante la prueba.',
        ],
      },
      {
        question: '¿Qué es la "Recarga automática por saldo bajo"?',
        answer: [
          'Es una opción para que, cuando te queden pocos mensajes, se compre otro pack automáticamente con tu tarjeta. Así no te quedas sin recordatorios en medio del mes. Es opcional y la desactivas cuando quieras.',
        ],
      },
    ],
  },
  {
    id: 'migracion',
    title: 'Migración de datos',
    icon: 'database',
    description: 'Vienes de otro sistema: traemos tus clientes y reservas.',
    items: [
      {
        question: 'Vengo de otro sistema de reservas, ¿puedo traer mis datos?',
        answer: [
          'Sí. En Clientes toca "Migrar mis datos" y sube los archivos que exportaste de tu sistema anterior (Excel o CSV, hasta 5 archivos): clientes y reservas, tanto pasadas como futuras.',
          'Nuestro equipo los revisa y los carga por ti. Tus reservas futuras quedan en su día, hora, servicio y profesional.',
        ],
      },
      {
        question: '¿Qué tengo que tener listo antes de migrar?',
        answer: [
          'Crea primero en Orbyx tus servicios, profesionales y horarios. Cada reserva que migremos se asigna a un servicio y a un profesional que ya existan en tu cuenta.',
        ],
      },
      {
        question: '¿Les llegará un aviso a mis clientes cuando carguen sus reservas?',
        answer: [
          'No. Las reservas migradas se cargan sin enviar confirmaciones, para no confundir a tus clientes con mensajes de horas que ya tenían agendadas.',
        ],
      },
      {
        question: '¿Puedo enviar la migración más de una vez?',
        answer: [
          'La migración se envía una sola vez, por eso conviene subir todo junto. Después ves el estado en la misma ventana: Recibida → En proceso → Lista. Si te faltó un archivo, escríbenos con un ticket.',
        ],
      },
    ],
  },
  {
    id: 'pagina',
    title: 'Tu página de reservas',
    icon: 'globe',
    description: 'Link, diseño y lo que ven tus clientes.',
    items: [
      {
        question: '¿Dónde está mi página de reservas y cómo la comparto?',
        answer: [
          'Tu página es orbyx.cl/tu-negocio. Arriba en el panel puedes copiar el enlace o generar un código QR para imprimir. Compártela en Instagram, WhatsApp o Google.',
        ],
      },
      {
        question: '¿Puedo cambiar los colores de mi página?',
        answer: [
          'Sí. En Mi Negocio → Diseño eliges entre varios estilos, suaves o llamativos (incluidos modos oscuros). Al tocar uno lo ves al instante en tu página real, y solo se aplica cuando tocas "Usar este diseño".',
        ],
      },
      {
        question: '¿Puedo pedir datos extra al cliente al reservar?',
        answer: [
          'Sí. En Mi Negocio → Campos agregas preguntas al formulario de reserva (por ejemplo, RUT o un comentario) y eliges si son obligatorias.',
        ],
      },
      {
        question: '¿Qué ve el cliente si tengo varias sucursales?',
        answer: [
          'Si tienes 2 o más sucursales activas, tu página muestra un selector para que el cliente elija dónde atenderse. Con una sola sucursal, el selector no aparece.',
        ],
      },
    ],
  },
  {
    id: 'equipo',
    title: 'Sucursales y equipo',
    icon: 'building',
    description: 'Sucursales y accesos de tu equipo al panel.',
    items: [
      {
        question: '¿Cómo agrego una nueva sucursal?',
        answer: [
          'Desde Mi Negocio → Sucursales, según el límite de tu plan (Starter: 1, Business: 2, Premium: 3). Si necesitas más, puedes sumar sucursales como add-on.',
          'Cada sucursal tiene sus propios servicios, profesionales y, si quieres, sus propios horarios.',
        ],
      },
      {
        question: '¿Cómo le doy acceso al panel a alguien de mi equipo?',
        answer: [
          'En Configuración → Equipo → "Crear nuevo usuario". Ingresa su correo y elige:',
          '- Qué secciones puede usar, y en cada una si solo puede ver o también editar.',
          '- A qué sucursales tiene acceso. Solo verá y trabajará en esas sucursales.',
          'La persona recibe un correo para crear su contraseña.',
        ],
      },
      {
        question: '¿Un usuario de mi equipo puede crear otros usuarios?',
        answer: [
          'No. Solo el propietario de la cuenta puede crear, editar, desactivar o eliminar usuarios. La facturación también es solo del propietario.',
        ],
      },
    ],
  },
  {
    id: 'soporte',
    title: 'Soporte',
    icon: 'headset',
    description: '¿No encontraste tu respuesta?',
    items: [
      {
        question: '¿Qué hago si mi pregunta no está aquí?',
        answer: [
          'Crea un ticket desde la pestaña "Mis tickets" de esta misma sección. Los atendemos por orden de prioridad según tu plan: primero Premium, luego Business y Starter.',
          'El soporte es solo por tickets (no hay correo ni chat), así queda todo registrado y te avisamos cuando te respondamos.',
        ],
      },
    ],
  },
]
