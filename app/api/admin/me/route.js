import { NextResponse } from 'next/server'
import {
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '../../../../lib/adminSession'

export async function GET(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const result = verifyAdminSessionToken(token)
  if (!result.valid) {
    return NextResponse.json({ authed: false, reason: result.reason }, { status: 401 })
  }
  return NextResponse.json({ authed: true, exp: result.payload.exp })
}
