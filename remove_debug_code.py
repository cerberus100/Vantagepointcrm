#!/usr/bin/env python3
"""
Remove debug functions and debug button from production code
"""

import re

def remove_debug_code(content):
    """Remove debug-related code from HTML/JS files"""
    
    # 1. Remove debug button creation block
    # Find and remove the entire setTimeout block that creates debug button
    debug_button_pattern = r'// Add debug button to page for testing\s*setTimeout\(\(\) => \{[\s\S]*?\}, 1000\);'
    content = re.sub(debug_button_pattern, '', content)
    
    # 2. Remove debugDealTrackerButtons function
    debug_tracker_pattern = r'// MANUAL DEBUG FUNCTION:[\s\S]*?function debugDealTrackerButtons\(\) \{[\s\S]*?\}'
    content = re.sub(debug_tracker_pattern, '', content)
    
    # 3. Remove forceDealTrackerButtons function
    force_tracker_pattern = r'function forceDealTrackerButtons\(\) \{[\s\S]*?\n        \}'
    content = re.sub(force_tracker_pattern, '', content)
    
    # 4. Remove global debug function assignments
    content = re.sub(r'window\.debugDealTrackerButtons = debugDealTrackerButtons;', '', content)
    content = re.sub(r'window\.forceDealTrackerButtons = forceDealTrackerButtons;', '', content)
    
    # 5. Remove calls to forceDealTrackerButtons
    content = re.sub(r'forceDealTrackerButtons\(\);', '', content)
    
    # 6. Remove debugModalTest function and related code
    debug_modal_pattern = r'function debugModalTest\(\) \{[\s\S]*?\n        \}'
    content = re.sub(debug_modal_pattern, '', content)
    
    # 7. Clean up any leftover empty lines
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    return content

def process_file(filepath):
    """Process a single file to remove debug code"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_length = len(content)
    cleaned_content = remove_debug_code(content)
    new_length = len(cleaned_content)
    
    if original_length != new_length:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        print(f"  ✅ Removed {original_length - new_length} characters of debug code")
    else:
        print(f"  ℹ️  No debug code found")
    
    return original_length - new_length

def main():
    """Main function to process production files"""
    print("🧹 Removing debug code from production files\n")
    
    files_to_clean = [
        'index.html',
        'aws_deploy/index.html'
    ]
    
    total_removed = 0
    
    for filepath in files_to_clean:
        removed = process_file(filepath)
        total_removed += removed
    
    print(f"\n✅ Total characters of debug code removed: {total_removed}")
    print("\nDebug features removed:")
    print("- Debug button in header")
    print("- debugDealTrackerButtons() function")
    print("- forceDealTrackerButtons() function")
    print("- debugModalTest() function")
    print("- Global debug function assignments")

if __name__ == "__main__":
    main()
