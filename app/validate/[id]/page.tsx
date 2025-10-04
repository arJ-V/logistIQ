"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { FileText, Package, Globe, Scale, Ship, BarChart3, Target, DollarSign } from "lucide-react"
import { useAiriaAgents } from "@/hooks/use-airia-agents"
import { AIRIA_AGENTS } from "@/lib/airia-client"

const agents = [
  {
    id: 1,
    name: "Document Completeness",
    description: "Checking completeness...",
    icon: FileText,
    color: "text-slate-400",
  },
  {
    id: 2,
    name: "HS Code Validator",
    description: "Verifying classifications...",
    icon: Package,
    color: "text-orange-400",
  },
  {
    id: 3,
    name: "Document Consistency",
    description: "Comparing document fields...",
    icon: FileText,
    color: "text-amber-400",
  },
  {
    id: 4,
    name: "Regulatory Compliance",
    description: "Reviewing regulations...",
    icon: Scale,
    color: "text-slate-400",
  },
  {
    id: 5,
    name: "Origin Validator",
    description: "Verifying origin claims...",
    icon: Globe,
    color: "text-blue-400",
  },
  {
    id: 6,
    name: "Value Validator",
    description: "Waiting...",
    icon: DollarSign,
    color: "text-yellow-400",
  },
  {
    id: 7,
    name: "Route Validator",
    description: "Waiting...",
    icon: Ship,
    color: "text-slate-400",
  },
  {
    id: 8,
    name: "Supplier History",
    description: "Waiting...",
    icon: BarChart3,
    color: "text-slate-400",
  },
  {
    id: 9,
    name: "Risk Scorer",
    description: "Waiting...",
    icon: Target,
    color: "text-red-400",
  },
]

// Map Airia agents to UI components with icons
const agentIconMap = {
  "Route_Validator": Ship,
  "Value_validator": DollarSign,
  "Regulatory_compliance_checker": Scale,
  "Supplier_History_Analyzer": BarChart3,
  "Risk Scorer_&_Prioritizer": Target,
  "Document_consistency_checker": FileText,
  "hs_code_validator": Package,
  "Origin_validator": Globe,
}

const agentColorMap = {
  "Route_Validator": "text-blue-400",
  "Value_validator": "text-yellow-400", 
  "Regulatory_compliance_checker": "text-purple-400",
  "Supplier_History_Analyzer": "text-green-400",
  "Risk Scorer_&_Prioritizer": "text-red-400",
  "Document_consistency_checker": "text-amber-400",
  "hs_code_validator": "text-orange-400",
  "Origin_validator": "text-cyan-400",
}

export default function ValidatePage() {
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string

  // Use Airia agents hook
  const {
    isProcessing,
    currentAgent,
    progress,
    results,
    errors,
    completedAgents,
    processWithAllAgents,
    resetState
  } = useAiriaAgents()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [liveUpdates, setLiveUpdates] = useState<string[]>([])

  // Create agent states from Airia agents
  const [agentStates, setAgentStates] = useState(
    AIRIA_AGENTS.map((agent) => ({
      ...agent,
      progress: 0,
      status: "waiting" as const,
      description: "Waiting...",
      icon: agentIconMap[agent.name as keyof typeof agentIconMap] || FileText,
      color: agentColorMap[agent.name as keyof typeof agentColorMap] || "text-slate-400"
    }))
  )

  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1)
    }, 100)

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Start processing when component mounts
  useEffect(() => {
    // Sample text input - in real implementation, this would come from uploaded PDFs
    const sampleText = `Commercial Invoice #INV-2025-001
Supplier: Shenzhen Tech Co.
Products: Electronic components
Total Value: $15,000
HS Codes: 8471.30.01, 8517.12.00
Country of Origin: China
Destination: Los Angeles, CA
ETD: 2025-01-15`

    // Start processing with all agents
    processWithAllAgents(sampleText)
  }, [processWithAllAgents])

  // Update agent states based on processing status
  useEffect(() => {
    if (isProcessing && currentAgent) {
      setLiveUpdates((updates) => [
        `Processing: ${currentAgent}`,
        ...updates.slice(0, 3),
      ])
    }
  }, [isProcessing, currentAgent])

  // Update agent states based on results
  useEffect(() => {
    setAgentStates((states) =>
      states.map((agent) => {
        const result = results.find(r => r.agent_name === agent.name)
        if (result) {
          return {
            ...agent,
            status: result.success ? "completed" : "error",
            progress: 100,
            description: result.success ? "Completed" : "Error"
          }
        }
        return agent
      })
    )
  }, [results])

  // Navigate to analysis page when all agents are complete
  useEffect(() => {
    if (results.length === AIRIA_AGENTS.length && results.every(r => r.success)) {
      const completionTimer = setTimeout(() => {
        router.push(`/analysis/${shipmentId}`)
      }, 2000)
      return () => clearTimeout(completionTimer)
    }
  }, [results, router, shipmentId])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">VALIDATING SHIPMENT</h1>
            <p className="text-muted-foreground">{deployedAgents} of 9 agents deployed</p>
          </div>
          <div className="text-5xl font-bold text-foreground">{elapsedTime.toFixed(1)}s</div>
        </div>

        <div className="flex gap-6">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {agentStates.map((agent) => (
                <Card
                  key={agent.id}
                  className={`p-6 bg-card border-border transition-all ${
                    agent.status === "running" ? "border-primary/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`${agent.color}`}>
                      <agent.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    </div>
                    {agent.status === "running" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        agent.status === "running" ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Live Updates Ticker */}
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  LIVE UPDATES
                </span>
                <div className="flex-1 overflow-hidden">
                  <div className="flex gap-8 animate-scroll">
                    {liveUpdates.map((update, idx) => (
                      <span key={idx} className="text-sm text-foreground whitespace-nowrap">
                        {update}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Live Findings Sidebar */}
          <div className="w-80">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">LIVE FINDINGS</h2>
              <div className="text-muted-foreground">
                <p className="text-sm">Analyzing documents...</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
