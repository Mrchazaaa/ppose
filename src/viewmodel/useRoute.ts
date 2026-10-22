import { useEffect, useState } from 'react'

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  let templateId: string | undefined
  if (path.startsWith('/capture/') && path.slice('/capture/'.length) && !path.slice('/capture/'.length).includes('/')) {
    try { templateId = decodeURIComponent(path.slice('/capture/'.length)) } catch { /* invalid route */ }
  }
  const kind = path === '/' ? 'menu' : path === '/results' ? 'results' : templateId ? 'studio' : 'unknown'

  function navigate(next: string) {
    if (next === window.location.pathname) return
    window.history.pushState(null, '', next)
    setPath(next)
  }

  return {
    path, kind, templateId,
    openStudio: (id: string) => navigate(`/capture/${encodeURIComponent(id)}`),
    openResults: () => navigate('/results'),
    openMenu: () => navigate('/'),
  }
}
