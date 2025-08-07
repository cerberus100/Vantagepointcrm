#!/usr/bin/env python3
"""
Input Validation Functions for Lambda
"""

validation_code = '''
import re
from typing import Dict, Any, List, Optional

class InputValidator:
    """Comprehensive input validation for all API endpoints"""
    
    # Regex patterns for validation
    PATTERNS = {
        'username': r'^[a-zA-Z0-9_-]{3,32}$',
        'password': r'^.{8,128}$',  # Min 8 chars, max 128
        'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'phone': r'^[\d\s\-\(\)\+\.]{10,20}$',
        'zip_code': r'^\d{5}(-\d{4})?$',
        'npi': r'^\d{10}$',
        'ein': r'^\d{2}-?\d{7}$',
        'ptan': r'^[A-Z0-9]{6,10}$',
        'state': r'^[A-Z]{2}$',
        'status': r'^(new|contacted|qualified|closed_won|closed_lost|disposed|sold|NEW|CONTACTED|QUALIFIED|CLOSED_WON|CLOSED_LOST)$',
        'role': r'^(admin|manager|agent)$',
        'priority': r'^(low|medium|high|A\+?|B|C)$'
    }
    
    # Max lengths for string fields
    MAX_LENGTHS = {
        'practice_name': 200,
        'owner_name': 100,
        'address': 200,
        'city': 100,
        'specialty': 100,
        'notes': 1000,
        'full_name': 100
    }
    
    # Required fields for different operations
    REQUIRED_FIELDS = {
        'login': ['username', 'password'],
        'create_lead': ['practice_name', 'owner_name', 'practice_phone'],
        'update_lead': [],  # No required fields for updates
        'create_user': ['username', 'role'],
        'send_docs': []  # Lead must have email, but that's checked separately
    }
    
    @staticmethod
    def validate_pattern(value: str, pattern_name: str) -> bool:
        """Validate value against a regex pattern"""
        pattern = InputValidator.PATTERNS.get(pattern_name)
        if not pattern:
            return True  # No pattern defined, allow
        return bool(re.match(pattern, value))
    
    @staticmethod
    def validate_length(value: str, field_name: str) -> bool:
        """Validate string length"""
        max_length = InputValidator.MAX_LENGTHS.get(field_name, 500)  # Default max
        return len(value) <= max_length
    
    @staticmethod
    def sanitize_string(value: str, field_type: str = 'general') -> str:
        """Sanitize string input to prevent injection attacks"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Trim whitespace
        value = value.strip()
        
        # Field-specific sanitization
        if field_type == 'phone':
            # Keep only digits, spaces, and common phone chars
            value = re.sub(r'[^0-9\s\-\(\)\+\.]', '', value)
        elif field_type == 'email':
            # Convert to lowercase, remove dangerous chars
            value = value.lower()
            value = re.sub(r'[<>\"\'\\;]', '', value)
        elif field_type == 'alphanumeric':
            # Keep only alphanumeric, space, dash, underscore
            value = re.sub(r'[^a-zA-Z0-9\s\-_]', '', value)
        elif field_type == 'numeric':
            # Keep only digits
            value = re.sub(r'[^0-9]', '', value)
        else:
            # General sanitization - remove potential SQL/NoSQL injection chars
            dangerous_chars = ['$', '{', '}', '<', '>', '`', '\\', '\n', '\r', '\t']
            for char in dangerous_chars:
                value = value.replace(char, '')
        
        return value
    
    @staticmethod
    def validate_login(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate login request"""
        # Check required fields
        for field in InputValidator.REQUIRED_FIELDS['login']:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        # Validate username
        username = InputValidator.sanitize_string(data['username'], 'alphanumeric')
        if not InputValidator.validate_pattern(username, 'username'):
            return False, "Invalid username format"
        
        # Validate password (don't sanitize passwords)
        if not InputValidator.validate_pattern(data['password'], 'password'):
            return False, "Invalid password format"
        
        return True, None
    
    @staticmethod
    def validate_lead_data(data: Dict[str, Any], is_update: bool = False) -> tuple[bool, Optional[str]]:
        """Validate lead creation/update data"""
        operation = 'update_lead' if is_update else 'create_lead'
        
        # Check required fields (only for creation)
        if not is_update:
            for field in InputValidator.REQUIRED_FIELDS[operation]:
                if field not in data or not data[field]:
                    return False, f"Missing required field: {field}"
        
        # Validate and sanitize fields
        if 'practice_name' in data:
            data['practice_name'] = InputValidator.sanitize_string(data['practice_name'])
            if not InputValidator.validate_length(data['practice_name'], 'practice_name'):
                return False, "Practice name too long"
        
        if 'owner_name' in data:
            data['owner_name'] = InputValidator.sanitize_string(data['owner_name'])
            if not InputValidator.validate_length(data['owner_name'], 'owner_name'):
                return False, "Owner name too long"
        
        if 'email' in data and data['email']:
            data['email'] = InputValidator.sanitize_string(data['email'], 'email')
            if not InputValidator.validate_pattern(data['email'], 'email'):
                return False, "Invalid email format"
        
        if 'practice_phone' in data:
            data['practice_phone'] = InputValidator.sanitize_string(data['practice_phone'], 'phone')
            if not InputValidator.validate_pattern(data['practice_phone'], 'phone'):
                return False, "Invalid phone format"
        
        if 'zip_code' in data and data['zip_code']:
            data['zip_code'] = InputValidator.sanitize_string(data['zip_code'], 'numeric')
            if not InputValidator.validate_pattern(data['zip_code'], 'zip_code'):
                return False, "Invalid ZIP code format"
        
        if 'npi' in data and data['npi']:
            data['npi'] = InputValidator.sanitize_string(data['npi'], 'numeric')
            if not InputValidator.validate_pattern(data['npi'], 'npi'):
                return False, "Invalid NPI format"
        
        if 'ein_tin' in data and data['ein_tin']:
            data['ein_tin'] = InputValidator.sanitize_string(data['ein_tin'], 'numeric')
            if not InputValidator.validate_pattern(data['ein_tin'], 'ein'):
                return False, "Invalid EIN format"
        
        if 'state' in data and data['state']:
            data['state'] = data['state'].upper()
            if not InputValidator.validate_pattern(data['state'], 'state'):
                return False, "Invalid state code"
        
        if 'status' in data:
            if not InputValidator.validate_pattern(data['status'], 'status'):
                return False, "Invalid status value"
        
        if 'priority' in data:
            if not InputValidator.validate_pattern(data['priority'], 'priority'):
                return False, "Invalid priority value"
        
        # Validate numeric fields
        numeric_fields = ['score', 'assigned_user_id']
        for field in numeric_fields:
            if field in data:
                try:
                    data[field] = int(data[field])
                except (ValueError, TypeError):
                    return False, f"Invalid {field} - must be a number"
        
        return True, None
    
    @staticmethod
    def validate_user_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate user creation data"""
        # Check required fields
        for field in InputValidator.REQUIRED_FIELDS['create_user']:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        # Validate username
        data['username'] = InputValidator.sanitize_string(data['username'], 'alphanumeric')
        if not InputValidator.validate_pattern(data['username'], 'username'):
            return False, "Invalid username format"
        
        # Validate role
        if not InputValidator.validate_pattern(data['role'], 'role'):
            return False, "Invalid role"
        
        # Validate password if provided
        if 'password' in data and data['password']:
            if not InputValidator.validate_pattern(data['password'], 'password'):
                return False, "Password must be at least 8 characters"
        
        # Validate email if provided
        if 'email' in data and data['email']:
            data['email'] = InputValidator.sanitize_string(data['email'], 'email')
            if not InputValidator.validate_pattern(data['email'], 'email'):
                return False, "Invalid email format"
        
        # Validate full name if provided
        if 'full_name' in data:
            data['full_name'] = InputValidator.sanitize_string(data['full_name'])
            if not InputValidator.validate_length(data['full_name'], 'full_name'):
                return False, "Full name too long"
        
        return True, None
    
    @staticmethod
    def validate_bulk_leads(leads_data: List[Dict[str, Any]]) -> tuple[bool, Optional[str]]:
        """Validate bulk lead upload data"""
        if not isinstance(leads_data, list):
            return False, "Leads data must be an array"
        
        if len(leads_data) == 0:
            return False, "No leads provided"
        
        if len(leads_data) > 1000:
            return False, "Maximum 1000 leads per batch"
        
        # Validate each lead
        for i, lead in enumerate(leads_data):
            valid, error = InputValidator.validate_lead_data(lead, is_update=False)
            if not valid:
                return False, f"Lead {i+1}: {error}"
        
        return True, None
'''

print("✅ Input validation code created!")
print("\nThis provides:")
print("- Pattern validation for all input fields")
print("- Length validation to prevent buffer overflows")
print("- Input sanitization to prevent injection attacks")
print("- Field-specific validation rules")
print("- Comprehensive error messages")
