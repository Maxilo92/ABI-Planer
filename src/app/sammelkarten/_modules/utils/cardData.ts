import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { CardVariant, LootTeacher, TeacherRarity } from '@/types/database'

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
  variant: CardVariant | NewCardVariant,
  globalTeachers: LootTeacher[]
): CardData {
  const globalIndex = globalTeachers.findIndex(
    (t) => (t.id || t.name) === (teacher.id || teacher.name)
  )

  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    variant,
    color: getTeacherRarityHex(teacher.rarity),
    cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks
  }
}
