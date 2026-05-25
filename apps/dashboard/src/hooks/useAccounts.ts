'use client'
import { useEffect, useState } from 'react'
import type { SocialAccount } from '@publer-mcp/shared-types'

export function useAccounts(): SocialAccount[] {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => {
        if (!res.ok) return []
        return res.json() as Promise<SocialAccount[]>
      })
      .then(setAccounts)
      .catch(() => setAccounts([]))
  }, [])

  return accounts
}
