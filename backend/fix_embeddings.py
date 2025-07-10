import os

# Read the file
with open('app/utils/embeddings.py', 'r') as f:
    content = f.read()

# Replace the hardcoded path
content = content.replace(
    'MODEL_CACHE_DIR = "/app/models"',
    'MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")'
)

# Write back
with open('app/utils/embeddings.py', 'w') as f:
    f.write(content)

print("Fixed embeddings.py")
