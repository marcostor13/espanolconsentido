// Preguntas del formulario de reserva de la clase de prueba (ver App.jsx
// BookingModal + translations.js "es"). Se guardan como bookings.questions
// (q1..q5) y no tienen normalización propia en el backend, así que el
// panel admin reusa aquí las mismas etiquetas para mostrarlas legibles.
export const INTAKE_QUESTIONS = [
  { key: 'q1', label: '¿Qué te gustaría lograr con el español en este momento?' },
  { key: 'q2', label: '¿Cómo describirías tu experiencia con el español?' },
  { key: 'q3', label: '¿En qué situaciones te gustaría sentirte más cómodo/a hablando español?' },
  { key: 'q4', label: '¿Qué temas disfrutas conversar?' },
  { key: 'q5', label: '¿Hay algo que te gustaría que supiera antes de nuestra clase?' },
]
