export const AVATAR_PALETTE = [
  '#FF595E', // Red
  '#FFCA3A', // Yellow
  '#8AC926', // Green
  '#1982C4', // Blue
  '#6A4C93', // Purple
  '#F4A261', // Orange
  '#2A9D8F', // Teal
  '#E76F51', // Coral
  '#264653', // Dark Slate
  '#E9C46A', // Sand
  '#F4F1DE', // Eggshell
  '#E07A5F', // Rust
  '#3D405B', // Navy
  '#81B29A', // Sage
  '#F2CC8F', // Peach
  '#2B2D42', // Dark Grey
]

export type PixelAvatarGalleryItem = {
  seed: string
  label: string
  description: string
}

export const PIXEL_AVATAR_GALLERY: PixelAvatarGalleryItem[] = [
  { seed: 'aurora-grid', label: 'Aurora Grid', description: 'Klares, kontrastreiches Muster' },
  { seed: 'sunset-loop', label: 'Sunset Loop', description: 'Warme Farben mit ruhigem Verlauf' },
  { seed: 'glacier-drift', label: 'Glacier Drift', description: 'Kühle Töne mit technischer Anmutung' },
  { seed: 'pixel-forest', label: 'Pixel Forest', description: 'Grüne, organische Symmetrie' },
  { seed: 'neon-dawn', label: 'Neon Dawn', description: 'Leuchtende Farben mit starkem Kontrast' },
  { seed: 'ember-core', label: 'Ember Core', description: 'Dunkler Kern mit Feuerakzenten' },
]

const hashSeed = (seed: string): number => {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed: string) => {
  let state = hashSeed(seed) || 1

  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

const buildPixelAvatarSvg = (random: () => number) => {
  const size = 8
  const halfSize = size / 2
  const svgSize = 64
  const blockSize = svgSize / size

  let rects = ''

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < halfSize; x += 1) {
      const color = AVATAR_PALETTE[Math.floor(random() * AVATAR_PALETTE.length)]

      rects += `<rect x="${x * blockSize}" y="${y * blockSize}" width="${blockSize}" height="${blockSize}" fill="${color}" />`

      const mirroredX = size - 1 - x
      rects += `<rect x="${mirroredX * blockSize}" y="${y * blockSize}" width="${blockSize}" height="${blockSize}" fill="${color}" />`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">${rects}</svg>`
}

const encodeSvg = (svgString: string): string => {
  if (typeof window !== 'undefined') {
    return `data:image/svg+xml;base64,${window.btoa(svgString)}`
  }

  return `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`
}

/**
 * Generates an 8x8 random pixel matrix avatar as an SVG data URL.
 * It uses a symmetric pattern (mirrored horizontally) with a random
 * foreground color from the palette and a light background, or 
 * randomly picks from the 16 colors. Based on the requirement:
 * "aus einer zufälligen 8 mal 8 Pixelmatrix bestehen ... 16 verschiedene Farben"
 * we randomly color each symmetric pixel with a random color or create a structured shape.
 * 
 * To make it look aesthetically pleasing while using the 16 colors:
 * Each pixel in the 8x4 left side is randomly assigned one of the 16 colors,
 * and then mirrored to the right side.
 */
export function generatePixelAvatar(): string {
  return encodeSvg(buildPixelAvatarSvg(Math.random))
}

export function generateSeededPixelAvatar(seed: string): string {
  return encodeSvg(buildPixelAvatarSvg(createSeededRandom(seed)))
}

/**
 * Generates a deterministic short ID for a given SVG data URL by hashing its content.
 * Returns null if the URL is not a valid generated pixel avatar.
 */
export function getAvatarId(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('data:image/svg+xml;base64,')) {
    return null
  }
  
  // Simple deterministic string hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive hex and pad
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()
  return `#ABI-${hexHash.substring(0, 4)}-${hexHash.substring(4, 8)}`
}
