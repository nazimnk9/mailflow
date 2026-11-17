import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('metromail_access_token')
    cookieStore.delete('metromail_session')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to logout' },
      { status: 500 }
    )
  }
}

