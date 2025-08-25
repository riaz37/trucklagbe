#!/bin/bash

# Load Testing Suite for TruckLagbe API
# This script runs comprehensive load tests with massive data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
TEST_DURATION="30m"
MAX_CONCURRENT_USERS=1000
REPORTS_DIR="./load-test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🚀 TruckLagbe Load Testing Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Timestamp: $TIMESTAMP"
echo -e "API URL: $API_URL"
echo -e "Reports Directory: $REPORTS_DIR"
echo ""

# Function to check if API is running
check_api_health() {
    echo -e "${CYAN}🔍 Checking API health...${NC}"
    
    if curl -s "$API_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ API is running and healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ API is not responding${NC}"
        echo -e "${YELLOW}Please start your API server first:${NC}"
        echo -e "  npm run start:prod"
        return 1
    fi
}

# Function to check dependencies
check_dependencies() {
    echo -e "${CYAN}🔍 Checking dependencies...${NC}"
    
    local missing_deps=()
    
    if ! command -v artillery &> /dev/null; then
        missing_deps+=("artillery")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Installing missing dependencies...${NC}"
        
        if [[ " ${missing_deps[*]} " =~ " artillery " ]]; then
            npm install -g artillery
        fi
        
        if [[ " ${missing_deps[*]} " =~ " node " ]] || [[ " ${missing_deps[*]} " =~ " npm " ]]; then
            echo -e "${RED}Please install Node.js and npm first${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ All dependencies are available${NC}"
    fi
}

# Function to generate test data
generate_test_data() {
    echo -e "${CYAN}📊 Generating test data...${NC}"
    
    if [ ! -f "scripts/generate-massive-data.js" ]; then
        echo -e "${RED}❌ Test data generator script not found${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  This will generate massive amounts of test data${NC}"
    echo -e "${YELLOW}Estimated time: 5-10 minutes${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Generating massive test data...${NC}"
        node scripts/generate-massive-data.js
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Test data generated successfully${NC}"
        else
            echo -e "${RED}❌ Failed to generate test data${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping test data generation${NC}"
    fi
}

# Function to run database performance tests
run_db_performance_tests() {
    echo -e "${CYAN}🗄️  Running database performance tests...${NC}"
    
    if [ ! -f "scripts/test-database-performance.js" ]; then
        echo -e "${RED}❌ Database performance test script not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Testing database performance under load...${NC}"
    node scripts/test-database-performance.js > "$REPORTS_DIR/db-performance-$TIMESTAMP.log" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database performance tests completed${NC}"
        echo -e "${BLUE}📄 Report saved to: $REPORTS_DIR/db-performance-$TIMESTAMP.log${NC}"
    else
        echo -e "${RED}❌ Database performance tests failed${NC}"
        echo -e "${YELLOW}Check the log file for details${NC}"
    fi
}

# Function to run Artillery load tests
run_artillery_tests() {
    echo -e "${CYAN}🚀 Running Artillery load tests...${NC}"
    
    if [ ! -f "artillery-heavy-load.yml" ]; then
        echo -e "${RED}❌ Artillery configuration file not found${NC}"
        return 1
    fi
    
    local test_name="heavy-load-test"
    local report_file="$REPORTS_DIR/artillery-$test_name-$TIMESTAMP.json"
    local html_report="$REPORTS_DIR/artillery-$test_name-$TIMESTAMP.html"
    
    echo -e "${BLUE}🔄 Starting heavy load test...${NC}"
    echo -e "${BLUE}📊 Test configuration: artillery-heavy-load.yml${NC}"
    echo -e "${BLUE}📄 JSON report: $report_file${NC}"
    echo -e "${BLUE}🌐 HTML report: $html_report${NC}"
    
    # Run Artillery test
    artillery run \
        --output "$report_file" \
        --report "$html_report" \
        artillery-heavy-load.yml
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Artillery load test completed${NC}"
        echo -e "${BLUE}📊 Results saved to: $report_file${NC}"
        echo -e "${BLUE}🌐 HTML report: $html_report${NC}"
        
        # Display summary
        if command -v jq &> /dev/null; then
            echo -e "\n${CYAN}📈 Test Summary:${NC}"
            jq -r '.aggregate.counts | "Total Requests: \(.total)\nSuccessful: \(.ok)\nFailed: \(.ko)\nSuccess Rate: \(.ok / .total * 100 | round)%"' "$report_file" 2>/dev/null || echo "Could not parse test results"
        fi
    else
        echo -e "${RED}❌ Artillery load test failed${NC}"
        return 1
    fi
}

