export type FaqItem = { question: string; answer: string }
export type FaqCategory = { title: string; icon: string; items: FaqItem[] }

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'Horarios',
    icon: 'ti-clock',
    items: [
      {
        question: '¿Cómo configuro los horarios de atención de mi negocio?',
        answer: 'Desde Horarios puedes definir un horario general válido para todas tus sucursales, o activar horario propio para una sucursal específica.',
      },
      {
        question: '¿Puedo tener horarios distintos por sucursal?',
        answer: 'Sí. Cada sucursal puede usar el horario general del negocio o tener su propio horario, según el flag "Usar horario global" en su configuración.',
      },
      {
        question: '¿Puedo bloquear un día feriado o una fecha especial?',
        answer: 'Sí, puedes agregar fechas especiales (cierres o aperturas puntuales) tanto a nivel de negocio como por sucursal.',
      },
      {
        question: 'Si cierro un día a nivel general, ¿mis sucursales igual quedan cerradas ese día?',
        answer: 'Sí. Las fechas especiales generales siempre se aplican a todas las sucursales, incluso si esa sucursal tiene sus propias fechas especiales activadas — se suman, no reemplazan el cierre general.',
      },
      {
        question: '¿Puedo dar horarios distintos a cada profesional?',
        answer: 'Sí, en Staff puedes activar horario propio para un profesional. Su horario siempre debe caber dentro del horario del negocio.',
      },
      {
        question: '¿Con cuánta anticipación mínima puede reservar un cliente?',
        answer: 'Tú defines la anticipación mínima y el máximo de días hacia adelante para reservar, desde la configuración de tu negocio.',
      },
    ],
  },
  {
    title: 'Reservas y Agenda',
    icon: 'ti-calendar-event',
    items: [
      {
        question: '¿Cómo cancelo o reagendo una cita?',
        answer: 'Desde la Agenda, busca la cita y cambia su estado a "Cancelada" o "Reagendada". Tu cliente también puede cancelar directamente con el link de su correo de confirmación.',
      },
      {
        question: '¿Qué pasa si mi Google Calendar se desconecta?',
        answer: 'Tus reservas se siguen creando con normalidad en Orbyx. Solo se pierde la sincronización automática hasta que reconectes tu cuenta.',
      },
    ],
  },
  {
    title: 'Sucursales y Equipo',
    icon: 'ti-building-store',
    items: [
      {
        question: '¿Cómo agrego una nueva sucursal?',
        answer: 'Desde Sucursales, según el límite de tu plan actual (Pro: 1, Premium: 2, VIP: 3, Platinum: 10).',
      },
      {
        question: '¿Cómo doy acceso a mi equipo con permisos limitados?',
        answer: 'Desde Miembros puedes invitar a alguien y elegir exactamente qué secciones puede ver o editar.',
      },
    ],
  },
  {
    title: 'Servicios y Profesionales',
    icon: 'ti-briefcase',
    items: [
      {
        question: '¿Por qué un servicio no aparece en mi página pública de reservas?',
        answer: 'Todo servicio necesita al menos un profesional asignado para ser visible. Revisa el badge "Sin profesional" en la lista de Servicios.',
      },
      {
        question: '¿Puedo definir un tiempo de preparación (buffer) antes o después de un servicio?',
        answer: 'Sí, cada servicio permite configurar un buffer antes y después de la duración base, que se suma al tiempo total ocupado en la agenda.',
      },
    ],
  },
  {
    title: 'Cuenta y Facturación',
    icon: 'ti-credit-card',
    items: [
      {
        question: '¿Los descuentos semestral/anual se aplican solos?',
        answer: 'Sí, al elegir ciclo semestral obtienes -10% y anual -15% automáticamente sobre el valor del plan.',
      },
      {
        question: '¿Cómo cambio de plan?',
        answer: 'Desde Configuración → Plan puedes ver el detalle del cambio antes de confirmarlo.',
      },
    ],
  },
  {
    title: 'Clientes y Campañas',
    icon: 'ti-users',
    items: [
      {
        question: '¿Puedo enviarles correos a mis clientes desde Orbyx?',
        answer: 'Sí, desde Campañas puedes enviar campañas de email reales a tus clientes segmentados (nuevos, recurrentes, frecuentes, inactivos).',
      },
      {
        question: '¿Ya puedo enviar campañas por WhatsApp?',
        answer: 'Aún no, está en desarrollo. Por ahora las campañas reales funcionan solo por correo.',
      },
    ],
  },
  {
    title: 'Soporte',
    icon: 'ti-headset',
    items: [
      {
        question: '¿Qué hago si mi pregunta no está aquí?',
        answer: 'Crea un ticket de soporte directamente desde esta misma sección — nuestro equipo responde según la prioridad de tu plan.',
      },
    ],
  },
]
