import os
import sys
import unittest.mock as mock

# Set environment to avoid database connections
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['TESTING'] = 'true'

# Mock all database and external service initializations
print("Testing imports only (no external connections)...\n")

# Mock the database metadata creation at module level
mock_create_all = mock.patch('sqlalchemy.schema.MetaData.create_all')
mock_embeddings = mock.patch('app.utils.embeddings.EmbeddingGenerator.__init__', return_value=None)

with mock_create_all, mock_embeddings:
    errors = []
    
    # Test each module
    modules = [
        'app.api.marketplace',
        'app.api.matching',
        'app.api.experts',
        'app.api.search'
    ]
    
    for module in modules:
        try:
            __import__(module)
            print(f"✓ {module} imports OK")
        except Exception as e:
            print(f"✗ {module} failed: {e}")
            errors.append((module, e))
    
    # Test main app
    try:
        from app.main import app
        print("✓ app.main imports OK")
    except Exception as e:
        print(f"✗ app.main failed: {e}")
        errors.append(('app.main', e))

if errors:
    print(f"\n{len(errors)} import errors found!")
    for module, error in errors:
        print(f"\n{module}: {error}")
else:
    print("\n✅ All imports successful! Ready to build Docker.")