# Function to run custom load tests
run_custom_load_tests() {
    echo -e "${CYAN}⚡ Running custom load tests...${NC}"
    
    # Test 1: Burst load test
    echo -e "${BLUE}🔄 Test 1: Burst load test (1000 concurrent users)${NC}"
    artillery run \
        --output "$REPORTS_DIR/burst-test-$TIMESTAMP.json" \
        --report "$REPORTS_DIR/burst-test-$TIMESTAMP.html" \
        -c '{"phases": [{"duration": "2m", "arrivalRate": 1000}]}' \
        artillery-heavy-load.yml
    
    # Test 2: Sustained load test
    echo -e "${BLUE}🔄 Test 2: Sustained load test (500 users for 10 minutes)${NC}"
    artillery run \
        --output "$REPORTS_DIR/sustained-test-$TIMESTAMP.json" \
        --report "$REPORTS_DIR/sustained-test-$TIMESTAMP.html" \
        -c '{"phases": [{"duration": "10m", "arrivalRate": 500}]}' \
        artillery-heavy-load.yml
    
    # Test 3: Ramp-up test
    echo -e "${BLUE}🔄 Test 3: Ramp-up test (0 to 1000 users)${NC}"
    artillery run \
        --output "$REPORTS_DIR/rampup-test-$TIMESTAMP.json" \
        --report "$REPORTS_DIR/rampup-test-$TIMESTAMP.html" \
        -c '{"phases": [{"duration": "5m", "arrivalRate": 0, "rampTo": 1000}]}' \
        artillery-heavy-load.yml
    
    echo -e "${GREEN}✅ Custom load tests completed${NC}"
}

# Function to run stress tests
run_stress_tests() {
    echo -e "${CYAN}💥 Running stress tests...${NC}"
    
    # Test 1: Memory stress test
    echo -e "${BLUE}🔄 Test 1: Memory stress test${NC}"
    artillery run \
        --output "$REPORTS_DIR/memory-stress-$TIMESTAMP.json" \
        --report "$REPORTS_DIR/memory-stress-$TIMESTAMP.html" \
        -c '{"phases": [{"duration": "5m", "arrivalRate": 2000}]}' \
        artillery-heavy-load.yml
    
    # Test 2: Database connection stress test
    echo -e "${BLUE}🔄 Test 2: Database connection stress test${NC}"
    artillery run \
        --output "$REPORTS_DIR/db-stress-$TIMESTAMP.json" \
        --report "$REPORTS_DIR/db-stress-$TIMESTAMP.html" \
        -c '{"phases": [{"duration": "3m", "arrivalRate": 3000}]}' \
        artillery-heavy-load.yml
    
    echo -e "${GREEN}✅ Stress tests completed${NC}"
}

