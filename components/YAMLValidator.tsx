"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, TrendingUp } from "lucide-react"

interface YAMLValidatorProps {
  yamlContent: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  stats: {
    jobs: number
    steps: number
    triggers: number
  }
}

const YAMLValidator: React.FC<YAMLValidatorProps> = ({ yamlContent }) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    stats: { jobs: 0, steps: 0, triggers: 0 },
  })

  useEffect(() => {
    validateYAML(yamlContent)
  }, [yamlContent])

  const validateYAML = (yaml: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const stats = { jobs: 0, steps: 0, triggers: 0 }

    if (!yaml.trim()) {
      setValidation({ isValid: true, errors: [], warnings: [], suggestions: [], stats })
      return
    }

    // Statistiques
    const jobMatches = yaml.match(/^\s*[a-zA-Z0-9_-]+:\s*$/gm)
    if (jobMatches) stats.jobs = jobMatches.length - 1 // -1 pour exclure "jobs:"

    const stepMatches = yaml.match(/- name:/g)
    if (stepMatches) stats.steps = stepMatches.length

    const triggerCount =
      (yaml.match(/on:/g) || []).length +
      (yaml.match(/push:/g) || []).length +
      (yaml.match(/pull_request:/g) || []).length
    stats.triggers = triggerCount

    // Validation basique de la syntaxe YAML
    const lines = yaml.split("\n")

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return

      // Vérifier l'indentation
      const currentIndent = line.length - line.trimStart().length
      if (currentIndent % 2 !== 0) {
        warnings.push(`LINE ${index + 1}: ODD INDENTATION DETECTED`)
      }

      // Vérifier les caractères spéciaux non échappés
      if (trimmed.includes(":") && !trimmed.match(/^[^:]+:\s*(.+)?$/)) {
        errors.push(`LINE ${index + 1}: INVALID KEY-VALUE SYNTAX`)
      }

      // Vérifier les tabulations
      if (line.includes("\t")) {
        errors.push(`LINE ${index + 1}: USE SPACES INSTEAD OF TABS`)
      }
    })

    // Validations spécifiques GitHub Actions
    if (yaml.includes("on:")) {
      if (!yaml.includes("jobs:")) {
        errors.push('GITHUB ACTIONS WORKFLOW MUST CONTAIN A "JOBS" SECTION')
      }

      // Vérifier les actions obsolètes
      if (yaml.includes("actions/checkout@v2")) {
        warnings.push("ACTIONS/CHECKOUT@V2 IS DEPRECATED, USE @V4")
      }
      if (yaml.includes("actions/setup-node@v2")) {
        warnings.push("ACTIONS/SETUP-NODE@V2 IS DEPRECATED, USE @V4")
      }

      // Suggestions d'amélioration
      if (!yaml.includes("timeout-minutes:")) {
        suggestions.push("ADD TIMEOUT-MINUTES TO PREVENT HANGING JOBS")
      }
      if (!yaml.includes("cache")) {
        suggestions.push("CONSIDER ADDING CACHE TO SPEED UP BUILDS")
      }
    }

    // Validations spécifiques GitLab CI
    if (yaml.includes("stages:")) {
      const stageMatches = yaml.match(/stages:\s*\n((?:\s*-\s*.+\n?)*)/g)
      if (stageMatches) {
        const stages = stageMatches[0].match(/-\s*(.+)/g)?.map((s) => s.replace(/^-\s*/, "").trim()) || []

        // Vérifier que tous les jobs référencent des stages existants
        const jobStageMatches = yaml.match(/stage:\s*(.+)/g)
        if (jobStageMatches) {
          jobStageMatches.forEach((match) => {
            const stage = match.replace("stage:", "").trim()
            if (!stages.includes(stage)) {
              errors.push(`STAGE "${stage}" USED BUT NOT DEFINED IN STAGES LIST`)
            }
          })
        }
      }

      // Suggestions GitLab CI
      if (!yaml.includes("rules:") && !yaml.includes("only:") && !yaml.includes("except:")) {
        suggestions.push("ADD RULES TO CONTROL WHEN JOBS EXECUTE")
      }
    }

    // Vérifications de sécurité
    if (yaml.includes("${{ secrets.") && yaml.includes("echo")) {
      warnings.push("WARNING: AVOID DISPLAYING SECRETS IN LOGS")
    }

    // Vérifications de performance
    if (yaml.includes("ubuntu-latest") && yaml.includes("windows-latest")) {
      suggestions.push("USE MATRIX STRATEGY TO TEST ON MULTIPLE OS EFFICIENTLY")
    }

    // Vérifications de versions Node.js
    if (yaml.includes("node-version: 16") || yaml.includes("node-version: '16'")) {
      warnings.push("NODE.JS 16 IS EOL, USE NODE.JS 18 OR 20")
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      stats,
    })
  }

  if (!yamlContent.trim()) return null

  return (
    <div className="space-y-4">
      {/* Status badges */}
      <div className="flex items-center flex-wrap gap-3">
        {validation.isValid ? (
          <div className="cyber-badge">
            <CheckCircle className="h-3 w-3 mr-2" />
            YAML VALID
          </div>
        ) : (
          <div className="cyber-badge-error">
            <XCircle className="h-3 w-3 mr-2" />
            {validation.errors.length} ERROR{validation.errors.length !== 1 ? "S" : ""}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="cyber-badge-warning">
            <AlertTriangle className="h-3 w-3 mr-2" />
            {validation.warnings.length} WARNING{validation.warnings.length !== 1 ? "S" : ""}
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div className="cyber-badge-info">
            <Info className="h-3 w-3 mr-2" />
            {validation.suggestions.length} SUGGESTION{validation.suggestions.length !== 1 ? "S" : ""}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="flex items-center space-x-6 text-sm font-bold text-green-400 font-mono uppercase tracking-wider">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-green-400 cyber-glow" />
          <span>
            {validation.stats.jobs} JOB{validation.stats.jobs !== 1 ? "S" : ""}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full cyber-glow"></span>
          <span>
            {validation.stats.steps} STEP{validation.stats.steps !== 1 ? "S" : ""}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full cyber-glow"></span>
          <span>
            {validation.stats.triggers} TRIGGER{validation.stats.triggers !== 1 ? "S" : ""}
          </span>
        </div>
      </div>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="cyber-border-red rounded-lg p-4 bg-red-900/10">
          <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center uppercase tracking-wider">
            <XCircle className="h-4 w-4 mr-2 cyber-glow" />
            ERRORS DETECTED:
          </h4>
          <ul className="text-red-300 text-sm space-y-2 font-mono">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-3 mt-0.5 cyber-glow">&gt;</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="cyber-border rounded-lg p-4 bg-yellow-900/10">
          <h4 className="text-yellow-400 font-bold text-sm mb-3 flex items-center uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 mr-2 cyber-glow" />
            WARNINGS:
          </h4>
          <ul className="text-yellow-300 text-sm space-y-2 font-mono">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-3 mt-0.5 cyber-glow">&gt;</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && (
        <div className="cyber-border-blue rounded-lg p-4 bg-blue-900/10">
          <h4 className="text-blue-400 font-bold text-sm mb-3 flex items-center uppercase tracking-wider">
            <Info className="h-4 w-4 mr-2 cyber-glow" />
            OPTIMIZATION SUGGESTIONS:
          </h4>
          <ul className="text-blue-300 text-sm space-y-2 font-mono">
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-3 mt-0.5 cyber-glow">&gt;</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default YAMLValidator
