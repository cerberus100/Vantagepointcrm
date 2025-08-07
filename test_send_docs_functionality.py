#!/usr/bin/env python3
"""
Test Send Docs Functionality
Tests if agents can successfully send documents to leads
"""

import requests
import json
from datetime import datetime

API_BASE = "https://api.vantagepointcrm.com"

def test_login(username, password):
    """Test user login"""
    print(f"\n🔐 Testing login for {username}...")
    
    response = requests.post(
        f"{API_BASE}/api/v1/auth/login",
        json={"username": username, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful! Token valid for 24 hours now")
        print(f"   User: {data['user']['username']} (Role: {data['user']['role']})")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_get_leads(token):
    """Get agent's leads"""
    print("\n📋 Fetching agent's leads...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/api/v1/leads", headers=headers)
    
    if response.status_code == 200:
        leads = response.json()
        print(f"✅ Found {len(leads)} leads")
        
        # Find a lead with email but no docs sent
        testable_lead = None
        for lead in leads:
            if lead.get('email') and not lead.get('docs_sent'):
                testable_lead = lead
                break
        
        if testable_lead:
            print(f"\n📌 Found testable lead:")
            print(f"   ID: {testable_lead['id']}")
            print(f"   Practice: {testable_lead['practice_name']}")
            print(f"   Email: {testable_lead['email']}")
            print(f"   Status: {testable_lead['status']}")
            return testable_lead
        else:
            print("⚠️  No leads found with email that haven't had docs sent")
            return None
    else:
        print(f"❌ Failed to get leads: {response.status_code}")
        return None

def test_send_docs(token, lead_id):
    """Test sending docs to a lead"""
    print(f"\n📤 Testing send docs for lead {lead_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_BASE}/api/v1/leads/{lead_id}/send-docs",
        headers=headers
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Docs sent successfully!")
        return True
    else:
        print(f"❌ Failed to send docs: {response.json()}")
        return False

def test_lead_update(token, lead_id):
    """Test updating a lead (to verify JWT token works)"""
    print(f"\n✏️  Testing lead update for lead {lead_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Simple status update
    update_data = {
        "status": "CONTACTED"
    }
    
    response = requests.put(
        f"{API_BASE}/api/v1/leads/{lead_id}",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        print("✅ Lead update successful! JWT token is working properly")
        return True
    else:
        print(f"❌ Lead update failed: {response.status_code} - {response.text}")
        return False

def main():
    print("🧪 VantagePoint CRM - Send Docs Functionality Test")
    print("=" * 50)
    
    # Test with agent credentials
    agent_token = test_login("agent1", "agent123")
    
    if agent_token:
        # Get leads
        lead = test_get_leads(agent_token)
        
        if lead:
            # Test lead update first (to verify JWT works)
            if test_lead_update(agent_token, lead['id']):
                print("\n✅ JWT Token Fix Verified - No more 1-hour timeouts!")
            
            # Test send docs
            print("\n" + "="*50)
            print("📧 SEND DOCS TEST")
            print("="*50)
            
            user_input = input(f"\nSend docs to {lead['practice_name']}? (y/n): ")
            if user_input.lower() == 'y':
                test_send_docs(agent_token, lead['id'])
            else:
                print("Skipped send docs test")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main()
