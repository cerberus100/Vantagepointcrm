#!/usr/bin/env python3
"""
Clean fake leads and implement proper lead lifecycle management
"""

import boto3
import json
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
leads_table = dynamodb.Table('vantagepoint-leads')

def identify_and_remove_fake_leads():
    """Identify and remove fake/test leads from the system"""
    print("🔍 Scanning for fake/test leads...")
    
    try:
        response = leads_table.scan()
        all_leads = response.get('Items', [])
        
        fake_patterns = [
            'UNAUTHORIZED', 'UPDATE', 'ATTEMPT', 'TEST', 'FAKE', 'PLACEHOLDER',
            'AGENT UPDATED', 'DEBUG', 'SAMPLE', 'DEMO', 'EXAMPLE'
        ]
        
        fake_leads = []
        for lead in all_leads:
            practice_name = (lead.get('practice_name', '') or '').upper()
            owner_name = (lead.get('owner_name', '') or '').upper()
            
            is_fake = any(pattern in practice_name for pattern in fake_patterns) or \
                     any(pattern in owner_name for pattern in fake_patterns)
            
            if is_fake:
                fake_leads.append(lead)
        
        print(f"📋 Found {len(fake_leads)} fake leads to remove:")
        for lead in fake_leads:
            print(f"  - ID {lead.get('id')}: {lead.get('practice_name', 'Unknown')} (Agent: {lead.get('assigned_user_id', 'None')})")
        
        if fake_leads:
            confirm = input(f"\n❓ Remove {len(fake_leads)} fake leads? (y/N): ")
            if confirm.lower() == 'y':
                removed_count = 0
                for lead in fake_leads:
                    try:
                        leads_table.delete_item(Key={'id': int(lead['id'])})
                        removed_count += 1
                        print(f"🗑️ Removed fake lead {lead['id']}: {lead.get('practice_name', 'Unknown')}")
                    except Exception as e:
                        print(f"❌ Failed to remove lead {lead.get('id')}: {e}")
                
                print(f"✅ Removed {removed_count} fake leads")
                return removed_count
            else:
                print("❌ Fake lead removal cancelled")
                return 0
        else:
            print("✅ No fake leads found")
            return 0
            
    except Exception as e:
        print(f"❌ Error scanning for fake leads: {e}")
        return 0

def check_lead_assignment_integrity():
    """Check for duplicate lead assignments and other integrity issues"""
    print("\n🔍 Checking lead assignment integrity...")
    
    try:
        response = leads_table.scan()
        all_leads = response.get('Items', [])
        
        # Check for duplicate assignments
        assigned_leads = [l for l in all_leads if l.get('assigned_user_id')]
        lead_to_agent = {}
        duplicates = []
        
        for lead in assigned_leads:
            lead_id = lead.get('id')
            agent_id = lead.get('assigned_user_id')
            
            if lead_id in lead_to_agent:
                duplicates.append(f"Lead {lead_id} assigned to both {lead_to_agent[lead_id]} and {agent_id}")
            else:
                lead_to_agent[lead_id] = agent_id
        
        if duplicates:
            print(f"❌ Found {len(duplicates)} duplicate assignments:")
            for dup in duplicates:
                print(f"  - {dup}")
        else:
            print("✅ No duplicate lead assignments found")
        
        # Check agent workload distribution
        agent_workloads = {}
        for lead in assigned_leads:
            agent_id = lead.get('assigned_user_id')
            if agent_id not in agent_workloads:
                agent_workloads[agent_id] = []
            agent_workloads[agent_id].append(lead.get('id'))
        
        print(f"\n📊 Agent workload distribution:")
        for agent_id, lead_ids in agent_workloads.items():
            print(f"  Agent {agent_id}: {len(lead_ids)} leads")
        
        # Check for sold/disposed leads that should be tracked
        sold_disposed_leads = [
            l for l in all_leads 
            if l.get('status') in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold']
        ]
        
        print(f"\n🎯 Found {len(sold_disposed_leads)} sold/disposed leads:")
        for lead in sold_disposed_leads[:5]:  # Show first 5
            print(f"  - ID {lead.get('id')}: {lead.get('practice_name', 'Unknown')} (Status: {lead.get('status')}, Agent: {lead.get('assigned_user_id', 'None')})")
        
        return {
            'duplicates': len(duplicates),
            'agent_workloads': agent_workloads,
            'sold_disposed_count': len(sold_disposed_leads)
        }
        
    except Exception as e:
        print(f"❌ Error checking integrity: {e}")
        return None

def reassign_leads_if_needed():
    """Reassign leads if an agent has fewer than expected"""
    print("\n🔄 Checking if lead reassignment is needed...")
    
    try:
        # Get current assignment status
        result = check_lead_assignment_integrity()
        if not result:
            return
        
        agent_workloads = result['agent_workloads']
        
        # Check if any agent has fewer than 20 leads
        for agent_id, lead_ids in agent_workloads.items():
            if len(lead_ids) < 20:
                needed = 20 - len(lead_ids)
                print(f"🎯 Agent {agent_id} needs {needed} more leads")
                
                # Find unassigned leads
                response = leads_table.scan()
                all_leads = response.get('Items', [])
                
                unassigned_leads = [
                    lead for lead in all_leads 
                    if not lead.get('assigned_user_id') and 
                    lead.get('status') not in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold', 'inactive_duplicate'] and
                    not any(phrase in (lead.get('practice_name', '') or '').upper() 
                           for phrase in ['TEST', 'UNKNOWN', 'PLACEHOLDER', 'UNAUTHORIZED', 'FAKE'])
                ]
                
                # Sort by score and assign
                unassigned_leads.sort(key=lambda x: x.get('score', 0), reverse=True)
                
                assigned_count = 0
                for lead in unassigned_leads[:needed]:
                    try:
                        leads_table.update_item(
                            Key={'id': int(lead['id'])},
                            UpdateExpression='SET assigned_user_id = :agent_id, updated_at = :updated_at',
                            ExpressionAttributeValues={
                                ':agent_id': agent_id,
                                ':updated_at': datetime.utcnow().isoformat()
                            }
                        )
                        assigned_count += 1
                        print(f"✅ Assigned lead {lead['id']} to agent {agent_id}")
                    except Exception as e:
                        print(f"❌ Failed to assign lead {lead.get('id')}: {e}")
                
                print(f"✅ Assigned {assigned_count} additional leads to agent {agent_id}")
        
    except Exception as e:
        print(f"❌ Error in reassignment: {e}")

def main():
    print("🛠️ LEAD SYSTEM CLEANUP AND INTEGRITY CHECK")
    print("=" * 50)
    
    # Step 1: Remove fake leads
    removed_count = identify_and_remove_fake_leads()
    
    # Step 2: Check integrity
    check_lead_assignment_integrity()
    
    # Step 3: Reassign if needed
    if removed_count > 0:
        reassign_leads_if_needed()
    
    print("\n✅ Lead system cleanup completed!")

if __name__ == "__main__":
    main()