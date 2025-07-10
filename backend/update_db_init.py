#!/usr/bin/env python3

# Update database.py to import new models
with open('app/models/database.py', 'r') as f:
    content = f.read()

if 'db_models' not in content:
    content = content.replace(
        'def init_db():',
        '''def init_db():
    # Import models to ensure they're registered
    from app.models import db_models'''
    )
    
    with open('app/models/database.py', 'w') as f:
        f.write(content)

print("✅ Updated database initialization")

# Update imports in __init__.py files
with open('app/models/__init__.py', 'a') as f:
    f.write('\nfrom app.models.db_models import ExpertDB, MarketplaceListingDB\n')

print("✅ Updated model imports")
