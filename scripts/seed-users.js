// GreenCredits — Seed 31 stall accounts via Supabase Admin API
// Usage: node scripts/seed-users.js

const SUPABASE_URL = 'https://bsquxyfpkvrglghpehpp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXV4eWZwa3ZyZ2xnaHBlaHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2MTI4MywiZXhwIjoyMDg5MzM3MjgzfQ.j1VBZmEKZCwBA3vTAZITNh8srFYuybAdlTZNsbxXyfY'

const stalls = [
  { username: 'stall01', password: 'Kp7mN2xQ' },
  { username: 'stall02', password: 'Lw9vB4jR' },
  { username: 'stall03', password: 'Xz3hD6fT' },
  { username: 'stall04', password: 'Mn8cG1yU' },
  { username: 'stall05', password: 'Pq5sA9eW' },
  { username: 'stall06', password: 'Vy2tF7kI' },
  { username: 'stall07', password: 'Rn4bH3mO' },
  { username: 'stall08', password: 'Tj6wC8pL' },
  { username: 'stall09', password: 'Zk1xE5nS' },
  { username: 'stall10', password: 'Fb9mJ2qV' },
  { username: 'stall11', password: 'Uc3vK7rD' },
  { username: 'stall12', password: 'Gh5nL4wX' },
  { username: 'stall13', password: 'Wd8oM1tY' },
  { username: 'stall14', password: 'Iq2pN6cZ' },
  { username: 'stall15', password: 'Ej7qO3sA' },
  { username: 'stall16', password: 'Ak4rP8dB' },
  { username: 'stall17', password: 'Bl6sQ2eC' },
  { username: 'stall18', password: 'Cm9tR5fD' },
  { username: 'stall19', password: 'Dn1uS7gE' },
  { username: 'stall20', password: 'Eo3vT4hF' },
  { username: 'stall21', password: 'Fp5wU6iG' },
  { username: 'stall22', password: 'Gq7xV8jH' },
  { username: 'stall23', password: 'Hr2yW1kI' },
  { username: 'stall24', password: 'Is4zX9lJ' },
  { username: 'stall25', password: 'Jt6aY3mK' },
  { username: 'stall26', password: 'Ku8bZ5nL' },
  { username: 'stall27', password: 'Lv1cA7oM' },
  { username: 'stall28', password: 'Mw3dB2pN' },
  { username: 'stall29', password: 'Nx5eC4qO' },
  { username: 'stall30', password: 'Oy7fD6rP' },
  { username: 'stall31', password: 'Pz9gE8sQ' },
]

async function createUser(username, password) {
  const email = `${username}@fest.com`

  // 1. Create auth user via Admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })

  const user = await res.json()

  if (!res.ok || user.error) {
    console.error(`❌ ${username}: ${user.error?.message || user.msg || 'unknown error'}`)
    return
  }

  // 2. Insert profile
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id: user.id,
      stall_name: username.replace('stall', 'Stall ').replace(/^Stall 0+/, 'Stall '),
      carbon_balance: 100,
    }),
  })

  if (!profileRes.ok) {
    const err = await profileRes.text()
    console.error(`❌ ${username} profile: ${err}`)
    return
  }

  console.log(`✅ ${username} created (${email} / ${password})`)
}

async function main() {
  console.log('🌿 GreenCredits — Creating stall accounts...\n')

  // First, clean up any broken users from before
  console.log('🧹 Cleaning up existing @fest.com users...')
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  })
  const { users } = await listRes.json()
  const festUsers = (users || []).filter(u => u.email?.endsWith('@fest.com'))

  for (const u of festUsers) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
    })
    console.log(`  🗑️  Deleted ${u.email}`)
  }

  console.log('\n👤 Creating accounts...\n')
  for (const { username, password } of stalls) {
    await createUser(username, password)
  }

  console.log('\n✅ Done! All stall accounts created.')
}

main().catch(console.error)
