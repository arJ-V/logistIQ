// Demo data generator for fake Structify database
import { structifyDB, type Shipment } from './structify-client'

const suppliers = [
  'Shenzhen Tech Co., Ltd.',
  'Guangzhou Electronics Manufacturing', 
  'Shanghai Industrial Corp',
  'Beijing Components Ltd.',
  'Dongguan Parts Co.',
  'Xiamen Export Trading',
  'Ningbo Logistics Hub',
  'Qingdao Marine Shipping',
  'Tianjin Port Authority',
  'Foshan Manufacturing Group'
]

const carriers = [
  'COSCO SHIPPING',
  'Maersk Line',
  'CMA CGM',
  'OOCL',
  'Evergreen Marine',
  'MSC',
  'APL',
  'Yang Ming',
  'Wan Hai Lines',
  'ZIM'
]

const originLocations = [
  'Shenzhen Port, Guangdong, China',
  'Shanghai Port, Shanghai, China',
  'Guangzhou Port, Guangdong, China',
  'Ningbo Port, Zhejiang, China',
  'Qingdao Port, Shandong, China',
  'Xiamen Port, Fujian, China',
  'Tianjin Port, Tianjin, China',
  'Dalian Port, Liaoning, China',
  'Yantian Port, Shenzhen, China',
  'Huangpu Port, Guangzhou, China'
]

const destinationLocations = [
  'Los Angeles, CA',
  'Long Beach, CA', 
  'New York, NY',
  'Newark, NJ',
  'Seattle, WA',
  'Tacoma, WA',
  'Miami, FL',
  'Houston, TX',
  'Charleston, SC',
  'San Francisco, CA'
]

const productTypes = [
  { name: 'Consumer Electronics', sku_prefix: 'CE', hazmat: false },
  { name: 'Automotive Parts', sku_prefix: 'AUTO', hazmat: false },
  { name: 'Textiles & Apparel', sku_prefix: 'TEX', hazmat: false },
  { name: 'Industrial Machinery', sku_prefix: 'MACH', hazmat: false },
  { name: 'Lithium Batteries', sku_prefix: 'BATT', hazmat: true },
  { name: 'Chemical Supplies', sku_prefix: 'CHEM', hazmat: true },
  { name: 'Medical Devices', sku_prefix: 'MED', hazmat: false },
  { name: 'Furniture & Fixtures', sku_prefix: 'FURN', hazmat: false },
  { name: 'Steel Components', sku_prefix: 'STEEL', hazmat: false },
  { name: 'Plastic Materials', sku_prefix: 'PLAS', hazmat: false }
]

const statuses = [
  { status: 'Delivered', weight: 40 },
  { status: 'In Transit', weight: 30 },
  { status: 'At Port', weight: 15 },
  { status: 'Customs Hold', weight: 8 },
  { status: 'Delayed', weight: 5 },
  { status: 'Cancelled', weight: 2 }
]

const serviceTypes = ['Standard', 'Expedited', 'Express', 'Economy']

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedChoice<T extends { weight: number }>(arr: T[]): T {
  const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const item of arr) {
    random -= item.weight
    if (random <= 0) return item
  }
  
  return arr[0]
}

function randomDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date.toISOString()
}

function calculateRisk(shipment: any, products: any[], compliance: any[]): { score: number; level: 'Low' | 'Medium' | 'High' } {
  let riskScore = 20 // Base risk
  
  // Add risk for hazmat
  if (products.some(p => p.hazmat_classification)) riskScore += 25
  
  // Add risk for high value
  const totalValue = Math.random() * 500000 + 50000
  if (totalValue > 200000) riskScore += 15
  
  // Add risk for compliance issues
  const hasIssues = compliance.some(c => c.compliance_status === 'pending' || c.compliance_status === 'rejected')
  if (hasIssues) riskScore += 20
  
  // Add risk for certain origins/destinations
  if (shipment.origin_location.includes('Shenzhen')) riskScore += 5
  
  // Add random variation
  riskScore += Math.random() * 10 - 5
  
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)))
  
  const level = riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High'
  
  return { score: riskScore, level }
}

