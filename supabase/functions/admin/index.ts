// Admin actions that need Supabase's secret key: creating accounts, setting
// passwords and disabling accounts. Only a signed-in admin may call it.
//
// The secret key is provided by Supabase inside the function's environment
// and never reaches the browser.
import { createClient } from 'npm:@supabase/supabase-js@2'

const EMAIL_DOMAIN = 'nest.home'
const FOREVER = '876000h' // about 100 years

type Body =
  | { action: 'create_user'; username: string; display_name: string; password: string }
  | { action: 'set_password'; user_id: string; password: string }
  | { action: 'set_disabled'; user_id: string; disabled: boolean }

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Who is calling? Use their own token, so RLS and is_admin() apply to them.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: isAdmin, error: adminErr } = await asCaller.rpc('is_admin')
  if (adminErr || isAdmin !== true) return reply(403, { error: 'Only the admin can do this' })
  const { data: me } = await asCaller.auth.getUser()
  const { data: household } = await asCaller.rpc('my_household')

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  let body: Body
  try {
    body = await req.json()
  } catch {
    return reply(400, { error: 'Invalid JSON' })
  }

  // Every target user must be in the caller's household.
  const inMyHousehold = async (userId: string) => {
    const { data } = await admin.from('profiles').select('id').eq('id', userId).eq('household_id', household).maybeSingle()
    return data !== null
  }

  switch (body.action) {
    case 'create_user': {
      const username = String(body.username ?? '').trim().toLowerCase()
      const displayName = String(body.display_name ?? '').trim()
      if (!/^[a-z0-9_]{2,24}$/.test(username)) {
        return reply(400, { error: 'Usernames are 2 to 24 lowercase letters, numbers or _' })
      }
      if (!displayName || displayName.length > 40) return reply(400, { error: 'Give a display name' })
      if (String(body.password ?? '').length < 8) return reply(400, { error: 'Passwords need at least 8 characters' })

      const { data, error } = await admin.auth.admin.createUser({
        email: `${username}@${EMAIL_DOMAIN}`,
        password: body.password,
        email_confirm: true,
        user_metadata: { username, display_name: displayName },
      })
      if (error) return reply(400, { error: error.message })
      return reply(200, { user_id: data.user.id })
    }

    case 'set_password': {
      if (String(body.password ?? '').length < 8) return reply(400, { error: 'Passwords need at least 8 characters' })
      if (!(await inMyHousehold(body.user_id))) return reply(404, { error: 'No such user' })
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: body.password })
      if (error) return reply(400, { error: error.message })
      return reply(200, { ok: true })
    }

    case 'set_disabled': {
      if (body.user_id === me.user?.id) return reply(400, { error: "You can't disable your own account" })
      if (!(await inMyHousehold(body.user_id))) return reply(404, { error: 'No such user' })
      const { error } = await admin.auth.admin.updateUserById(body.user_id, {
        ban_duration: body.disabled ? FOREVER : 'none',
      })
      if (error) return reply(400, { error: error.message })
      if (body.disabled) {
        const { error: endErr } = await asCaller.rpc('end_user_sessions', { target: body.user_id })
        if (endErr) return reply(500, { error: endErr.message })
      }
      return reply(200, { ok: true })
    }

    default:
      return reply(400, { error: 'Unknown action' })
  }
})
