import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { CardVariant, LootTeacher, TeacherRarity } from '@/types/database'
import { CARD_SETS, getCard } from '@/constants/cardRegistry'
import { getRarityHexColor } from '@/modules/shared/rarity'

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
    const teacherColor = getRarityHexColor(registryCard.rarity as TeacherRarity)
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
    color: getRarityHexColor(teacher.rarity),
    cardNumber: resolveAlbumNumber(teacher.id || teacher.name),
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks
  }
}
