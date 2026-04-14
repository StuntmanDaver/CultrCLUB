import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless'

// CRITICAL: fullResults: true makes neon() return { rows: [], rowCount, command, fields }
// matching @vercel/postgres result shape. Without this, all .rows accesses silently break.
export const sql: NeonQueryFunction<false, true> = neon(process.env.POSTGRES_URL!, {
  fullResults: true,
})

// WebSocket transport — use for transactions only (Pool.connect() API is pg-compatible)
export const createPool = () => new Pool({ connectionString: process.env.POSTGRES_URL })

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}
