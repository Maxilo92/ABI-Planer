import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const templatePath = resolve(root, 'scripts/firebase-messaging-sw.template.js')
const outputPath = resolve(root, 'public/firebase-messaging-sw.js')

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missing = requiredVars.filter((v) => !process.env[v])
if (missing.length > 0) {
  const msg = `[generate-sw] Missing env vars: ${missing.join(', ')}.\nDefine them in your .env.local file (local dev) or in your CI/hosting environment.\nThe generated service worker will not be functional until these are set.`
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg)
  }
  console.warn(msg)
}

let content = readFileSync(templatePath, 'utf8')

for (const varName of requiredVars) {
  const value = process.env[varName] ?? ''
  content = content.replaceAll(`%%${varName}%%`, value)
}

writeFileSync(outputPath, content, 'utf8')
console.log('[generate-sw] public/firebase-messaging-sw.js generated from template.')
