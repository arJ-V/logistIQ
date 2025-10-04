from fastmcp import FastMCP
from typing import List, Optional, Dict, Any
import json
import os
import deepl
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP("CrossCheck AI - Trade Compliance Tools")

# Airia client for testing
try:
    from airia import AiriaClient
    AIRIA_API_KEY = os.getenv("AIRIA_API_KEY")
    airia_client = AiriaClient(api_key=AIRIA_API_KEY) if AIRIA_API_KEY else None
except ImportError:
    airia_client = None
    print("Airia SDK not installed. Run: pip install airia")

# DeepL Translator
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
translator = deepl.Translator(DEEPL_API_KEY) if DEEPL_API_KEY else None

# Data paths
DATA_DIR = "data"
DOCUMENTS_FILE = os.path.join(DATA_DIR, "documents.json")
CERTIFICATES_FILE = os.path.join(DATA_DIR, "certificates.json")
HS_CODE_DB_FILE = os.path.join(DATA_DIR, "hs_code_database.json")
MARKET_PRICES_FILE = os.path.join(DATA_DIR, "market_prices.json")
SUPPLIER_HISTORY_FILE = os.path.join(DATA_DIR, "supplier_history.json")
CBP_RULINGS_FILE = os.path.join(DATA_DIR, "cbp_rulings.json")
REGULATORY_REQ_FILE = os.path.join(DATA_DIR, "regulatory_requirements.json")
VESSEL_SCHEDULES_FILE = os.path.join(DATA_DIR, "vessel_schedules.json")

