import { BottomBar } from './components/BottomBar'
import { enabledModules } from './lib/modules'
import { useReady } from './lib/nest-context'
import { useRoute } from './lib/route'
import { useToast } from './lib/toast-context'
import { All } from './screens/All'
import { Home } from './screens/Home'
import { ModuleScreen } from './screens/ModuleScreen'
import { Us } from './screens/Us'

/** The logged-in app: the current screen plus the bottom bar. */
export function Shell() {
  const { data } = useReady()
  const toast = useToast()
  const [route, go] = useRoute()
  const on = enabledModules(data.modules)
  const pins = data.me.pinned_modules.map((key) => on.find((m) => m.key === key)).filter((m) => m !== undefined)

  return (
    <>
      {route.name === 'home' && <Home go={go} />}
      {route.name === 'all' && <All go={go} />}
      {route.name === 'us' && <Us />}
      {route.name === 'module' && <ModuleScreen key={route.key} moduleKey={route.key} go={go} />}
      <BottomBar
        route={route}
        pins={pins}
        go={go}
        onEmptyPin={() => {
          go({ name: on.length ? 'all' : 'home' })
          toast(on.length ? 'Pin something here with the pin buttons' : 'Pins arrive once a list is switched on')
        }}
      />
    </>
  )
}