# Function to generate comprehensive report
generate_comprehensive_report() {
    echo -e "${CYAN}📊 Generating comprehensive report...${NC}"
    
    local report_file="$REPORTS_DIR/comprehensive-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# TruckLagbe Load Testing Report
Generated: $(date)

## Test Summary
- **Timestamp**: $TIMESTAMP
- **API URL**: $API_URL
- **Test Duration**: $TEST_DURATION
- **Max Concurrent Users**: $MAX_CONCURRENT_USERS

## Test Results

### 1. Database Performance Tests
- **Status**: $(grep -q "✅ Database performance tests completed" "$REPORTS_DIR/db-performance-$TIMESTAMP.log" && echo "PASSED" || echo "FAILED")
- **Log File**: db-performance-$TIMESTAMP.log

### 2. Artillery Load Tests
- **Heavy Load Test**: artillery-heavy-load-$TIMESTAMP.json
- **HTML Report**: artillery-heavy-load-$TIMESTAMP.html

### 3. Custom Load Tests
- **Burst Test**: burst-test-$TIMESTAMP.json
- **Sustained Test**: sustained-test-$TIMESTAMP.json
- **Ramp-up Test**: rampup-test-$TIMESTAMP.json

### 4. Stress Tests
- **Memory Stress**: memory-stress-$TIMESTAMP.json
- **Database Stress**: db-stress-$TIMESTAMP.json

## Performance Metrics
$(if [ -f "$REPORTS_DIR/artillery-heavy-load-$TIMESTAMP.json" ]; then
    echo "### Response Time Statistics"
    echo "- P95 Response Time: $(jq -r '.aggregate.latency.p95 // "N/A"' "$REPORTS_DIR/artillery-heavy-load-$TIMESTAMP.json" 2>/dev/null || echo "N/A")"
    echo "- P99 Response Time: $(jq -r '.aggregate.latency.p99 // "N/A"' "$REPORTS_DIR/artillery-heavy-load-$TIMESTAMP.json" 2>/dev/null || echo "N/A")"
    echo "- Average Response Time: $(jq -r '.aggregate.latency.median // "N/A"' "$REPORTS_DIR/artillery-heavy-load-$TIMESTAMP.json" 2>/dev/null || echo "N/A")"
fi)

## Recommendations
1. **Database Optimization**: Review slow queries and add appropriate indexes
2. **API Performance**: Monitor response times and optimize slow endpoints
3. **Resource Usage**: Monitor memory and CPU usage during peak loads
4. **Scalability**: Consider horizontal scaling for high-traffic scenarios

## Next Steps
1. Review all test reports in the $REPORTS_DIR directory
2. Analyze performance bottlenecks
3. Implement optimizations based on findings
4. Re-run tests to validate improvements
EOF

    echo -e "${GREEN}✅ Comprehensive report generated: $report_file${NC}"
}

# Function to cleanup old reports
cleanup_old_reports() {
    echo -e "${CYAN}🧹 Cleaning up old reports (older than 7 days)...${NC}"
    
    find "$REPORTS_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    find "$REPORTS_DIR" -name "*.html" -mtime +7 -delete 2>/dev/null || true
    find "$REPORTS_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    find "$REPORTS_DIR" -name "*.md" -mtime +7 -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting comprehensive load testing suite...${NC}"
    echo ""
    
    # Check prerequisites
    check_dependencies
    check_api_health
    
    # Generate test data if needed
    read -p "Generate massive test data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_test_data
    fi
    
    # Run all tests
    echo -e "\n${PURPLE}🧪 Running all load tests...${NC}"
    
    # Database performance tests
    run_db_performance_tests
    
    # Artillery load tests
    run_artillery_tests
    
    # Custom load tests
    run_custom_load_tests
    
    # Stress tests
    run_stress_tests
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Cleanup old reports
    cleanup_old_reports
    
    echo -e "\n${GREEN}🎉 All load tests completed successfully!${NC}"
    echo -e "${BLUE}📁 Check the reports directory: $REPORTS_DIR${NC}"
    echo -e "${BLUE}📊 Open HTML reports in your browser to view detailed results${NC}"
}

# Handle script arguments
case "${1:-}" in
    "health")
        check_api_health
        ;;
    "data")
        generate_test_data
        ;;
    "db")
        run_db_performance_tests
        ;;
    "artillery")
        run_artillery_tests
        ;;
    "custom")
        run_custom_load_tests
        ;;
    "stress")
        run_stress_tests
        ;;
    "report")
        generate_comprehensive_report
        ;;
    "cleanup")
        cleanup_old_reports
        ;;
    "help"|"-h"|"--help")
        echo -e "${BLUE}Usage: $0 [command]${NC}"
        echo -e "${BLUE}Commands:${NC}"
        echo -e "  health   - Check API health"
        echo -e "  data     - Generate test data"
        echo -e "  db       - Run database performance tests"
        echo -e "  artillery- Run Artillery load tests"
        echo -e "  custom   - Run custom load tests"
        echo -e "  stress   - Run stress tests"
        echo -e "  report   - Generate comprehensive report"
        echo -e "  cleanup  - Clean up old reports"
        echo -e "  help     - Show this help message"
        echo -e "  (no args)- Run all tests"
        ;;
    *)
        main
        ;;
esac 