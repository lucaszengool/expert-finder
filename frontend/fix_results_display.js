// Find the line with results.experts.map and add a filter before it
sed -i '' 's/{results.experts.map((expert, idx) => (/{results.experts.filter(expert => expert && expert.id).map((expert, idx) => (/' src/App.js
