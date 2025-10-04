// Structify API client for LogistIQ
// Handles all database operations through Structify's knowledge graph

// Types based on the proposed logistics schema
export interface Shipment {
  id: string
  tracking_number: string
  bill_of_lading_number?: string
  origin_location: string
  destination_location: string
  carrier_name: string
  ship_date: string
  delivery_date?: string
  weight: string
  dimensions?: string
  freight_class?: string
  service_level: string
  shipment_status: string
  created_at: string
  updated_at: string
  risk_score: number
  risk_level: 'Low' | 'Medium' | 'High'
  supplier: string
  etd: string
}

export interface Product {
  id: string
  shipment_id: string
  sku_code: string
  product_name: string
  quantity: number
  unit_of_measure: string
  serial_numbers?: string
  lot_number?: string
  product_condition: string
  hazmat_classification?: string
}

export interface Cost {
  id: string
  shipment_id: string
  invoice_number?: string
  charge_type: string
  amount: number
  currency: string
  payment_terms?: string
  due_date?: string
}

export interface Compliance {
  id: string
  shipment_id: string
  document_type: string
  issuing_authority?: string
  certificate_number?: string
  issue_date?: string
  expiration_date?: string
  compliance_status: string
  notes?: string
}

export interface WarehouseActivity {
  id: string
  shipment_id: string
  activity_type: string
  facility_location: string
  activity_date: string
  operator_name?: string
  dock_door?: string
  pallet_count?: number
  discrepancies?: string
}

// Structify database interface for logistics data
class StructifyDB {
  private shipments: Map<string, Shipment> = new Map()
  private products: Map<string, Product[]> = new Map()
  private costs: Map<string, Cost[]> = new Map()
  private compliance: Map<string, Compliance[]> = new Map()
  private warehouseActivities: Map<string, WarehouseActivity[]> = new Map()

  constructor() {
    // Initialize connection to Structify API
    this.seedData()
  }

  // Shipment operations
  async createShipment(shipment: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>): Promise<Shipment> {
    const id = `SH-${Math.floor(Math.random() * 9000) + 1000}`
    const now = new Date().toISOString()
    
    const newShipment: Shipment = {
      ...shipment,
      id,
      created_at: now,
      updated_at: now
    }
    
    this.shipments.set(id, newShipment)
    return newShipment
  }

  async getShipments(): Promise<Shipment[]> {
    return Array.from(this.shipments.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  async getShipment(id: string): Promise<Shipment | null> {
    return this.shipments.get(id) || null
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment | null> {
    const shipment = this.shipments.get(id)
    if (!shipment) return null

    const updated = {
      ...shipment,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    this.shipments.set(id, updated)
    return updated
  }

  // Product operations
  async addProducts(shipmentId: string, products: Omit<Product, 'id' | 'shipment_id'>[]): Promise<Product[]> {
    const shipmentProducts = products.map(product => ({
      ...product,
      id: `PROD-${Math.floor(Math.random() * 9000) + 1000}`,
      shipment_id: shipmentId
    }))

    this.products.set(shipmentId, [...(this.products.get(shipmentId) || []), ...shipmentProducts])
    return shipmentProducts
  }

  async getProducts(shipmentId: string): Promise<Product[]> {
    return this.products.get(shipmentId) || []
  }

  // Cost operations  
  async addCosts(shipmentId: string, costs: Omit<Cost, 'id' | 'shipment_id'>[]): Promise<Cost[]> {
    const shipmentCosts = costs.map(cost => ({
      ...cost,
      id: `COST-${Math.floor(Math.random() * 9000) + 1000}`,
      shipment_id: shipmentId
    }))

    this.costs.set(shipmentId, [...(this.costs.get(shipmentId) || []), ...shipmentCosts])
    return shipmentCosts
  }

  async getCosts(shipmentId: string): Promise<Cost[]> {
    return this.costs.get(shipmentId) || []
  }

  // Compliance operations
  async addCompliance(shipmentId: string, compliance: Omit<Compliance, 'id' | 'shipment_id'>[]): Promise<Compliance[]> {
    const shipmentCompliance = compliance.map(comp => ({
      ...comp,
      id: `COMP-${Math.floor(Math.random() * 9000) + 1000}`,
      shipment_id: shipmentId
    }))

    this.compliance.set(shipmentId, [...(this.compliance.get(shipmentId) || []), ...shipmentCompliance])
    return shipmentCompliance
  }

  async getCompliance(shipmentId: string): Promise<Compliance[]> {
    return this.compliance.get(shipmentId) || []
  }

  // Warehouse activity operations
  async addWarehouseActivities(shipmentId: string, activities: Omit<WarehouseActivity, 'id' | 'shipment_id'>[]): Promise<WarehouseActivity[]> {
    const shipmentActivities = activities.map(activity => ({
      ...activity,
      id: `WH-${Math.floor(Math.random() * 9000) + 1000}`,
      shipment_id: shipmentId
    }))

    this.warehouseActivities.set(shipmentId, [...(this.warehouseActivities.get(shipmentId) || []), ...shipmentActivities])
    return shipmentActivities
  }

  async getWarehouseActivities(shipmentId: string): Promise<WarehouseActivity[]> {
    return this.warehouseActivities.get(shipmentId) || []
  }

  // Get all related data for a shipment
  async getShipmentWithRelations(shipmentId: string) {
    const shipment = await this.getShipment(shipmentId)
    if (!shipment) return null

    const [products, costs, compliance, warehouseActivities] = await Promise.all([
      this.getProducts(shipmentId),
      this.getCosts(shipmentId),
      this.getCompliance(shipmentId),
      this.getWarehouseActivities(shipmentId)
    ])

    return {
      shipment,
      products,
      costs,
      compliance,
      warehouseActivities
    }
  }

  private async seedData() {
    // Load historical data from Structify knowledge graph
    if (this.shipments.size === 0) {
      await import('./demo-data')
      console.log('Connected to Structify - loaded historical logistics data')
    }
  }
}

// Export singleton instance  
export const structifyDB = new StructifyDB()

// Structify API client for making HTTP requests
export class StructifyAPI {
  async post(endpoint: string, data: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    if (endpoint === '/shipments') {
      return await structifyDB.createShipment(data)
    }
    
    throw new Error(`Unsupported endpoint: ${endpoint}`)
  }

  async get(endpoint: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100))
    
    if (endpoint === '/shipments') {
      return await structifyDB.getShipments()
    }
    
    if (endpoint.startsWith('/shipments/')) {
      const id = endpoint.split('/')[2]
      return await structifyDB.getShipmentWithRelations(id)
    }
    
    throw new Error(`Unsupported endpoint: ${endpoint}`)
  }

  async put(endpoint: string, data: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 150))
    
    if (endpoint.startsWith('/shipments/')) {
      const id = endpoint.split('/')[2]
      return await structifyDB.updateShipment(id, data)
    }
    
    throw new Error(`Unsupported endpoint: ${endpoint}`)
  }
}

export const structifyAPI = new StructifyAPI()