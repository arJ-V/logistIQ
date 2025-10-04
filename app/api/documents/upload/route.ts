import { NextRequest, NextResponse } from 'next/server'

// POST /api/documents/upload - Handle PDF upload and text extraction
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const extractedData = []

    for (const file of files) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      
      // Generate fake but realistic extracted data based on document type
      const documentType = guessDocumentType(file.name)
      const fakeExtractedText = generateFakeDocumentText(documentType, file.name)
      const language = detectLanguageFromFilename(file.name)

      extractedData.push({
        fileName: file.name,
        size: file.size,
        type: file.type,
        text: fakeExtractedText,
        language: language,
        documentType: documentType,
        pages: Math.floor(Math.random() * 3) + 1, // 1-3 pages
        extractedAt: new Date().toISOString(),
        confidence: Math.floor(Math.random() * 15) + 85 // 85-100% confidence
      })
    }

    return NextResponse.json({ 
      message: 'Files processed successfully',
      files: extractedData,
      extractionSummary: generateExtractionSummary(extractedData)
    })

  } catch (error) {
    console.error('Error processing upload:', error)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}

function detectLanguageFromFilename(fileName: string): 'english' | 'chinese' | 'mixed' | 'unknown' {
  const name = fileName.toLowerCase()
  
  // Simple heuristic based on filename
  if (name.includes('cn') || name.includes('china') || name.includes('chinese')) return 'chinese'
  if (name.includes('eng') || name.includes('english')) return 'english'
  if (name.includes('bilingual') || name.includes('mixed')) return 'mixed'
  
  // Random assignment for demo (weighted toward mixed since it's more interesting)
  const rand = Math.random()
  if (rand < 0.4) return 'mixed'
  if (rand < 0.7) return 'english'
  if (rand < 0.9) return 'chinese'
  return 'unknown'
}

function generateFakeDocumentText(documentType: string, fileName: string): string {
  const templates = {
    'Commercial Invoice': `COMMERCIAL INVOICE
Invoice No: CI-${Math.floor(Math.random() * 900000) + 100000}
Date: ${new Date().toLocaleDateString()}

SELLER:
Shenzhen Tech Co., Ltd.
Building A, Industrial Park
Shenzhen, Guangdong, China

BUYER:
TechCorp USA
123 Business Ave
Los Angeles, CA 90001

DESCRIPTION OF GOODS:
- Consumer Electronics Components (HS Code: 8517.70.00)
- Quantity: ${Math.floor(Math.random() * 500) + 100} PCS
- Unit Price: $${(Math.random() * 50 + 10).toFixed(2)}
- Total Value: $${(Math.random() * 25000 + 5000).toFixed(2)}

Terms: FOB Shenzhen
Payment: T/T in advance

中文说明：
产品：电子元器件
数量：${Math.floor(Math.random() * 500) + 100}个
单价：$${(Math.random() * 50 + 10).toFixed(2)}`,

    'Bill of Lading': `OCEAN BILL OF LADING
B/L No: BOL-${Math.floor(Math.random() * 900000) + 100000}

SHIPPER:
Shenzhen Tech Co., Ltd.
Shenzhen Port, China

CONSIGNEE:
TechCorp USA
Port of Los Angeles

VESSEL: COSCO SHIPPING STAR
VOYAGE: ${Math.floor(Math.random() * 100) + 200}E

CONTAINER NO: CSLU${Math.floor(Math.random() * 9000000) + 1000000}
SEAL NO: ${Math.floor(Math.random() * 900000) + 100000}

CARGO:
${Math.floor(Math.random() * 50) + 10} CTNS ELECTRONIC COMPONENTS
GROSS WEIGHT: ${Math.floor(Math.random() * 5000) + 1000} KGS

装货港：深圳港
卸货港：洛杉矶港`,

    'Packing List': `PACKING LIST
P/L No: PL-${Math.floor(Math.random() * 900000) + 100000}

SHIPPER: Shenzhen Tech Co., Ltd.
INVOICE NO: CI-${Math.floor(Math.random() * 900000) + 100000}

PACKAGING DETAILS:
- Carton No. 1-${Math.floor(Math.random() * 20) + 5}
- ${Math.floor(Math.random() * 500) + 100} PCS Electronic Components
- Each carton: ${Math.floor(Math.random() * 30) + 10} KGS
- Dimensions: 60x40x30 CM per carton

装箱清单
纸箱编号：1-${Math.floor(Math.random() * 20) + 5}
产品数量：${Math.floor(Math.random() * 500) + 100}件电子元件`,

    'Certificate of Origin': `CERTIFICATE OF ORIGIN
Certificate No: CO-${Math.floor(Math.random() * 900000) + 100000}

We hereby certify that the goods described below:
- Electronic Components and Parts
- HS Code: 8517.70.00
- Manufactured in China

are of Chinese origin.

Issued by: China Chamber of International Commerce
Date: ${new Date().toLocaleDateString()}

原产地证明
产品：电子元器件
原产地：中国`,

    'MSDS Certificate': `MATERIAL SAFETY DATA SHEET
Product: Electronic Components
MSDS No: MSDS-${Math.floor(Math.random() * 900000) + 100000}

HAZARD CLASSIFICATION:
- Not classified as dangerous goods
- UN Class: Not applicable
- Flash Point: N/A

HANDLING PRECAUTIONS:
- Store in dry conditions
- Avoid static discharge

物质安全数据表
产品：电子元器件
危险等级：非危险品`
  }

  return templates[documentType as keyof typeof templates] || `TRADE DOCUMENT
Document: ${documentType}
File: ${fileName}
Processed: ${new Date().toISOString()}

This document contains trade-related information
extracted using AI text recognition.

该文档包含与贸易相关的信息
使用AI文本识别技术提取`
}

function guessDocumentType(fileName: string): string {
  const name = fileName.toLowerCase()
  
  // Check filename patterns
  if (name.includes('invoice')) return 'Commercial Invoice'
  if (name.includes('bill') && name.includes('lading')) return 'Bill of Lading'
  if (name.includes('bol')) return 'Bill of Lading'
  if (name.includes('packing') || name.includes('pack')) return 'Packing List'
  if (name.includes('certificate')) return 'Certificate of Origin'
  if (name.includes('customs')) return 'Customs Declaration'
  if (name.includes('msds')) return 'MSDS Certificate'
  if (name.includes('pod')) return 'Proof of Delivery'
  
  // Random assignment for generic files (weighted toward common documents)
  const rand = Math.random()
  if (rand < 0.3) return 'Commercial Invoice'
  if (rand < 0.5) return 'Bill of Lading'
  if (rand < 0.7) return 'Packing List'
  if (rand < 0.85) return 'Certificate of Origin'
  if (rand < 0.95) return 'MSDS Certificate'
  
  return 'Trade Document'
}

function generateExtractionSummary(extractedData: any[]) {
  const totalFiles = extractedData.length
  const successfulExtractions = extractedData.filter(f => f.text && !f.error).length
  const languages = extractedData.reduce((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const documentTypes = extractedData.reduce((acc, f) => {
    acc[f.documentType] = (acc[f.documentType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalFiles,
    successfulExtractions,
    extractionRate: `${Math.round((successfulExtractions / totalFiles) * 100)}%`,
    languages,
    documentTypes,
    processingTime: new Date().toISOString()
  }
}