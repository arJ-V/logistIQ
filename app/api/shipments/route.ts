import { NextRequest, NextResponse } from 'next/server';
import { structifyDB } from '@/lib/structify-client';

export async function GET() {
  try {
    const shipments = await structifyDB.getShipments();
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const shipmentData = {
      tracking_number: body.tracking_number || `TRK${Date.now()}`,
      bill_of_lading_number: body.bill_of_lading_number,
      origin_location: body.origin_location || 'Unknown',
      destination_location: body.destination_location || 'Unknown',
      carrier_name: body.carrier_name || 'Unknown',
      ship_date: body.ship_date || new Date().toISOString(),
      delivery_date: body.delivery_date,
      weight: body.weight || '0 lbs',
      dimensions: body.dimensions,
      freight_class: body.freight_class,
      service_level: body.service_level || 'Standard',
      shipment_status: 'Validating',
      supplier: body.supplier || 'Unknown Supplier',
      etd: body.etd || new Date().toISOString().split('T')[0],
      risk_score: 0,
      risk_level: 'Low' as const
    };

    const newShipment = await structifyDB.createShipment(shipmentData);
    return NextResponse.json(newShipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
