// middleware.ts redirects every request to /login or the caller's role
// dashboard before this ever renders. This is just a safe fallback.
export default function Home() {
  return null;
}
