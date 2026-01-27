import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const isAdmin = cookie.split(';').map(s => s.trim()).some(s => s.startsWith('isAdmin='))
  if (isAdmin) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false }, { status: 401 })
}
