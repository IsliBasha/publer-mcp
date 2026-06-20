import { NextResponse } from 'next/server'
import { getPubServices } from '@/lib/publer.server'

export async function GET() {
  try {
    const services = getPubServices()
    if (!services) {
      return NextResponse.json({ error: 'PUBLER_API_KEY is not configured' }, { status: 503 })
    }
    const { accounts } = services
    const data = await accounts.listAccounts()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch accounts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
