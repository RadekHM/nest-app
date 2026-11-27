// A tiny hash router: #/ (Home), #/all, #/us and #/m/<module>. Hash URLs work
// on GitHub Pages without server rewrites, and the phone's back gesture works.
import { useEffect, useState } from 'react'

export type Route = { name: 'home' } | { name: 'all' } | { name: 'us' } | { name: 'module'; key: string }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  if (path === 'all') return { name: 'all' }
  if (path === 'us') return { name: 'us' }
  const m = /^m\/([a-z][a-z0-9_]*)$/.exec(path)
  if (m) return { name: 'module', key: m[1] }
  return { name: 'home' }
}

export function hrefOf(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'all':
      return '#/all'
    case 'us':
      return '#/us'
    case 'module':
      return `#/m/${route.key}`
  }
}

export function useRoute(): [Route, (to: Route) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      if (!navigator.userAgent.includes("jsdom")) window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = (to: Route) => {
    window.location.hash = hrefOf(to)
  }
  return [route, go]
}
