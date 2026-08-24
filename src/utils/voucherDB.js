const DB_NAME = 'smartru-vouchers'
const STORE_NAME = 'pending_usages'

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'voucher_id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveLocalUsage(usage) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(usage)
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  }).finally(() => db.close())
}

export async function getPendingUsages() {
  const db = await openDB()
  try {
    return await requestResult(db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll())
  } finally {
    db.close()
  }
}

export async function removeLocalUsages(voucherIds) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  voucherIds.forEach((id) => tx.objectStore(STORE_NAME).delete(id))
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  }).finally(() => db.close())
}

export async function checkLocalUsage(voucherId) {
  const db = await openDB()
  try {
    return Boolean(
      await requestResult(db.transaction(STORE_NAME).objectStore(STORE_NAME).get(voucherId))
    )
  } finally {
    db.close()
  }
}
