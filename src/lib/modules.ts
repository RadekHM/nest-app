import { MODULES, moduleByKey, type ModuleDef } from '../modules/registry'
import type { ModuleSwitch } from './api'

/** The modules that are switched on, in the household's order. */
export function enabledModules(switches: ModuleSwitch[]): ModuleDef[] {
  return switches
    .filter((s) => s.enabled)
    .map((s) => moduleByKey(s.module_key))
    .filter((m): m is ModuleDef => m !== undefined)
}

export function moduleName(key: string): string {
  return moduleByKey(key)?.name ?? key
}

export { MODULES }
