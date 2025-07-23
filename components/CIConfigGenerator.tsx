"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Github, GitBranch, Play, Copy, Download, RotateCcw, Plus, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RainingLetters from "./RainingLetters"
import Toast from "./Toast"
import CustomCursors from "./CustomCursors"

interface Step {
  id: string
  name: string
  type: "run" | "uses"
  content: string
}

interface Job {
  id: string
  name: string
  runsOn: string
  dockerImage?: string
  steps: Step[]
  cache: boolean
  envVars: { key: string; value: string }[]
}

interface Trigger {
  push: boolean
  pullRequest: boolean
  tags: boolean
  cron: string
  branches: string[]
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
  })
  const [yamlOutput, setYamlOutput] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const addJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      name: `job-${jobs.length + 1}`,
      runsOn: "ubuntu-latest",
      steps: [],
      cache: false,
      envVars: [],
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

    yaml += "\njobs:\n"

    jobs.forEach((job) => {
      yaml += `  ${job.name}:\n`
      yaml += `    runs-on: ${job.runsOn}\n`

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
        yaml += "        uses: actions/cache@v3\n"
        yaml += "        with:\n"
        yaml += "          path: ~/.cache\n"
        yaml += "          key: ${{ runner.os }}-cache\n"
      }

      job.steps.forEach((step) => {
        yaml += `      - name: ${step.name}\n`
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
    let yaml = "stages:\n"
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

      if (job.cache) {
        yaml += "  cache:\n"
        yaml += "    paths:\n"
        yaml += "      - .cache/\n"
      }

      if (job.envVars.length > 0) {
        yaml += "  variables:\n"
        job.envVars.forEach((env) => {
          yaml += `    ${env.key}: ${env.value}\n`
        })
      }

      yaml += "  script:\n"
      job.steps.forEach((step) => {
        if (step.type === "run") {
          step.content.split("\n").forEach((line) => {
            yaml += `    - ${line}\n`
          })
        }
      })

      yaml += "\n"
    })

    return yaml
  }

  useEffect(() => {
    setYamlOutput(generateYAML())
  }, [jobs, triggers, platform])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlOutput)
      setToast({ message: "YAML copié dans le presse-papiers!", type: "success" })
    } catch (err) {
      setToast({ message: "Erreur lors de la copie", type: "error" })
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
    setToast({ message: "Fichier téléchargé!", type: "success" })
  }

  const resetConfig = () => {
    setJobs([])
    setTriggers({
      push: true,
      pullRequest: false,
      tags: false,
      cron: "",
      branches: ["main"],
    })
    setToast({ message: "Configuration réinitialisée", type: "success" })
  }

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      <CustomCursors />
      {/* Background Effect - Same as original */}
      <RainingLetters />

      {/* Navigation */}
      <nav className="relative z-50 bg-black/90 backdrop-blur-sm border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-green-400" />
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">CI CONFIG GENERATOR</h1>
            </div>
            <Button className="bg-green-600 hover:bg-green-500 text-black font-bold border border-green-400">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <Card className="bg-black/80 backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/10">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="flex items-center space-x-2 text-green-400 font-mono">
                  <GitBranch className="h-5 w-5" />
                  <span>PLATEFORME CI/CD</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={platform === "github" ? "default" : "outline"}
                    onClick={() => setPlatform("github")}
                    className={`h-16 flex flex-col items-center space-y-2 font-mono ${
                      platform === "github"
                        ? "bg-green-600 text-black hover:bg-green-500 border-green-400"
                        : "border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400"
                    }`}
                  >
                    <Github className="h-6 w-6" />
                    <span>GitHub Actions</span>
                  </Button>
                  <Button
                    variant={platform === "gitlab" ? "default" : "outline"}
                    onClick={() => setPlatform("gitlab")}
                    className={`h-16 flex flex-col items-center space-y-2 font-mono ${
                      platform === "gitlab"
                        ? "bg-green-600 text-black hover:bg-green-500 border-green-400"
                        : "border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400"
                    }`}
                  >
                    <GitBranch className="h-6 w-6" />
                    <span>GitLab CI</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Triggers Configuration */}
            <Card className="bg-black/80 backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/10">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="flex items-center space-x-2 text-green-400 font-mono">
                  <Play className="h-5 w-5" />
                  <span>DÉCLENCHEURS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-mono">Push</Label>
                  <Switch
                    checked={triggers.push}
                    onCheckedChange={(checked) => setTriggers({ ...triggers, push: checked })}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white font-mono">Pull Request</Label>
                  <Switch
                    checked={triggers.pullRequest}
                    onCheckedChange={(checked) => setTriggers({ ...triggers, pullRequest: checked })}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white font-mono">Tags</Label>
                  <Switch
                    checked={triggers.tags}
                    onCheckedChange={(checked) => setTriggers({ ...triggers, tags: checked })}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-mono">Cron Schedule</Label>
                  <Input
                    placeholder="0 0 * * *"
                    value={triggers.cron}
                    onChange={(e) => setTriggers({ ...triggers, cron: e.target.value })}
                    className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-mono">Branches</Label>
                  <Input
                    placeholder="main, develop"
                    value={triggers.branches.join(", ")}
                    onChange={(e) =>
                      setTriggers({ ...triggers, branches: e.target.value.split(",").map((b) => b.trim()) })
                    }
                    className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Jobs Configuration */}
            <Card className="bg-black/80 backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/10">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="flex items-center justify-between text-green-400 font-mono">
                  <span>JOBS CONFIGURATION</span>
                  <Button onClick={addJob} size="sm" className="bg-green-600 hover:bg-green-500 text-black font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Job
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {jobs.length === 0 ? (
                  <p className="text-green-400/60 text-center py-8 font-mono">{"> Aucun job configuré"}</p>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <JobConfiguration
                        key={job.id}
                        job={job}
                        onUpdate={(updates) => updateJob(job.id, updates)}
                        onRemove={() => removeJob(job.id)}
                        onAddStep={() => addStep(job.id)}
                        onUpdateStep={(stepId, updates) => updateStep(job.id, stepId, updates)}
                        onRemoveStep={(stepId) => removeStep(job.id, stepId)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* YAML Preview */}
          <div className="space-y-6">
            <Card className="bg-black/80 backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/10">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="flex items-center justify-between text-green-400 font-mono">
                  <span>APERÇU YAML</span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </Button>
                    <Button
                      onClick={downloadYAML}
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button
                      onClick={resetConfig}
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-black/90 p-4 rounded-lg border border-green-500/30 max-h-96 overflow-auto">
                  <pre className="text-sm font-mono">
                    <code className="text-green-400">
                      {yamlOutput || "# Configurez vos jobs pour voir le YAML généré"}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

interface JobConfigurationProps {
  job: Job
  onUpdate: (updates: Partial<Job>) => void
  onRemove: () => void
  onAddStep: () => void
  onUpdateStep: (stepId: string, updates: Partial<Step>) => void
  onRemoveStep: (stepId: string) => void
}

const JobConfiguration: React.FC<JobConfigurationProps> = ({
  job,
  onUpdate,
  onRemove,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
}) => {
  return (
    <Card className="bg-black/60 border border-green-500/40 shadow-md shadow-green-500/5">
      <CardHeader className="border-b border-green-500/20">
        <div className="flex items-center justify-between">
          <Input
            value={job.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="bg-black/60 border-green-500/50 text-white font-mono font-semibold focus:border-green-400 focus:ring-green-400/20"
          />
          <Button onClick={onRemove} size="sm" className="bg-red-600/80 hover:bg-red-500 text-white border-red-500/50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white font-mono">Runs On</Label>
            <Select value={job.runsOn} onValueChange={(value) => onUpdate({ runsOn: value })}>
              <SelectTrigger className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/50">
                <SelectItem value="ubuntu-latest" className="text-white hover:bg-green-500/20">
                  ubuntu-latest
                </SelectItem>
                <SelectItem value="windows-latest" className="text-white hover:bg-green-500/20">
                  windows-latest
                </SelectItem>
                <SelectItem value="macos-latest" className="text-white hover:bg-green-500/20">
                  macos-latest
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white font-mono">Docker Image</Label>
            <Input
              placeholder="node:18"
              value={job.dockerImage || ""}
              onChange={(e) => onUpdate({ dockerImage: e.target.value })}
              className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-white font-mono">Cache</Label>
          <Switch
            checked={job.cache}
            onCheckedChange={(checked) => onUpdate({ cache: checked })}
            className="data-[state=checked]:bg-green-600"
          />
        </div>

        <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/30">
            <TabsTrigger
              value="steps"
              className="text-white data-[state=active]:bg-green-600 data-[state=active]:text-black font-mono"
            >
              Steps
            </TabsTrigger>
            <TabsTrigger
              value="env"
              className="text-white data-[state=active]:bg-green-600 data-[state=active]:text-black font-mono"
            >
              Variables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Label className="text-white font-mono">Steps</Label>
              <Button
                onClick={onAddStep}
                size="sm"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Step
              </Button>
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

          <TabsContent value="env" className="space-y-4 mt-4">
            <Label className="text-white font-mono">Variables d'environnement</Label>
            {job.envVars.map((env, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => {
                    const newEnvVars = [...job.envVars]
                    newEnvVars[index].key = e.target.value
                    onUpdate({ envVars: newEnvVars })
                  }}
                  className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20"
                />
                <Input
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => {
                    const newEnvVars = [...job.envVars]
                    newEnvVars[index].value = e.target.value
                    onUpdate({ envVars: newEnvVars })
                  }}
                  className="bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
            ))}
            <Button
              onClick={() => onUpdate({ envVars: [...job.envVars, { key: "", value: "" }] })}
              size="sm"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Variable
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface StepConfigurationProps {
  step: Step
  onUpdate: (updates: Partial<Step>) => void
  onRemove: () => void
}

const StepConfiguration: React.FC<StepConfigurationProps> = ({ step, onUpdate, onRemove }) => {
  return (
    <Card className="bg-black/40 border border-green-500/30">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Nom du step"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="bg-black/60 border-green-500/50 text-white font-mono flex-1 mr-2 focus:border-green-400 focus:ring-green-400/20"
          />
          <Select value={step.type} onValueChange={(value: "run" | "uses") => onUpdate({ type: value })}>
            <SelectTrigger className="w-24 bg-black/60 border-green-500/50 text-white font-mono focus:border-green-400 focus:ring-green-400/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/50">
              <SelectItem value="run" className="text-white hover:bg-green-500/20">
                run
              </SelectItem>
              <SelectItem value="uses" className="text-white hover:bg-green-500/20">
                uses
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onRemove}
            size="sm"
            className="ml-2 bg-red-600/80 hover:bg-red-500 text-white border-red-500/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          placeholder={step.type === "run" ? 'echo "Hello World"' : "actions/checkout@v3"}
          value={step.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="bg-black/60 border-green-500/50 text-white font-mono text-sm focus:border-green-400 focus:ring-green-400/20"
          rows={3}
        />
      </CardContent>
    </Card>
  )
}

export default CIConfigGenerator