export async function seedDemoData() {
  console.log('Seeding demo data...')
  
  // Generate 35 historical shipments
  for (let i = 0; i < 35; i++) {
    const trackingNum = `TRK${String(Math.floor(Math.random() * 900000) + 100000)}`
    const supplier = randomChoice(suppliers)
    const carrier = randomChoice(carriers)
    const origin = randomChoice(originLocations)
    const destination = randomChoice(destinationLocations)
    const status = weightedChoice(statuses).status
    const serviceType = randomChoice(serviceTypes)
    
    const shipDate = randomDate(180) // Up to 6 months ago
    const deliveryDate = status === 'Delivered' ? 
      new Date(new Date(shipDate).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() :
      undefined
    
    // Create shipment (without risk data first)
    const shipmentData: Omit<Shipment, 'id' | 'created_at' | 'updated_at' | 'risk_score' | 'risk_level'> = {
      tracking_number: trackingNum,
      bill_of_lading_number: `BOL-${Math.floor(Math.random() * 900000) + 100000}`,
      origin_location: origin,
      destination_location: destination,
      carrier_name: carrier,
      ship_date: shipDate,
      delivery_date: deliveryDate,
      weight: `${Math.floor(Math.random() * 45000) + 5000} lbs`,
      dimensions: `${Math.floor(Math.random() * 20) + 5}' x ${Math.floor(Math.random() * 8) + 4}' x ${Math.floor(Math.random() * 8) + 4}'`,
      freight_class: Math.random() > 0.7 ? `Class ${Math.floor(Math.random() * 400) + 50}` : undefined,
      service_level: serviceType,
      shipment_status: status,
      supplier: supplier,
      etd: new Date(shipDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      risk_score: 0, // Will be calculated below
      risk_level: 'Low' // Will be calculated below
    }
    
    const shipment = await structifyDB.createShipment(shipmentData)
    
    // Generate 2-5 products per shipment
    const numProducts = Math.floor(Math.random() * 4) + 2
    const products = []
    
    for (let j = 0; j < numProducts; j++) {
      const productType = randomChoice(productTypes)
      const product = {
        sku_code: `${productType.sku_prefix}-${Math.floor(Math.random() * 90000) + 10000}`,
        product_name: `${productType.name} - Model ${Math.floor(Math.random() * 900) + 100}`,
        quantity: Math.floor(Math.random() * 500) + 50,
        unit_of_measure: randomChoice(['pcs', 'cartons', 'pallets', 'cases']),
        serial_numbers: Math.random() > 0.6 ? `SN${Math.floor(Math.random() * 900000) + 100000}` : undefined,
        lot_number: Math.random() > 0.5 ? `LOT${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        product_condition: randomChoice(['New', 'Refurbished', 'Used']),
        hazmat_classification: productType.hazmat ? `Class ${Math.floor(Math.random() * 9) + 1}` : undefined
      }
      products.push(product)
    }
    
    await structifyDB.addProducts(shipment.id, products)
    
    // Generate costs (2-4 cost entries per shipment)
    const costs = [
      {
        invoice_number: `INV-${Math.floor(Math.random() * 900000) + 100000}`,
        charge_type: 'Freight',
        amount: Math.floor(Math.random() * 8000) + 2000,
        currency: 'USD',
        payment_terms: randomChoice(['Net 30', 'Net 60', 'Prepaid', 'COD']),
        due_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString() : undefined
      }
    ]
    
    // Add optional surcharges
    if (Math.random() > 0.7) {
      costs.push({
        charge_type: 'Fuel Surcharge',
        amount: Math.floor(Math.random() * 500) + 100,
        currency: 'USD'
      })
    }
    
    if (Math.random() > 0.8) {
      costs.push({
        charge_type: 'Detention',
        amount: Math.floor(Math.random() * 300) + 50,
        currency: 'USD'
      })
    }
    
    await structifyDB.addCosts(shipment.id, costs)
    
    // Generate compliance documents (2-4 per shipment)
    const complianceDocs = [
      {
        document_type: 'Commercial Invoice',
        issuing_authority: 'Exporter',
        certificate_number: `CI-${Math.floor(Math.random() * 900000) + 100000}`,
        issue_date: shipDate,
        compliance_status: randomChoice(['approved', 'pending', 'approved', 'approved']) // Weighted toward approved
      },
      {
        document_type: 'Bill of Lading',
        issuing_authority: carrier,
        certificate_number: shipment.bill_of_lading_number,
        issue_date: shipDate,
        compliance_status: 'approved'
      }
    ]
    
    // Add certificate of origin for some shipments
    if (Math.random() > 0.4) {
      complianceDocs.push({
        document_type: 'Certificate of Origin',
        issuing_authority: 'China Chamber of Commerce',
        certificate_number: `CO-${Math.floor(Math.random() * 900000) + 100000}`,
        issue_date: shipDate,
        expiration_date: new Date(new Date(shipDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        compliance_status: randomChoice(['approved', 'approved', 'pending'])
      })
    }
    
    // Add hazmat docs if needed
    const hasHazmat = products.some(p => p.hazmat_classification)
    if (hasHazmat) {
      complianceDocs.push({
        document_type: 'MSDS Certificate',
        issuing_authority: 'Manufacturer',
        certificate_number: `MSDS-${Math.floor(Math.random() * 900000) + 100000}`,
        issue_date: shipDate,
        compliance_status: randomChoice(['approved', 'approved', 'rejected']),
        notes: Math.random() > 0.7 ? 'Requires special handling' : undefined
      })
    }
    
    await structifyDB.addCompliance(shipment.id, complianceDocs)
    
    // Generate warehouse activities (1-3 per shipment)
    const activities = []
    if (Math.random() > 0.3) {
      activities.push({
        activity_type: 'Receiving',
        facility_location: origin.split(',')[0],
        activity_date: new Date(new Date(shipDate).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        operator_name: `Operator ${Math.floor(Math.random() * 100) + 1}`,
        dock_door: `Door ${Math.floor(Math.random() * 20) + 1}`,
        pallet_count: Math.floor(Math.random() * 15) + 5,
        discrepancies: Math.random() > 0.8 ? 'Minor packaging damage noted' : undefined
      })
    }
    
    if (status === 'Delivered' && Math.random() > 0.5) {
      activities.push({
        activity_type: 'Delivery',
        facility_location: destination,
        activity_date: deliveryDate!,
        operator_name: `Driver ${Math.floor(Math.random() * 100) + 1}`,
        pallet_count: Math.floor(Math.random() * 15) + 5
      })
    }
    
    if (activities.length > 0) {
      await structifyDB.addWarehouseActivities(shipment.id, activities)
    }
    
    // Calculate and update risk score
    const risk = calculateRisk(shipment, products, complianceDocs)
    await structifyDB.updateShipment(shipment.id, {
      risk_score: risk.score,
      risk_level: risk.level
    })
  }
  
  console.log('Demo data seeded successfully! Generated 35 historical shipments with full relational data.')
}

// Auto-seed on import
seedDemoData()