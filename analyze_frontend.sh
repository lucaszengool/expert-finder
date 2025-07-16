#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file
OUTPUT_FILE="frontend_analysis_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${GREEN}Starting frontend analysis for search display...${NC}"
echo "Results will be saved to: ${OUTPUT_FILE}"
echo "====================================" > "$OUTPUT_FILE"
echo "Frontend Search Display Analysis" >> "$OUTPUT_FILE"
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

# Function to extract key parts of files
extract_search_related() {
    local file=$1
    if [ -f "$file" ]; then
        echo "=== File: $file ===" >> "$OUTPUT_FILE"
        
        # Extract imports related to search/expert
        echo "SEARCH-RELATED IMPORTS:" >> "$OUTPUT_FILE"
        grep -E "import.*[Ee]xpert|import.*[Ss]earch|from.*api|from.*services" "$file" 2>/dev/null >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Extract component definitions and key functions
        echo "KEY FUNCTIONS/COMPONENTS:" >> "$OUTPUT_FILE"
        grep -E "function |const.*=|export |return \(|onClick|onSearch|handleSearch|results|experts" "$file" 2>/dev/null | head -30 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Extract API calls
        echo "API CALLS:" >> "$OUTPUT_FILE"
        grep -A 3 -B 1 -E "fetch|axios|api\.|searchExperts|getExperts" "$file" 2>/dev/null | head -20 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Extract how results are displayed
        echo "RESULT DISPLAY LOGIC:" >> "$OUTPUT_FILE"
        grep -A 5 -B 2 -E "map\(|\.experts|results\.|expert\.|profile|article|linkedin|github" "$file" 2>/dev/null | head -30 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    else
        echo "=== File: $file (NOT FOUND) ===" >> "$OUTPUT_FILE"
    fi
}

# 1. Main App Structure
add_section "1. MAIN APP STRUCTURE"
extract_search_related "frontend/src/App.js"

# 2. Search Components
add_section "2. SEARCH COMPONENTS"
extract_search_related "frontend/src/components/SearchBar.js"
extract_search_related "frontend/src/components/ExpertResults.js"
extract_search_related "frontend/src/components/ExpertCard.js"

# 3. Modern Components (Latest UI)
add_section "3. MODERN SEARCH COMPONENTS"
extract_search_related "frontend/src/components/modern/ExpertSearchResults.js"
extract_search_related "frontend/src/components/modern/ExpertCard.jsx"
extract_search_related "frontend/src/components/modern/EnhancedExpertCard.js"
extract_search_related "frontend/src/components/modern/ExpertDetailModal.js"

# 4. API Services
add_section "4. API SERVICES"
extract_search_related "frontend/src/services/api.js"

# Check for specific search endpoints
echo "=== Search API Endpoints ===" >> "$OUTPUT_FILE"
grep -r "search\|expert" frontend/src/services/ --include="*.js" 2>/dev/null | grep -E "endpoint|url|fetch|post|get" | head -20 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 5. State Management
add_section "5. STATE MANAGEMENT"

# Check if using Redux/Context
echo "=== Checking for state management ===" >> "$OUTPUT_FILE"
find frontend/src/store -name "*.js" -o -name "*.jsx" 2>/dev/null | head -10 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 6. Search Flow Analysis
add_section "6. SEARCH FLOW ANALYSIS"

echo "=== How search query flows through the app ===" >> "$OUTPUT_FILE"
echo "1. SearchBar component:" >> "$OUTPUT_FILE"
grep -A 5 "onSearch\|handleSearch\|handleSubmit" frontend/src/components/SearchBar.js 2>/dev/null >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "2. API call structure:" >> "$OUTPUT_FILE"
grep -A 10 -B 2 "/search\|searchExperts" frontend/src/services/api.js 2>/dev/null >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "3. Results display:" >> "$OUTPUT_FILE"
grep -A 10 "results\.map\|experts\.map" frontend/src/components/ExpertResults.js frontend/src/components/modern/ExpertSearchResults.js 2>/dev/null >> "$OUTPUT_FILE"

# 7. Check for profile type handling
add_section "7. PROFILE TYPE HANDLING"

echo "=== Checking how frontend handles profile types ===" >> "$OUTPUT_FILE"
grep -r "profile_type\|profileType\|linkedin\|github\|article\|is_verified\|isVerified" frontend/src/components --include="*.js" --include="*.jsx" 2>/dev/null | head -20 >> "$OUTPUT_FILE"

# 8. Package.json dependencies
add_section "8. RELEVANT DEPENDENCIES"

echo "=== Search/UI related packages ===" >> "$OUTPUT_FILE"
grep -E "axios|react-query|swr|redux|tailwind|mui|antd" frontend/package.json 2>/dev/null >> "$OUTPUT_FILE"

# Summary
echo "" >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"
echo "ANALYSIS SUMMARY" >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"
echo "Total files analyzed: $(find frontend/src -name "*.js" -o -name "*.jsx" | wc -l)" >> "$OUTPUT_FILE"
echo "Search-related components found:" >> "$OUTPUT_FILE"
find frontend/src -name "*[Ss]earch*" -o -name "*[Ee]xpert*" -o -name "*[Rr]esult*" 2>/dev/null | wc -l >> "$OUTPUT_FILE"

echo -e "${GREEN}Analysis complete!${NC}"
echo -e "Results saved to: ${OUTPUT_FILE}"
echo ""
echo "Next: Run 'cat $OUTPUT_FILE' to see the analysis"
