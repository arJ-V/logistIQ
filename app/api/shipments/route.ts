import { NextRequest, NextResponse } from 'next/server'
import { structifyDB, type Shipment } from '@/lib/structify-client'

// GET /api/shipments - Get all shipments
export async function GET() {
  try {
    const shipments = await structifyDB.getShipments()
    return NextResponse.json(shipments)
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}

// POST /api/shipments - Create new shipment
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Map the form data to our shipment schema
    const shipmentData: Omit<Shipment, 'id' | 'created_at' | 'updated_at'> = {
      tracking_number: `TRK${String(Math.floor(Math.random() * 900000) + 100000)}`,
      bill_of_lading_number: `BOL-${Math.floor(Math.random() * 900000) + 100000}`,
      origin_location: 'Shenzhen Port, Guangdong, China', // Default for demo
      destination_location: getDestinationFromPort(data.port),
      carrier_name: 'COSCO SHIPPING', // Default for demo
      ship_date: data.etd || new Date().toISOString(),
      weight: `${Math.floor(Math.random() * 20000) + 5000} lbs`, // Random weight for demo
      service_level: 'Standard',
      shipment_status: 'AI Processing',
      supplier: getSupplierName(data.supplier),
      etd: data.etd || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      risk_score: 0,
      risk_level: 'Low'
    }
    
    const shipment = await structifyDB.createShipment(shipmentData)
    
    // Simulate AI processing by updating status after a delay
    setTimeout(async () => {
      await structifyDB.updateShipment(shipment.id, {
        shipment_status: 'Validating',
        risk_score: Math.floor(Math.random() * 50) + 10,
        risk_level: Math.random() > 0.7 ? 'Medium' : 'Low'
      })
    }, 2000)
    
    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}

function getSupplierName(supplierKey: string): string {
  const supplierNames: { [key: string]: string } = {
    'shenzhen': 'Shenzhen Tech Co., Ltd.',
    'guangzhou': 'Guangzhou Electronics Manufacturing',
    'shanghai': 'Shanghai Industrial Corp',
    'beijing': 'Beijing Components Ltd.'
  }
  return supplierNames[supplierKey] || 'New Supplier'
}

function getDestinationFromPort(portKey: string): string {
  const portNames: { [key: string]: string } = {
    'la': 'Los Angeles, CA',
    'ny': 'New York, NY',
    'sf': 'San Francisco, CA',
    'seattle': 'Seattle, WA'
  }
  return portNames[portKey] || 'Los Angeles, CA'
}