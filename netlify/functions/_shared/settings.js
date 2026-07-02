const SETTINGS_ID = 'app'
const DEFAULTS = { groupClassCapacity: 4, wiseLinks: {} }

export async function getSettings(db) {
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID })
  return { ...DEFAULTS, ...(doc || {}) }
}

export async function updateSettings(db, updates) {
  await db
    .collection('settings')
    .updateOne({ _id: SETTINGS_ID }, { $set: { ...updates, updatedAt: new Date() } }, { upsert: true })
  return getSettings(db)
}
