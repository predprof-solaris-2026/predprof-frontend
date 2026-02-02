import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const login = body?.login
  const password = body?.password

  const ADMIN_LOGIN = process.env.ADMIN_LOGIN
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'ADMIN credentials not set' }, { status: 500 })
  }

  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    // generate a simple admin token (not a secure JWT) — server trusts it for admin actions
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    return NextResponse.json({ ok: true, token })
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
