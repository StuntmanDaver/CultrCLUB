// TODO: Phase 3 will rewrite this to use @neondatabase/serverless
// Placeholder — do not import @vercel/postgres here
export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}
