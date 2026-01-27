import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const password = body?.password

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD not set' }, { status: 500 })
  }

  if (password === ADMIN_PASSWORD) {
    const res = NextResponse.json({ ok: true })
    // set httpOnly cookie
    res.cookies.set('isAdmin', '1', { httpOnly: true, path: '/', maxAge: 60 * 60 })
    return res
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
