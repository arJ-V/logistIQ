"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Send,
  Clock,
  Package,
  Ship,
  MapPin,
  Eye,
} from "lucide-react"
import Link from "next/link"

const documents = [
  { name: "Commercial Invoice", status: "validated", issues: 0, aiScore: 98 },
  { name: "Packing List", status: "validated", issues: 0, aiScore: 95 },
  { name: "Bill of Lading", status: "warning", issues: 2, aiScore: 78 },
  { name: "Certificate of Origin", status: "validated", issues: 0, aiScore: 92 },
]

const riskChecks = [
  { name: "HS Code Validation", status: "pass", detail: "All codes verified" },
  { name: "Tariff Classification", status: "pass", detail: "Correctly classified" },
  { name: "Value Declaration", status: "warning", detail: "2 discrepancies found" },
  { name: "Country of Origin", status: "pass", detail: "Documentation complete" },
  { name: "Restricted Items", status: "pass", detail: "No restrictions detected" },
  { name: "Compliance Check", status: "warning", detail: "Minor issues detected" },
]

const timeline = [
  { time: "2 hours ago", event: "Shipment created", status: "completed" },
  { time: "1 hour ago", event: "Documents uploaded", status: "completed" },
  { time: "45 min ago", event: "AI validation started", status: "completed" },
  { time: "30 min ago", event: "Issues detected and flagged", status: "completed" },
  { time: "15 min ago", event: "Auto-correction applied", status: "completed" },
  { time: "Now", event: "Ready for review", status: "current" },
  { time: "Pending", event: "Submit to customs", status: "pending" },
]

export default function ShipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const shipmentId = resolvedParams.id
  const getDocStatusIcon = (status: string) => {
    if (status === "validated") return <CheckCircle2 className="h-5 w-5 text-green-400" />
    if (status === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-400" />
    return <XCircle className="h-5 w-5 text-red-400" />
  }

  const getRiskStatusColor = (status: string) => {
    if (status === "pass") return "bg-green-500/10 text-green-400 border-green-500/20"
    if (status === "warning") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    return "bg-red-500/10 text-red-400 border-red-500/20"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">LogistIQ</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Shipment {shipmentId}</h1>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 border">Validating</Badge>
              <span className="text-sm text-muted-foreground">Shenzhen Tech → Los Angeles</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/analysis/${shipmentId}`}>
              <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                View Analysis
              </Button>
            </Link>
            <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="h-4 w-4 mr-2" />
              Submit to Customs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Validation */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Document Validation</h2>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.name} className="p-4 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getDocStatusIcon(doc.status)}
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.issues === 0 ? "No issues found" : `${doc.issues} issues detected`}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AI Confidence Score</span>
                        <span className="text-foreground font-medium">{doc.aiScore}%</span>
                      </div>
                      <Progress value={doc.aiScore} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Shipment Timeline</h2>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          item.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : item.status === "current"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : item.status === "current" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${item.status === "completed" ? "bg-green-500/20" : "bg-border"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="font-medium text-foreground">{item.event}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Assessment */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-2">Risk Assessment</h2>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Overall Risk Score</span>
                  <span className="text-2xl font-bold text-foreground">28</span>
                </div>
                <Progress value={28} className="h-3" />
                <p className="text-xs text-green-400 mt-2">Low Risk</p>
              </div>

              <div className="space-y-3">
                {riskChecks.map((check) => (
                  <div key={check.name} className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{check.name}</span>
                      <Badge className={`${getRiskStatusColor(check.status)} border text-xs`}>{check.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipment Info */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Shipment Info</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium text-foreground">Shenzhen Tech</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ship className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">ETD</p>
                    <p className="font-medium text-foreground">October 12, 2024</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium text-foreground">Los Angeles, CA</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
