"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Github,
  GitBranch,
  Play,
  Copy,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Upload,
  Eye,
  Code,
  Zap,
  Shield,
  Terminal,
  Cpu,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RainingLetters from "./RainingLetters"
import Toast from "./Toast"
import CustomCursors from "./CustomCursors"
import TemplateSelector from "./TemplateSelector"
import YAMLValidator from "./YAMLValidator"

interface Step {
  id: string
  name: string
  type: "run" | "uses"
  content: string
  condition?: string
  continueOnError?: boolean
}

interface Job {
  id: string
  name: string
  runsOn: string
  dockerImage?: string
  steps: Step[]
  cache: boolean
  envVars: { key: string; value: string }[]
  needs?: string[]
  timeout?: number
  strategy?: {
    matrix?: Record<string, string[]>
    failFast?: boolean
  }
}

interface Trigger {
  push: boolean
  pullRequest: boolean
  tags: boolean
  cron: string
  branches: string[]
  paths?: string[]
  workflowDispatch: boolean
}

interface Secret {
  key: string
  description: string
}

const CIConfigGenerator: React.FC = () => {
  const [platform, setPlatform] = useState<"github" | "gitlab">("github")
  const [jobs, setJobs] = useState<Job[]>([])
  const [triggers, setTriggers] = useState<Trigger>({
    push: true,
    pullRequest: false,
    tags: false,
    cron: "",
    branches: ["main"],
    paths: [],
    workflowDispatch: false,
  })
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [yamlOutput, setYamlOutput] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; config: any; date: string }>>([])
  const [currentConfigName, setCurrentConfigName] = useState("")
  const [showPreview, setShowPreview] = useState(true)

  // Templates prédéfinis
  const templates = {
    "node-ci": {
      name: "Node.js CI/CD",
      description: "Pipeline pour applications Node.js avec tests et déploiement",
      jobs: [
        {
          id: "1",
          name: "build-and-test",
          runsOn: "ubuntu-latest",
          steps: [
            { id: "1", name: "Checkout code", type: "uses" as const, content: "actions/checkout@v4" },
            {
              id: "2",
              name: "Setup Node.js",
              type: "uses" as const,
              content: "actions/setup-node@v4\n        with:\n          node-version: '18'",
            },
            { id: "3", name: "Install dependencies", type: "run" as const, content: "npm ci" },
            { id: "4", name: "Run tests", type: "run" as const, content: "npm test" },
            { id: "5", name: "Build application", type: "run" as const, content: "npm run build" },
          ],
          cache: true,
          envVars: [{ key: "NODE_ENV", value: "production" }],
        },
      ],
    },
    "docker-build": {
      name: "Docker Build & Push",
      description: "Construction et publication d'images Docker",
      jobs: [
        {
          id: "1",
          name: "docker-build",
          runsOn: "ubuntu-latest",
          steps: [
            { id: "1", name: "Checkout", type: "uses" as const, content: "actions/checkout@v4" },
            { id: "2", name: "Setup Docker Buildx", type: "uses" as const, content: "docker/setup-buildx-action@v3" },
            {
              id: "3",
              name: "Login to DockerHub",
              type: "uses" as const,
              content:
                "docker/login-action@v3\n        with:\n          username: ${{ secrets.DOCKER_USERNAME }}\n          password: ${{ secrets.DOCKER_PASSWORD }}",
            },
            {
              id: "4",
              name: "Build and push",
              type: "uses" as const,
              content:
                "docker/build-push-action@v5\n        with:\n          push: true\n          tags: user/app:latest",
            },
          ],
          cache: false,
          envVars: [],
        },
      ],
    },
    "python-ci": {
      name: "Python CI/CD",
      description: "Pipeline pour applications Python avec pytest",
      jobs: [
        {
          id: "1",
          name: "test",
          runsOn: "ubuntu-latest",
          strategy: {
            matrix: { "python-version": ["3.8", "3.9", "3.10", "3.11"] },
          },
          steps: [
            { id: "1", name: "Checkout", type: "uses" as const, content: "actions/checkout@v4" },
            {
              id: "2",
              name: "Setup Python",
              type: "uses" as const,
              content: "actions/setup-python@v4\n        with:\n          python-version: ${{ matrix.python-version }}",
            },
            { id: "3", name: "Install dependencies", type: "run" as const, content: "pip install -r requirements.txt" },
            { id: "4", name: "Run tests", type: "run" as const, content: "pytest" },
          ],
          cache: true,
          envVars: [],
        },
      ],
    },
  }

  const addJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      name: `job-${jobs.length + 1}`,
      runsOn: "ubuntu-latest",
      steps: [],
      cache: false,
      envVars: [],
      needs: [],
      timeout: 30,
    }
    setJobs([...jobs, newJob])
  }

  const removeJob = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
  }

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    setJobs(jobs.map((job) => (job.id === jobId ? { ...job, ...updates } : job)))
  }

  const addStep = (jobId: string) => {
    const newStep: Step = {
      id: Date.now().toString(),
      name: "New Step",
      type: "run",
      content: "",
      continueOnError: false,
    }
    updateJob(jobId, {
      steps: [...(jobs.find((j) => j.id === jobId)?.steps || []), newStep],
    })
  }

  const updateStep = (jobId: string, stepId: string, updates: Partial<Step>) => {
    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      const updatedSteps = job.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
      updateJob(jobId, { steps: updatedSteps })
    }
  }

  const removeStep = (jobId: string, stepId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      updateJob(jobId, { steps: job.steps.filter((step) => step.id !== stepId) })
    }
  }

  const loadTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates]
    if (template) {
      setJobs(template.jobs.map((job) => ({ ...job, id: Date.now().toString() + Math.random() })))
      setToast({ message: `Template "${template.name}" loaded successfully`, type: "success" })
    }
  }

  const saveConfig = () => {
    if (!currentConfigName.trim()) {
      setToast({ message: "Please enter a configuration name", type: "error" })
      return
    }

    const config = {
      name: currentConfigName,
      config: { platform, jobs, triggers, secrets },
      date: new Date().toISOString(),
    }

    const existing = savedConfigs.findIndex((c) => c.name === currentConfigName)
    if (existing >= 0) {
      const newConfigs = [...savedConfigs]
      newConfigs[existing] = config
      setSavedConfigs(newConfigs)
    } else {
      setSavedConfigs([...savedConfigs, config])
    }

    localStorage.setItem("ci-configs", JSON.stringify(savedConfigs))
    setToast({ message: "Configuration saved successfully", type: "success" })
  }

  const loadConfig = (configName: string) => {
    const config = savedConfigs.find((c) => c.name === configName)
    if (config) {
      setPlatform(config.config.platform)
      setJobs(config.config.jobs)
      setTriggers(config.config.triggers)
      setSecrets(config.config.secrets || [])
      setCurrentConfigName(configName)
      setToast({ message: `Configuration "${configName}" loaded successfully`, type: "success" })
    }
  }

  const exportConfig = () => {
    const config = { platform, jobs, triggers, secrets, yamlOutput }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ci-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast({ message: "Configuration exported successfully", type: "success" })
  }

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          setPlatform(config.platform || "github")
          setJobs(config.jobs || [])
          setTriggers(config.triggers || triggers)
          setSecrets(config.secrets || [])
          setToast({ message: "Configuration imported successfully", type: "success" })
        } catch (error) {
          setToast({ message: "Error importing configuration", type: "error" })
        }
      }
      reader.readAsText(file)
    }
  }

  const generateYAML = () => {
    if (platform === "github") {
      return generateGitHubActionsYAML()
    } else {
      return generateGitLabCIYAML()
    }
  }

  const generateGitHubActionsYAML = () => {
    let yaml = "name: CI/CD Pipeline\n\n"

    // Triggers
    yaml += "on:\n"
    if (triggers.push) {
      yaml += "  push:\n"
      yaml += `    branches: [${triggers.branches.map((b) => `"${b}"`).join(", ")}]\n`
      if (triggers.paths && triggers.paths.length > 0) {
        yaml += `    paths: [${triggers.paths.map((p) => `"${p}"`).join(", ")}]\n`
      }
    }
    if (triggers.pullRequest) {
      yaml += "  pull_request:\n"
      yaml += `    branches: [${triggers.branches.map((b) => `"${b}"`).join(", ")}]\n`
    }
    if (triggers.tags) {
      yaml += '  push:\n    tags: ["v*"]\n'
    }
    if (triggers.cron) {
      yaml += "  schedule:\n"
      yaml += `    - cron: "${triggers.cron}"\n`
    }
    if (triggers.workflowDispatch) {
      yaml += "  workflow_dispatch:\n"
    }

    // Environment variables globales
    if (secrets.length > 0) {
      yaml += "\nenv:\n"
      secrets.forEach((secret) => {
        yaml += `  ${secret.key}: \${{ secrets.${secret.key} }}\n`
      })
    }

    yaml += "\njobs:\n"

    jobs.forEach((job) => {
      yaml += `  ${job.name}:\n`
      yaml += `    runs-on: ${job.runsOn}\n`

      if (job.timeout) {
        yaml += `    timeout-minutes: ${job.timeout}\n`
      }

      if (job.needs && job.needs.length > 0) {
        yaml += `    needs: [${job.needs.map((n) => `"${n}"`).join(", ")}]\n`
      }

      if (job.strategy) {
        yaml += "    strategy:\n"
        if (job.strategy.matrix) {
          yaml += "      matrix:\n"
          Object.entries(job.strategy.matrix).forEach(([key, values]) => {
            yaml += `        ${key}: [${values.map((v) => `"${v}"`).join(", ")}]\n`
          })
        }
        if (job.strategy.failFast !== undefined) {
          yaml += `      fail-fast: ${job.strategy.failFast}\n`
        }
      }

      if (job.dockerImage) {
        yaml += `    container: ${job.dockerImage}\n`
      }

      if (job.envVars.length > 0) {
        yaml += "    env:\n"
        job.envVars.forEach((env) => {
          yaml += `      ${env.key}: ${env.value}\n`
        })
      }

      yaml += "    steps:\n"

      if (job.cache) {
        yaml += "      - name: Cache dependencies\n"
        yaml += "        uses: actions/cache@v4\n"
        yaml += "        with:\n"
        yaml += "          path: ~/.cache\n"
        yaml += "          key: ${{ runner.os }}-cache-${{ hashFiles('**/package-lock.json') }}\n"
        yaml += "          restore-keys: |\n"
        yaml += "            ${{ runner.os }}-cache-\n"
      }

      job.steps.forEach((step) => {
        yaml += `      - name: ${step.name}\n`
        if (step.condition) {
          yaml += `        if: ${step.condition}\n`
        }
        if (step.continueOnError) {
          yaml += "        continue-on-error: true\n"
        }
        if (step.type === "uses") {
          yaml += `        uses: ${step.content}\n`
        } else {
          yaml += `        run: |\n`
          step.content.split("\n").forEach((line) => {
            yaml += `          ${line}\n`
          })
        }
      })

      yaml += "\n"
    })

    return yaml
  }

  const generateGitLabCIYAML = () => {
    let yaml = "# GitLab CI/CD Pipeline\n\n"

    // Variables globales
    if (secrets.length > 0) {
      yaml += "variables:\n"
      secrets.forEach((secret) => {
        yaml += `  ${secret.key}: \$${secret.key}\n`
      })
      yaml += "\n"
    }

    yaml += "stages:\n"
    jobs.forEach((job) => {
      yaml += `  - ${job.name}\n`
    })
    yaml += "\n"

    jobs.forEach((job) => {
      yaml += `${job.name}:\n`
      yaml += `  stage: ${job.name}\n`

      if (job.dockerImage) {
        yaml += `  image: ${job.dockerImage}\n`
      }

      if (job.timeout) {
        yaml += `  timeout: ${job.timeout}m\n`
      }

      if (job.needs && job.needs.length > 0) {
        yaml += `  needs: [${job.needs.join(", ")}]\n`
      }

      if (job.cache) {
        yaml += "  cache:\n"
        yaml += "    paths:\n"
        yaml += "      - node_modules/\n"
        yaml += "      - .cache/\n"
      }

      if (job.envVars.length > 0) {
        yaml += "  variables:\n"
        job.envVars.forEach((env) => {
          yaml += `    ${env.key}: ${env.value}\n`
        })
      }

      // Conditions pour les triggers
      const rules = []
      if (triggers.push) {
        rules.push(`if: '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "${triggers.branches[0]}"'`)
      }
      if (triggers.pullRequest) {
        rules.push(`if: '$CI_PIPELINE_SOURCE == "merge_request_event"'`)
      }
      if (triggers.tags) {
        rules.push(`if: '$CI_COMMIT_TAG'`)
      }

      if (rules.length > 0) {
        yaml += "  rules:\n"
        rules.forEach((rule) => {
          yaml += `    - ${rule}\n`
        })
      }

      yaml += "  script:\n"
      job.steps.forEach((step) => {
        if (step.type === "run") {
          step.content.split("\n").forEach((line) => {
            if (line.trim()) {
              yaml += `    - ${line.trim()}\n`
            }
          })
        }
      })

      yaml += "\n"
    })

    return yaml
  }

  useEffect(() => {
    setYamlOutput(generateYAML())
  }, [jobs, triggers, platform, secrets])

  useEffect(() => {
    const saved = localStorage.getItem("ci-configs")
    if (saved) {
      setSavedConfigs(JSON.parse(saved))
    }
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlOutput)
      setToast({ message: "YAML copied to clipboard", type: "success" })
    } catch (err) {
      setToast({ message: "Error copying YAML", type: "error" })
    }
  }

  const downloadYAML = () => {
    const filename = platform === "github" ? ".github/workflows/ci.yml" : ".gitlab-ci.yml"
    const blob = new Blob([yamlOutput], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setToast({ message: "File downloaded successfully", type: "success" })
  }

  const resetConfig = () => {
    setJobs([])
    setTriggers({
      push: true,
      pullRequest: false,
      tags: false,
      cron: "",
      branches: ["main"],
      paths: [],
      workflowDispatch: false,
    })
    setSecrets([])
    setCurrentConfigName("")
    setToast({ message: "Configuration reset", type: "success" })
  }

  return (
    <div className="relative w-full min-h-screen bg-black cyber-grid">
      <CustomCursors />
      <RainingLetters />

      {/* Refined Navigation */}
      <nav className="relative z-50 cyber-nav">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 cyber-border rounded">
                <Terminal className="h-6 w-6 text-green-400 cyber-glow" />
              </div>
              <div className="flex flex-col">
                <h1 className="cyber-title text-xl">CI/CD Generator</h1>
                <p className="cyber-subtitle">Pipeline Configuration Tool</p>
              </div>
              <div className="cyber-badge">v2.0</div>
            </div>
            <div className="button-group">
              <button onClick={() => setShowPreview(!showPreview)} className="cyber-btn">
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Hide" : "Show"} Preview
              </button>
              <button className="cyber-btn-primary">
                <Github className="h-4 w-4 mr-2" />
                Deploy
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-40 max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className={`grid ${showPreview ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"} gap-8`}>
          {/* Configuration Panel */}
          <div className="space-y-8 cyber-fade-in">
            {/* Quick Actions */}
            <div className="cyber-card rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="h-5 w-5 text-green-400 cyber-glow" />
                <h2 className="cyber-title text-lg">Quick Actions</h2>
              </div>

              {/* Fixed button layout */}
              <div className="space-y-4">
                <div className="button-row-2">
                  <TemplateSelector onSelectTemplate={loadTemplate} />
                  <button onClick={saveConfig} className="cyber-btn">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>

                <div className="button-row-2">
                  <button onClick={exportConfig} className="cyber-btn">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <label className="cursor-pointer">
                    <button className="cyber-btn w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </button>
                    <input type="file" accept=".json" onChange={importConfig} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
                  Configuration Name
                </label>
                <input
                  placeholder="Enter configuration name..."
                  value={currentConfigName}
                  onChange={(e) => setCurrentConfigName(e.target.value)}
                  className="cyber-input w-full"
                />
              </div>
            </div>

            {/* Platform Selection */}
            <div className="cyber-card rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <GitBranch className="h-5 w-5 text-green-400 cyber-glow" />
                <h2 className="cyber-title text-lg">Platform</h2>
              </div>
              <div className="button-row-2">
                <button
                  onClick={() => setPlatform("github")}
                  className={`h-20 flex flex-col items-center justify-center space-y-3 ${
                    platform === "github" ? "cyber-btn-primary" : "cyber-btn"
                  }`}
                >
                  <Github className="h-6 w-6" />
                  <span>GitHub Actions</span>
                </button>
                <button
                  onClick={() => setPlatform("gitlab")}
                  className={`h-20 flex flex-col items-center justify-center space-y-3 ${
                    platform === "gitlab" ? "cyber-btn-primary" : "cyber-btn"
                  }`}
                >
                  <GitBranch className="h-6 w-6" />
                  <span>GitLab CI</span>
                </button>
              </div>
            </div>

            {/* Triggers Configuration */}
            <div className="cyber-card rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Play className="h-5 w-5 text-green-400 cyber-glow" />
                <h2 className="cyber-title text-lg">Triggers</h2>
              </div>
              <div className="space-y-4">
                <div className="button-row-2">
                  <div className="flex items-center justify-between p-4 cyber-border rounded">
                    <label className="text-green-400 font-bold text-sm uppercase">Push Events</label>
                    <Switch
                      checked={triggers.push}
                      onCheckedChange={(checked) => setTriggers({ ...triggers, push: checked })}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 cyber-border rounded">
                    <label className="text-green-400 font-bold text-sm uppercase">Pull Requests</label>
                    <Switch
                      checked={triggers.pullRequest}
                      onCheckedChange={(checked) => setTriggers({ ...triggers, pullRequest: checked })}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>

                <div className="button-row-2">
                  <div className="flex items-center justify-between p-4 cyber-border rounded">
                    <label className="text-green-400 font-bold text-sm uppercase">Tag Releases</label>
                    <Switch
                      checked={triggers.tags}
                      onCheckedChange={(checked) => setTriggers({ ...triggers, tags: checked })}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 cyber-border rounded">
                    <label className="text-green-400 font-bold text-sm uppercase">Manual Trigger</label>
                    <Switch
                      checked={triggers.workflowDispatch}
                      onCheckedChange={(checked) => setTriggers({ ...triggers, workflowDispatch: checked })}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
                    Cron Schedule
                  </label>
                  <input
                    placeholder="0 0 * * * (daily at midnight)"
                    value={triggers.cron}
                    onChange={(e) => setTriggers({ ...triggers, cron: e.target.value })}
                    className="cyber-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
                    Target Branches
                  </label>
                  <input
                    placeholder="main, develop, feature/*"
                    value={triggers.branches.join(", ")}
                    onChange={(e) =>
                      setTriggers({ ...triggers, branches: e.target.value.split(",").map((b) => b.trim()) })
                    }
                    className="cyber-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
                    Path Filters (Optional)
                  </label>
                  <input
                    placeholder="src/**, tests/**, docs/**"
                    value={triggers.paths?.join(", ") || ""}
                    onChange={(e) =>
                      setTriggers({
                        ...triggers,
                        paths: e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean),
                      })
                    }
                    className="cyber-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Secrets Management */}
            <div className="cyber-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-400 cyber-glow" />
                  <h2 className="cyber-title text-lg">Secrets & Environment Variables</h2>
                </div>
                <button onClick={() => setSecrets([...secrets, { key: "", description: "" }])} className="cyber-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </button>
              </div>
              {secrets.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-green-400 mx-auto mb-4 cyber-glow" />
                  <p className="text-green-400 font-bold uppercase tracking-wider">No secrets configured</p>
                  <p className="text-green-400/60 text-sm mt-1">
                    Add environment variables and secrets for your pipeline
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {secrets.map((secret, index) => (
                    <div key={index} className="grid grid-cols-3 gap-3 items-center">
                      <input
                        placeholder="SECRET_NAME"
                        value={secret.key}
                        onChange={(e) => {
                          const newSecrets = [...secrets]
                          newSecrets[index].key = e.target.value.toUpperCase()
                          setSecrets(newSecrets)
                        }}
                        className="cyber-input"
                      />
                      <input
                        placeholder="Description"
                        value={secret.description}
                        onChange={(e) => {
                          const newSecrets = [...secrets]
                          newSecrets[index].description = e.target.value
                          setSecrets(newSecrets)
                        }}
                        className="cyber-input"
                      />
                      <button
                        onClick={() => setSecrets(secrets.filter((_, i) => i !== index))}
                        className="cyber-btn-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jobs Configuration */}
            <div className="cyber-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Cpu className="h-5 w-5 text-green-400 cyber-glow" />
                  <h2 className="cyber-title text-lg">Pipeline Jobs</h2>
                </div>
                <button onClick={addJob} className="cyber-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </button>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="h-12 w-12 text-green-400 mx-auto mb-4 cyber-glow" />
                  <p className="text-green-400 font-bold uppercase tracking-wider">No jobs configured</p>
                  <p className="text-green-400/60 text-sm mt-1">Create jobs to define your CI/CD pipeline steps</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {jobs.map((job) => (
                    <JobConfiguration
                      key={job.id}
                      job={job}
                      jobs={jobs}
                      onUpdate={(updates) => updateJob(job.id, updates)}
                      onRemove={() => removeJob(job.id)}
                      onAddStep={() => addStep(job.id)}
                      onUpdateStep={(stepId, updates) => updateStep(job.id, stepId, updates)}
                      onRemoveStep={(stepId) => removeStep(job.id, stepId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* YAML Preview */}
          {showPreview && (
            <div className="space-y-8 cyber-slide-in">
              <div className="cyber-card rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Code className="h-5 w-5 text-green-400 cyber-glow" />
                    <h2 className="cyber-title text-lg">YAML Configuration</h2>
                  </div>
                  <div className="button-group">
                    <button onClick={copyToClipboard} className="cyber-btn">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </button>
                    <button onClick={downloadYAML} className="cyber-btn">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button onClick={resetConfig} className="cyber-btn-danger">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </button>
                  </div>
                </div>
                <YAMLValidator yamlContent={yamlOutput} />
                <div className="cyber-code mt-6 max-h-96 overflow-auto">
                  <pre className="text-sm leading-relaxed">
                    <code className="text-green-400">
                      {yamlOutput || "# Configure your jobs to see the generated YAML"}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

interface JobConfigurationProps {
  job: Job
  jobs: Job[]
  onUpdate: (updates: Partial<Job>) => void
  onRemove: () => void
  onAddStep: () => void
  onUpdateStep: (stepId: string, updates: Partial<Step>) => void
  onRemoveStep: (stepId: string) => void
}

const JobConfiguration: React.FC<JobConfigurationProps> = ({
  job,
  jobs,
  onUpdate,
  onRemove,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
}) => {
  return (
    <div className="cyber-border rounded-lg p-4 bg-black/50">
      <div className="flex items-center justify-between mb-4">
        <input
          value={job.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="cyber-input flex-1 mr-4 font-bold text-lg"
        />
        <button onClick={onRemove} className="cyber-btn-danger">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <div className="button-row-2">
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
              Runner Environment
            </label>
            <Select value={job.runsOn} onValueChange={(value) => onUpdate({ runsOn: value })}>
              <SelectTrigger className="cyber-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500">
                <SelectItem value="ubuntu-latest" className="text-green-400 hover:bg-green-900/20">
                  ubuntu-latest
                </SelectItem>
                <SelectItem value="ubuntu-20.04" className="text-green-400 hover:bg-green-900/20">
                  ubuntu-20.04
                </SelectItem>
                <SelectItem value="windows-latest" className="text-green-400 hover:bg-green-900/20">
                  windows-latest
                </SelectItem>
                <SelectItem value="macos-latest" className="text-green-400 hover:bg-green-900/20">
                  macos-latest
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
              Docker Image (Optional)
            </label>
            <input
              placeholder="node:18, python:3.11, nginx:alpine"
              value={job.dockerImage || ""}
              onChange={(e) => onUpdate({ dockerImage: e.target.value })}
              className="cyber-input w-full"
            />
          </div>
        </div>

        <div className="button-row-2">
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
              Timeout (minutes)
            </label>
            <input
              type="number"
              placeholder="30"
              value={job.timeout || ""}
              onChange={(e) => onUpdate({ timeout: Number.parseInt(e.target.value) || undefined })}
              className="cyber-input w-full"
            />
          </div>
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">Dependencies</label>
            <Select
              value={job.needs?.[0] || "no-dependency"}
              onValueChange={(value) => onUpdate({ needs: value === "no-dependency" ? [] : [value] })}
            >
              <SelectTrigger className="cyber-input">
                <SelectValue placeholder="No dependencies" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500">
                <SelectItem value="no-dependency" className="text-green-400 hover:bg-green-900/20">
                  No dependencies
                </SelectItem>
                {jobs
                  .filter((j) => j.id !== job.id)
                  .map((j) => (
                    <SelectItem key={j.id} value={j.name} className="text-green-400 hover:bg-green-900/20">
                      {j.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 cyber-border rounded">
          <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Enable Caching</label>
          <Switch
            checked={job.cache}
            onCheckedChange={(checked) => onUpdate({ cache: checked })}
            className="data-[state=checked]:bg-green-600"
          />
        </div>

        <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 cyber-border">
            <TabsTrigger
              value="steps"
              className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black font-bold uppercase"
            >
              Steps
            </TabsTrigger>
            <TabsTrigger
              value="env"
              className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black font-bold uppercase"
            >
              Environment
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black font-bold uppercase"
            >
              Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Pipeline Steps</label>
              <button onClick={onAddStep} className="cyber-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </button>
            </div>
            {job.steps.map((step) => (
              <StepConfiguration
                key={step.id}
                step={step}
                onUpdate={(updates) => onUpdateStep(step.id, updates)}
                onRemove={() => onRemoveStep(step.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="env" className="space-y-4 mt-6">
            <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Environment Variables</label>
            {job.envVars.map((env, index) => (
              <div key={index} className="grid grid-cols-3 gap-3">
                <input
                  placeholder="VARIABLE_NAME"
                  value={env.key}
                  onChange={(e) => {
                    const newEnvVars = [...job.envVars]
                    newEnvVars[index].key = e.target.value
                    onUpdate({ envVars: newEnvVars })
                  }}
                  className="cyber-input"
                />
                <input
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => {
                    const newEnvVars = [...job.envVars]
                    newEnvVars[index].value = e.target.value
                    onUpdate({ envVars: newEnvVars })
                  }}
                  className="cyber-input"
                />
                <button
                  onClick={() => onUpdate({ envVars: job.envVars.filter((_, i) => i !== index) })}
                  className="cyber-btn-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => onUpdate({ envVars: [...job.envVars, { key: "", value: "" }] })}
              className="cyber-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </button>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4 mt-6">
            <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Matrix Strategy</label>
            <div className="space-y-4">
              <div className="button-row-2">
                <input placeholder="node-version" className="cyber-input" />
                <input placeholder="16, 18, 20" className="cyber-input" />
              </div>
              <div className="flex items-center justify-between p-4 cyber-border rounded">
                <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Fail Fast</label>
                <Switch
                  checked={job.strategy?.failFast || false}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      strategy: { ...job.strategy, failFast: checked },
                    })
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface StepConfigurationProps {
  step: Step
  onUpdate: (updates: Partial<Step>) => void
  onRemove: () => void
}

const StepConfiguration: React.FC<StepConfigurationProps> = ({ step, onUpdate, onRemove }) => {
  return (
    <div className="cyber-border rounded-lg p-4 bg-black/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <input
            placeholder="Step name"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="cyber-input flex-1 mr-3 font-bold"
          />
          <Select value={step.type} onValueChange={(value: "run" | "uses") => onUpdate({ type: value })}>
            <SelectTrigger className="w-24 cyber-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500">
              <SelectItem value="run" className="text-green-400 hover:bg-green-900/20">
                run
              </SelectItem>
              <SelectItem value="uses" className="text-green-400 hover:bg-green-900/20">
                uses
              </SelectItem>
            </SelectContent>
          </Select>
          <button onClick={onRemove} className="ml-3 cyber-btn-danger">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <textarea
          placeholder={step.type === "run" ? 'echo "Hello World"\nnpm install\nnpm test' : "actions/checkout@v4"}
          value={step.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="cyber-input w-full text-sm leading-relaxed"
          rows={4}
        />

        <div className="button-row-2">
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">
              Condition (if)
            </label>
            <input
              placeholder="success() && github.ref == 'refs/heads/main'"
              value={step.condition || ""}
              onChange={(e) => onUpdate({ condition: e.target.value })}
              className="cyber-input w-full text-sm"
            />
          </div>
          <div className="flex items-center justify-between pt-6">
            <label className="text-green-400 font-bold text-sm uppercase tracking-wider">Continue on Error</label>
            <Switch
              checked={step.continueOnError || false}
              onCheckedChange={(checked) => onUpdate({ continueOnError: checked })}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CIConfigGenerator
