import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { CardVariant, LootTeacher, TeacherRarity } from '@/types/database'
import { CARD_SETS, getCard } from '@/constants/cardRegistry'

function getTeacherRarityHex(rarity: TeacherRarity) {
  switch (rarity) {
    case 'common': return '#64748b'
    case 'rare': return '#10b981'
    case 'epic': return '#9333ea'
    case 'mythic': return '#dc2626'
    case 'legendary': return '#f59e0b'
    case 'iconic': return '#000000'
    default: return '#64748b'
  }
}

export function mapToTeacherCardData(
  teacher: LootTeacher,
  variant: CardVariant | NewCardVariant
): CardData {
  const fullId = teacher.id || teacher.name
  const registryCard = getCard(fullId)

  const resolveAlbumNumber = (id: string) => {
    const teacherCards = CARD_SETS['teacher_vol1']?.cards || []
    const index = teacherCards.findIndex((t: any) => (t.id || t.name) === id)
    return index >= 0 ? (index + 1).toString().padStart(3, '0') : '???'
  }
  
  if (registryCard) {
    const teacherColor = getTeacherRarityHex(registryCard.rarity as TeacherRarity)
    const albumNumber = resolveAlbumNumber(registryCard.id)

    return {
      id: registryCard.id,
      setId: registryCard.setId,
      fullId: registryCard.fullId,
      name: registryCard.name,
      rarity: registryCard.rarity,
      type: 'teacher',
      variant,
      // Teacher visuals should stay rarity-colored; set-level color is always blue.
      color: teacherColor,
      cardNumber: albumNumber,
      style: registryCard.style,
      description: registryCard.description,
      hp: (registryCard as any).hp,
      attacks: (registryCard as any).attacks
    }
  }

  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    type: 'teacher',
    variant,
    color: getTeacherRarityHex(teacher.rarity),
    cardNumber: resolveAlbumNumber(teacher.id || teacher.name),
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks
  }
}
