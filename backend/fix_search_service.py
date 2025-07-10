# Find line with Anthropic initialization and comment it out
import sys

with open('/app/app/services/search_service.py', 'r') as f:
    lines = f.readlines()

# Find and fix the problematic line
for i, line in enumerate(lines):
    if 'self.anthropic = Anthropic' in line:
        lines[i] = '        self.anthropic = None  # Temporarily disabled\n'
        break

with open('/app/app/services/search_service.py', 'w') as f:
    f.writelines(lines)

print("Fixed search_service.py")
