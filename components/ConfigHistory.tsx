"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Download, Trash2, Clock, GitBranch } from "lucide-react"

interface SavedConfig {
  id: string
  name: string
  platform: "github" | "gitlab"
  jobCount: number
  createdAt: string
  lastModified: string
  config: any
}

interface ConfigHistoryProps {
  onLoadConfig: (config: any) => void
}

const ConfigHistory: React.FC<ConfigHistoryProps> = ({ onLoadConfig }) => {
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadSavedConfigs()
  }, [])

  const loadSavedConfigs = () => {
    const saved = localStorage.getItem("ci-config-history")
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved configs:", error)
      }
    }
  }

  const saveConfig = (config: any, name: string) => {
    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name,
      platform: config.platform,
      jobCount: config.jobs?.length || 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      config,
    }

    const updated = [newConfig, ...savedConfigs.slice(0, 9)] // Keep only 10 most recent
    setSavedConfigs(updated)
    localStorage.setItem("ci-config-history", JSON.stringify(updated))
  }

  const deleteConfig = (id: string) => {
    const updated = savedConfigs.filter((config) => config.id !== id)
    setSavedConfigs(updated)
    localStorage.setItem("ci-config-history", JSON.stringify(updated))
  }

  const exportConfig = (config: SavedConfig) => {
    const blob = new Blob([JSON.stringify(config.config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${config.name.replace(/\s+/g, "-")}-config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!showHistory) {
    return (
      <Button
        onClick={() => setShowHistory(true)}
        size="sm"
        className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
      >
        <History className="h-4 w-4 mr-2" />
        Historique ({savedConfigs.length})
      </Button>
    )
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/10">
      <CardHeader className="border-b border-green-500/20">
        <CardTitle className="flex items-center justify-between text-green-400 font-mono">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>HISTORIQUE DES CONFIGURATIONS</span>
          </div>
          <Button
            onClick={() => setShowHistory(false)}
            size="sm"
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
          >
            Fermer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {savedConfigs.length === 0 ? (
          <p className="text-green-400/60 text-center py-8 font-mono">{"> Aucune configuration sauvegardée"}</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedConfigs.map((config) => (
              <div
                key={config.id}
                className="bg-black/40 border border-green-500/30 rounded p-3 hover:border-green-400/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-mono font-semibold">{config.name}</h4>
                    <Badge
                      className={`${
                        config.platform === "github"
                          ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                          : "bg-orange-600/20 text-orange-400 border-orange-500/50"
                      }`}
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      {config.platform === "github" ? "GitHub" : "GitLab"}
                    </Badge>
                    <Badge className="bg-green-600/20 text-green-400 border-green-500/50">
                      {config.jobCount} job(s)
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => onLoadConfig(config.config)}
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
                    >
                      Charger
                    </Button>
                    <Button
                      onClick={() => exportConfig(config)}
                      size="sm"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 bg-transparent"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteConfig(config.id)}
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 bg-transparent"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono text-green-400/70">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(config.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ConfigHistory
