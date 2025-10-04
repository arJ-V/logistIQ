"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Eye,
  Plus,
  Activity,
  FileCheck,
  Bell,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { CreateShipmentModal } from "@/components/create-shipment-modal"
import Link from "next/link"

const shipments = [
  {
    id: "SH-2847",
    supplier: "Shenzhen Tech",
    status: "Docs Ready",
    statusColor: "gray",
    riskScore: 28,
    riskLevel: "Low",
    etd: "Oct 12",
  },
  {
    id: "SH-2846",
    supplier: "Guangzhou Electronics",
    status: "Validating",
    statusColor: "blue",
    riskScore: 45,
    riskLevel: "Medium",
    etd: "Oct 15",
  },
  {
    id: "SH-2845",
    supplier: "Shanghai Manufacturing",
    status: "Ready",
    statusColor: "green",
    riskScore: 18,
    riskLevel: "Low",
    etd: "Oct 10",
  },
  {
    id: "SH-2844",
    supplier: "Beijing Components",
    status: "Shipped",
    statusColor: "slate",
    riskScore: 72,
    riskLevel: "High",
    etd: "Oct 8",
  },
  {
    id: "SH-2843",
    supplier: "Dongguan Parts Co",
    status: "Docs Ready",
    statusColor: "gray",
    riskScore: 34,
    riskLevel: "Low",
    etd: "Oct 18",
  },
]

const activities = [
  { time: "2 min ago", text: "SH-2846 validation started", icon: Activity, color: "text-blue-400" },
  { time: "5 min ago", text: "SH-2847 auto-corrected 3 issues", icon: CheckCircle2, color: "text-green-400" },
  { time: "12 min ago", text: "New CBP regulation detected", icon: Bell, color: "text-orange-400" },
  { time: "18 min ago", text: "SH-2845 cleared all validations", icon: FileCheck, color: "text-green-400" },
  { time: "25 min ago", text: "Risk threshold updated", icon: AlertTriangle, color: "text-yellow-400" },
  { time: "32 min ago", text: "SH-2844 flagged for review", icon: AlertTriangle, color: "text-red-400" },
  { time: "45 min ago", text: "Batch validation completed", icon: CheckCircle2, color: "text-green-400" },
]

