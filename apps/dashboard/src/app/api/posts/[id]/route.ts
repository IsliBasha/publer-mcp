import { NextRequest, NextResponse } from 'next/server'

const API_SERVER_URL = process.env.API_SERVER_URL ?? 'http://localhost:3001'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const upstream = await fetch(`${API_SERVER_URL}/api/posts/${id}`, {
      method: 'DELETE',
    })

    const json = await upstream.json() as Record<string, unknown>

    if (!upstream.ok) {
      // Propagate 404 as-is; everything else becomes 502
      const status = upstream.status === 404 ? 404 : 502
      return NextResponse.json({ error: json.error ?? 'api-server error' }, { status })
    }

    return NextResponse.json({ deleted: id })
  } catch {
    return NextResponse.json({ error: 'api-server unreachable' }, { status: 502 })
  }
}
