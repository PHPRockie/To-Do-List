export function getGreeting(displayName?: string): string {
  const hour = new Date().getHours()
  const timeOfDay = hour >= 5 && hour < 12 ? 'morning'
    : hour >= 12 && hour < 18 ? 'afternoon'
    : 'evening'
  return displayName ? `Good ${timeOfDay}, ${displayName}` : `Good ${timeOfDay}`
}
