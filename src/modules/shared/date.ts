type DateWithToDate = {
  toDate: () => Date
}

type TimestampLike = {
  seconds: number
}

function hasToDate(value: unknown): value is DateWithToDate {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as DateWithToDate).toDate === 'function'
  )
}

function hasSeconds(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as TimestampLike).seconds === 'number'
  )
}

export function toDate(value: unknown): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (hasToDate(value)) return value.toDate()
  if (hasSeconds(value)) return new Date(value.seconds * 1000)

  const parsed = new Date(value as string | number)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function toMillis(value: unknown): number {
  return toDate(value).getTime()
}
