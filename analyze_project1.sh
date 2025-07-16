#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file
OUTPUT_FILE="search_analysis_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${GREEN}Starting focused search analysis...${NC}"
echo "Results will be saved to: ${OUTPUT_FILE}"
echo "====================================" > "$OUTPUT_FILE"
echo "Search System Analysis Report" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to add section headers
add_section() {
    echo "" >> "$OUTPUT_FILE"
    echo "========== $1 ==========" >> "$OUTPUT_FILE"
    echo -e "${BLUE}Analyzing: $1${NC}"
}

# Function to extract key parts of files
extract_key_parts() {
    local file=$1
    local patterns=$2
    
    if [ -f "$file" ]; then
        echo "=== File: $file ===" >> "$OUTPUT_FILE"
        echo "--- Key sections only ---" >> "$OUTPUT_FILE"
        
        # Extract imports
        echo "IMPORTS:" >> "$OUTPUT_FILE"
        grep -E "^import|^from" "$file" 2>/dev/null | head -20 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Extract class and function definitions
        echo "CLASSES/FUNCTIONS:" >> "$OUTPUT_FILE"
        grep -E "^class |^def |^async def " "$file" 2>/dev/null >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Extract specific patterns if provided
        if [ ! -z "$patterns" ]; then
            echo "KEY LOGIC ($patterns):" >> "$OUTPUT_FILE"
            grep -A 5 -B 2 -E "$patterns" "$file" 2>/dev/null | head -50 >> "$OUTPUT_FILE"
        fi
        echo "" >> "$OUTPUT_FILE"
    else
        echo "=== File: $file (NOT FOUND) ===" >> "$OUTPUT_FILE"
    fi
}

# 1. Core Search Implementation
add_section "1. CORE SEARCH IMPLEMENTATION"

extract_key_parts "backend/app/services/search_service.py" "search|query|rank|score|filter"
extract_key_parts "backend/app/services/vector_search.py" "embed|vector|similarity|distance"
extract_key_parts "backend/app/api/search.py" "route|endpoint|get|post"

# 2. Data Models (Structure only)
add_section "2. DATA MODELS STRUCTURE"

for file in backend/app/models/expert.py backend/app/models/db_models.py backend/app/models/search.py; do
    if [ -f "$file" ]; then
        echo "=== $file ===" >> "$OUTPUT_FILE"
        grep -E "class |Column|String|Integer|relationship|Table" "$file" 2>/dev/null | head -30 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# 3. Data Sources
add_section "3. DATA SOURCE CONFIGURATION"

extract_key_parts "backend/app/services/linkedin_scraper.py" "scrape|extract|parse|linkedin"
extract_key_parts "backend/app/agents/web_search_agent.py" "search|query|filter|expert"

# 4. Search Algorithm
add_section "4. SEARCH ALGORITHM ANALYSIS"

echo "=== Search/Ranking Logic ===" >> "$OUTPUT_FILE"
grep -r "rank\|score\|weight\|boost\|relevance" backend/app/services --include="*.py" | grep -v "__pycache__" | head -30 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "=== Filtering Logic ===" >> "$OUTPUT_FILE"
grep -r "filter\|exclude\|article\|blog\|news" backend/app --include="*.py" | grep -v "__pycache__" | head -30 >> "$OUTPUT_FILE"

# 5. Quick Config Check
add_section "5. KEY CONFIGURATIONS"

echo "=== Requirements (search-related only) ===" >> "$OUTPUT_FILE"
grep -E "embed|vector|search|elastic|langchain|openai|sentence-transformer" backend/requirements.txt 2>/dev/null >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "=== Main app search initialization ===" >> "$OUTPUT_FILE"
grep -A 10 -B 5 -E "search|vector|embed" backend/app/main.py 2>/dev/null | head -30 >> "$OUTPUT_FILE"

# 6. Database Schema
add_section "6. DATABASE SCHEMA (Latest Migration)"

echo "=== Latest migration file ===" >> "$OUTPUT_FILE"
ls -t backend/alembic/versions/*.py 2>/dev/null | head -1 | xargs grep -E "table|column|expert|profile" 2>/dev/null | head -30 >> "$OUTPUT_FILE"

# 7. Summary Info
add_section "7. QUICK DIAGNOSTIC INFO"

echo "=== File sizes (to identify which files have actual logic) ===" >> "$OUTPUT_FILE"
find backend/app -name "*.py" -path "*search*" -o -path "*expert*" -o -path "*match*" | xargs ls -lh 2>/dev/null | grep -v "__pycache__" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "=== Search endpoint routes ===" >> "$OUTPUT_FILE"
grep -r "@router\|@app" backend/app/api --include="*.py" | grep -E "search|expert|match" | head -20 >> "$OUTPUT_FILE"

# Create a separate minimal version
MINIMAL_FILE="search_minimal_$(date +%Y%m%d_%H%M%S).txt"

echo "Creating minimal version for quick review..." > "$MINIMAL_FILE"
echo "" >> "$MINIMAL_FILE"
echo "1. SEARCH FUNCTION SIGNATURES:" >> "$MINIMAL_FILE"
find backend/app/services -name "*.py" -exec grep -H "def.*search\|async def.*search" {} \; 2>/dev/null >> "$MINIMAL_FILE"
echo "" >> "$MINIMAL_FILE"
echo "2. EXPERT MODEL FIELDS:" >> "$MINIMAL_FILE"
grep -A 20 "class Expert" backend/app/models/*.py 2>/dev/null | grep -E "Column|relationship" | head -20 >> "$MINIMAL_FILE"
echo "" >> "$MINIMAL_FILE"
echo "3. DATA SOURCE TYPES:" >> "$MINIMAL_FILE"
grep -r "source_type\|data_source\|profile_type" backend/app --include="*.py" | head -10 >> "$MINIMAL_FILE"

echo -e "${GREEN}Analysis complete!${NC}"
echo -e "${YELLOW}Created two files:${NC}"
echo "1. Full analysis: $OUTPUT_FILE ($(wc -l < "$OUTPUT_FILE") lines)"
echo "2. Minimal version: $MINIMAL_FILE ($(wc -l < "$MINIMAL_FILE") lines)"
echo ""
echo "If still too large, just share the minimal version first."

# Compress both files
gzip -c "$OUTPUT_FILE" > "${OUTPUT_FILE}.gz" 2>/dev/null
gzip -c "$MINIMAL_FILE" > "${MINIMAL_FILE}.gz" 2>/dev/null
echo -e "${GREEN}Also created compressed versions (.gz files)${NC}"
