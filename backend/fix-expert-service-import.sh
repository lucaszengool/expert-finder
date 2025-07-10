#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔍 Checking expert_service.py structure..."

# First, let's see what's in expert_service.py
echo "📄 Content of app/services/expert_service.py (last 20 lines):"
tail -20 app/services/expert_service.py

echo -e "\n📄 Looking for class or instance definitions:"
grep -n "class\|expert_service\s*=" app/services/expert_service.py || echo "No expert_service instance found"

echo -e "\n📄 Checking how it's imported in enhanced_experts.py:"
grep -n "from app.services.expert_service import" app/api/enhanced_experts.py

# Now let's fix it
echo -e "\n🔧 Fixing the import issue..."

# Check if there's a class that should be instantiated
if grep -q "class ExpertService" app/services/expert_service.py; then
    echo "Found ExpertService class. Adding instance creation..."
    
    # Add instance creation at the end of expert_service.py if not exists
    if ! grep -q "expert_service = ExpertService" app/services/expert_service.py; then
        echo -e "\n# Create singleton instance\nexpert_service = ExpertService()" >> app/services/expert_service.py
        echo "✅ Added expert_service instance to expert_service.py"
    fi
else
    echo "⚠️  No ExpertService class found. Checking for functions..."
    
    # If it's just functions, we need to change the import in enhanced_experts.py
    echo "📝 Updating import in enhanced_experts.py..."
    
    # Change from importing expert_service to importing the module
    sed -i '' 's/from app.services.expert_service import expert_service/from app.services import expert_service/g' app/api/enhanced_experts.py
    
    echo "✅ Updated import to use module instead of instance"
fi

# Let's also check all files that import from expert_service
echo -e "\n📄 Checking all imports of expert_service:"
grep -r "from app.services.expert_service import" app/ 2>/dev/null || echo "No other imports found"

# Alternative fix: Create a proper service instance
echo -e "\n🔧 Creating a comprehensive fix..."

cat > fix_expert_service.py << 'EOF'
#!/usr/bin/env python3
import os
import re

def fix_expert_service():
    """Fix the expert_service import issue"""
    
    # Read expert_service.py
    with open('app/services/expert_service.py', 'r') as f:
        content = f.read()
    
    # Check if there's a class definition
    if 'class ExpertService' in content:
        # Check if there's already an instance
        if 'expert_service = ExpertService' not in content:
            # Add instance at the end
            content += '\n\n# Singleton instance\nexpert_service = ExpertService()\n'
            
            with open('app/services/expert_service.py', 'w') as f:
                f.write(content)
            
            print("✅ Added expert_service instance to expert_service.py")
    else:
        print("ℹ️  No ExpertService class found, it might be using functions directly")
        
        # Fix imports in files that try to import expert_service
        files_to_check = [
            'app/api/enhanced_experts.py',
            'app/api/experts.py',
            'app/api/matching.py'
        ]
        
        for file_path in files_to_check:
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    file_content = f.read()
                
                # Fix the import
                if 'from app.services.expert_service import expert_service' in file_content:
                    file_content = file_content.replace(
                        'from app.services.expert_service import expert_service',
                        'from app.services import expert_service'
                    )
                    
                    with open(file_path, 'w') as f:
                        f.write(file_content)
                    
                    print(f"✅ Fixed import in {file_path}")

if __name__ == "__main__":
    fix_expert_service()
EOF

python3 fix_expert_service.py

# Run pre-flight check again
echo -e "\n🔍 Running pre-flight check again..."
./preflight_check.py --test
