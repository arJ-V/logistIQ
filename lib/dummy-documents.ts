// Dummy document text for testing Airia agents
// These simulate extracted text from actual shipping documents

export const DUMMY_COMMERCIAL_INVOICE = `
COMMERCIAL INVOICE

Invoice No: INV-2025-0847
Date: January 15, 2025

EXPORTER:
Shenzhen Tech Electronics Co., Ltd.
Building 5, High-Tech Industrial Park
Nanshan District, Shenzhen, Guangdong 518057, China
Tel: +86-755-8899-6677
Email: export@shenzhentech.com.cn

CONSIGNEE:
TechWorld Imports LLC
4850 W. Sunset Blvd
Los Angeles, CA 90027, USA
Tel: +1-310-555-0199

NOTIFY PARTY: Same as Consignee

COUNTRY OF ORIGIN: China
COUNTRY OF FINAL DESTINATION: United States
PORT OF LOADING: Shenzhen, China
PORT OF DISCHARGE: Los Angeles, CA, USA

TERMS OF DELIVERY: FOB Shenzhen
TERMS OF PAYMENT: T/T 30 Days
CARRIER: COSCO SHIPPING

DESCRIPTION OF GOODS:

Item 1:
HS Code: 8471.30.0100
Description: Laptop Computers - Business Series Model LT-5000
Quantity: 500 Units
Unit Price: USD 285.00
Total Value: USD 142,500.00

Item 2:
HS Code: 8471.60.7000
Description: Computer Keyboards - Wireless Mechanical KB-200
Quantity: 750 Units
Unit Price: USD 45.00
Total Value: USD 33,750.00

Item 3:
HS Code: 8471.60.1000
Description: Computer Mice - Optical Wireless Mouse WM-150
Quantity: 1000 Units
Unit Price: USD 12.00
Total Value: USD 12,000.00

SUBTOTAL: USD 188,250.00
FREIGHT: USD 4,500.00
INSURANCE: USD 1,850.00
TOTAL INVOICE VALUE: USD 194,600.00

GROSS WEIGHT: 2,850 KG
NET WEIGHT: 2,450 KG
TOTAL PACKAGES: 85 Cartons

PACKING: Export Standard Cartons with Pallets

Declaration: We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct.

Authorized Signature: ___________________
Name: Li Wei
Title: Export Manager
Date: January 15, 2025
`;

export const DUMMY_PACKING_LIST = `
PACKING LIST

Packing List No: PL-2025-0847
Invoice No: INV-2025-0847
Date: January 15, 2025

SHIPPER:
Shenzhen Tech Electronics Co., Ltd.
Building 5, High-Tech Industrial Park
Nanshan District, Shenzhen, Guangdong 518057, China

CONSIGNEE:
TechWorld Imports LLC
4850 W. Sunset Blvd
Los Angeles, CA 90027, USA

VESSEL: COSCO EXCELLENCE V.215
CONTAINER NO: COSU7654321
SEAL NO: SZ8847521
MARKS & NUMBERS: TECHWORLD/LA/2025

DETAILED PACKING INFORMATION:

Cartons 1-45: Laptop Computers LT-5000
- HS Code: 8471.30.0100
- Quantity: 500 Units (11-12 units per carton)
- Gross Weight: 1,850 KG
- Net Weight: 1,625 KG
- Carton Dimensions: 60cm x 45cm x 50cm each
- Country of Manufacture: China

Cartons 46-70: Wireless Keyboards KB-200
- HS Code: 8471.60.7000
- Quantity: 750 Units (30 units per carton)
- Gross Weight: 650 KG
- Net Weight: 525 KG
- Carton Dimensions: 55cm x 40cm x 35cm each
- Country of Manufacture: China

Cartons 71-85: Wireless Mice WM-150
- HS Code: 8471.60.1000
- Quantity: 1000 Units (67 units per carton)
- Gross Weight: 350 KG
- Net Weight: 300 KG
- Carton Dimensions: 50cm x 35cm x 30cm each
- Country of Manufacture: China

TOTAL SUMMARY:
Total Cartons: 85
Total Gross Weight: 2,850 KG
Total Net Weight: 2,450 KG
Total Volume: 18.5 CBM

SHIPPING MARKS:
TECHWORLD
LOS ANGELES, CA
MADE IN CHINA
FRAGILE - HANDLE WITH CARE
THIS SIDE UP

Packed by: Zhang Ming
QC Inspector: Wang Hua
Date: January 14, 2025
`;

