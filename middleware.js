// Vercel Routing Middleware: gates the whole site behind SITE_PASSWORD.
// Returning nothing lets the request through to the static files.

const COOKIE = 'site_auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Cookie holds a hash of the password, so changing SITE_PASSWORD logs everyone out.
async function expectedToken(password) {
  const data = new TextEncoder().encode(`siyas-space:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getCookie(request, name) {
  const header = request.headers.get('cookie') || ''
  const match = header.split(/;\s*/).find(c => c.startsWith(name + '='))
  return match ? match.slice(name.length + 1) : null
}

function loginPage(error) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>siya's space</title>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #ffe4f1; font-family: 'Press Start 2P', monospace; color: #3a1030; padding: 16px; }
  form { background: #fff; border: 4px solid #3a1030; box-shadow: 6px 6px 0 #ff69b4;
         padding: 32px 24px; width: 100%; max-width: 360px; text-align: center; }
  h1 { font-size: 16px; margin: 0 0 24px; line-height: 1.6; }
  input { width: 100%; font: inherit; font-size: 12px; padding: 12px; border: 3px solid #3a1030;
          background: #fff5fa; color: inherit; margin-bottom: 16px; }
  button { width: 100%; font: inherit; font-size: 12px; padding: 12px; border: 3px solid #3a1030;
           background: #ff69b4; color: #fff; cursor: pointer; }
  .err { color: #c0392b; font-size: 10px; margin: 0 0 16px; line-height: 1.6; }
</style>
</head>
<body>
  <form method="POST" action="/__unlock">
    <h1>siya's space</h1>
    ${error ? `<p class="err">${error}</p>` : ''}
    <input type="password" name="password" placeholder="password" autofocus required>
    <button type="submit">enter</button>
  </form>
</body>
</html>`
  return new Response(html, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD
  if (!password) return loginPage('SITE_PASSWORD is not set')

  const token = await expectedToken(password)
  const url = new URL(request.url)

  if (url.pathname === '/__unlock' && request.method === 'POST') {
    const form = await request.formData()
    const attempt = String(form.get('password') || '')
    if (!safeEqual(attempt, password)) return loginPage('wrong password')

    return new Response(null, {
      status: 303,
      headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      },
    })
  }

  const cookie = getCookie(request, COOKIE)
  if (cookie && safeEqual(cookie, token)) return // authed — serve the site

  return loginPage()
}

export const config = {
  matcher: '/:path*',
}
