#!/usr/bin/env python3
"""
Remove all console.log statements from production code
"""

import re
import os

def remove_console_logs(content):
    """Remove console.log statements while preserving code structure"""
    # Pattern to match console.log statements (including multi-line)
    patterns = [
        # Single line console.log
        r'^\s*console\.log\([^;]*\);?\s*$',
        # Multi-line console.log
        r'^\s*console\.log\([^;]*\n[^;]*\);?\s*$',
        # Console.log with trailing code
        r'console\.log\([^)]*\);\s*',
        # Console.error, console.warn, etc.
        r'^\s*console\.(error|warn|info|debug)\([^;]*\);?\s*$',
    ]
    
    lines = content.split('\n')
    filtered_lines = []
    skip_next = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line starts a console.log
        if 'console.' in line:
            # Check for multi-line console.log
            if 'console.log(' in line and ');' not in line:
                # Find the end of the console.log
                j = i + 1
                while j < len(lines) and ');' not in lines[j]:
                    j += 1
                # Skip all these lines
                i = j + 1
                continue
            
            # Single line console statement
            skip = False
            for pattern in patterns:
                if re.match(pattern, line, re.MULTILINE):
                    skip = True
                    break
            
            if skip:
                i += 1
                continue
        
        filtered_lines.append(line)
        i += 1
    
    return '\n'.join(filtered_lines)

def process_file(filepath):
    """Process a single file to remove console.log statements"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_count = content.count('console.')
    cleaned_content = remove_console_logs(content)
    new_count = cleaned_content.count('console.')
    
    if original_count > new_count:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        print(f"  ✅ Removed {original_count - new_count} console statements")
    else:
        print(f"  ℹ️  No console statements to remove")
    
    return original_count - new_count

def main():
    """Main function to process all production files"""
    print("🧹 Removing console.log statements from production code\n")
    
    files_to_clean = [
        'index.html',
        'aws_deploy/index.html', 
        'web/script.js',
        'web/lead-edit-modal.js',
        'web/enhanced-components.js'
    ]
    
    total_removed = 0
    
    for filepath in files_to_clean:
        if os.path.exists(filepath):
            removed = process_file(filepath)
            total_removed += removed
        else:
            print(f"  ⚠️  File not found: {filepath}")
    
    print(f"\n✅ Total console statements removed: {total_removed}")
    
    # Also create a simplified console wrapper for production
    wrapper_content = """// Production console wrapper - prevents console errors in older browsers
if (typeof console === 'undefined') {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {},
        info: function() {},
        debug: function() {}
    };
}

// Disable console in production
if (window.location.hostname !== 'localhost') {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
}
"""
    
    with open('web/console-wrapper.js', 'w') as f:
        f.write(wrapper_content)
    
    print("\n📝 Created console-wrapper.js for production safety")

if __name__ == "__main__":
    main()
