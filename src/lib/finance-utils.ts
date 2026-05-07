import { FinanceEntry, ShopEarning, Settings } from '@/types/database'

export const COURSE_COLORS = [
  'bg-primary',
  'bg-success',
  'bg-brand',
  'bg-info',
  'bg-warning',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
]

/**
 * Calculates a breakdown of contributions by course for visualization in progress bars.
 */
export function calculateFinanceBreakdown(
  finances: FinanceEntry[],
  shopEarnings: ShopEarning[],
  settings: Settings | null
) {
  const courseContributions: Record<string, number> = {}

  // 1. Add contributions from finance entries (income only for better visualization)
  finances.forEach(entry => {
    if (entry.responsible_class && entry.amount > 0) {
      const course = String(entry.responsible_class)
      courseContributions[course] = (courseContributions[course] || 0) + entry.amount
    }
  })

  // 2. Add contributions from shop earnings
  shopEarnings.forEach(earning => {
    if (earning.selected_course && earning.abi_share_eur > 0) {
      const course = String(earning.selected_course)
      courseContributions[course] = (courseContributions[course] || 0) + earning.abi_share_eur
    }
  })

  // 3. Add manual adjustments if they exist
  if (settings?.leaderboard_adjustments) {
    Object.entries(settings.leaderboard_adjustments).forEach(([course, amount]) => {
      if (typeof amount === 'number' && amount > 0) {
        courseContributions[course] = (courseContributions[course] || 0) + amount
      }
    })
  }

  // 4. Format for the breakdown prop
  return Object.entries(courseContributions)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([course, amount], index) => ({
      label: `Kurs ${course}`,
      amount,
      color: COURSE_COLORS[index % COURSE_COLORS.length]
    }))
}

export function calculateTicketPenalty(
  profile: { task_stats?: { completed_count: number, total_penalty_reduction?: number } | null, participation_manual_credit?: number } | null,
  settings: { ticket_penalty_base?: number, ticket_penalty_reduction?: number } | null
) {
  const penaltyBase = settings?.ticket_penalty_base ?? 30
  const penaltyReductionSetting = settings?.ticket_penalty_reduction ?? 10
  
  const completedCount = profile?.task_stats?.completed_count ?? 0
  const totalTaskReduction = profile?.task_stats?.total_penalty_reduction ?? (completedCount * penaltyReductionSetting)
  const manualCredit = profile?.participation_manual_credit ?? 0

  const currentPenalty = Math.max(0, penaltyBase - totalTaskReduction - manualCredit)

  return {
    currentPenalty,
    completedTasks: completedCount,
    totalTaskReduction,
    manualCredit,
    penaltyBase,
    penaltyReductionSetting,
    isFullyReduced: currentPenalty === 0
  }
}


