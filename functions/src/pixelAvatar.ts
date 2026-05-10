const AVATAR_PALETTE = [
  '#FF595E',
  '#FFCA3A',
  '#8AC926',
  '#1982C4',
  '#6A4C93',
  '#F4A261',
  '#2A9D8F',
  '#E76F51',
  '#264653',
  '#E9C46A',
  '#F4F1DE',
  '#E07A5F',
  '#3D405B',
  '#81B29A',
  '#F2CC8F',
  '#2B2D42',
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

const encodeSvg = (svgString: string): string => `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`

export function generateSeededPixelAvatar(seed: string): string {
  return encodeSvg(buildPixelAvatarSvg(createSeededRandom(seed)))
}