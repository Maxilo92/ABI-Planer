export function isAdSenseAllowedRoute(pathname: string) {
  return pathname === '/' || pathname === '/uber' || pathname.startsWith('/vorteile') || pathname.startsWith('/news')
}