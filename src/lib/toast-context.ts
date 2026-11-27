import { createContext, useContext } from 'react'

export const ToastContext = createContext<(message: string) => void>(() => {})

/** Shows a short note above the bottom bar. */
export const useToast = () => useContext(ToastContext)
