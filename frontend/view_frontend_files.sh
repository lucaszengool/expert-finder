#!/bin/bash

# Commands to view all relevant frontend files
# Run these commands and share the output

echo "=== VIEWING FRONTEND FILES ==="
echo ""

echo "1. Main App.js:"
echo "==============="
cat src/App.js
echo ""

echo "2. API Service:"
echo "==============="
cat src/services/api.js
echo ""

echo "3. Existing Expert Results Component:"
echo "====================================="
cat src/components/ExpertResults.js
echo ""

echo "4. Search Bar Component:"
echo "========================"
cat src/components/SearchBar.js
echo ""

echo "5. Enhanced Expert Card (Modern):"
echo "================================="
cat src/components/modern/EnhancedExpertCard.js | head -50
echo "... (showing first 50 lines)"
echo ""

echo "6. Email Composer:"
echo "=================="
cat src/components/modern/EmailComposer.js | head -50
echo "... (showing first 50 lines)"
echo ""

echo "7. Check if ExpertDetailModal exists:"
echo "====================================="
if [ -f "src/components/modern/ExpertDetailModal.js" ]; then
    cat src/components/modern/ExpertDetailModal.js | head -50
    echo "... (showing first 50 lines)"
else
    echo "ExpertDetailModal.js not found"
fi
echo ""

echo "8. Package.json dependencies:"
echo "============================="
grep -A 20 '"dependencies"' package.json
echo ""

echo "9. Check for Router setup:"
echo "=========================="
grep -n "Router\|Route\|router" src/App.js
echo ""

echo "10. Check index.js:"
echo "==================="
cat src/index.js
echo ""

echo "11. Check for existing pages directory:"
echo "======================================="
if [ -d "src/pages" ]; then
    ls -la src/pages/
    echo "Found pages directory"
else
    echo "No pages directory found"
fi
echo ""

echo "12. Environment variables:"
echo "========================="
if [ -f ".env" ]; then
    grep "REACT_APP_" .env | sed 's/=.*/=***/'
else
    echo "No .env file found"
fi
echo ""

echo "=== END OF FILE VIEWING ==="
