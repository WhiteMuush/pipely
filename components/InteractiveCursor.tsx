"use client"

import { useEffect, useState } from "react"

interface CursorState {
  x: number
  y: number
  isClicking: boolean
  isHovering: boolean
  isLoading: boolean
  isError: boolean
  elementType: string
}

const InteractiveCursor = () => {
  const [cursorState, setCursorState] = useState<CursorState>({
    x: 0,
    y: 0,
    isClicking: false,
    isHovering: false,
    isLoading: false,
    isError: false,
    elementType: "default",
  })

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setCursorState((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }))
    }

    const handleMouseDown = () => {
      setCursorState((prev) => ({ ...prev, isClicking: true }))
    }

    const handleMouseUp = () => {
      setCursorState((prev) => ({ ...prev, isClicking: false }))
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      let elementType = "default"
      let isHovering = false

      if (target.matches("button")) {
        elementType = "button"
        isHovering = true
      } else if (target.matches("a")) {
        elementType = "link"
        isHovering = true
      } else if (target.matches("input, textarea")) {
        elementType = "input"
        isHovering = true
      } else if (target.matches("pre, code")) {
        elementType = "code"
        isHovering = true
      } else if (target.matches('[data-loading="true"]')) {
        elementType = "loading"
        isHovering = true
      }

      setCursorState((prev) => ({
        ...prev,
        isHovering,
        elementType,
        isLoading: elementType === "loading",
      }))
    }

    document.addEventListener("mousemove", updateCursor)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mouseover", handleMouseOver)

    return () => {
      document.removeEventListener("mousemove", updateCursor)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseover", handleMouseOver)
    }
  }, [])

  const getCursorStyle = () => {
    const baseStyle = {
      left: cursorState.x - 12,
      top: cursorState.y - 12,
      transition: cursorState.isClicking ? "all 0.1s ease" : "all 0.2s ease",
    }

    return baseStyle
  }

  const getCursorClass = () => {
    let classes = "fixed pointer-events-none z-[9999] w-6 h-6"

    if (cursorState.isLoading) classes += " cursor-loading"
    if (cursorState.isError) classes += " cursor-glitch"
    if (cursorState.isClicking) classes += " scale-75"
    if (cursorState.isHovering) classes += " scale-125"

    return classes
  }

  const renderCursorContent = () => {
    switch (cursorState.elementType) {
      case "button":
        return (
          <div className="w-full h-full border-2 border-green-400 rounded-full bg-green-400/20">
            <div className="w-2 h-2 bg-green-400 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )
      case "link":
        return (
          <div className="w-full h-full border-2 border-blue-400 rounded-full bg-blue-400/20">
            <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )
      case "input":
        return (
          <div className="w-full h-full border-2 border-yellow-400 rounded-sm bg-yellow-400/20">
            <div className="w-1 h-4 bg-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
        )
      case "code":
        return (
          <div className="w-full h-full border-2 border-purple-400 rounded bg-purple-400/20 font-mono text-xs flex items-center justify-center">
            <span className="text-purple-400">{`</>`}</span>
          </div>
        )
      case "loading":
        return (
          <div className="w-full h-full border-2 border-green-400 rounded-full bg-green-400/20 animate-spin">
            <div className="w-1 h-1 bg-green-400 rounded-full absolute top-1 left-1/2 transform -translate-x-1/2" />
          </div>
        )
      default:
        return (
          <div className="w-full h-full border-2 border-green-400 rounded-full bg-green-400/10">
            <div className="w-2 h-2 bg-green-400 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )
    }
  }

  return (
    <div className={getCursorClass()} style={getCursorStyle()}>
      {renderCursorContent()}

      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          boxShadow: `0 0 20px rgba(34, 197, 94, ${cursorState.isHovering ? "0.6" : "0.3"})`,
        }}
      />
    </div>
  )
}

export default InteractiveCursor
