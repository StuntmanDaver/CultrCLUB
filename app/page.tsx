export const runtime = 'edge'

import { cookies } from 'next/headers'
import { sql } from '@/lib/db'
import { verifyClubVisitorToken } from '@/lib/auth'
import { JoinLandingClient } from './JoinLandingClient'

interface ServerMember {
  firstName: string
  lastName: string
  email: string
  phone: string
  socialHandle: string
  signupType: string
  age?: number
  gender?: string
  address?: { street: string; city: string; state: string; zip: string }
}

async function resolveServerMember(): Promise<ServerMember | null> {
  if (!process.env.POSTGRES_URL) return null

  const cookieStore = await cookies()
  const token = cookieStore.get('cultr_club_visitor')?.value
  if (!token) return null

  const payload = await verifyClubVisitorToken(token)
  if (!payload?.email) return null

  try {
    const result = await sql`
      SELECT name, email, phone, social_handle, signup_type, age, gender,
             address_street, address_city, address_state, address_zip
      FROM club_members
      WHERE LOWER(email) = LOWER(${payload.email})
      LIMIT 1
    `
    if (result.rows.length === 0) return null

    const row = result.rows[0]
    const nameParts = (row.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      firstName,
      lastName,
      email: row.email,
      phone: row.phone || '',
      socialHandle: row.social_handle || '',
      signupType: row.signup_type || 'products',
      age: row.age ? Number(row.age) : undefined,
      gender: row.gender || undefined,
      address: row.address_street ? {
        street: row.address_street,
        city: row.address_city || '',
        state: row.address_state || '',
        zip: row.address_zip || '',
      } : undefined,
    }
  } catch (error) {
    console.error('[page] Server member resolution failed:', error instanceof Error ? error.message : 'unknown')
    return null
  }
}

export default async function JoinClubPage() {
  const serverMember = await resolveServerMember()
  return <JoinLandingClient serverMember={serverMember} />
}
