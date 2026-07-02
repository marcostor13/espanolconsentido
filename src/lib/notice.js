// Política de cancelación/reprogramación: el crédito solo se conserva si se
// avisa con al menos 48h de anticipación a la hora de la clase reservada.
// Debe reflejar exactamente la misma regla que netlify/functions/bookings.js.
export const CANCELLATION_NOTICE_HOURS = 48

export function hasEnoughNotice(booking) {
  const classDateTime = new Date(`${booking.date}T${booking.time}:00`)
  const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilClass >= CANCELLATION_NOTICE_HOURS
}
