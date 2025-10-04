"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2, XCircle, AlertTriangle, CheckCircle } from "lucide-react"
import { useAiriaAgents } from "@/hooks/use-airia-agents"
import { AiriaResponse } from "@/lib/airia-client"

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

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const { results } = useAiriaAgents()
  const [analysisResults, setAnalysisResults] = useState<AiriaResponse[]>([])

  useEffect(() => {
    // In a real implementation, you would fetch the results from a store or API
    // For now, we'll use the results from the hook
    setAnalysisResults(results)
  }, [results])

  // Process agent results into the expected format
  const processedResults = {
    criticalIssues: analysisResults
      .filter(r => r.success && r.data?.severity === 'critical')
      .map(r => ({
        title: `${r.agent_name} Issue`,
        description: r.data?.description || 'Issue detected',
        impact: r.data?.impact || 'Potential compliance risk',
        action: r.data?.recommendation || 'Review and correct'
      })),
    warnings: analysisResults
      .filter(r => r.success && r.data?.severity === 'warning')
      .map(r => ({
        title: `${r.agent_name} Warning`,
        description: r.data?.description || 'Warning detected',
        recommendation: r.data?.recommendation || 'Review for accuracy'
      })),
    recommendations: analysisResults
      .filter(r => r.success && r.data?.savings)
      .map(r => ({
        title: `${r.agent_name} Optimization`,
        savings: r.data?.savings || '$0',
        description: r.data?.description || 'Potential savings identified'
      }))
  }

  const totalSavings = processedResults.recommendations.reduce((sum, rec) => {
    const savings = parseFloat(rec.savings.replace(/[$,]/g, '')) || 0
    return sum + savings
  }, 0)

  const riskLevel = processedResults.criticalIssues.length > 0 ? 'HIGH' : 
                   processedResults.warnings.length > 2 ? 'MEDIUM' : 'LOW'

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
        {/* Risk Banner */}
        <Card className={`p-8 mb-8 ${
          riskLevel === 'HIGH' ? 'bg-red-500/5 border-red-500/20' :
          riskLevel === 'MEDIUM' ? 'bg-yellow-500/5 border-yellow-500/20' :
          'bg-green-500/5 border-green-500/20'
        }`}>
          <div className="flex items-center gap-8">
            <div className={`w-32 h-32 rounded-full ${
              riskLevel === 'HIGH' ? 'bg-red-500' :
              riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
              'bg-green-500'
            } flex items-center justify-center flex-shrink-0`}>
              <div className={`w-28 h-28 rounded-full ${
                riskLevel === 'HIGH' ? 'bg-red-600' :
                riskLevel === 'MEDIUM' ? 'bg-yellow-600' :
                'bg-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-4xl font-bold mb-2 ${
                riskLevel === 'HIGH' ? 'text-red-500' :
                riskLevel === 'MEDIUM' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {riskLevel} RISK
              </h2>
              <p className={`text-xl mb-4 ${
                riskLevel === 'HIGH' ? 'text-red-400' :
                riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {riskLevel === 'HIGH' ? 'Action Required' :
                 riskLevel === 'MEDIUM' ? 'Review Recommended' :
                 'All Good'}
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div>
                  Validated in <span className="font-semibold text-foreground">8.2s</span>
                </div>
                <div>
                  Est. savings <span className="font-semibold text-foreground">${totalSavings.toLocaleString()}</span>
                </div>
                <div>
                  Issues found <span className="font-semibold text-red-400">{processedResults.criticalIssues.length} critical</span>,{" "}
                  <span className="font-semibold text-yellow-400">{processedResults.warnings.length} warnings</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Issues Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Critical Issues */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-foreground">Critical Issues</h3>
            </div>
            <div className="space-y-4">
              {processedResults.criticalIssues.map((issue, idx) => (
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
                {processedResults.warnings.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {processedResults.warnings.map((warning, idx) => (
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
                {processedResults.recommendations.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {processedResults.recommendations.map((rec, idx) => (
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
            Request Corrections
          </Button>
          <Button className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground">
            Approve & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
