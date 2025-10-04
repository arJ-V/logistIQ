#!/usr/bin/env python3
"""
Test script for Airia integration
"""

import os
import sys

# Try to load environment variables
try:
    from dotenv import load_dotenv
    # Try to load from .env.local first, then .env
    if os.path.exists('.env.local'):
        load_dotenv('.env.local')
        print("✅ Environment variables loaded from .env.local file")
    elif os.path.exists('.env'):
        load_dotenv('.env')
        print("✅ Environment variables loaded from .env file")
    else:
        print("⚠️  No .env or .env.local file found")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment variables only")

def test_airia_installation():
    """Test if Airia SDK is installed and can be imported"""
    try:
        from airia import AiriaClient
        print("✅ Airia SDK imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import Airia SDK: {e}")
        print("Run: pip install airia")
        return False

def test_airia_client():
    """Test Airia client initialization"""
    api_key = os.getenv("AIRIA_API_KEY")
    
    if not api_key:
        print("❌ AIRIA_API_KEY environment variable not set")
        print("Please set your Airia API key in .env file:")
        print("AIRIA_API_KEY=your_api_key_here")
        return None
    
    try:
        from airia import AiriaClient
        client = AiriaClient(api_key=api_key)
        print("✅ Airia client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Airia client: {e}")
        return None

def test_single_agent(client):
    """Test a single agent with sample input"""
    if not client:
        return False
    
    # Test with HS Code Validator
    agent_guid = "09d34238-c58a-41ff-8034-7f9ebe3e1d73"  # hs_code_validator
    test_input = "Electronic components, HS Code: 8471.30.01, Value: $15,000"
    
    print(f"\n🧪 Testing agent: {agent_guid}")
    print(f"📝 Input: {test_input}")
    
    try:
        response = client.pipeline_execution.execute_pipeline(
            pipeline_id=agent_guid,
            user_input=test_input
        )
        
        print("✅ Agent test successful!")
        print(f"📊 Result: {response.result}")
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False

def test_all_agents(client):
    """Test all configured agents"""
    if not client:
        return False
    
    agent_guids = [
        ("71c23734-2a91-4345-bcdf-887717c73769", "Route_Validator"),
        ("07a2107e-9c9b-4cf1-b91c-85d6b07963d9", "Value_validator"),
        ("cff07b49-dd72-4941-ab48-7da1907b6f4b", "Regulatory_compliance_checker"),
        ("5fdf36fa-632a-4154-ba92-d182bf93cb72", "Supplier_History_Analyzer"),
        ("bb5aa7e3-a134-4866-98d7-74c8b311fc53", "Risk Scorer_&_Prioritizer"),
        ("f0265e05-d232-45f7-aab5-c0bc2b870171", "Document_consistency_checker"),
        ("09d34238-c58a-41ff-8034-7f9ebe3e1d73", "hs_code_validator"),
        ("f182b7d5-5da3-4a90-b535-122e88f96087", "Origin_validator"),
    ]
    
    test_input = """Commercial Invoice #INV-2025-001
Supplier: Shenzhen Tech Co.
Products: Electronic components
Total Value: $15,000
HS Codes: 8471.30.01, 8517.12.00
Country of Origin: China
Destination: Los Angeles, CA
ETD: 2025-01-15"""
    
    print(f"\n🧪 Testing all {len(agent_guids)} agents...")
    print(f"📝 Input: {test_input[:100]}...")
    
    results = []
    
    for guid, name in agent_guids:
        print(f"\n  Testing {name} ({guid[:8]}...)")
        
        try:
            response = client.pipeline_execution.execute_pipeline(
                pipeline_id=guid,
                user_input=test_input
            )
            
            print(f"  ✅ Success: {response.result[:100]}...")
            results.append((name, True, response.result))
            
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            results.append((name, False, str(e)))
    
    # Summary
    successful = len([r for r in results if r[1]])
    total = len(results)
    
    print(f"\n📊 Test Summary:")
    print(f"  ✅ Successful: {successful}/{total}")
    print(f"  ❌ Failed: {total - successful}/{total}")
    
    return successful > 0

def main():
    """Main test function"""
    print("🚀 Airia Integration Test")
    print("=" * 50)
    
    # Test 1: SDK Installation
    print("\n1. Testing Airia SDK installation...")
    if not test_airia_installation():
        sys.exit(1)
    
    # Test 2: Client Initialization
    print("\n2. Testing Airia client initialization...")
    client = test_airia_client()
    if not client:
        sys.exit(1)
    
    # Test 3: Single Agent
    print("\n3. Testing single agent...")
    single_success = test_single_agent(client)
    
    # Test 4: All Agents
    print("\n4. Testing all agents...")
    all_success = test_all_agents(client)
    
    # Final Results
    print("\n" + "=" * 50)
    print("🏁 Test Results:")
    print(f"  SDK Installation: ✅")
    print(f"  Client Initialization: ✅")
    print(f"  Single Agent Test: {'✅' if single_success else '❌'}")
    print(f"  All Agents Test: {'✅' if all_success else '❌'}")
    
    if single_success or all_success:
        print("\n🎉 Airia integration is working!")
        print("You can now use the agents in your LogistIQ platform.")
    else:
        print("\n⚠️  Airia integration has issues.")
        print("Check your API key and agent configurations.")

if __name__ == "__main__":
    main()
