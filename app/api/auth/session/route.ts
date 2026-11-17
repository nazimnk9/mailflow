import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('metromail_access_token')

    if (!token?.value) {
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

