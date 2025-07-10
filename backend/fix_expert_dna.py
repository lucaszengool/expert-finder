import re

# Read the file
with open('app/models/expert_dna.py', 'r') as f:
    content = f.read()

# Add Enum import if not present
if 'from enum import Enum' not in content:
    content = 'from enum import Enum\n' + content

# Fix WorkStyle class
content = re.sub(
    r'class WorkStyle\(str\):',
    'class WorkStyle(str, Enum):',
    content
)

# Fix CommunicationStyle class
content = re.sub(
    r'class CommunicationStyle\(str\):',
    'class CommunicationStyle(str, Enum):',
    content
)

# Fix the 'any' type
content = content.replace('Dict[str, any]', 'Dict[str, Any]')

# Add Any import if needed
if 'from typing import' in content and ', Any' not in content:
    content = re.sub(
        r'from typing import (.*)',
        r'from typing import \1, Any',
        content
    )

# Write back
with open('app/models/expert_dna.py', 'w') as f:
    f.write(content)

print("Fixed expert_dna.py")
