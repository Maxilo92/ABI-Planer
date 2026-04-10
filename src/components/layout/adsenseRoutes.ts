export function isAdSenseAllowedRoute(pathname: string) {
  return pathname === '/' || pathname.startsWith('/vorteile') || pathname.startsWith('/news')
}