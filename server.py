from fastmcp import FastMCP
from typing import List, Optional, Dict, Any
import json
import os
from datetime import datetime
import deepl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("CrossCheck AI - Complete Trade Compliance Validator")

# DeepL Translator
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
if DEEPL_API_KEY:
    translator = deepl.Translator(DEEPL_API_KEY)
else:
    print("⚠️  WARNING: DEEPL_API_KEY not found. Translation tools will return errors.")
    translator = None

# Data file paths
DATA_DIR = "data"
DOCUMENTS_FILE = os.path.join(DATA_DIR, "documents.json")
CERTIFICATES_FILE = os.path.join(DATA_DIR, "certificates.json")
HS_CODE_DB_FILE = os.path.join(DATA_DIR, "hs_code_database.json")
MARKET_PRICES_FILE = os.path.join(DATA_DIR, "market_prices.json")
SUPPLIER_HISTORY_FILE = os.path.join(DATA_DIR, "supplier_history.json")
CBP_RULINGS_FILE = os.path.join(DATA_DIR, "cbp_rulings.json")
REGULATORY_REQ_FILE = os.path.join(DATA_DIR, "regulatory_requirements.json")
VESSEL_SCHEDULES_FILE = os.path.join(DATA_DIR, "vessel_schedules.json")

