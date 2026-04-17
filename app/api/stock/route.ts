export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

/** GET — Public endpoint returning stock status for all products */
export async function GET() {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ stock: {} }, { headers: NO_CACHE_HEADERS })
    }

    // Read both site_source values — join_cultrhealth rows are legacy admin writes
    // from before the cultrclub.com migration. When both exist for the same therapy,
    // prefer the explicit cultrclub row.
    const result = await sql`
      SELECT DISTINCT ON (therapy_id) therapy_id, stock_status, stock_quantity
      FROM product_inventory
      WHERE COALESCE(site_source, 'join_cultrhealth') IN ('cultrclub', 'join_cultrhealth')
      ORDER BY therapy_id, CASE WHEN site_source = 'cultrclub' THEN 0 ELSE 1 END
    `

    const stock: Record<string, { status: string; quantity: number | null }> = {}
    for (const row of result.rows) {
      stock[row.therapy_id] = {
        status: row.stock_status,
        quantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
      }
    }

    return NextResponse.json({ stock }, { headers: NO_CACHE_HEADERS })
  } catch (err) {
    console.error('[api/stock] GET error:', err)
    return NextResponse.json({ stock: {} }, { headers: NO_CACHE_HEADERS })
  }
}