export const DUMMY_BILL_OF_LADING = `
BILL OF LADING

B/L No: COSU8471920250115
Date: January 16, 2025

SHIPPER:
Shenzhen Tech Electronics Co., Ltd.
Building 5, High-Tech Industrial Park
Nanshan District, Shenzhen, Guangdong 518057, China
Tel: +86-755-8899-6677

CONSIGNEE:
TO ORDER OF: TechWorld Imports LLC
4850 W. Sunset Blvd
Los Angeles, CA 90027, USA

NOTIFY PARTY:
TechWorld Imports LLC
Contact: John Martinez
Tel: +1-310-555-0199
Email: imports@techworldusa.com

VESSEL: COSCO EXCELLENCE V.215
VOYAGE NO: 215W
PORT OF LOADING: Shenzhen, China (Yantian Terminal)
PORT OF DISCHARGE: Los Angeles, CA, USA (LBCT Terminal)
PLACE OF DELIVERY: Los Angeles, CA

CONTAINER & SEAL:
Container No: COSU7654321 (40' HC)
Seal No: SZ8847521
Container Type: 40-foot High Cube Dry Container

DESCRIPTION OF PACKAGES AND GOODS:
85 CARTONS CONTAINING:
- Laptop Computers (500 Units)
- Wireless Keyboards (750 Units)
- Wireless Mice (1000 Units)

HS CODES: 8471.30.0100, 8471.60.7000, 8471.60.1000

FREIGHT PAYABLE AT: Los Angeles
FREIGHT TERMS: PREPAID
SERVICE CONTRACT NO: SC-COSCO-2025-8471

MEASUREMENTS:
Gross Weight: 2,850 KG
Net Weight: 2,450 KG
Measurement: 18.5 CBM

MARKS & NUMBERS:
TECHWORLD/LA/2025
CONTAINER NO: COSU7654321

PARTICULARS FURNISHED BY SHIPPER

LADEN ON BOARD: January 16, 2025
ETD: January 17, 2025
ETA: February 3, 2025

PLACE AND DATE OF ISSUE: Shenzhen, China, January 16, 2025

COSCO SHIPPING LINES CO., LTD.
Authorized Signature: ___________________
Agent: COSCO Shenzhen Branch
`;

export const DUMMY_CERTIFICATE_OF_ORIGIN = `
CERTIFICATE OF ORIGIN

Certificate No: CO-CN-2025-084751
Issue Date: January 15, 2025

ISSUED BY:
China Council for the Promotion of International Trade (CCPIT)
Shenzhen Sub-Council
Address: 1019 Fuhua 3rd Road, Futian District, Shenzhen, China
Tel: +86-755-8888-9999

EXPORTER:
Shenzhen Tech Electronics Co., Ltd.
Building 5, High-Tech Industrial Park
Nanshan District, Shenzhen, Guangdong 518057, China

CONSIGNEE:
TechWorld Imports LLC
4850 W. Sunset Blvd
Los Angeles, CA 90027, USA

COUNTRY OF ORIGIN: PEOPLE'S REPUBLIC OF CHINA
COUNTRY OF DESTINATION: UNITED STATES OF AMERICA

MEANS OF TRANSPORT AND ROUTE:
Ocean Freight
Vessel: COSCO EXCELLENCE V.215
From: Shenzhen, China
To: Los Angeles, California, USA

DESCRIPTION OF GOODS:

1. Laptop Computers - Business Series Model LT-5000
   HS Code: 8471.30.0100
   Quantity: 500 Units
   Origin: China

2. Wireless Mechanical Keyboards Model KB-200
   HS Code: 8471.60.7000
   Quantity: 750 Units
   Origin: China

3. Optical Wireless Computer Mice Model WM-150
   HS Code: 8471.60.1000
   Quantity: 1000 Units
   Origin: China

REMARKS:
These goods are manufactured in China and comply with Chinese export regulations and international standards. All components are sourced and manufactured in the People's Republic of China.

PREFERENTIAL TREATMENT: Not Applicable
This shipment does NOT claim preferential tariff treatment under any trade agreement.

DECLARATION:
We hereby certify that the information contained in this certificate is true and accurate, and that the goods described herein originate in the country shown above.

CERTIFYING AUTHORITY:
China Council for the Promotion of International Trade
Shenzhen Sub-Council

Authorized Signature: ___________________
Name: Chen Xiaoming
Title: Certification Officer
Official Seal: [CCPIT SHENZHEN]
Date: January 15, 2025

Certificate Valid Until: January 15, 2026
`;

export const COMBINED_SHIPMENT_DOCUMENTS = `
${DUMMY_COMMERCIAL_INVOICE}

---

${DUMMY_PACKING_LIST}

---

${DUMMY_BILL_OF_LADING}

---

${DUMMY_CERTIFICATE_OF_ORIGIN}
`;