# Helper functions to load data
def load_json(filename: str) -> dict:
    """Load JSON data from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def fetch_document(doc_id: str) -> dict:
    """Fetch a specific document"""
    documents = load_json(DOCUMENTS_FILE)
    doc = documents.get(doc_id)
    if not doc:
        available = ', '.join(documents.keys())
        raise ValueError(f"Document {doc_id} not found. Available: {available}")
    return doc

def get_shipment_documents(shipment_id: str) -> Dict[str, Any]:
    """Get all documents for a shipment"""
    documents = load_json(DOCUMENTS_FILE)
    shipment_docs = {k: v for k, v in documents.items() if v.get("shipment_id") == shipment_id}
    return shipment_docs

# ============================================================================
# DEEPL TRANSLATION TOOLS (NEW)
# ============================================================================

@mcp.tool()
def translate_document_field(text: str, source_lang: str = "ZH", target_lang: str = "EN-US") -> dict:
    """
    Translate document text from Chinese to English using DeepL.
    
    Critical for validating Chinese documents where descriptions must match
    exactly across docs but are in different languages. Use this before
    comparing product descriptions from Chinese vs English documents.
    
    Args:
        text: Text to translate (e.g., Chinese product description)
        source_lang: Source language code (default: "ZH" for Chinese)
        target_lang: Target language code (default: "EN-US" for US English)
    
    Returns:
        Translated text with confidence information
    
    Example:
        translate_document_field("笔记本电脑", "ZH", "EN-US")
    """
    try:
        if not translator:
            return {
                "success": False,
                "error": "DeepL API key not configured",
                "message": "Set DEEPL_API_KEY environment variable",
                "fallback": "Manual translation required"
            }
        
        result = translator.translate_text(text, source_lang=source_lang, target_lang=target_lang)
        
        return {
            "success": True,
            "original_text": text,
            "translated_text": result.text,
            "source_language": source_lang,
            "target_language": target_lang,
            "detected_source_language": result.detected_source_lang if hasattr(result, 'detected_source_lang') else None
        }
    
    except deepl.DeepLException as e:
        return {
            "success": False,
            "error": f"DeepL API error: {str(e)}",
            "fallback": "Manual translation required"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fallback": "Manual translation required"
        }

@mcp.tool()
def compare_translated_descriptions(
    chinese_description: str, 
    english_description: str
) -> dict:
    """
    Compare Chinese and English product descriptions to verify they match.
    
    Common customs issue: Chinese packing list says one thing, English invoice 
    says another. This tool translates Chinese, then uses fuzzy matching to 
    compare with English version. Critical for catching description mismatches
    that trigger CBP reviews.
    
    Args:
        chinese_description: Description in Chinese (e.g., from Chinese packing list)
        english_description: Description in English (e.g., from English invoice)
    
    Returns:
        Match analysis with translation and similarity score
    
    Example:
        compare_translated_descriptions("便携式电脑", "Portable Computer")
    """
    try:
        if not translator:
            return {
                "success": False,
                "error": "DeepL API key not configured",
                "recommendation": "Manual translation comparison required"
            }
        
        # Translate Chinese to English
        translation_result = translate_document_field(chinese_description, "ZH", "EN-US")
        
        if not translation_result.get("success"):
            return translation_result
        
        translated = translation_result.get("translated_text", "").lower().strip()
        english = english_description.lower().strip()
        
        # Fuzzy matching (exact match is rare after translation)
        # Simple word-based similarity
        translated_words = set(translated.split())
        english_words = set(english.split())
        
        if translated_words and english_words:
            common_words = translated_words.intersection(english_words)
            total_unique_words = translated_words.union(english_words)
            similarity = len(common_words) / len(total_unique_words) if total_unique_words else 0
        else:
            similarity = 0
        
        # Consider >70% similarity as a match (allows for translation variance)
        match = similarity > 0.70
        
        return {
            "success": True,
            "original_chinese": chinese_description,
            "translated_to_english": translated,
            "declared_english": english_description,
            "similarity_score": round(similarity, 2),
            "common_words": list(translated_words.intersection(english_words)) if translated_words and english_words else [],
            "match": match,
            "status": "PASS" if match else "FAIL",
            "risk_level": "LOW" if match else "HIGH",
            "message": "✅ Descriptions match after translation" if match else "🚨 Descriptions don't match - potential translation/description mismatch",
            "customs_impact": "No issue" if match else "May trigger CBP review for description inconsistency",
            "recommendation": "No action needed" if match else "Verify product description is correct and consistent in both languages"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def translate_full_document(doc_id: str, fields_to_translate: List[str]) -> dict:
    """
    Translate multiple fields from a document at once.
    
    Useful for translating Chinese invoices or packing lists where multiple
    fields need translation (description, consignee, supplier notes, etc.)
    
    Args:
        doc_id: Document ID (e.g., "INV-001")
        fields_to_translate: List of field names to translate (e.g., ["description", "notes"])
    
    Returns:
        Document with translated fields
    """
    try:
        if not translator:
            return {
                "success": False,
                "error": "DeepL API key not configured"
            }
        
        doc = fetch_document(doc_id)
        translated_fields = {}
        
        for field in fields_to_translate:
            field_value = doc.get(field)
            if field_value:
                result = translate_document_field(str(field_value), "ZH", "EN-US")
                if result.get("success"):
                    translated_fields[field] = {
                        "original": field_value,
                        "translated": result.get("translated_text")
                    }
                else:
                    translated_fields[field] = {
                        "original": field_value,
                        "translated": None,
                        "error": result.get("error")
                    }
            else:
                translated_fields[field] = {
                    "original": None,
                    "translated": None,
                    "error": f"Field '{field}' not found in document"
                }
        
        return {
            "success": True,
            "document_id": doc_id,
            "translated_fields": translated_fields,
            "fields_count": len(fields_to_translate)
        }
    
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# AGENT 1: HS CODE VALIDATOR TOOLS
# ============================================================================

@mcp.tool()
def lookup_hs_code_database(product_description: str) -> dict:
    """
    Look up appropriate HS codes based on product description.
    
    Searches the HS code database for codes matching the product description.
    Critical for ensuring correct tariff classification and duty rates.
    
    Args:
        product_description: Product description from invoice (e.g., "Laptop Model XPS-15")
    
    Returns:
        Matching HS codes with descriptions and duty rates
    """
    try:
        hs_db = load_json(HS_CODE_DB_FILE)
        product_lower = product_description.lower()
        
        matches = []
        for code, details in hs_db.items():
            # Check if any common name matches
            common_names = details.get("common_names", [])
            if any(name in product_lower for name in common_names):
                matches.append({
                    "hs_code": code,
                    "description": details.get("description"),
                    "common_names": common_names,
                    "duty_rate": details.get("duty_rate"),
                    "notes": details.get("notes"),
                    "subcategories": details.get("subcategories", {})
                })
        
        if not matches:
            return {
                "success": False,
                "message": f"No matching HS codes found for '{product_description}'",
                "suggestion": "Manual classification required - consult customs broker"
            }
        
        return {
            "success": True,
            "product_description": product_description,
            "matches": matches,
            "match_count": len(matches),
            "recommendation": "Review matches and select most specific applicable code"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def search_cbp_rulings(keywords: List[str]) -> dict:
    """
    Search CBP (Customs and Border Protection) rulings database.
    
    Finds relevant past customs rulings to guide HS code classification.
    Useful for ambiguous products or borderline cases.
    
    Args:
        keywords: List of keywords to search (e.g., ["laptop", "detachable keyboard"])
    
    Returns:
        Relevant CBP rulings with guidance
    """
    try:
        cbp_data = load_json(CBP_RULINGS_FILE)
        rulings = cbp_data.get("rulings", [])
        
        keywords_lower = [k.lower() for k in keywords]
        
        matching_rulings = []
        for ruling in rulings:
            ruling_keywords = [k.lower() for k in ruling.get("keywords", [])]
            if any(kw in ruling_keywords for kw in keywords_lower):
                matching_rulings.append(ruling)
        
        if not matching_rulings:
            return {
                "success": True,
                "message": "No specific CBP rulings found for these keywords",
                "rulings": [],
                "recommendation": "Proceed with standard HS code classification"
            }
        
        return {
            "success": True,
            "keywords_searched": keywords,
            "rulings_found": len(matching_rulings),
            "rulings": matching_rulings,
            "recommendation": "Review rulings for guidance on classification"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def compare_hs_codes(invoice_code: str, suggested_code: str) -> dict:
    """
    Compare HS code on invoice with suggested correct code.
    
    Determines if declared HS code matches the appropriate classification
    and assesses risk of misclassification.
    
    Args:
        invoice_code: HS code declared on invoice (e.g., "8471.30.0100")
        suggested_code: Suggested correct HS code (e.g., "8471.41.0150")
    
    Returns:
        Comparison analysis with risk assessment
    """
    try:
        hs_db = load_json(HS_CODE_DB_FILE)
        
        # Get base codes (first 7 digits)
        invoice_base = invoice_code[:7] if len(invoice_code) >= 7 else invoice_code
        suggested_base = suggested_code[:7] if len(suggested_code) >= 7 else suggested_code
        
        invoice_details = hs_db.get(invoice_base, {})
        suggested_details = hs_db.get(suggested_base, {})
        
        match = invoice_code == suggested_code
        base_match = invoice_base == suggested_base
        
        if match:
            return {
                "success": True,
                "match": True,
                "status": "PASS",
                "risk_level": "LOW",
                "message": "✅ HS codes match exactly",
                "invoice_code": invoice_code,
                "suggested_code": suggested_code,
                "recommendation": "No action needed - classification is correct"
            }
        
        elif base_match:
            return {
                "success": True,
                "match": False,
                "base_match": True,
                "status": "WARNING",
                "risk_level": "MEDIUM",
                "message": "⚠️ Same base code but different subcategory",
                "invoice_code": invoice_code,
                "invoice_description": invoice_details.get("description", "Unknown"),
                "suggested_code": suggested_code,
                "suggested_description": suggested_details.get("description", "Unknown"),
                "impact": "May require reclassification but duties likely similar",
                "recommendation": "Verify subcategory selection is correct"
            }
        
        else:
            return {
                "success": True,
                "match": False,
                "base_match": False,
                "status": "FAIL",
                "risk_level": "CRITICAL",
                "message": "🚨 HS Code Mismatch Detected",
                "invoice_code": invoice_code,
                "invoice_description": invoice_details.get("description", "Unknown"),
                "suggested_code": suggested_code,
                "suggested_description": suggested_details.get("description", "Unknown"),
                "impact": "Potential 5-7 day delay for CBP reclassification. Possible duty adjustment.",
                "recommendation": "Contact customs broker immediately to resolve classification"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "status": "FAIL"
        }

# ============================================================================
# AGENT 2: DOCUMENT CONSISTENCY CHECKER TOOLS
# ============================================================================

@mcp.tool()
def compare_fields(doc1: str, doc2: str, field_name: str) -> dict:
    """
    Cross-validates a specific field value between two trade documents.
    
    Use this when you need to verify that the same field contains matching data 
    across Invoice, Packing List, or Bill of Lading documents.
    
    Args:
        doc1: Document ID (e.g., "INV-001")
        doc2: Document ID to compare against (e.g., "PL-001")
        field_name: Field to compare (e.g., "quantity", "description")
    
    Returns:
        Match status, both values, and discrepancy details
    """
    try:
        doc1_data = fetch_document(doc1)
        doc2_data = fetch_document(doc2)
        
        doc1_value = doc1_data.get(field_name)
        doc2_value = doc2_data.get(field_name)
        
        if doc1_value is None or doc2_value is None:
            return {
                "success": False,
                "error": f"Field '{field_name}' not found in one or both documents",
                "doc1_value": str(doc1_value) if doc1_value else "MISSING",
                "doc2_value": str(doc2_value) if doc2_value else "MISSING",
                "match": False
            }
        
        # Normalize strings for comparison
        match = str(doc1_value).strip().lower() == str(doc2_value).strip().lower()
        
        result = {
            "success": True,
            "field_name": field_name,
            "doc1_id": doc1,
            "doc1_type": doc1_data.get("type"),
            "doc1_value": str(doc1_value),
            "doc2_id": doc2,
            "doc2_type": doc2_data.get("type"),
            "doc2_value": str(doc2_value),
            "match": match
        }
        
        if not match:
            result["status"] = "FAIL"
            result["risk_level"] = "HIGH"
            result["customs_risk"] = "Will trigger manual CBP review"
            result["discrepancy_details"] = f"Mismatch: '{doc1_value}' vs '{doc2_value}'"
            result["recommended_action"] = f"Standardize {field_name} to match exactly across all documents"
        else:
            result["status"] = "PASS"
            result["risk_level"] = "LOW"
            result["customs_risk"] = "None"
        
        return result
    
    except ValueError as e:
        return {"success": False, "error": str(e), "match": False}

@mcp.tool()
def calculate_quantity_variance(
    invoice_id: str, 
    packing_list_id: str, 
    acceptable_variance_percent: float = 0.0
) -> dict:
    """
    Calculates quantity discrepancies between invoice and packing list.
    
    Args:
        invoice_id: Invoice document ID
        packing_list_id: Packing list document ID
        acceptable_variance_percent: Max acceptable variance % (default: 0)
    
    Returns:
        Variance analysis with risk assessment
    """
    try:
        invoice = fetch_document(invoice_id)
        packing_list = fetch_document(packing_list_id)
        
        if invoice.get("type") != "invoice":
            return {"success": False, "error": f"{invoice_id} is not an invoice"}
        if packing_list.get("type") != "packing_list":
            return {"success": False, "error": f"{packing_list_id} is not a packing list"}
        
        invoice_qty = float(invoice.get('quantity', 0))
        packing_qty = float(packing_list.get('quantity', 0))
        
        if invoice_qty == 0:
            return {"success": False, "error": "Invoice quantity is zero", "status": "FAIL"}
        
        variance = packing_qty - invoice_qty
        variance_percent = abs((variance / invoice_qty) * 100)
        exceeds_threshold = variance_percent > acceptable_variance_percent
        
        if variance_percent == 0:
            status = "PASS"
            risk_level = "LOW"
            message = "✅ Quantities match exactly"
        elif exceeds_threshold:
            status = "FAIL"
            risk_level = "CRITICAL"
            message = f"🚨 CRITICAL: {abs(int(variance))} unit variance ({variance_percent:.2f}%)"
        else:
            status = "WARNING"
            risk_level = "MEDIUM"
            message = f"⚠️ WARNING: {abs(int(variance))} unit variance ({variance_percent:.2f}%)"
        
        estimated_value_per_unit = invoice.get('unit_price', 50.00)
        financial_impact = abs(variance) * estimated_value_per_unit
        
        return {
            "success": True,
            "status": status,
            "risk_level": risk_level,
            "message": message,
            "invoice_quantity": int(invoice_qty),
            "packing_list_quantity": int(packing_qty),
            "variance": int(variance),
            "variance_percent": round(variance_percent, 2),
            "exceeds_threshold": exceeds_threshold,
            "financial_impact_usd": round(financial_impact, 2),
            "customs_impact": "Will trigger inspection - 5-7 day delay" if exceeds_threshold else "Should clear normally"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e), "status": "FAIL"}

@mcp.tool()
def check_value_consistency(
    document_ids: List[str],
    value_field: str = "total_value",
    tolerance: float = 0.01
) -> dict:
    """
    Verifies monetary values match across multiple trade documents.
    
    Args:
        document_ids: List of 2-10 document IDs
        value_field: Field containing monetary value (default: "total_value")
        tolerance: Acceptable rounding difference (default: $0.01)
    
    Returns:
        Consistency analysis with discrepancies
    """
    try:
        if len(document_ids) < 2:
            return {"success": False, "error": "At least 2 documents required"}
        
        values = []
        currencies = set()
        
        for doc_id in document_ids:
            doc = fetch_document(doc_id)
            value = doc.get(value_field)
            currency = doc.get("currency", "USD")
            
            if value is None:
                return {"success": False, "error": f"Field '{value_field}' not found in {doc_id}"}
            
            values.append({
                "document_id": doc_id,
                "document_type": doc.get("type"),
                "value": float(value),
                "currency": currency
            })
            currencies.add(currency)
        
        currency_consistent = len(currencies) == 1
        reference_value = values[0]["value"]
        discrepancies = []
        
        for item in values[1:]:
            difference = abs(item["value"] - reference_value)
            if difference > tolerance:
                discrepancies.append({
                    "document_id": item["document_id"],
                    "expected_value": reference_value,
                    "actual_value": item["value"],
                    "difference": round(difference, 2)
                })
        
        consistent = len(discrepancies) == 0
        
        if not currency_consistent:
            status = "FAIL"
            risk_level = "CRITICAL"
            recommendation = "🚨 Currency mismatch - all documents must use same currency"
        elif not consistent:
            status = "FAIL"
            risk_level = "HIGH"
            recommendation = "🚨 Value discrepancies will trigger CBP audit"
        else:
            status = "PASS"
            risk_level = "LOW"
            recommendation = "✅ All values consistent"
        
        return {
            "success": True,
            "status": status,
            "risk_level": risk_level,
            "values": values,
            "consistent": consistent,
            "currency_consistent": currency_consistent,
            "discrepancies": discrepancies,
            "recommendation": recommendation
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# AGENT 3: REGULATORY COMPLIANCE VALIDATOR TOOLS
# ============================================================================

@mcp.tool()
def check_fcc_requirement(product_description: str, hs_code: str) -> dict:
    """
    Check if product requires FCC certification.
    
    Determines if wireless/RF products need FCC Part 15 certification
    based on product type and HS code.
    
    Args:
        product_description: Product description (e.g., "Bluetooth Headphones")
        hs_code: HS classification code
    
    Returns:
        FCC requirement status and details
    """
    try:
        reg_req = load_json(REGULATORY_REQ_FILE)
        fcc_rules = reg_req.get("FCC", {})
        
        product_lower = product_description.lower()
        hs_base = hs_code[:7] if len(hs_code) >= 7 else hs_code
        
        requires_fcc = False
        reason = None
        
        for rule in fcc_rules.get("applies_to", []):
            keywords = rule.get("product_keywords", [])
            applicable_codes = rule.get("hs_codes", [])
            
            keyword_match = any(kw in product_lower for kw in keywords)
            code_match = any(code in hs_base for code in applicable_codes)
            
            if keyword_match or code_match:
                requires_fcc = True
                reason = rule.get("requirement")
                break
        
        return {
            "success": True,
            "product_description": product_description,
            "hs_code": hs_code,
            "requires_fcc": requires_fcc,
            "requirement": reason if requires_fcc else "No FCC certification required",
            "status": "REQUIRED" if requires_fcc else "NOT REQUIRED",
            "risk_level": "HIGH" if requires_fcc else "NONE",
            "recommendation": "Verify FCC certification is present" if requires_fcc else "No action needed"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def verify_certificate_validity(shipment_id: str, cert_type: str = "fcc") -> dict:
    """
    Verify if required certificate exists and is valid for shipment.
    
    Args:
        shipment_id: Shipment ID (e.g., "SHIP-2025-001")
        cert_type: Type of certificate (default: "fcc", options: "fcc", "origin", "ul")
    
    Returns:
        Certificate validation status
    """
    try:
        certificates = load_json(CERTIFICATES_FILE)
        
        cert_type_map = {
            "fcc": "fcc_certification",
            "origin": "certificate_of_origin",
            "ul": "ul_certification"
        }
        
        target_type = cert_type_map.get(cert_type.lower(), cert_type)
        
        # Find certificate for this shipment
        found_cert = None
        for cert_id, cert in certificates.items():
            if (cert.get("shipment_id") == shipment_id and 
                cert.get("type") == target_type):
                found_cert = cert
                found_cert["cert_id"] = cert_id
                break
        
        if not found_cert:
            return {
                "success": True,
                "found": False,
                "status": "NOT FOUND",
                "risk_level": "CRITICAL",
                "message": f"⚠️ Missing {cert_type.upper()} Certification",
                "impact": "Shipment will be held until certification provided",
                "recommendation": f"Obtain {cert_type.upper()} certification or provide proof of exemption"
            }
        
        # Check validity
        is_valid = found_cert.get("valid", False)
        
        if is_valid:
            return {
                "success": True,
                "found": True,
                "valid": True,
                "status": "VALID",
                "risk_level": "LOW",
                "certificate": found_cert,
                "message": f"✅ {cert_type.upper()} certification present and valid",
                "recommendation": "No action needed"
            }
        else:
            return {
                "success": True,
                "found": True,
                "valid": False,
                "status": "INVALID",
                "risk_level": "CRITICAL",
                "certificate": found_cert,
                "message": f"🚨 {cert_type.upper()} certification expired or invalid",
                "recommendation": "Renew certification before shipping"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def lookup_import_restrictions(product_description: str, origin_country: str) -> dict:
    """
    Check for import restrictions based on product and origin country.
    
    Args:
        product_description: Product description
        origin_country: Country of origin
    
    Returns:
        Import restriction analysis
    """
    try:
        reg_req = load_json(REGULATORY_REQ_FILE)
        restrictions = reg_req.get("Import_Restrictions", {}).get("restricted_items", [])
        
        product_lower = product_description.lower()
        
        for restriction in restrictions:
            keywords = restriction.get("keywords", [])
            if any(kw in product_lower for kw in keywords):
                return {
                    "success": True,
                    "restricted": True,
                    "status": "PROHIBITED",
                    "risk_level": "CRITICAL",
                    "restriction_type": restriction.get("restriction"),
                    "penalty": restriction.get("penalty"),
                    "message": "🚨 PROHIBITED ITEM DETECTED",
                    "recommendation": "DO NOT SHIP - Item is prohibited for import"
                }
        
        return {
            "success": True,
            "restricted": False,
            "status": "ALLOWED",
            "risk_level": "LOW",
            "message": "✅ No import restrictions found",
            "recommendation": "Proceed with shipment"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# AGENT 4: ORIGIN VALIDATOR TOOLS
# ============================================================================

@mcp.tool()
def check_origin_consistency(shipment_id: str) -> dict:
    """
    Verify country of origin is consistent across all documents.
    
    Args:
        shipment_id: Shipment ID (e.g., "SHIP-2025-001")
    
    Returns:
        Origin consistency analysis
    """
    try:
        shipment_docs = get_shipment_documents(shipment_id)
        
        if not shipment_docs:
            return {"success": False, "error": f"No documents found for {shipment_id}"}
        
        origins = {}
        for doc_id, doc in shipment_docs.items():
            origin = doc.get("origin_country")
            if origin:
                origins[doc_id] = {
                    "doc_type": doc.get("type"),
                    "origin": origin
                }
        
        if not origins:
            return {
                "success": False,
                "error": "No origin information found in documents"
            }
        
        unique_origins = set(o["origin"] for o in origins.values())
        consistent = len(unique_origins) == 1
        
        if consistent:
            return {
                "success": True,
                "consistent": True,
                "status": "PASS",
                "risk_level": "LOW",
                "origin_country": list(unique_origins)[0],
                "documents_checked": len(origins),
                "message": "✅ Origin consistent across all documents",
                "recommendation": "No action needed"
            }
        else:
            return {
                "success": True,
                "consistent": False,
                "status": "FAIL",
                "risk_level": "CRITICAL",
                "conflicting_origins": list(unique_origins),
                "document_origins": origins,
                "message": "🚨 Origin country mismatch detected",
                "impact": "Will trigger CBP investigation for potential transshipment",
                "recommendation": "Verify correct origin and update all documents"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def verify_supplier_location(supplier_name: str, declared_origin: str) -> dict:
    """
    Verify supplier location matches declared origin country.
    
    Args:
        supplier_name: Supplier company name
        declared_origin: Declared country of origin
    
    Returns:
        Supplier location verification
    """
    try:
        supplier_history = load_json(SUPPLIER_HISTORY_FILE)
        supplier_data = supplier_history.get(supplier_name)
        
        if not supplier_data:
            return {
                "success": True,
                "found": False,
                "status": "UNKNOWN",
                "risk_level": "MEDIUM",
                "message": f"⚠️ Supplier '{supplier_name}' not in database",
                "recommendation": "New supplier - verify location independently"
            }
        
        supplier_country = supplier_data.get("country")
        supplier_city = supplier_data.get("city")
        
        match = supplier_country.lower() == declared_origin.lower()
        
        if match:
            return {
                "success": True,
                "found": True,
                "match": True,
                "status": "VERIFIED",
                "risk_level": "LOW",
                "supplier_name": supplier_name,
                "supplier_country": supplier_country,
                "supplier_city": supplier_city,
                "declared_origin": declared_origin,
                "message": "✅ Supplier location matches declared origin",
                "recommendation": "No action needed"
            }
        else:
            return {
                "success": True,
                "found": True,
                "match": False,
                "status": "MISMATCH",
                "risk_level": "CRITICAL",
                "supplier_name": supplier_name,
                "supplier_country": supplier_country,
                "declared_origin": declared_origin,
                "message": "🚨 Supplier location does NOT match declared origin",
                "impact": "Potential fraud or transshipment - will trigger investigation",
                "recommendation": "Investigate discrepancy immediately"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def validate_certificate_of_origin(shipment_id: str) -> dict:
    """
    Validate Certificate of Origin exists and matches other documents.
    
    Args:
        shipment_id: Shipment ID
    
    Returns:
        Certificate of Origin validation
    """
    return verify_certificate_validity(shipment_id, "origin")

# ============================================================================
# AGENT 5: VALUE VALIDATOR TOOLS
# ============================================================================

@mcp.tool()
def lookup_market_price(product_name: str) -> dict:
    """
    Look up typical market price range for a product.
    
    Args:
        product_name: Product name/description
    
    Returns:
        Market price information
    """
    try:
        market_prices = load_json(MARKET_PRICES_FILE)
        
        # Try exact match first
        price_data = market_prices.get(product_name)
        
        # If no exact match, try partial match
        if not price_data:
            product_lower = product_name.lower()
            for prod_name, data in market_prices.items():
                if prod_name.lower() in product_lower or product_lower in prod_name.lower():
                    price_data = data
                    break
        
        if not price_data:
            return {
                "success": False,
                "found": False,
                "message": f"No market price data found for '{product_name}'",
                "recommendation": "Manual price verification required"
            }
        
        return {
            "success": True,
            "found": True,
            "product_name": product_name,
            "category": price_data.get("category"),
            "price_range": price_data.get("typical_price_range"),
            "currency": price_data.get("currency"),
            "last_updated": price_data.get("last_updated")
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def calculate_per_unit_price(invoice_id: str) -> dict:
    """
    Calculate unit price from invoice.
    
    Args:
        invoice_id: Invoice document ID
    
    Returns:
        Unit price calculation
    """
    try:
        invoice = fetch_document(invoice_id)
        
        if invoice.get("type") != "invoice":
            return {"success": False, "error": f"{invoice_id} is not an invoice"}
        
        quantity = float(invoice.get("quantity", 0))
        total_value = float(invoice.get("total_value", 0))
        declared_unit_price = invoice.get("unit_price")
        
        if quantity == 0:
            return {"success": False, "error": "Quantity is zero"}
        
        calculated_unit_price = total_value / quantity
        
        result = {
            "success": True,
            "invoice_id": invoice_id,
            "quantity": int(quantity),
            "total_value": total_value,
            "calculated_unit_price": round(calculated_unit_price, 2),
            "currency": invoice.get("currency", "USD")
        }
        
        if declared_unit_price:
            declared_unit_price = float(declared_unit_price)
            result["declared_unit_price"] = declared_unit_price
            
            difference = abs(calculated_unit_price - declared_unit_price)
            if difference > 0.01:
                result["calculation_error"] = True
                result["difference"] = round(difference, 2)
                result["status"] = "ERROR"
                result["message"] = "⚠️ Declared unit price doesn't match calculation"
            else:
                result["calculation_error"] = False
                result["status"] = "CORRECT"
        
        return result
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def check_historical_pricing(supplier_name: str, product_description: str, current_unit_price: float) -> dict:
    """
    Compare current pricing to historical pricing from this supplier.
    
    Args:
        supplier_name: Supplier company name
        product_description: Product description
        current_unit_price: Current declared unit price
    
    Returns:
        Historical price comparison and anomaly detection
    """
    try:
        market_result = lookup_market_price(product_description)
        
        if not market_result.get("found"):
            return {
                "success": True,
                "historical_data_available": False,
                "message": "No historical pricing data available",
                "recommendation": "Manual review recommended for new product/supplier combination"
            }
        
        price_range = market_result.get("price_range", {})
        min_price = price_range.get("min", 0)
        max_price = price_range.get("max", 0)
        avg_price = price_range.get("average", 0)
        
        if current_unit_price < min_price:
            variance_percent = ((min_price - current_unit_price) / min_price) * 100
            return {
                "success": True,
                "status": "ANOMALY",
                "risk_level": "HIGH",
                "current_price": current_unit_price,
                "market_range": {"min": min_price, "max": max_price, "average": avg_price},
                "variance_percent": round(variance_percent, 1),
                "message": f"⚠️ Price {variance_percent:.0f}% below market minimum",
                "concern": "High probability of CBP value challenge - potential undervaluation",
                "recommendation": "Provide commercial documentation justifying price (volume discount, defects, etc.)"
            }
        
        elif current_unit_price > max_price:
            variance_percent = ((current_unit_price - max_price) / max_price) * 100
            return {
                "success": True,
                "status": "HIGH",
                "risk_level": "MEDIUM",
                "current_price": current_unit_price,
                "market_range": {"min": min_price, "max": max_price, "average": avg_price},
                "variance_percent": round(variance_percent, 1),
                "message": f"Price {variance_percent:.0f}% above market maximum",
                "concern": "Unusual but not necessarily problematic - premium product or small quantity",
                "recommendation": "Verify pricing is correct"
            }
        
        else:
            return {
                "success": True,
                "status": "NORMAL",
                "risk_level": "LOW",
                "current_price": current_unit_price,
                "market_range": {"min": min_price, "max": max_price, "average": avg_price},
                "message": "✅ Price within normal market range",
                "recommendation": "No action needed"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# AGENT 6: ROUTE VALIDATOR TOOLS
# ============================================================================

@mcp.tool()
def validate_shipping_route(bol_id: str) -> dict:
    """
    Validate shipping route makes logistical sense.
    
    Args:
        bol_id: Bill of Lading document ID
    
    Returns:
        Route validation analysis
    """
    try:
        bol = fetch_document(bol_id)
        
        if bol.get("type") != "bill_of_lading":
            return {"success": False, "error": f"{bol_id} is not a bill of lading"}
        
        vessel_name = bol.get("vessel")
        origin_port = bol.get("origin_port")
        dest_port = bol.get("destination_port")
        routing = bol.get("routing", [])
        
        vessel_schedules = load_json(VESSEL_SCHEDULES_FILE)
        vessel_data = vessel_schedules.get(vessel_name)
        
        if not vessel_data:
            return {
                "success": True,
                "vessel_found": False,
                "status": "UNKNOWN",
                "risk_level": "MEDIUM",
                "message": f"⚠️ Vessel '{vessel_name}' not in database",
                "recommendation": "Verify vessel is legitimate"
            }
        
        typical_routes = vessel_data.get("regular_routes", [])
        route_match = False
        direct_available = False
        
        for typical_route in typical_routes:
            if (origin_port in typical_route.get("origin", "") and 
                dest_port in typical_route.get("destination", "")):
                route_match = True
                if typical_route.get("direct"):
                    direct_available = True
        
        is_direct = len(routing) == 2
        
        if route_match and is_direct:
            return {
                "success": True,
                "status": "VALID",
                "risk_level": "LOW",
                "vessel": vessel_name,
                "route": routing,
                "direct": True,
                "message": "✅ Direct route on regular vessel schedule",
                "recommendation": "No action needed"
            }
        
        elif route_match and not is_direct and direct_available:
            return {
                "success": True,
                "status": "SUSPICIOUS",
                "risk_level": "HIGH",
                "vessel": vessel_name,
                "route": routing,
                "direct": False,
                "transshipment_points": routing[1:-1],
                "message": "⚠️ Unnecessary transshipment detected",
                "concern": "Potential tariff circumvention (goods routed through third country)",
                "impact": "May trigger CBP investigation",
                "recommendation": "Provide explanation for routing or consider direct shipment"
            }
        
        else:
            return {
                "success": True,
                "status": "UNUSUAL",
                "risk_level": "MEDIUM",
                "vessel": vessel_name,
                "route": routing,
                "message": "⚠️ Unusual routing pattern",
                "recommendation": "Verify routing is legitimate and cost-effective"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def check_port_consistency(shipment_id: str) -> dict:
    """
    Verify port information is consistent across documents.
    
    Args:
        shipment_id: Shipment ID
    
    Returns:
        Port consistency analysis
    """
    try:
        shipment_docs = get_shipment_documents(shipment_id)
        
        if not shipment_docs:
            return {"success": False, "error": f"No documents found for {shipment_id}"}
        
        supplier_city = None
        for doc in shipment_docs.values():
            if doc.get("type") == "invoice":
                supplier_addr = doc.get("supplier_address", "")
                if "," in supplier_addr:
                    supplier_city = supplier_addr.split(",")[0].strip()
        
        origin_port = None
        for doc in shipment_docs.values():
            if doc.get("type") == "bill_of_lading":
                origin_port = doc.get("origin_port")
        
        if not supplier_city or not origin_port:
            return {
                "success": False,
                "error": "Missing supplier location or origin port information"
            }
        
        port_city_pairs = {
            "Shenzhen": ["Shenzhen", "Hong Kong", "Guangzhou"],
            "Beijing": ["Beijing", "Tianjin"],
            "Guangzhou": ["Guangzhou", "Shenzhen", "Hong Kong"],
            "Shanghai": ["Shanghai"]
        }
        
        expected_ports = port_city_pairs.get(supplier_city, [supplier_city])
        port_matches = origin_port in expected_ports
        
        if port_matches:
            return {
                "success": True,
                "consistent": True,
                "status": "VALID",
                "risk_level": "LOW",
                "supplier_city": supplier_city,
                "origin_port": origin_port,
                "message": "✅ Origin port matches supplier location",
                "recommendation": "No action needed"
            }
        else:
            return {
                "success": True,
                "consistent": False,
                "status": "INCONSISTENT",
                "risk_level": "MEDIUM",
                "supplier_city": supplier_city,
                "origin_port": origin_port,
                "expected_ports": expected_ports,
                "message": "⚠️ Origin port doesn't match supplier location",
                "concern": "May indicate consolidation or transshipment",
                "recommendation": "Verify logistics arrangement"
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def verify_vessel_schedule(vessel_name: str, departure_date: str) -> dict:
    """
    Verify vessel schedule and estimated transit time.
    
    Args:
        vessel_name: Vessel name
        departure_date: Departure date (YYYY-MM-DD)
    
    Returns:
        Vessel schedule verification
    """
    try:
        vessel_schedules = load_json(VESSEL_SCHEDULES_FILE)
        vessel_data = vessel_schedules.get(vessel_name)
        
        if not vessel_data:
            return {
                "success": True,
                "found": False,
                "status": "UNKNOWN",
                "message": f"Vessel '{vessel_name}' not in schedule database",
                "recommendation": "Verify vessel legitimacy"
            }
        
        return {
            "success": True,
            "found": True,
            "vessel_name": vessel_name,
            "carrier": vessel_data.get("carrier"),
            "vessel_type": vessel_data.get("type"),
            "regular_routes": vessel_data.get("regular_routes"),
            "message": "✅ Vessel found in schedule database",
            "recommendation": "Cross-check with carrier's published schedule"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# AGENT 7: SUPPLIER HISTORY ANALYZER TOOLS
# ============================================================================

@mcp.tool()
def query_past_shipments(supplier_name: str) -> dict:
    """
    Query past shipment history for a supplier.
    
    Args:
        supplier_name: Supplier company name
    
    Returns:
        Supplier shipment history
    """
    try:
        supplier_history = load_json(SUPPLIER_HISTORY_FILE)
        supplier_data = supplier_history.get(supplier_name)
        
        if not supplier_data:
            return {
                "success": True,
                "found": False,
                "status": "NEW_SUPPLIER",
                "risk_level": "MEDIUM",
                "message": f"No historical data for supplier '{supplier_name}'",
                "recommendation": "New supplier - apply extra scrutiny to first shipments"
            }
        
        return {
            "success": True,
            "found": True,
            "supplier_name": supplier_name,
            "supplier_id": supplier_data.get("supplier_id"),
            "location": f"{supplier_data.get('city')}, {supplier_data.get('country')}",
            "total_shipments": supplier_data.get("total_shipments"),
            "date_range": supplier_data.get("date_range"),
            "customs_holds": supplier_data.get("customs_holds"),
            "hold_rate": supplier_data.get("hold_rate"),
            "risk_level": supplier_data.get("risk_level"),
            "notes": supplier_data.get("notes")
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def calculate_hold_rate(supplier_name: str) -> dict:
    """
    Calculate customs hold rate for supplier.
    
    Args:
        supplier_name: Supplier company name
    
    Returns:
        Hold rate calculation
    """
    try:
        supplier_data_result = query_past_shipments(supplier_name)
        
        if not supplier_data_result.get("found"):
            return supplier_data_result
        
        total = supplier_data_result.get("total_shipments", 0)
        holds = supplier_data_result.get("customs_holds", 0)
        hold_rate = supplier_data_result.get("hold_rate", 0)
        
        industry_avg = 0.125
        
        if hold_rate > industry_avg * 2:
            assessment = "POOR - Significantly above industry average"
            risk = "HIGH"
        elif hold_rate > industry_avg:
            assessment = "BELOW AVERAGE - Above industry average"
            risk = "MEDIUM"
        else:
            assessment = "GOOD - At or below industry average"
            risk = "LOW"
        
        return {
            "success": True,
            "supplier_name": supplier_name,
            "total_shipments": total,
            "customs_holds": holds,
            "hold_rate_percent": round(hold_rate * 100, 1),
            "industry_average_percent": round(industry_avg * 100, 1),
            "assessment": assessment,
            "risk_level": risk
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def identify_common_issues(supplier_name: str) -> dict:
    """
    Identify common compliance issues for a supplier.
    
    Args:
        supplier_name: Supplier company name
    
    Returns:
        Common issues analysis
    """
    try:
        supplier_history = load_json(SUPPLIER_HISTORY_FILE)
        supplier_data = supplier_history.get(supplier_name)
        
        if not supplier_data:
            return {
                "success": True,
                "found": False,
                "message": f"No historical data for supplier '{supplier_name}'"
            }
        
        common_issues = supplier_data.get("common_issues", [])
        
        if not common_issues:
            return {
                "success": True,
                "supplier_name": supplier_name,
                "issues_found": False,
                "message": "✅ No recurring issues identified",
                "recommendation": "Continue standard monitoring"
            }
        
        sorted_issues = sorted(common_issues, key=lambda x: x.get("occurrences", 0), reverse=True)
        
        return {
            "success": True,
            "supplier_name": supplier_name,
            "issues_found": True,
            "issue_count": len(sorted_issues),
            "common_issues": sorted_issues,
            "top_issue": sorted_issues[0],
            "recommendation": f"Watch for: {sorted_issues[0].get('issue')}"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# AGENT 8: RISK SCORER & PRIORITIZER TOOLS
# ============================================================================

@mcp.tool()
def calculate_delay_probability(issues: List[Dict[str, Any]]) -> dict:
    """
    Calculate probability of customs delay based on issues found.
    
    Args:
        issues: List of issues with risk levels
    
    Returns:
        Delay probability calculation
    """
    try:
        if not issues:
            return {
                "success": True,
                "delay_probability_percent": 5,
                "risk_level": "LOW",
                "message": "✅ No issues detected - low delay risk"
            }
        
        risk_weights = {
            "CRITICAL": 40,
            "HIGH": 25,
            "MEDIUM": 10,
            "LOW": 5
        }
        
        total_risk_score = 0
        for issue in issues:
            risk_level = issue.get("risk_level", "LOW")
            total_risk_score += risk_weights.get(risk_level, 5)
        
        delay_probability = min(total_risk_score, 95)
        
        if delay_probability >= 70:
            risk_level = "CRITICAL"
            message = "🚨 Very high probability of customs hold"
        elif delay_probability >= 40:
            risk_level = "HIGH"
            message = "⚠️ High probability of customs delay"
        elif delay_probability >= 20:
            risk_level = "MEDIUM"
            message = "⚠️ Moderate delay risk"
        else:
            risk_level = "LOW"
            message = "✅ Low delay risk"
        
        return {
            "success": True,
            "delay_probability_percent": delay_probability,
            "risk_level": risk_level,
            "issues_analyzed": len(issues),
            "message": message
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def estimate_delay_cost(delay_probability_percent: float, shipment_value: float, delay_days: int = 7) -> dict:
    """
    Estimate financial cost of potential customs delay.
    
    Args:
        delay_probability_percent: Probability of delay (0-100)
        shipment_value: Total shipment value in USD
        delay_days: Expected delay duration (default: 7)
    
    Returns:
        Cost estimation
    """
    try:
        daily_holding_fee = 75
        opportunity_cost_rate = 0.001
        fixed_admin_cost = 500
        
        holding_cost = daily_holding_fee * delay_days
        opportunity_cost = shipment_value * opportunity_cost_rate * delay_days
        total_cost = holding_cost + opportunity_cost + fixed_admin_cost
        
        expected_cost = total_cost * (delay_probability_percent / 100)
        
        return {
            "success": True,
            "delay_probability_percent": delay_probability_percent,
            "delay_days": delay_days,
            "shipment_value": shipment_value,
            "cost_breakdown": {
                "holding_fees": round(holding_cost, 2),
                "opportunity_cost": round(opportunity_cost, 2),
                "admin_costs": fixed_admin_cost,
                "total_if_delayed": round(total_cost, 2)
            },
            "expected_cost": round(expected_cost, 2),
            "cost_range": {
                "min": round(expected_cost * 0.7, 2),
                "max": round(expected_cost * 1.5, 2)
            }
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def prioritize_issues(findings: List[Dict[str, Any]]) -> dict:
    """
    Prioritize issues by severity and create action plan.
    
    Args:
        findings: List of findings from all agents with risk levels
    
    Returns:
        Prioritized action plan
    """
    try:
        if not findings:
            return {
                "success": True,
                "issues_found": False,
                "message": "✅ No issues to prioritize",
                "recommendation": "Proceed with shipment"
            }
        
        priority_scores = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1
        }
        
        for finding in findings:
            risk_level = finding.get("risk_level", "LOW")
            finding["priority_score"] = priority_scores.get(risk_level, 1)
            
            if risk_level == "CRITICAL":
                finding["action_timeline"] = "IMMEDIATE - Fix before shipping"
            elif risk_level == "HIGH":
                finding["action_timeline"] = "URGENT - Fix within 24 hours"
            elif risk_level == "MEDIUM":
                finding["action_timeline"] = "SOON - Review before shipping"
            else:
                finding["action_timeline"] = "OPTIONAL - Monitor"
        
        sorted_findings = sorted(findings, key=lambda x: x["priority_score"], reverse=True)
        
        critical = [f for f in sorted_findings if f.get("risk_level") == "CRITICAL"]
        high = [f for f in sorted_findings if f.get("risk_level") == "HIGH"]
        medium = [f for f in sorted_findings if f.get("risk_level") == "MEDIUM"]
        low = [f for f in sorted_findings if f.get("risk_level") == "LOW"]
        
        return {
            "success": True,
            "total_issues": len(findings),
            "critical_issues": len(critical),
            "high_issues": len(high),
            "medium_issues": len(medium),
            "low_issues": len(low),
            "prioritized_findings": sorted_findings,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "overall_assessment": "BLOCK SHIPMENT" if critical else "REVIEW RECOMMENDED" if high else "PROCEED WITH CAUTION" if medium else "CLEAR TO SHIP"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@mcp.tool()
def generate_action_plan(shipment_id: str, prioritized_findings: List[Dict[str, Any]]) -> dict:
    """
    Generate comprehensive action plan based on all findings.
    
    Args:
        shipment_id: Shipment ID
        prioritized_findings: Prioritized list of findings
    
    Returns:
        Detailed action plan
    """
    try:
        if not prioritized_findings:
            return {
                "success": True,
                "shipment_id": shipment_id,
                "action_required": False,
                "overall_status": "CLEARED",
                "message": "✅ No issues found - shipment cleared for export",
                "next_steps": ["Proceed with shipping", "Monitor customs clearance"]
            }
        
        critical = [f for f in prioritized_findings if f.get("risk_level") == "CRITICAL"]
        high = [f for f in prioritized_findings if f.get("risk_level") == "HIGH"]
        
        immediate_actions = []
        urgent_actions = []
        recommended_actions = []
        
        for finding in prioritized_findings:
            action = {
                "issue": finding.get("message", "Unknown issue"),
                "agent": finding.get("agent", "Unknown"),
                "action": finding.get("recommended_action", finding.get("recommendation", "Review required"))
            }
            
            if finding.get("risk_level") == "CRITICAL":
                immediate_actions.append(action)
            elif finding.get("risk_level") == "HIGH":
                urgent_actions.append(action)
            else:
                recommended_actions.append(action)
        
        if critical:
            overall_status = "BLOCKED"
            decision = "DO NOT SHIP - Critical issues must be resolved"
        elif high:
            overall_status = "REVIEW REQUIRED"
            decision = "HOLD - Review recommended before shipping"
        else:
            overall_status = "CLEARED WITH CONDITIONS"
            decision = "PROCEED - Address minor issues as time permits"
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "overall_status": overall_status,
            "decision": decision,
            "total_issues": len(prioritized_findings),
            "immediate_actions": immediate_actions,
            "urgent_actions": urgent_actions,
            "recommended_actions": recommended_actions,
            "action_counts": {
                "immediate": len(immediate_actions),
                "urgent": len(urgent_actions),
                "recommended": len(recommended_actions)
            }
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Run the MCP server
    print("=" * 70)
    print("🚀 CrossCheck AI - MCP Server Starting")
    print("=" * 70)
    print(f"DeepL Translation: {'✅ Enabled' if translator else '⚠️  Disabled (no API key)'}")
    print(f"Total Tools Available: 38")
    print(f"  - DeepL Translation Tools: 3")
    print(f"  - Agent 1 (HS Code): 3")
    print(f"  - Agent 2 (Document Consistency): 3")
    print(f"  - Agent 3 (Regulatory): 3")
    print(f"  - Agent 4 (Origin): 3")
    print(f"  - Agent 5 (Value): 3")
    print(f"  - Agent 6 (Route): 3")
    print(f"  - Agent 7 (Supplier History): 3")
    print(f"  - Agent 8 (Risk Scorer): 4")
    print("=" * 70)
    mcp.run()
