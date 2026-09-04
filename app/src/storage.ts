// Requests the durable storage bucket -- part of why "installable PWA"
// matters for iOS storage survival (installed PWAs get a storage bucket
// less subject to Safari's eviction than a regular tab), though this is
// best-effort and still needs verifying on a real device (see plan Risks).
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageEstimate(): Promise<{ usageBytes: number; quotaBytes: number } | null> {
  if (!navigator.storage?.estimate) return null
  try {
    const { usage, quota } = await navigator.storage.estimate()
    if (usage === undefined || quota === undefined) return null
    return { usageBytes: usage, quotaBytes: quota }
  } catch {
    return null
  }
}