const metrics = [
  { label: "Validation Accuracy", week1: "67%", week4: "89%", change: "+33%", trend: "up" },
  { label: "False Positive Rate", week1: "12%", week4: "5%", change: "-58%", trend: "down" },
  { label: "Avg Processing Time", week1: "4.2h", week4: "1.8h", change: "-57%", trend: "down" },
  { label: "Auto-Correction Rate", week1: "34%", week4: "67%", change: "+97%", trend: "up" },
]

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [shipmentsData, setShipmentsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch shipments from API on component mount
  useEffect(() => {
    fetchShipments()
  }, [])
  
  const fetchShipments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/shipments')
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match existing UI expectations
        const transformedData = data.map((shipment: any) => ({
          id: shipment.id,
          supplier: shipment.supplier,
          status: shipment.shipment_status,
          statusColor: getStatusColorFromStatus(shipment.shipment_status),
          riskScore: shipment.risk_score,
          riskLevel: shipment.risk_level,
          etd: shipment.etd
        }))
        setShipmentsData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
      // Keep empty array on error
    } finally {
      setIsLoading(false)
    }
  }
  
  const getStatusColorFromStatus = (status: string) => {
    if (status === 'Delivered') return 'green'
    if (status === 'In Transit' || status === 'Validating' || status === 'AI Processing') return 'blue'
    if (status === 'At Port' || status === 'Docs Ready') return 'gray'
    if (status === 'Delayed' || status === 'Customs Hold') return 'yellow'
    return 'slate'
  }

  const handleNewShipment = async (shipmentData: any) => {
    try {
      // Send to API to create new shipment
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      })
      
      if (response.ok) {
        const newShipment = await response.json()
        
        // Transform and add to local state immediately
        const transformedShipment = {
          id: newShipment.id,
          supplier: newShipment.supplier,
          status: newShipment.shipment_status,
          statusColor: getStatusColorFromStatus(newShipment.shipment_status),
          riskScore: newShipment.risk_score,
          riskLevel: newShipment.risk_level,
          etd: newShipment.etd
        }
        
        setShipmentsData([transformedShipment, ...shipmentsData])
        
        // Update the shipment when AI processing completes
        setTimeout(async () => {
          await fetchShipments() // Refresh all data
        }, 3000)
      }
    } catch (error) {
      console.error('Error creating shipment:', error)
    }
  }

  const getRiskBadgeColor = (level: string) => {
    if (level === "Low") return "bg-green-500/10 text-green-400 border-green-500/20"
    if (level === "Medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    return "bg-red-500/10 text-red-400 border-red-500/20"
  }

  const getStatusBadgeColor = (color: string) => {
    if (color === "gray") return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    if (color === "blue") return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    if (color === "green") return "bg-green-500/10 text-green-400 border-green-500/20"
    return "bg-slate-600/10 text-slate-500 border-slate-600/20"
  }

  const getRiskBadgeColorForLevel = (level: string) => {
    if (level === "Low") return "bg-green-500/10 text-green-400 border-green-500/20"
    if (level === "Medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    if (level === "High") return "bg-red-500/10 text-red-400 border-red-500/20"
    if (level === "Analyzing") return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    return "bg-slate-500/10 text-slate-400 border-slate-500/20"
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
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/" className="text-foreground font-medium">
                  Dashboard
                </Link>
                <Link 
                  href={`/analysis/${shipmentsData.length > 0 ? shipmentsData[0].id : 'SH-2847'}`} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analytics
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
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
        <div>
          {/* Main Content */}
          <div>
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Shipments</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{shipmentsData.length}</div>
              </Card>

              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-muted-foreground">Validated Today</span>
                </div>
                <div className="text-3xl font-bold text-foreground">23</div>
              </Card>

              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Issues Auto-Corrected</span>
                </div>
                <div className="text-3xl font-bold text-foreground">47</div>
              </Card>

              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-muted-foreground">Avg Risk Score</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  34<span className="text-lg text-muted-foreground">/100</span>
                </div>
              </Card>
            </div>

            {/* Shipments Table */}
            <Card className="p-6 bg-card border-border mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Shipments</h2>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Shipment
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Shipment ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Supplier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ETD</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                            Loading shipments...
                          </div>
                        </td>
                      </tr>
                    ) : shipmentsData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No shipments found. Create your first shipment to get started.
                        </td>
                      </tr>
                    ) : (
                      shipmentsData.map((shipment) => (
                      <tr key={shipment.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-foreground">{shipment.id}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-foreground">{shipment.supplier}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${getStatusBadgeColor(shipment.statusColor)} border`}>
                            {shipment.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getRiskBadgeColorForLevel(shipment.riskLevel)} border`}>
                            {shipment.riskLevel === "Analyzing" 
                              ? "🤖 Analyzing..." 
                              : `${shipment.riskScore} ${shipment.riskLevel}`
                            }
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{shipment.etd}</td>
                        <td className="py-4 px-4">
                          <Link href={`/shipment/${shipment.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* System Performance */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-2">Continuous Improvement</h2>
              <p className="text-sm text-muted-foreground mb-6">System Performance Metrics</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metrics.map((metric) => (
                  <div key={metric.label} className="p-4 rounded-lg bg-muted/20 border border-border">
                    <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-muted-foreground">{metric.week1}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-2xl font-bold text-foreground">{metric.week4}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${metric.trend === "up" ? "text-green-400" : "text-green-400"}`}
                      >
                        {metric.trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        <span className="font-semibold">{metric.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CreateShipmentModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onShipmentCreated={handleNewShipment}
      />
    </div>
  )
}
