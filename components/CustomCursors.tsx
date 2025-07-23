"use client"

import { useEffect, useRef } from "react"

const CustomCursors = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const trailPos = useRef({ x: 0, y: 0 })
  const isClicking = useRef(false)
  const isHovering = useRef(false)

  useEffect(() => {
    let animationId: number

    const updateMousePosition = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseDown = () => {
      isClicking.current = true
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorPos.current.x - 12}px, ${cursorPos.current.y - 12}px, 0) scale(0.75)`
      }
    }

    const handleMouseUp = () => {
      isClicking.current = false
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorPos.current.x - 12}px, ${cursorPos.current.y - 12}px, 0) scale(1)`
      }
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const wasHovering = isHovering.current
      isHovering.current = target.matches('button, a, input, textarea, select, [role="button"], .cursor-pointer')

      if (wasHovering !== isHovering.current && cursorRef.current) {
        const ring = cursorRef.current.querySelector(".cursor-ring") as HTMLElement
        if (ring) {
          ring.style.transform = isHovering.current ? "scale(1.5)" : "scale(1)"
          ring.style.borderColor = isHovering.current ? "rgb(134, 239, 172)" : "rgb(34, 197, 94)"
        }
      }
    }

    const animate = () => {
      // Interpolation ultra-rapide pour le curseur principal
      cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * 0.9
      cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * 0.9

      // Interpolation plus lente pour la traînée
      trailPos.current.x += (mousePos.current.x - trailPos.current.x) * 0.15
      trailPos.current.y += (mousePos.current.y - trailPos.current.y) * 0.15

      // Mise à jour directe du DOM sans React
      if (cursorRef.current) {
        const scale = isClicking.current ? 0.75 : 1
        cursorRef.current.style.transform = `translate3d(${cursorPos.current.x - 12}px, ${cursorPos.current.y - 12}px, 0) scale(${scale})`
      }

      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${trailPos.current.x - 8}px, ${trailPos.current.y - 8}px, 0)`
      }

      animationId = requestAnimationFrame(animate)
    }

    // Initialisation
    document.addEventListener("mousemove", updateMousePosition, { passive: true })
    document.addEventListener("mousedown", handleMouseDown, { passive: true })
    document.addEventListener("mouseup", handleMouseUp, { passive: true })
    document.addEventListener("mouseover", handleMouseOver, { passive: true })

    // Démarrer l'animation
    animate()

    return () => {
      document.removeEventListener("mousemove", updateMousePosition)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseover", handleMouseOver)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <>
      {/* Main cursor - pas de transitions CSS */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] w-6 h-6"
        style={{
          willChange: "transform",
          transform: "translate3d(-12px, -12px, 0)",
        }}
      >
        {/* Outer ring */}
        <div
          className="cursor-ring w-full h-full border-2 border-green-400 rounded-full"
          style={{
            boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
            transition: "transform 0.2s ease, border-color 0.2s ease",
            willChange: "transform, border-color",
          }}
        />

        {/* Inner dot */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)",
          }}
        />

        {/* Pulse effect */}
        <div className="absolute inset-0 border border-green-400 rounded-full animate-ping opacity-20" />
      </div>

      {/* Trailing cursor - pas de transitions CSS */}
      <div
        ref={trailRef}
        className="fixed pointer-events-none z-[9998] w-4 h-4 opacity-30"
        style={{
          willChange: "transform",
          transform: "translate3d(-8px, -8px, 0)",
        }}
      >
        <div
          className="w-full h-full border border-green-400 rounded-full"
          style={{
            boxShadow: "0 0 6px rgba(34, 197, 94, 0.3)",
          }}
        />
      </div>

      {/* Second trail for more depth */}
      <div
        className="fixed pointer-events-none z-[9997] w-3 h-3 opacity-15"
        style={{
          willChange: "transform",
          transform: "translate3d(-6px, -6px, 0)",
        }}
        ref={(el) => {
          if (el) {
            const trailPos2 = { x: 0, y: 0 }
            const updateTrail2 = () => {
              trailPos2.x += (mousePos.current.x - trailPos2.x) * 0.08
              trailPos2.y += (mousePos.current.y - trailPos2.y) * 0.08
              el.style.transform = `translate3d(${trailPos2.x - 6}px, ${trailPos2.y - 6}px, 0)`
              requestAnimationFrame(updateTrail2)
            }
            updateTrail2()
          }
        }}
      >
        <div
          className="w-full h-full border border-green-400 rounded-full"
          style={{
            boxShadow: "0 0 4px rgba(34, 197, 94, 0.2)",
          }}
        />
      </div>
    </>
  )
}

export default CustomCursors
