export const MAX_PINS = 2

/**
 * Pins or unpins a module. With both spots taken, the oldest pin makes room.
 * Returns the new pins and a short line to show the person.
 */
export function togglePin(
  pins: string[],
  key: string,
  nameOf: (key: string) => string,
): { pins: string[]; message: string } {
  if (pins.includes(key)) {
    return { pins: pins.filter((p) => p !== key), message: `Unpinned ${nameOf(key)}` }
  }
  if (pins.length < MAX_PINS) {
    return { pins: [...pins, key], message: `Pinned ${nameOf(key)} to the bar` }
  }
  const [oldest, ...rest] = pins
  return { pins: [...rest, key], message: `Pinned ${nameOf(key)} in place of ${nameOf(oldest)}` }
}
