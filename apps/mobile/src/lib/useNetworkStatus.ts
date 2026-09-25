import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE } from './api'

// Probes connectivity with a lightweight HEAD to the health endpoint.
// Falls back to `true` if the probe itself errors in an unexpected way.
async function probe(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${API_BASE}/health`, {
      method: 'HEAD',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = useCallback(async () => {
    const online = await probe()
    setIsOnline(online)
    return online
  }, [])

  useEffect(() => {
    // Initial probe
    check()
    // Re-probe every 12 seconds
    intervalRef.current = setInterval(check, 12_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [check])

  return { isOnline, recheckNow: check }
}
