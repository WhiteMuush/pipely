"use client"

import type React from "react"
import { useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div
        className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border-2 font-mono
        ${
          type === "success"
            ? "bg-black/90 border-green-500/50 text-green-400 shadow-green-500/20"
            : "bg-black/90 border-red-500/50 text-red-400 shadow-red-500/20"
        }
      `}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
