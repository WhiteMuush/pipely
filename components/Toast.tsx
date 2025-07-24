"use client"

import type React from "react"
import { useEffect } from "react"
import { CheckCircle, XCircle, X, AlertTriangle, Info } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error" | "warning" | "info"
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "cyber-border bg-black/90 text-green-400"
      case "error":
        return "cyber-border-red bg-black/90 text-red-400"
      case "warning":
        return "cyber-border-blue bg-black/90 text-yellow-400"
      case "info":
        return "cyber-border-blue bg-black/90 text-blue-400"
      default:
        return "cyber-border bg-black/90 text-green-400"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400 cyber-glow" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-400 cyber-glow" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-400 cyber-glow" />
      case "info":
        return <Info className="h-5 w-5 text-blue-400 cyber-glow" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-400 cyber-glow" />
    }
  }

  return (
    <div className="fixed top-6 right-6 z-50 cyber-slide-in">
      <div
        className={`flex items-center space-x-3 px-6 py-4 rounded-lg font-bold uppercase tracking-wider ${getToastStyles()}`}
      >
        {getIcon()}
        <span className="text-sm font-bold font-mono">{message}</span>
        <button onClick={onClose} className="ml-3 hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
