// Los `price` de aquí son solo el valor por defecto: el precio real es
// configurable desde /admin/configuraciones y viene en settings.packagePrices
// (GET /api/settings). Usa resolvePrice/withConfiguredPrices para mostrarlo.
export const PACKAGES = [
  { id: 'trial', title: 'Clase de prueba', totalClasses: 1, price: 10 },
  { id: 'inicio', title: 'Plan Inicio', totalClasses: 4, price: 76 },
  { id: 'progreso', title: 'Plan Progreso', totalClasses: 8, price: 144 },
  { id: 'pro', title: 'Plan Fluidez', totalClasses: 12, price: 204 },
  { id: 'individual', title: 'Clase individual', totalClasses: 1, price: 20 },
  { id: 'group', title: 'Clase grupal', totalClasses: 1, price: 10 },
  // Clase grupal comprable como crédito desde el portal del alumno (se agenda
  // en una franja grupal después de comprarla), a diferencia de 'group' que se
  // compra en la web pública eligiendo la franja en el momento.
  { id: 'grupal', title: 'Clase grupal', totalClasses: 1, price: 10 },
]

// Precio vigente de un servicio: el configurado en settings o, si aún no
// cargó, el precio por defecto que traiga el objeto (translations/PACKAGES).
export function resolvePrice(packagePrices, serviceId, fallback) {
  const configured = packagePrices?.[serviceId]
  return typeof configured === 'number' ? configured : fallback
}

export function withConfiguredPrices(items, packagePrices) {
  return items.map((item) => ({ ...item, price: resolvePrice(packagePrices, item.id, item.price) }))
}

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