def load_json(filename: str) -> dict:
    """Load JSON data from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def fetch_document(doc_id: str) -> dict:
    """Fetch a specific document"""
    documents = load_json(DOCUMENTS_FILE)
    doc = documents.get(doc_id)
    if not doc:
        raise ValueError(f"Document {doc_id} not found")
    return doc

def get_shipment_documents(shipment_id: str) -> Dict[str, Any]:
    """Get all documents for a shipment"""
    documents = load_json(DOCUMENTS_FILE)
    return {k: v for k, v in documents.items() if v.get("shipment_id") == shipment_id}

# ============================================================================
# TRANSLATION TOOLS
# ============================================================================

@mcp.tool()
def translate_text(
    text: str, 
    source_lang: Optional[str] = None, 
    target_lang: str = "EN-US"
) -> dict:
    """
    Translate text using DeepL.
    
    Args:
        text: Text to translate
        source_lang: Source language code (optional, auto-detect if None)
        target_lang: Target language code (default: EN-US)
    
    Returns:
        Original text, translated text, and detected source language
    """
    try:
        if not translator:
            return {
                "success": False,
                "error": "DeepL API not configured"
            }
        
        result = translator.translate_text(
            text, 
            source_lang=source_lang, 
            target_lang=target_lang
        )
        
        return {
            "success": True,
            "original_text": text,
            "translated_text": result.text,
            "source_language": source_lang or result.detected_source_lang,
            "target_language": target_lang
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def calculate_text_similarity(text1: str, text2: str) -> dict:
    """
    Calculate similarity between two texts using word overlap.
    
    Args:
        text1: First text
        text2: Second text
    
    Returns:
        Similarity score (0-1), common words, and unique words
    """
    try:
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        common = words1.intersection(words2)
        all_words = words1.union(words2)
        
        similarity = len(common) / len(all_words) if all_words else 0
        
        return {
            "success": True,
            "text1": text1,
            "text2": text2,
            "similarity_score": round(similarity, 3),
            "common_words": sorted(list(common)),
            "words_only_in_text1": sorted(list(words1 - words2)),
            "words_only_in_text2": sorted(list(words2 - words1)),
            "word_count_text1": len(words1),
            "word_count_text2": len(words2),
            "common_word_count": len(common)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# DOCUMENT RETRIEVAL TOOLS
# ============================================================================

@mcp.tool()
def get_document(doc_id: str) -> dict:
    """
    Retrieve a document by ID.
    
    Args:
        doc_id: Document ID (e.g., "INV-001", "PL-001", "BOL-001")
    
    Returns:
        Complete document data
    """
    try:
        doc = fetch_document(doc_id)
        return {
            "success": True,
            "document_id": doc_id,
            "document": doc
        }
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_shipment_all_documents(shipment_id: str) -> dict:
    """
    Get all documents for a shipment.
    
    Args:
        shipment_id: Shipment ID (e.g., "SHIP-2025-001")
    
    Returns:
        Dictionary of all documents for this shipment
    """
    try:
        docs = get_shipment_documents(shipment_id)
        if not docs:
            return {
                "success": False,
                "error": f"No documents found for {shipment_id}"
            }
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "document_count": len(docs),
            "documents": docs
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_field_from_document(doc_id: str, field_name: str) -> dict:
    """
    Extract a specific field from a document.
    
    Args:
        doc_id: Document ID
        field_name: Name of field to extract
    
    Returns:
        Field value
    """
    try:
        doc = fetch_document(doc_id)
        value = doc.get(field_name)
        
        return {
            "success": True,
            "document_id": doc_id,
            "field_name": field_name,
            "value": value,
            "value_exists": value is not None
        }
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def list_available_documents() -> dict:
    """
    List all available document IDs.
    
    Returns:
        List of all document IDs and their types
    """
    try:
        documents = load_json(DOCUMENTS_FILE)
        
        doc_list = []
        for doc_id, doc in documents.items():
            doc_list.append({
                "document_id": doc_id,
                "type": doc.get("type"),
                "shipment_id": doc.get("shipment_id")
            })
        
        return {
            "success": True,
            "total_documents": len(doc_list),
            "documents": doc_list
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# CALCULATION TOOLS
# ============================================================================

@mcp.tool()
def calculate_variance(value1: float, value2: float) -> dict:
    """
    Calculate variance between two values.
    
    Args:
        value1: First value (e.g., invoice quantity)
        value2: Second value (e.g., packing list quantity)
    
    Returns:
        Absolute variance, percentage variance, and comparison
    """
    try:
        if value1 == 0:
            return {
                "success": False,
                "error": "Cannot calculate variance - value1 is zero"
            }
        
        absolute_variance = value2 - value1
        percentage_variance = (absolute_variance / value1) * 100
        
        return {
            "success": True,
            "value1": value1,
            "value2": value2,
            "absolute_variance": absolute_variance,
            "percentage_variance": round(percentage_variance, 2),
            "values_match": value1 == value2
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def calculate_unit_price(total_value: float, quantity: float) -> dict:
    """
    Calculate unit price from total value and quantity.
    
    Args:
        total_value: Total value
        quantity: Quantity
    
    Returns:
        Calculated unit price
    """
    try:
        if quantity == 0:
            return {
                "success": False,
                "error": "Cannot calculate unit price - quantity is zero"
            }
        
        unit_price = total_value / quantity
        
        return {
            "success": True,
            "total_value": total_value,
            "quantity": quantity,
            "unit_price": round(unit_price, 2)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def compare_values(values: List[float], tolerance: float = 0.01) -> dict:
    """
    Compare multiple values to see if they match within tolerance.
    
    Args:
        values: List of values to compare
        tolerance: Acceptable difference (default: 0.01)
    
    Returns:
        Comparison results with differences
    """
    try:
        if len(values) < 2:
            return {
                "success": False,
                "error": "Need at least 2 values to compare"
            }
        
        reference = values[0]
        differences = []
        
        for i, value in enumerate(values[1:], 1):
            diff = abs(value - reference)
            differences.append({
                "index": i,
                "value": value,
                "difference_from_reference": round(diff, 2),
                "within_tolerance": diff <= tolerance
            })
        
        all_match = all(d["within_tolerance"] for d in differences)
        
        return {
            "success": True,
            "reference_value": reference,
            "compared_values": values[1:],
            "tolerance": tolerance,
            "all_match": all_match,
            "differences": differences
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# REFERENCE DATA LOOKUP TOOLS
# ============================================================================

@mcp.tool()
def lookup_hs_code(hs_code: str) -> dict:
    """
    Look up HS code in reference database.
    
    Args:
        hs_code: HS code to look up (e.g., "8471.30.0100")
    
    Returns:
        HS code details from database
    """
    try:
        hs_db = load_json(HS_CODE_DB_FILE)
        base_code = hs_code[:7] if len(hs_code) >= 7 else hs_code
        
        data = hs_db.get(base_code)
        
        return {
            "success": True,
            "hs_code": hs_code,
            "base_code": base_code,
            "found": data is not None,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def search_hs_codes_by_keywords(keywords: List[str]) -> dict:
    """
    Search HS code database by product keywords.
    
    Args:
        keywords: List of keywords (e.g., ["laptop", "computer"])
    
    Returns:
        Matching HS codes
    """
    try:
        hs_db = load_json(HS_CODE_DB_FILE)
        keywords_lower = [k.lower() for k in keywords]
        
        matches = []
        for code, details in hs_db.items():
            common_names = details.get("common_names", [])
            if any(kw in name for kw in keywords_lower for name in common_names):
                matches.append({
                    "hs_code": code,
                    "details": details
                })
        
        return {
            "success": True,
            "keywords": keywords,
            "matches_found": len(matches),
            "matches": matches
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def search_cbp_rulings(keywords: List[str]) -> dict:
    """
    Search CBP rulings by keywords.
    
    Args:
        keywords: Keywords to search
    
    Returns:
        Matching rulings
    """
    try:
        cbp_data = load_json(CBP_RULINGS_FILE)
        rulings = cbp_data.get("rulings", [])
        keywords_lower = [k.lower() for k in keywords]
        
        matches = []
        for ruling in rulings:
            ruling_keywords = [k.lower() for k in ruling.get("keywords", [])]
            if any(kw in ruling_keywords for kw in keywords_lower):
                matches.append(ruling)
        
        return {
            "success": True,
            "keywords": keywords,
            "matches_found": len(matches),
            "rulings": matches
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def lookup_market_price(product_name: str) -> dict:
    """
    Look up market price data for product.
    
    Args:
        product_name: Product name/description
    
    Returns:
        Market price information if available
    """
    try:
        market_prices = load_json(MARKET_PRICES_FILE)
        
        # Try exact match
        price_data = market_prices.get(product_name)
        
        # Try partial match
        if not price_data:
            product_lower = product_name.lower()
            for prod_name, data in market_prices.items():
                if prod_name.lower() in product_lower or product_lower in prod_name.lower():
                    price_data = data
                    break
        
        return {
            "success": True,
            "product_name": product_name,
            "found": price_data is not None,
            "data": price_data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_regulatory_requirements(product_keywords: List[str], hs_code: Optional[str] = None) -> dict:
    """
    Get regulatory requirements based on product type.
    
    Args:
        product_keywords: Keywords describing product (e.g., ["wireless", "bluetooth"])
        hs_code: Optional HS code for additional filtering
    
    Returns:
        List of applicable regulatory requirements
    """
    try:
        reg_req = load_json(REGULATORY_REQ_FILE)
        product_keywords_lower = [k.lower() for k in product_keywords]
        
        applicable_reqs = []
        
        for reg_name, reg_info in reg_req.items():
            if reg_name == "Import_Restrictions":
                continue
                
            applies_to = reg_info.get("applies_to", [])
            for rule in applies_to:
                rule_keywords = rule.get("product_keywords", [])
                keyword_match = any(kw in rule_keywords for kw in product_keywords_lower)
                
                if keyword_match:
                    applicable_reqs.append({
                        "regulation": reg_name,
                        "requirement": rule.get("requirement"),
                        "mandatory": rule.get("mandatory"),
                        "exemptions": rule.get("exemptions")
                    })
        
        return {
            "success": True,
            "product_keywords": product_keywords,
            "requirements_found": len(applicable_reqs),
            "requirements": applicable_reqs
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_certificate(cert_id: Optional[str] = None, shipment_id: Optional[str] = None, cert_type: Optional[str] = None) -> dict:
    """
    Get certificate by ID, shipment, or type.
    
    Args:
        cert_id: Certificate ID (optional)
        shipment_id: Shipment ID (optional)
        cert_type: Certificate type (optional, e.g., "fcc_certification")
    
    Returns:
        Certificate data
    """
    try:
        certificates = load_json(CERTIFICATES_FILE)
        
        if cert_id:
            cert = certificates.get(cert_id)
            return {
                "success": True,
                "search_by": "cert_id",
                "found": cert is not None,
                "certificate": cert
            }
        
        # Search by shipment and/or type
        matches = []
        for cid, cert in certificates.items():
            match = True
            if shipment_id and cert.get("shipment_id") != shipment_id:
                match = False
            if cert_type and cert.get("type") != cert_type:
                match = False
            
            if match:
                cert_copy = cert.copy()
                cert_copy["cert_id"] = cid
                matches.append(cert_copy)
        
        return {
            "success": True,
            "search_by": "shipment_id and/or cert_type",
            "shipment_id": shipment_id,
            "cert_type": cert_type,
            "found": len(matches) > 0,
            "certificates": matches
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_supplier_history(supplier_name: str) -> dict:
    """
    Get historical data for a supplier.
    
    Args:
        supplier_name: Supplier company name
    
    Returns:
        Supplier history data
    """
    try:
        supplier_history = load_json(SUPPLIER_HISTORY_FILE)
        data = supplier_history.get(supplier_name)
        
        return {
            "success": True,
            "supplier_name": supplier_name,
            "found": data is not None,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_vessel_schedule(vessel_name: str) -> dict:
    """
    Get schedule data for a vessel.
    
    Args:
        vessel_name: Vessel name
    
    Returns:
        Vessel schedule data
    """
    try:
        vessel_schedules = load_json(VESSEL_SCHEDULES_FILE)
        data = vessel_schedules.get(vessel_name)
        
        return {
            "success": True,
            "vessel_name": vessel_name,
            "found": data is not None,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_import_restrictions() -> dict:
    """
    Get list of import restrictions.
    
    Returns:
        Import restriction data
    """
    try:
        reg_req = load_json(REGULATORY_REQ_FILE)
        restrictions = reg_req.get("Import_Restrictions", {})
        
        return {
            "success": True,
            "restrictions": restrictions
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# AIRIA TESTING TOOLS
# ============================================================================

@mcp.tool()
def test_airia_agent(agent_guid: str, test_input: str) -> dict:
    """
    Test an Airia agent with sample input.
    
    Args:
        agent_guid: The GUID of the agent to test
        test_input: Sample input text to send to the agent
    
    Returns:
        Test results from the agent
    """
    try:
        if not airia_client:
            return {
                "success": False,
                "error": "Airia client not configured. Set AIRIA_API_KEY environment variable."
            }
        
        # Execute pipeline for the agent
        response = airia_client.pipeline_execution.execute_pipeline(
            pipeline_id=agent_guid,
            user_input=test_input
        )
        
        return {
            "success": True,
            "agent_guid": agent_guid,
            "test_input": test_input,
            "result": response.result,
            "status": "completed"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "agent_guid": agent_guid,
            "test_input": test_input
        }

@mcp.tool()
def test_all_airia_agents(test_input: str) -> dict:
    """
    Test all configured Airia agents with sample input.
    
    Args:
        test_input: Sample input text to send to all agents
    
    Returns:
        Test results from all agents
    """
    try:
        if not airia_client:
            return {
                "success": False,
                "error": "Airia client not configured. Set AIRIA_API_KEY environment variable."
            }
        
        # Agent GUIDs from the configuration
        agent_guids = [
            "71c23734-2a91-4345-bcdf-887717c73769",  # Route_Validator
            "07a2107e-9c9b-4cf1-b91c-85d6b07963d9",  # Value_validator
            "cff07b49-dd72-4941-ab48-7da1907b6f4b",  # Regulatory_compliance_checker
            "5fdf36fa-632a-4154-ba92-d182bf93cb72",  # Supplier_History_Analyzer
            "bb5aa7e3-a134-4866-98d7-74c8b311fc53",  # Risk Scorer_&_Prioritizer
            "f0265e05-d232-45f7-aab5-c0bc2b870171",  # Document_consistency_checker
            "09d34238-c58a-41ff-8034-7f9ebe3e1d73",  # hs_code_validator
            "f182b7d5-5da3-4a90-b535-122e88f96087",  # Origin_validator
        ]
        
        results = []
        
        for guid in agent_guids:
            try:
                response = airia_client.pipeline_execution.execute_pipeline(
                    pipeline_id=guid,
                    user_input=test_input
                )
                results.append({
                    "agent_guid": guid,
                    "success": True,
                    "result": response.result
                })
            except Exception as e:
                results.append({
                    "agent_guid": guid,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "test_input": test_input,
            "total_agents": len(agent_guids),
            "successful_tests": len([r for r in results if r["success"]]),
            "failed_tests": len([r for r in results if not r["success"]]),
            "results": results
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "test_input": test_input
        }

@mcp.tool()
def get_airia_status() -> dict:
    """
    Get the status of Airia integration.
    
    Returns:
        Status information about Airia configuration
    """
    return {
        "success": True,
        "airia_sdk_installed": airia_client is not None,
        "api_key_configured": bool(os.getenv("AIRIA_API_KEY")),
        "client_initialized": airia_client is not None,
        "total_agents": 8
    }

if __name__ == "__main__":
    print("=" * 70)
    print("CrossCheck AI - Clean MCP Server")
    print("=" * 70)
    print(f"DeepL Translation: {'Enabled' if translator else 'Disabled'}")
    print(f"Airia Integration: {'Enabled' if airia_client else 'Disabled'}")
    print(f"Total Tools: 20 (data-only utilities + Airia testing)")
    print("\nTool Categories:")
    print("  - Translation: 2 tools")
    print("  - Document Retrieval: 4 tools")
    print("  - Calculations: 3 tools")
    print("  - Reference Lookups: 8 tools")
    print("  - Airia Testing: 3 tools")
    print("\nAll interpretation & decision-making handled by AI agents!")
    print("=" * 70)
    mcp.run()
