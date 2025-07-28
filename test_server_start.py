#!/usr/bin/env python3
"""
Test server startup locally before Railway deployment
"""
import sys
import os
import asyncio
import httpx
import time
from multiprocessing import Process

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def start_server():
    """Start the FastAPI server"""
    import uvicorn
    from app.main import app
    
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")

async def test_endpoints():
    """Test key endpoints"""
    print("🧪 Testing server endpoints...")
    
    base_url = "http://127.0.0.1:8001"
    
    async with httpx.AsyncClient() as client:
        try:
            # Test root endpoint
            response = await client.get(f"{base_url}/")
            if response.status_code == 200:
                print("✅ Root endpoint working")
                data = response.json()
                print(f"   Status: {data.get('status')}")
                print(f"   Outreach enabled: {data.get('outreach_enabled')}")
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
                return False
            
            # Test health endpoint
            response = await client.get(f"{base_url}/health")
            if response.status_code == 200:
                print("✅ Health endpoint working")
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
            
            # Test simplified outreach endpoints
            response = await client.get(f"{base_url}/api/outreach/v2/campaigns")
            if response.status_code == 200:
                print("✅ Outreach campaigns endpoint working")
            else:
                print(f"❌ Outreach campaigns endpoint failed: {response.status_code}")
                return False
                
            return True
            
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

def main():
    print("🚀 Starting local server test...")
    
    # Start server in background
    server_process = Process(target=start_server)
    server_process.start()
    
    try:
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        time.sleep(5)
        
        # Run async tests
        result = asyncio.run(test_endpoints())
        
        if result:
            print("\n🎉 All tests passed! Server is ready for Railway deployment.")
            return 0
        else:
            print("\n❌ Some tests failed. Check server logs.")
            return 1
            
    finally:
        # Clean up
        server_process.terminate()
        server_process.join()

if __name__ == "__main__":
    sys.exit(main())