"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { FileText, Package, Globe, Scale, Ship, BarChart3, Target, DollarSign } from "lucide-react"

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

export default function ValidatePage() {
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string

  const [deployedAgents, setDeployedAgents] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [agentStates, setAgentStates] = useState(agents.map((a) => ({ ...a, progress: 0, status: "waiting" })))
  const [liveUpdates, setLiveUpdates] = useState<string[]>([])

  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1)
    }, 100)

    // Simulate agent deployment
    const deploymentInterval = setInterval(() => {
      setDeployedAgents((prev) => {
        if (prev < 9) {
          const nextAgent = prev
          setAgentStates((states) =>
            states.map((agent, idx) =>
              idx === nextAgent
                ? { ...agent, status: "running", description: agent.description.replace("Waiting...", "Processing...") }
                : agent,
            ),
          )

          // Add live update
          setLiveUpdates((updates) => [
            `Agent ${nextAgent + 1} started: ${agents[nextAgent].name}`,
            ...updates.slice(0, 3),
          ])

          return prev + 1
        }
        return prev
      })
    }, 400)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAgentStates((states) =>
        states.map((agent) =>
          agent.status === "running" && agent.progress < 100
            ? { ...agent, progress: Math.min(100, agent.progress + Math.random() * 15) }
            : agent,
        ),
      )
    }, 300)

    // Navigate to analysis page after completion
    const completionTimer = setTimeout(() => {
      router.push(`/analysis/${shipmentId}`)
    }, 8200)

    return () => {
      clearInterval(timer)
      clearInterval(deploymentInterval)
      clearInterval(progressInterval)
      clearTimeout(completionTimer)
    }
  }, [router, shipmentId])

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
