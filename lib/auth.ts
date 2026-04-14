import { SignJWT, jwtVerify } from 'jose'

const sessionSecret = process.env.SESSION_SECRET
const jwtSecret = process.env.JWT_SECRET

const CLUB_VISITOR_SECRET = new TextEncoder().encode(
  sessionSecret || jwtSecret || 'cultr-club-visitor-secret-dev-only'
)

export interface ClubVisitorPayload {
  email: string
}

export async function createClubVisitorToken(email: string): Promise<string> {
  return new SignJWT({
    email: email.trim().toLowerCase(),
    type: 'club_visitor',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(CLUB_VISITOR_SECRET)
}

export async function verifyClubVisitorToken(token: string): Promise<ClubVisitorPayload | null> {
  try {
    const { payload } = await jwtVerify(token, CLUB_VISITOR_SECRET)
    if (payload.type !== 'club_visitor' || typeof payload.email !== 'string') {
      return null
    }

    return {
      email: payload.email.trim().toLowerCase(),
    }
  } catch {
    return null
  }
}
