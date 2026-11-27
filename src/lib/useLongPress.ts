import { useRef } from 'react'

/**
 * Press and hold for `ms` to call onLongPress; a normal tap calls onTap.
 * Moving the finger (scrolling) cancels the hold.
 */
export function useLongPress(onLongPress: () => void, onTap: () => void, ms = 550) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
  }

  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      cancel()
      timer.current = window.setTimeout(() => {
        fired.current = true
        navigator.vibrate?.(15)
        onLongPress()
      }, ms)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return
      if (Math.abs(e.clientX - start.current.x) > 10 || Math.abs(e.clientY - start.current.y) > 10) cancel()
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (fired.current) {
        fired.current = false
        return
      }
      onTap()
    },
  }
}
