"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"

interface Character {
  char: string
  x: number
  y: number
  speed: number
}

const RainingBackground: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([])

  const createCharacters = useCallback(() => {
    const allChars = "{}[]()<>|&*+-=;:,.🍕"
    const charCount = 50 // Reduced for better performance
    const newCharacters: Character[] = []

    for (let i = 0; i < charCount; i++) {
      newCharacters.push({
        char: allChars[Math.floor(Math.random() * allChars.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.05 + Math.random() * 0.1, // Slower speed
      })
    }

    return newCharacters
  }, [])

  useEffect(() => {
    setCharacters(createCharacters())
  }, [createCharacters])

  useEffect(() => {
    let animationFrameId: number

    const updatePositions = () => {
      setCharacters((prevChars) =>
        prevChars.map((char) => ({
          ...char,
          y: char.y + char.speed,
          ...(char.y >= 100 && {
            y: -5,
            x: Math.random() * 100,
            char: "{}[]()<>|&*+-=;:,.🍕"[Math.floor(Math.random() * "{}[]()<>&*+-=;:,.🍕".length)],
          }),
        })),
      )
      animationFrameId = requestAnimationFrame(updatePositions)
    }

    animationFrameId = requestAnimationFrame(updatePositions)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {characters.map((char, index) => (
        <span
          key={index}
          className="absolute text-xs text-gray-800/30 font-mono"
          style={{
            left: `${char.x}%`,
            top: `${char.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: "0.75rem",
          }}
        >
          {char.char}
        </span>
      ))}
    </div>
  )
}

export default RainingBackground
