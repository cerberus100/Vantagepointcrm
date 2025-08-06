#!/usr/bin/env python3
"""
Update generic practice names to use doctor's name instead
"""

import boto3
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
leads_table = dynamodb.Table('vantagepoint-leads')

def update_generic_practice_names():
    """Update generic 'Medical Practice' names to doctor's name"""
    response = leads_table.scan()
    all_leads = response.get('Items', [])
    
    updated_count = 0
    
    for lead in all_leads:
        practice_name = str(lead.get('practice_name', ''))
        if practice_name.startswith('Medical Practice') and lead.get('owner_name'):
            # Create new practice name from doctor's name
            owner_name = lead.get('owner_name', '').strip()
            if owner_name.lower().startswith('dr.'):
                new_practice_name = f"{owner_name}'s Practice"
            else:
                new_practice_name = f"Dr. {owner_name}'s Practice"
            
            try:
                # Update the practice name
                leads_table.update_item(
                    Key={'id': int(lead['id'])},
                    UpdateExpression='SET practice_name = :new_name, updated_at = :updated_at',
                    ExpressionAttributeValues={
                        ':new_name': new_practice_name,
                        ':updated_at': datetime.utcnow().isoformat()
                    }
                )
                updated_count += 1
                print(f"✅ Updated: '{practice_name}' → '{new_practice_name}'")
            except Exception as e:
                print(f"❌ Error updating lead {lead['id']}: {e}")
    
    return updated_count

def reassign_updated_leads():
    """Reassign the updated leads back to agents"""
    response = leads_table.scan()
    all_leads = response.get('Items', [])
    
    # Find leads with doctor practice names that are unassigned
    doctor_practice_leads = []
    for lead in all_leads:
        if ("'s Practice" in str(lead.get('practice_name', '')) and 
            lead.get('status') == 'UNASSIGNED_GENERIC'):
            doctor_practice_leads.append(lead)
    
    # Sort by score
    doctor_practice_leads.sort(key=lambda x: float(x.get('score', 0)), reverse=True)
    
    # Get agents who need more leads
    from collections import defaultdict
    agent_lead_counts = defaultdict(int)
    
    for lead in all_leads:
        if lead.get('assigned_user_id') and lead.get('status') not in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold']:
            agent_lead_counts[lead['assigned_user_id']] += 1
    
    # Distribute to agents with less than 20 leads
    reassigned = 0
    for lead in doctor_practice_leads:
        # Find agent with fewest leads
        agents_needing_leads = [(agent_id, count) for agent_id, count in agent_lead_counts.items() if count < 20]
        if agents_needing_leads:
            agents_needing_leads.sort(key=lambda x: x[1])  # Sort by count
            chosen_agent = agents_needing_leads[0][0]
            
            try:
                leads_table.update_item(
                    Key={'id': int(lead['id'])},
                    UpdateExpression='SET assigned_user_id = :agent_id, #status = :status, updated_at = :updated_at',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':agent_id': chosen_agent,
                        ':status': 'NEW',
                        ':updated_at': datetime.utcnow().isoformat()
                    }
                )
                agent_lead_counts[chosen_agent] += 1
                reassigned += 1
                print(f"✅ Assigned lead {lead['id']} ({lead['practice_name']}) to agent {chosen_agent}")
            except Exception as e:
                print(f"❌ Error reassigning lead {lead['id']}: {e}")
    
    return reassigned

def main():
    print("🏥 UPDATING GENERIC PRACTICE NAMES TO DOCTOR NAMES")
    print("=" * 60)
    
    # Update practice names
    print("\n📝 Updating generic practice names...")
    updated = update_generic_practice_names()
    print(f"\n✅ Updated {updated} practice names")
    
    # Reassign the updated leads
    print("\n🎯 Reassigning updated leads to agents...")
    reassigned = reassign_updated_leads()
    print(f"\n✅ Reassigned {reassigned} leads")
    
    print("\n🎉 COMPLETE! Generic leads now show as:")
    print("  - 'Dr. Smith's Practice' instead of 'Medical Practice 123'")
    print("  - Professional appearance")
    print("  - Still valuable leads with phone numbers")
    print("  - Reassigned to agents for calling")

if __name__ == "__main__":
    main()