import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless'

// CRITICAL: fullResults: true makes neon() return { rows: [], rowCount, command, fields }
// matching @vercel/postgres result shape. Without this, all .rows accesses silently break.
// Lazy-initialized to avoid crashing at build time when POSTGRES_URL is not set.
// Proxy target must be a function for the `apply` trap (tagged template calls) to work.
let _sql: NeonQueryFunction<false, true> | null = null
function _getSql(): NeonQueryFunction<false, true> {
  if (!_sql) _sql = neon(process.env.POSTGRES_URL!, { fullResults: true })
  return _sql
}
export const sql: NeonQueryFunction<false, true> = new Proxy(function () {} as unknown as NeonQueryFunction<false, true>, {
  apply(_target, thisArg, args) {
    return Reflect.apply(_getSql() as any, thisArg, args)
  },
  get(_target, prop) {
    return (_getSql() as any)[prop]
  },
})

// WebSocket transport — use for transactions only (Pool.connect() API is pg-compatible)
export const createPool = () => new Pool({ connectionString: process.env.POSTGRES_URL })

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}
