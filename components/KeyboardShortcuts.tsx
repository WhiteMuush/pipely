"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Keyboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KeyboardShortcutsProps {
  onCopy?: () => void
  onDownload?: () => void
  onReset?: () => void
  onAddJob?: () => void
  onSave?: () => void
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onCopy, onDownload, onReset, onAddJob, onSave }) => {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const shortcuts = [
    { key: "Ctrl + C", description: "Copier le YAML", action: onCopy },
    { key: "Ctrl + S", description: "Sauvegarder la config", action: onSave },
    { key: "Ctrl + D", description: "Télécharger le YAML", action: onDownload },
    { key: "Ctrl + R", description: "Réinitialiser", action: onReset },
    { key: "Ctrl + J", description: "Ajouter un job", action: onAddJob },
    { key: "Ctrl + ?", description: "Afficher les raccourcis", action: () => setShowShortcuts(true) },
    { key: "Escape", description: "Fermer les raccourcis", action: () => setShowShortcuts(false) },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            if (e.target === document.body) {
              e.preventDefault()
              onCopy?.()
            }
            break
          case "s":
            e.preventDefault()
            onSave?.()
            break
          case "d":
            e.preventDefault()
            onDownload?.()
            break
          case "r":
            e.preventDefault()
            onReset?.()
            break
          case "j":
            e.preventDefault()
            onAddJob?.()
            break
          case "/":
          case "?":
            e.preventDefault()
            setShowShortcuts(true)
            break
        }
      } else if (e.key === "Escape") {
        setShowShortcuts(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onCopy, onDownload, onReset, onAddJob, onSave])

  if (!showShortcuts) {
    return (
      <Button
        onClick={() => setShowShortcuts(true)}
        size="sm"
        className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
      >
        <Keyboard className="h-4 w-4 mr-2" />
        Raccourcis
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="bg-black/90 border-2 border-green-500/30 shadow-lg shadow-green-500/10 max-w-md w-full mx-4">
        <CardHeader className="border-b border-green-500/20">
          <CardTitle className="flex items-center justify-between text-green-400 font-mono">
            <div className="flex items-center space-x-2">
              <Keyboard className="h-5 w-5" />
              <span>RACCOURCIS CLAVIER</span>
            </div>
            <Button
              onClick={() => setShowShortcuts(false)}
              size="sm"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white font-mono text-sm">{shortcut.description}</span>
                <Badge className="bg-green-600/20 text-green-400 border-green-500/50 font-mono">{shortcut.key}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 p-3 bg-green-900/20 border border-green-500/30 rounded">
            <p className="text-green-400/80 font-mono text-xs">
              💡 Astuce: Utilisez Ctrl+? pour afficher/masquer ce panneau rapidement
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default KeyboardShortcuts
