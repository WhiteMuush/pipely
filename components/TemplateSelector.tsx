"use client"

import type React from "react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Sparkles } from "lucide-react"

interface TemplateSelectorProps {
  onSelectTemplate: (templateKey: string) => void
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none")

  const templates = {
    "node-ci": "Node.js CI/CD",
    "docker-build": "Docker Build & Push",
    "python-ci": "Python CI/CD",
    "react-deploy": "React Deploy",
    "full-stack": "Full Stack App",
  }

  const handleSelect = () => {
    if (selectedTemplate && selectedTemplate !== "none") {
      onSelectTemplate(selectedTemplate)
      setSelectedTemplate("none")
    }
  }

  return (
    <div className="button-group w-full">
      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
        <SelectTrigger className="cyber-input flex-1">
          <SelectValue placeholder="Select Template" />
        </SelectTrigger>
        <SelectContent className="bg-black border-green-500">
          <SelectItem value="none" className="text-green-400/50 hover:bg-green-900/20 font-mono opacity-50">
            Select a template
          </SelectItem>
          {Object.entries(templates).map(([key, name]) => (
            <SelectItem key={key} value={key} className="text-green-400 hover:bg-green-900/20 font-mono">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-3 w-3 text-green-400 cyber-glow" />
                <span>{name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={handleSelect}
        disabled={!selectedTemplate || selectedTemplate === "none"}
        className={`cyber-btn ${!selectedTemplate || selectedTemplate === "none" ? "opacity-50" : ""}`}
      >
        <FileText className="h-4 w-4 mr-1" />
        Load
      </button>
    </div>
  )
}

export default TemplateSelector
