import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

type AppTarget = 'dashboard' | 'tcg'

function normalizeClassName(className?: unknown): string | null {
  if (typeof className !== 'string') return null

  const normalized = className.trim()
  return normalized.length > 0 ? normalized : null
}

function extractGrade(className?: string | null): string | null {
  if (!className) return null

  const match = className.toLowerCase().match(/\b(11|12)\b/)
  return match?.[1] ?? null
}

function resolveAccessTarget(profile: Record<string, unknown>): AppTarget {
  if (profile.access_target === 'dashboard' || profile.access_target === 'tcg') {
    return profile.access_target
  }

  if (profile.role === 'admin' || profile.role === 'admin_main' || profile.role === 'admin_co') {
    return 'dashboard'
  }

  const className = normalizeClassName(profile.class_name)
  const grade = extractGrade(className)
  return grade === '11' ? 'dashboard' : 'tcg'
}

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null

  return {
    dryRun,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : null,
  }
}

async function main() {
  initializeApp({
    credential: applicationDefault(),
  }, 'access-target-migration')

  const db = getFirestore('abi-data')
  const { dryRun, limit } = parseArgs()

  console.log(`Starting access-target migration${dryRun ? ' (dry-run)' : ''}...`)

  const snapshot = await db.collection('profiles').get()
  const stats = {
    dashboard: 0,
    tcg: 0,
    updated: 0,
    skipped: 0,
  }

  let batch = db.batch()
  let batchCount = 0
  const maxBatchSize = 400

  for (const profileSnap of snapshot.docs) {
    if (limit !== null && stats.updated + stats.skipped >= limit) {
      break
    }

    const profile = profileSnap.data() as Record<string, unknown>
    const accessTarget = resolveAccessTarget(profile)
    stats[accessTarget] += 1

    if (profile.access_target === accessTarget) {
      stats.skipped += 1
      continue
    }

    stats.updated += 1

    if (!dryRun) {
      batch.update(profileSnap.ref, {
        access_target: accessTarget,
        access_target_migrated_at: FieldValue.serverTimestamp(),
      })
      batchCount += 1

      if (batchCount >= maxBatchSize) {
        await batch.commit()
        batch = db.batch()
        batchCount = 0
      }
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit()
  }

  console.log('Finished access-target migration.')
  console.log(JSON.stringify(stats, null, 2))
}

main().catch((error) => {
  console.error('Access-target migration failed:', error)
  process.exitCode = 1
})
