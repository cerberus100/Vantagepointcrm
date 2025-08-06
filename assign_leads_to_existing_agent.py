#!/usr/bin/env python3
"""
Assign leads to existing agent that was created without lead assignment
"""

import boto3
import json
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
leads_table = dynamodb.Table('vantagepoint-leads')
users_table = dynamodb.Table('vantagepoint-users')

def get_agents_without_leads():
    """Find agents that have no leads assigned"""
    try:
        # Get all users
        users_response = users_table.scan()
        agents = [u for u in users_response.get('Items', []) if u.get('role') == 'agent']
        
        # Get all leads 
        leads_response = leads_table.scan()
        all_leads = leads_response.get('Items', [])
        
        # Find agents with no leads
        agents_without_leads = []
        for agent in agents:
            agent_id = agent.get('id')
            agent_leads = [l for l in all_leads if l.get('assigned_user_id') == agent_id]
            if len(agent_leads) == 0:
                agents_without_leads.append({
                    'id': agent_id,
                    'username': agent.get('username'),
                    'created_at': agent.get('created_at'),
                    'manager_id': agent.get('manager_id')
                })
        
        return agents_without_leads
    except Exception as e:
        print(f"Error finding agents: {e}")
        return []

def assign_leads_to_agent(agent_id, count=20):
    """Assign unassigned leads to a specific agent"""
    try:
        # Get all leads
        response = leads_table.scan()
        all_leads = response.get('Items', [])
        
        # Find unassigned leads
        unassigned_leads = [
            lead for lead in all_leads 
            if not lead.get('assigned_user_id') or lead.get('assigned_user_id') == 'null'
        ]
        
        # Filter out inactive duplicates and test data
        quality_unassigned = [
            lead for lead in unassigned_leads
            if lead.get('status') != 'inactive_duplicate' and
            not any(test_phrase in (lead.get('practice_name', '') or '').upper() 
                   for test_phrase in ['TEST', 'UNKNOWN', 'PLACEHOLDER'])
        ]
        
        # Sort by score (highest first)
        quality_unassigned.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        print(f"📊 Found {len(quality_unassigned)} quality unassigned leads")
        
        # Assign up to 'count' leads
        assigned_count = 0
        for lead in quality_unassigned[:count]:
            try:
                # Update lead assignment in DynamoDB
                leads_table.update_item(
                    Key={'id': int(lead['id'])},
                    UpdateExpression='SET assigned_user_id = :agent_id, updated_at = :updated_at',
                    ExpressionAttributeValues={
                        ':agent_id': agent_id,
                        ':updated_at': datetime.utcnow().isoformat()
                    }
                )
                assigned_count += 1
                print(f"✅ Assigned lead {lead['id']} ({lead.get('practice_name', 'Unknown')}) to agent {agent_id}")
            except Exception as e:
                print(f"❌ Failed to assign lead {lead.get('id')}: {e}")
                continue
        
        return assigned_count
        
    except Exception as e:
        print(f"❌ Error in assign_leads_to_agent: {e}")
        return 0

def main():
    print("🔍 Finding agents without leads...")
    
    agents_without_leads = get_agents_without_leads()
    
    if not agents_without_leads:
        print("✅ All agents have leads assigned!")
        return
    
    print(f"📋 Found {len(agents_without_leads)} agents without leads:")
    for agent in agents_without_leads:
        print(f"   - {agent['username']} (ID: {agent['id']}, Manager: {agent.get('manager_id', 'None')})")
    
    print("\n🎯 Assigning leads to agents...")
    
    for agent in agents_without_leads:
        agent_id = agent['id']
        username = agent['username']
        
        print(f"\n👤 Processing {username} (ID: {agent_id})...")
        assigned_count = assign_leads_to_agent(agent_id, 20)
        print(f"✅ Assigned {assigned_count} leads to {username}")
    
    print("\n🎉 Lead assignment complete!")

if __name__ == "__main__":
    main()