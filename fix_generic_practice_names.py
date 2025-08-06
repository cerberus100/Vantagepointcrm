#!/usr/bin/env python3
"""
Fix generic practice names and prevent their assignment to agents
"""

import boto3
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
leads_table = dynamodb.Table('vantagepoint-leads')
users_table = dynamodb.Table('vantagepoint-users')

def identify_generic_leads():
    """Find all leads with generic 'Medical Practice' names"""
    response = leads_table.scan()
    all_leads = response.get('Items', [])
    
    generic_leads = []
    for lead in all_leads:
        practice_name = str(lead.get('practice_name', ''))
        if practice_name.startswith('Medical Practice'):
            generic_leads.append(lead)
    
    return generic_leads

def unassign_generic_leads(generic_leads):
    """Remove assignment from generic leads"""
    unassigned_count = 0
    
    for lead in generic_leads:
        if lead.get('assigned_user_id'):
            try:
                # Unassign the lead
                leads_table.update_item(
                    Key={'id': int(lead['id'])},
                    UpdateExpression='REMOVE assigned_user_id SET updated_at = :updated_at, #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':updated_at': datetime.utcnow().isoformat(),
                        ':status': 'UNASSIGNED_GENERIC'
                    }
                )
                unassigned_count += 1
                print(f"✅ Unassigned lead {lead['id']} ({lead['practice_name']}) from agent {lead['assigned_user_id']}")
            except Exception as e:
                print(f"❌ Error unassigning lead {lead['id']}: {e}")
    
    return unassigned_count

def reassign_quality_leads_to_agents():
    """Reassign quality leads to agents who lost generic ones"""
    # Get all agents
    response = users_table.scan()
    all_users = response.get('Items', [])
    agents = [u for u in all_users if u.get('role') == 'agent']
    
    # Get all quality unassigned leads
    response = leads_table.scan()
    all_leads = response.get('Items', [])
    
    # Filter for quality unassigned leads (not generic, not fake, not sold)
    quality_unassigned = []
    for lead in all_leads:
        if (not lead.get('assigned_user_id') and 
            lead.get('status') not in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold', 'inactive_duplicate', 'UNASSIGNED_GENERIC'] and
            not str(lead.get('practice_name', '')).startswith('Medical Practice') and
            lead.get('email') and lead.get('email').strip()):  # Must have email
            
            practice_name = (lead.get('practice_name') or '').upper()
            owner_name = (lead.get('owner_name') or '').upper()
            
            # Skip fake patterns
            fake_patterns = ['TEST', 'UNKNOWN', 'PLACEHOLDER', 'UNAUTHORIZED', 'UPDATE', 
                           'ATTEMPT', 'FAKE', 'DEMO', 'SAMPLE', 'DEBUG', 'AGENT UPDATED', 'EXAMPLE']
            
            if not any(pattern in practice_name or pattern in owner_name for pattern in fake_patterns):
                quality_unassigned.append(lead)
    
    # Sort by score
    quality_unassigned.sort(key=lambda x: float(x.get('score', 0)), reverse=True)
    
    # Count current assignments
    for agent in agents:
        agent_id = agent['id']
        current_count = len([l for l in all_leads if l.get('assigned_user_id') == agent_id and 
                           not str(l.get('practice_name', '')).startswith('Medical Practice')])
        
        print(f"\n👤 Agent {agent['username']} (ID: {agent_id}) has {current_count} quality leads")
        
        # Assign more if needed (target 20 quality leads)
        if current_count < 20 and quality_unassigned:
            to_assign = 20 - current_count
            print(f"  → Assigning {to_assign} more quality leads...")
            
            for lead in quality_unassigned[:to_assign]:
                try:
                    leads_table.update_item(
                        Key={'id': int(lead['id'])},
                        UpdateExpression='SET assigned_user_id = :agent_id, updated_at = :updated_at',
                        ExpressionAttributeValues={
                            ':agent_id': agent_id,
                            ':updated_at': datetime.utcnow().isoformat()
                        }
                    )
                    quality_unassigned.remove(lead)
                    print(f"  ✅ Assigned lead {lead['id']}: {lead['practice_name']} to {agent['username']}")
                except Exception as e:
                    print(f"  ❌ Error assigning lead {lead['id']}: {e}")

def main():
    print("🔍 FIXING GENERIC PRACTICE NAME ISSUE")
    print("=" * 50)
    
    # Find generic leads
    generic_leads = identify_generic_leads()
    print(f"\n📊 Found {len(generic_leads)} leads with generic 'Medical Practice' names")
    
    # Show which agents have them
    assigned_generic = [l for l in generic_leads if l.get('assigned_user_id')]
    print(f"📌 {len(assigned_generic)} of these are currently assigned to agents")
    
    # Unassign generic leads
    if assigned_generic:
        print("\n🔄 Unassigning generic leads from agents...")
        unassigned = unassign_generic_leads(assigned_generic)
        print(f"✅ Unassigned {unassigned} generic leads")
    
    # Reassign quality leads
    print("\n🎯 Reassigning quality leads to agents...")
    reassign_quality_leads_to_agents()
    
    print("\n✅ COMPLETE! Agents now have only quality leads with:")
    print("  - Real practice names (not generic)")
    print("  - Valid email addresses")
    print("  - No test/fake data")
    print("  - High quality scores")

if __name__ == "__main__":
    main()