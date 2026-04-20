import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const versionPath = resolve(root, 'VERSION')
const packagePath = resolve(root, 'package.json')

// Read existing version
let version = readFileSync(versionPath, 'utf8').trim()
if (!version) {
  throw new Error('VERSION file is empty')
}

// Optional: auto-increment if requested via args (e.g. npm run sync:version -- patch)
const args = process.argv.slice(2)
if (args.includes('patch')) {
  const parts = version.split('.').map(Number)
  if (parts.length === 3) {
    parts[2] += 1
  } else if (parts.length === 4) {
    parts[3] += 1
  }
  version = parts.join('.')
  writeFileSync(versionPath, `${version}\n`, 'utf8')
  console.log(`[sync-version] VERSION file auto-incremented to ${version}`)
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
if (packageJson.version !== version) {
  packageJson.version = version
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
  console.log(`[sync-version] package.json synced to ${version}`)
} else {
  console.log(`[sync-version] already synced (${version})`)
}
