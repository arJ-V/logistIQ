#!/usr/bin/env python3
"""
Setup script for Airia integration
"""

import os
import sys

def create_env_file():
    """Create .env.local file with template"""
    env_content = """# Airia API Configuration
# Get your API key from Airia Settings > API Keys
AIRIA_API_KEY=your_airia_api_key_here

# Frontend environment variables (for Next.js)
NEXT_PUBLIC_AIRIA_API_KEY=your_airia_api_key_here
NEXT_PUBLIC_AIRIA_BASE_URL=https://api.airia.com

# DeepL Translation (existing)
DEEPL_API_KEY=your_deepl_api_key_here

# Instructions:
# 1. Replace 'your_airia_api_key_here' with your actual Airia API key
# 2. Replace 'your_deepl_api_key_here' with your actual DeepL API key
# 3. Never commit this file to version control
"""
    
    env_file = ".env.local"
    
    if os.path.exists(env_file):
        print(f"⚠️  {env_file} already exists. Please edit it manually.")
        return False
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"✅ Created {env_file}")
        print("📝 Please edit this file and add your API keys:")
        print(f"   nano {env_file}")
        return True
    except Exception as e:
        print(f"❌ Failed to create {env_file}: {e}")
        return False

def test_with_api_key():
    """Test Airia with API key input"""
    api_key = input("\n🔑 Enter your Airia API key (or press Enter to skip): ").strip()
    
    if not api_key:
        print("⏭️  Skipping API key test")
        return False
    
    # Set environment variable for this session
    os.environ['AIRIA_API_KEY'] = api_key
    
    try:
        from airia import AiriaClient
        client = AiriaClient(api_key=api_key)
        print("✅ Airia client initialized successfully")
        
        # Test with a simple agent
        agent_guid = "09d34238-c58a-41ff-8034-7f9ebe3e1d73"  # hs_code_validator
        test_input = "Electronic components, HS Code: 8471.30.01"
        
        print(f"🧪 Testing agent: {agent_guid[:8]}...")
        
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

def main():
    """Main setup function"""
    print("🚀 Airia Integration Setup")
    print("=" * 50)
    
    # Check if Airia SDK is installed
    try:
        from airia import AiriaClient
        print("✅ Airia SDK is installed")
    except ImportError:
        print("❌ Airia SDK not installed")
        print("Run: pip install airia")
        return
    
    # Create environment file
    print("\n1. Creating environment configuration...")
    create_env_file()
    
    # Test with API key
    print("\n2. Testing with API key...")
    test_with_api_key()
    
    print("\n" + "=" * 50)
    print("🏁 Setup Complete!")
    print("\nNext steps:")
    print("1. Edit .env.local and add your API keys")
    print("2. Run: python test_airia.py")
    print("3. Start the Next.js app: npm run dev")
    print("4. Test the integration in the browser")

if __name__ == "__main__":
    main()
