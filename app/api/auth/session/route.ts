import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/server-auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)

    if (!accessToken?.value && !refreshToken?.value) {
      return NextResponse.json({
        isAuthenticated: false,
      })
    }

    return NextResponse.json({
      isAuthenticated: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      { isAuthenticated: false, message: error?.message },
      { status: 500 }
    )
  }
}
