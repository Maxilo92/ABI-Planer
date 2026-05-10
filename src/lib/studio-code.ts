/**
 * Deterministic personal studio access code.
 * Computed entirely from the user's UID — no Firestore needed.
 *
 * The code is purposely NOT documented elsewhere in the UI.
 * It appears (hidden) only in the NFT avatar dialog for the owner.
 */
const WORDS = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'SIGMA', 'OMEGA', 'NOVA', 'ECHO', 'ZETA', 'LAMBDA', 'HELIX', 'VEGA']

export function computeStudioCode(uid: string): string {
  // DJB2-style hash
  let h = 5381
  for (let i = 0; i < uid.length; i++) {
    h = Math.imul((h << 5) + h, 1) ^ uid.charCodeAt(i)
    h = h >>> 0 // keep unsigned 32-bit
  }
  const w1 = WORDS[h % WORDS.length]
  const w2 = WORDS[(h >>> 5) % WORDS.length]
  const num = (h % 9000) + 1000
  return `${w1}-${w2}-${num}`
}

export function verifyStudioCode(uid: string, input: string): boolean {
  return input.trim().toUpperCase() === computeStudioCode(uid)
}
