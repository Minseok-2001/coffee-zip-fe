export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('memberId')
}

export function requireAuth(router: ReturnType<typeof import('next/navigation').useRouter>): boolean {
  if (!isLoggedIn()) {
    router.push('/login')
    return false
  }
  return true
}
