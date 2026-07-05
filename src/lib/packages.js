export const PACKAGES = [
  { id: 'trial', title: 'Clase de prueba', totalClasses: 1, price: 10 },
  { id: 'inicio', title: 'Plan Inicio', totalClasses: 4, price: 76 },
  { id: 'progreso', title: 'Plan Progreso', totalClasses: 8, price: 144 },
  { id: 'pro', title: 'Plan Fluidez', totalClasses: 12, price: 204 },
  { id: 'individual', title: 'Clase individual', totalClasses: 1, price: 20 },
  { id: 'group', title: 'Clase grupal', totalClasses: 1, price: 10 },
]

// Ids de servicios que se reservan contra una franja real del calendario (una
// sola clase, elegida en el momento de la compra) vs. paquetes de varias
// clases que se agendan después desde el portal del estudiante.
export const SLOT_BASED_SERVICE_IDS = ['trial', 'individual', 'group']

// Tipo de franja de availability que corresponde a cada servicio de una sola clase.
export const SERVICE_SLOT_TYPE = {
  trial: 'individual',
  individual: 'individual',
  group: 'group',
}
