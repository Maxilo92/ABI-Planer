#!/usr/bin/env node

const admin = require('firebase-admin')

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  const projectIdArg = argv.find((arg) => arg.startsWith('--project-id='))
  return {
    help: args.has('--help') || args.has('-h'),
    apply: args.has('--apply'),
    resetOnline: args.has('--reset-online'),
    projectId: projectIdArg ? projectIdArg.replace('--project-id=', '').trim() : '',
  }
}

function printHelp() {
  console.log('Usage: node scripts/cleanup_session_metrics.js [--apply] [--reset-online] [--project-id=<id>]')
  console.log('')
  console.log('Options:')
  console.log('  --apply         Persist changes (without this flag the script is dry-run)')
  console.log('  --reset-online  Also force stale isOnline flags to false')
  console.log('  --project-id    Override Firebase project id explicitly')
  console.log('  --help, -h      Show this help')
}

function initAdmin(projectIdOverride) {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const projectId =
    projectIdOverride ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'abi-planer-75319'
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  })
}

async function run() {
  const { help, apply, resetOnline, projectId } = parseArgs(process.argv)

  if (help) {
    printHelp()
    return
  }

  initAdmin(projectId)

  const db = admin.firestore()
  const batchSize = 300
  const deleteField = admin.firestore.FieldValue.delete()

  let scanned = 0
  let affected = 0
  let updated = 0
  let lastDoc = null

  console.log(`[cleanup_session_metrics] Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`[cleanup_session_metrics] resetOnline: ${resetOnline ? 'yes' : 'no'}`)

  while (true) {
    let query = db.collection('profiles').orderBy(admin.firestore.FieldPath.documentId()).limit(batchSize)
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    let batch = db.batch()
    let batchOps = 0

    for (const doc of snap.docs) {
      scanned += 1
      const data = doc.data() || {}

      const hasLegacyDuration = Object.prototype.hasOwnProperty.call(data, 'lastSessionDurationSeconds')
      const hasOnlineSince = Object.prototype.hasOwnProperty.call(data, 'onlineSince')
      const hasOnlineFlag = Boolean(data.isOnline)

      const update = {}

      if (hasLegacyDuration) {
        update.lastSessionDurationSeconds = deleteField
      }

      if (hasOnlineSince) {
        update.onlineSince = null
      }

      if (resetOnline && hasOnlineFlag) {
        update.isOnline = false
      }

      if (Object.keys(update).length === 0) {
        continue
      }

      affected += 1

      if (apply) {
        batch.update(doc.ref, update)
        batchOps += 1

        if (batchOps >= 400) {
          await batch.commit()
          updated += batchOps
          batch = db.batch()
          batchOps = 0
        }
      }
    }

    if (apply && batchOps > 0) {
      await batch.commit()
      updated += batchOps
    }

    lastDoc = snap.docs[snap.docs.length - 1]
  }

  console.log(`[cleanup_session_metrics] scanned: ${scanned}`)
  console.log(`[cleanup_session_metrics] affected: ${affected}`)
  console.log(`[cleanup_session_metrics] updated: ${updated}`)

  if (!apply) {
    console.log('[cleanup_session_metrics] Dry-run complete. Use --apply to persist changes.')
  }
}

run().catch((error) => {
  console.error('[cleanup_session_metrics] failed:', error?.message || error)
  console.error('[cleanup_session_metrics] Hint: set FIREBASE_PROJECT_ID and either ADC credentials or FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.')
  process.exitCode = 1
})
