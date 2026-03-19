import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const versionPath = resolve(root, 'VERSION')
const packagePath = resolve(root, 'package.json')

const version = readFileSync(versionPath, 'utf8').trim()
if (!version) {
  throw new Error('VERSION file is empty')
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
if (packageJson.version !== version) {
  packageJson.version = version
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
  console.log(`[sync-version] package.json synced to ${version}`)
} else {
  console.log(`[sync-version] already synced (${version})`)
}
