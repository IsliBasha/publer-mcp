import { NextResponse } from 'next/server'
import { getPubServices } from '@/lib/publer.server'

export async function GET() {
  try {
    const { accounts } = getPubServices()
    const data = await accounts.listAccounts()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch accounts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
