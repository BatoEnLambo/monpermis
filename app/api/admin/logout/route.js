import { NextResponse } from 'next/server'
import { buildAdminClearCookie } from '../../../../lib/adminSession'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', buildAdminClearCookie())
  return response
}
