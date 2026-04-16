// Override Response.json() to return Promise<any> instead of Promise<unknown>
// Required because TypeScript 5.x DOM lib changed the return type
interface Body {
  json(): Promise<any>
}
