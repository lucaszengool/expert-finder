#!/usr/bin/env python3
import re

# Read main.py
with open('app/main.py', 'r') as f:
    content = f.read()

# Check for the syntax error - likely duplicate or misplaced import
lines = content.split('\n')

# Find and fix the issue
fixed_lines = []
seen_imports = set()
in_error_handler = False

for i, line in enumerate(lines):
    # Skip duplicate imports
    if line.strip().startswith(('import ', 'from ')) and line.strip() in seen_imports:
        print(f"Removing duplicate: {line.strip()}")
        continue
    
    if line.strip().startswith(('import ', 'from ')):
        seen_imports.add(line.strip())
    
    # Check for orphaned imports (imports not at the top)
    if i > 50 and line.strip() == "from fastapi import Request":
        print(f"Found orphaned import at line {i+1}, removing it")
        continue
    
    fixed_lines.append(line)

# Write back
with open('app/main.py', 'w') as f:
    f.write('\n'.join(fixed_lines))

print("✓ Fixed main.py syntax")
