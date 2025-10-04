"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2, XCircle, AlertTriangle, CheckCircle, Activity, Bell, FileCheck, Package, Globe, Scale, Ship, BarChart3, Target, DollarSign, FileText } from "lucide-react"

const criticalIssues = [
  {
    title: "HS Code Mismatch",
    description: "Product description does not match declared HS code 8471.30.01",
    impact: "Potential duty miscalculation of $3,200",
    action: "Reclassify under HS 8471.50.01",
  },
  {
    title: "Missing Certificate of Origin",
    description: "Required for claimed preferential tariff treatment under USMCA",
    impact: "Cannot claim preferential rates",
    action: "Obtain certificate from supplier",
  },
]

const warnings = [
  {
    title: "Value Declaration Variance",
    description: "Declared value 18% below market average for similar goods",
    recommendation: "Provide additional valuation documentation",
  },
  {
    title: "Incomplete Packing List",
    description: "Missing net weight and country of manufacture for 3 items",
    recommendation: "Request complete packing list from supplier",
  },
]

const recommendations = [
  {
    title: "Optimize Duty Classification",
    savings: "$1,200",
    description: "Alternative HS code 8471.49.00 may reduce duty by $1,200",
  },
  {
    title: "Leverage Trade Agreement",
    savings: "$2,100",
    description: "Eligible for CPTPP preferential rates with proper documentation",
  },
  {
    title: "Consolidate Shipments",
    savings: "$850",
    description: "Combining with pending order #0472 reduces per-unit costs",
  },
]

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

const activities = [
  { time: "2 min ago", text: "SH-2846 validation started", icon: Activity, color: "text-blue-400" },
  { time: "5 min ago", text: "SH-2847 auto-corrected 3 issues", icon: CheckCircle, color: "text-green-400" },
  { time: "12 min ago", text: "New CBP regulation detected", icon: Bell, color: "text-orange-400" },
  { time: "18 min ago", text: "SH-2845 cleared all validations", icon: FileCheck, color: "text-green-400" },
  { time: "25 min ago", text: "Risk threshold updated", icon: AlertTriangle, color: "text-yellow-400" },
  { time: "32 min ago", text: "SH-2844 flagged for review", icon: AlertTriangle, color: "text-red-400" },
  { time: "45 min ago", text: "Batch validation completed", icon: CheckCircle, color: "text-green-400" },
  { time: "1 hour ago", text: "Agent 3: Regulatory compliance check initiated", icon: Activity, color: "text-blue-400" },
  { time: "1 hour ago", text: "Agent 2: Document consistency validation completed", icon: CheckCircle, color: "text-green-400" },
  { time: "1 hour ago", text: "Agent 1: HS Code classification in progress", icon: Activity, color: "text-yellow-400" },
]

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string
  
  // State for processing mode vs completed mode
  const [isProcessing, setIsProcessing] = useState(true)
  const [deployedAgents, setDeployedAgents] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [agentStates, setAgentStates] = useState(agents.map((a) => ({ ...a, progress: 0, status: "waiting" })))
  const [liveUpdates, setLiveUpdates] = useState<string[]>([])

  useEffect(() => {
    if (!isProcessing) return

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

    // Switch to completed mode after processing
    const completionTimer = setTimeout(() => {
      setIsProcessing(false)
    }, 8200)

    return () => {
      clearInterval(timer)
      clearInterval(deploymentInterval)
      clearInterval(progressInterval)
      clearTimeout(completionTimer)
    }
  }, [isProcessing])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">LogistIQ</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {isProcessing ? (
          // PROCESSING MODE - Show AI Agents Working
          <>
            {/* Processing Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">🤖 AI AGENTS PROCESSING</h1>
                <p className="text-muted-foreground">{deployedAgents} of 9 agents deployed</p>
              </div>
              <div className="text-5xl font-bold text-foreground">{elapsedTime.toFixed(1)}s</div>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
            <Card className="p-4 bg-card border-border mb-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  LIVE UPDATES
                </span>
                <div className="flex-1 overflow-hidden">
                  <div className="flex gap-8">
                    {liveUpdates.map((update, idx) => (
                      <span key={idx} className="text-sm text-foreground whitespace-nowrap">
                        {update}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          // COMPLETED MODE - Show Analysis Results
          <>
            {/* Risk Banner */}
            <Card className="p-8 mb-8 bg-red-500/5 border-red-500/20">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-28 h-28 rounded-full bg-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-red-500 mb-2">HIGH RISK</h2>
                  <p className="text-xl text-red-400 mb-4">Action Required</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div>
                      Validated in <span className="font-semibold text-foreground">{elapsedTime.toFixed(1)}s</span>
                    </div>
                    <div>
                      Est. savings <span className="font-semibold text-foreground">$10,500</span>
                    </div>
                    <div>
                      Issues found <span className="font-semibold text-red-400">3 critical</span>,{" "}
                      <span className="font-semibold text-yellow-400">3 warnings</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Main Layout with Activity Feed */}
            <div className="flex gap-6">
              {/* Issues Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Issues */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-foreground">Critical Issues</h3>
                </div>
                <div className="space-y-4">
                  {criticalIssues.map((issue, idx) => (
                    <Card key={idx} className="p-4 bg-card border-red-500/20">
                      <h4 className="font-semibold text-foreground mb-2">{issue.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-red-400 font-medium">Impact:</span>{" "}
                          <span className="text-foreground">{issue.impact}</span>
                        </div>
                        <div>
                          <span className="text-red-400 font-medium">Action:</span>{" "}
                          <span className="text-foreground">{issue.action}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-foreground">Warnings</h3>
                  <Badge variant="outline" className="ml-auto border-border text-muted-foreground">
                    {warnings.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {warnings.map((warning, idx) => (
                    <Card key={idx} className="p-4 bg-card border-border">
                      <h4 className="font-semibold text-foreground mb-2">{warning.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{warning.description}</p>
                      <div className="text-sm">
                        <span className="text-yellow-400 font-medium">Recommendation:</span>{" "}
                        <span className="text-foreground">{warning.recommendation}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
                  <Badge variant="outline" className="ml-auto border-border text-muted-foreground">
                    {recommendations.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <Card key={idx} className="p-4 bg-card border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{rec.title}</h4>
                        <span className="text-green-400 font-bold">{rec.savings}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Real-time Agent Activity */}
          <div className="w-80">
            <Card className="p-6 bg-card border-border sticky top-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                🤖 AI Agent Activity - Live
              </h2>

              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-3 pb-4 border-b border-border/50 last:border-0">
                    <div className={`mt-1 ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{activity.text}</p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                Request Corrections
              </Button>
              <Button className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground">
                Approve & Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
