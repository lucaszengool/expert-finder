#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file
OUTPUT_FILE="project_analysis_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${GREEN}Starting comprehensive project analysis...${NC}"
echo "Results will be saved to: ${OUTPUT_FILE}"
echo "====================================" > "$OUTPUT_FILE"
echo "Project Analysis Report" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to add section headers
add_section() {
    echo "" >> "$OUTPUT_FILE"
    echo "====================================" >> "$OUTPUT_FILE"
    echo "$1" >> "$OUTPUT_FILE"
    echo "====================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo -e "${BLUE}Analyzing: $1${NC}"
}

# Function to safely cat files
safe_cat() {
    if [ -f "$1" ]; then
        echo "=== File: $1 ===" >> "$OUTPUT_FILE"
        cat "$1" >> "$OUTPUT_FILE" 2>/dev/null
        echo "" >> "$OUTPUT_FILE"
    else
        echo "=== File: $1 (NOT FOUND) ===" >> "$OUTPUT_FILE"
    fi
}

# 1. Backend Structure & Search Implementation
add_section "1. BACKEND STRUCTURE & SEARCH FILES"

echo "Finding all search-related Python files..." >> "$OUTPUT_FILE"
find backend -type f -name "*.py" | grep -E "(search|match|expert|vector|embed)" | head -50 >> "$OUTPUT_FILE" 2>/dev/null

add_section "2. SEARCH SERVICE IMPLEMENTATIONS"

safe_cat "backend/app/services/search_service.py"
safe_cat "backend/app/services/enhanced_search_service.py"
safe_cat "backend/app/services/vector_search.py"
safe_cat "backend/app/services/matching_service.py"
safe_cat "backend/app/services/expert_service.py"

add_section "3. API ENDPOINTS"

safe_cat "backend/app/api/search.py"
safe_cat "backend/app/api/experts.py"
safe_cat "backend/app/api/enhanced_experts.py"
safe_cat "backend/app/api/matching.py"

add_section "4. DATA MODELS"

safe_cat "backend/app/models/search.py"
safe_cat "backend/app/models/expert.py"
safe_cat "backend/app/models/db_models.py"
safe_cat "backend/app/models/expert_dna.py"

add_section "5. UTILITIES"

safe_cat "backend/app/utils/embeddings.py"
safe_cat "backend/app/utils/database.py"

add_section "6. DATABASE SCHEMA & DATA PROCESSING"

echo "=== Data Processing Directory ===" >> "$OUTPUT_FILE"
ls -la backend/data_processing/ >> "$OUTPUT_FILE" 2>/dev/null
echo "" >> "$OUTPUT_FILE"

find backend/data_processing -name "*.py" -type f 2>/dev/null | while read -r file; do
    safe_cat "$file"
done

add_section "7. CONFIGURATION FILES"

safe_cat "backend/requirements.txt"
safe_cat "backend/app/main.py"

echo "=== Looking for config files ===" >> "$OUTPUT_FILE"
find backend -name "*.env*" -o -name "config*.py" -o -name "settings*.py" 2>/dev/null | while read -r file; do
    safe_cat "$file"
done

add_section "8. SEARCH ALGORITHM DETAILS"

echo "=== Grep for ranking/scoring logic ===" >> "$OUTPUT_FILE"
grep -r "rank\|score\|match\|similarity\|embed\|vector" backend/app --include="*.py" 2>/dev/null | grep -v "__pycache__" | head -100 >> "$OUTPUT_FILE"

add_section "9. DATA SOURCES & SCRAPING"

safe_cat "backend/app/services/linkedin_scraper.py"
safe_cat "backend/app/services/linkedin_profile_extractor.py"
safe_cat "backend/app/agents/web_search_agent.py"
safe_cat "backend/app/agents/scholar_agent.py"

add_section "10. TEST FILES"

echo "=== Finding test files ===" >> "$OUTPUT_FILE"
find backend/tests -name "*search*" -o -name "*match*" -o -name "*expert*" 2>/dev/null | while read -r file; do
    safe_cat "$file"
done

add_section "11. DEBUG AND FIX SCRIPTS"

echo "=== Listing fix/debug scripts ===" >> "$OUTPUT_FILE"
ls -la backend/*fix*.py backend/*debug*.py 2>/dev/null >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

add_section "12. PROJECT STRUCTURE"

echo "=== Backend Python File Tree ===" >> "$OUTPUT_FILE"
if command -v tree &> /dev/null; then
    tree backend -P "*.py" -I "__pycache__|venv|*.pyc" >> "$OUTPUT_FILE" 2>/dev/null
else
    echo "Tree command not found, using find instead:" >> "$OUTPUT_FILE"
    find backend -name "*.py" -type f | grep -v "__pycache__" | sort >> "$OUTPUT_FILE" 2>/dev/null
fi

add_section "13. IMPORTS ANALYSIS"

echo "=== Search-related imports ===" >> "$OUTPUT_FILE"
find backend -name "*.py" -exec grep -H "^import\|^from" {} \; 2>/dev/null | grep -E "(search|match|expert|vector|embed)" | head -200 >> "$OUTPUT_FILE"

add_section "14. DATABASE MIGRATIONS"

echo "=== Alembic migrations ===" >> "$OUTPUT_FILE"
ls -la backend/alembic/versions/ >> "$OUTPUT_FILE" 2>/dev/null

add_section "15. FRONTEND SEARCH (if accessible)"

echo "=== Looking for frontend search implementations ===" >> "$OUTPUT_FILE"
echo "Note: Adjust paths if frontend is in a different location" >> "$OUTPUT_FILE"

# Common frontend locations
for dir in "frontend" "client" "web" "src"; do
    if [ -d "$dir" ]; then
        echo "Found frontend directory: $dir" >> "$OUTPUT_FILE"
        find "$dir" -path "*/node_modules" -prune -o -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -print 2>/dev/null | xargs grep -l "search\|expert\|match" 2>/dev/null | head -20 >> "$OUTPUT_FILE"
    fi
done

# Summary
add_section "ANALYSIS COMPLETE"

echo "Total lines in report: $(wc -l < "$OUTPUT_FILE")" >> "$OUTPUT_FILE"
echo "Report generated successfully!" >> "$OUTPUT_FILE"

echo -e "${GREEN}Analysis complete!${NC}"
echo -e "${YELLOW}Results saved to: ${OUTPUT_FILE}${NC}"
echo ""
echo "To view the report:"
echo "  cat $OUTPUT_FILE"
echo ""
echo "To share the report:"
echo "  1. Upload the file directly, or"
echo "  2. Use: cat $OUTPUT_FILE | pbcopy  (on macOS)"
echo "  3. Use: cat $OUTPUT_FILE | xclip -selection clipboard  (on Linux)"

# Optional: Create a compressed version for easier sharing
if command -v gzip &> /dev/null; then
    gzip -c "$OUTPUT_FILE" > "${OUTPUT_FILE}.gz"
    echo -e "${GREEN}Also created compressed version: ${OUTPUT_FILE}.gz${NC}"
fi
