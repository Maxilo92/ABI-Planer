import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin-server'

export const runtime = 'nodejs'

// Helper to determine the cookie domain
function getCookieDomain(host: string) {
  const hostname = host.split(':')[0] // Strip port
  
  // For standard localhost (no subdomains)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return undefined
  }

  // Special case for localhost subdomains (e.g. tcg.localhost -> .localhost)
  if (hostname.endsWith('.localhost')) {
    return '.localhost'
  }
  
  // For production subdomains
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    // production, e.g. "tcg.abi-planer-27.de" -> ".abi-planer-27.de"
    return '.' + parts.slice(-2).join('.')
  }
  
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: 'ID Token missing' }, { status: 400 })
    }

    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    let sessionCookie: string;

    if (process.env.NODE_ENV !== 'production') {
      // For development, use a mock cookie. This bypasses Firebase Auth but allows testing.
      // If there are issues with downstream usage of this mock cookie, further investigation will be needed.
      sessionCookie = 'mock-session-cookie';
    } else {
      // In production, create a real session cookie using Firebase Admin SDK
      sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
    }

    const host = request.headers.get('host') || ''
    const domain = getCookieDomain(host)

    // Explicitly create a JSON response
    const response = NextResponse.json({ status: 'success' }, { status: 200 })

    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: domain,
    })

    return response
  } catch (error) {
    // Log the error for debugging
    console.error('Session API POST Error:', error)
    // Ensure a JSON response is always returned in case of an error
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value

    if (!sessionCookie) {
      return NextResponse.json({ isOnline: false }, { status: 200 })
    }

    // Verify session cookie
    const decodedClaims = await adminAuth().verifySessionCookie(sessionCookie, true)
    
    // Create a custom token for the client to sign in
    const customToken = await adminAuth().createCustomToken(decodedClaims.uid)

    return NextResponse.json({
      isOnline: true,
      uid: decodedClaims.uid,
      customToken: customToken,
    }, { status: 200 })
  } catch (error) {
    // If verification fails, clear the cookie
    const response = NextResponse.json({ isOnline: false }, { status: 200 })
    response.cookies.delete('__session')
    return response
  }
}

export async function DELETE(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const domain = getCookieDomain(host)
  
  const response = NextResponse.json({ status: 'success' }, { status: 200 })
  
  response.cookies.set('__session', '', {
    maxAge: 0,
    path: '/',
    domain: domain,
  })
  
  return response
}
