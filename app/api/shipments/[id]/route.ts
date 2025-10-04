import { NextRequest, NextResponse } from 'next/server'
import { structifyDB } from '@/lib/structify-client'

// GET /api/shipments/[id] - Get shipment with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const shipmentData = await structifyDB.getShipmentWithRelations(id)
    
    if (!shipmentData) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    
    return NextResponse.json(shipmentData)
  } catch (error) {
    console.error('Error fetching shipment:', error)
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 })
  }
}

// PUT /api/shipments/[id] - Update shipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    
    const updatedShipment = await structifyDB.updateShipment(id, updates)
    
    if (!updatedShipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedShipment)
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
  }
}