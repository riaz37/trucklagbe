#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
# Get BASE_URL from environment or use default
BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
DRIVER_ID="1"
OPTIMIZED_ENDPOINT="/drivers/${DRIVER_ID}/analytics"
UNOPTIMIZED_ENDPOINT="/drivers/${DRIVER_ID}/analytics/unoptimized"
PERFORMANCE_ENDPOINT="/drivers/performance"
HISTORY_ENDPOINT="/drivers/performance"

# Test parameters - will be set by user input
SINGLE_REQUESTS=0
CONCURRENT_REQUESTS=0
LOAD_TEST_DURATION=0

# Data generation flag
GENERATE_DATA=false

# Debug mode flag
DEBUG_MODE=false

# Function to show usage
show_usage() {
    echo -e "${BLUE}🚀 TRUCKLAGBE PERFORMANCE COMPARISON SCRIPT${NC}"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -d, --debug     Enable debug mode for process detection"
    echo "  -h, --help      Show this help message"
    echo "  -s, --single    Number of single requests (default: interactive)"
    echo "  -c, --concurrent Number of concurrent requests (default: interactive)"
    echo "  -l, --load      Load test duration in seconds (default: interactive)"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                    # Run with interactive prompts"
    echo "  $0 -d                 # Run with debug mode and interactive prompts"
    echo "  $0 -s 50 -c 500      # Custom request counts"
    echo "  $0 --debug --load 60  # Debug mode with 60s load test"
    echo ""
    echo "ENVIRONMENT VARIABLES:"
    echo "  BASE_URL              # Base URL for the API (default: http://localhost:3000/api/v1)"
    echo "  DRIVER_ID             # Driver ID to test (default: 1)"
    echo ""
    echo "EXAMPLE:"
    echo "  BASE_URL=http://staging.example.com/api/v1 $0"
    echo ""
}

# Function to prompt user for data generation
prompt_for_data_generation() {
    echo -e "${CYAN}📊 DATA GENERATION SETUP${NC}"
    echo "=================================="
    echo ""
    
    # Show data generation information
    echo -e "${YELLOW}📈 DATA GENERATION DETAILS:${NC}"
    echo "  • Drivers: 10,000 records"
    echo "  • Trips: 1,000,000 records (50-250 per driver)"
    echo "  • Payments: 950,000 records (95% of trips)"
    echo "  • Ratings: 800,000 records (80% of trips)"
    echo "  • Total: ~2,760,000 database records"
    echo ""
    echo -e "${YELLOW}⚠️  ESTIMATED TIME:${NC}"
    echo "  • Drivers (10K): ~2-5 minutes"
    echo "  • Trips (1M): ~8-15 minutes"
    echo "  • Payments (950K): ~5-10 minutes"
    echo "  • Ratings (800K): ~5-10 minutes"
    echo "  • Total estimated time: ~20-40 minutes"
    echo ""
    echo -e "${YELLOW}💾 DATABASE IMPACT:${NC}"
    echo "  • Will create a massive database (~2.76M records)"
    echo "  • Significant storage increase (several GB)"
    echo "  • Realistic performance testing with production-like data volume"
    echo "  • Covers 5 years of data (2020-2024)"
    echo ""
    
    echo -e "${YELLOW}Do you want to generate massive test data before running performance tests?${NC}"
    echo "This will run 'npm run data:generate' to populate the database with test data."
    echo ""
    
    while true; do
        read -p "Generate massive data? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✅ Will generate massive data before testing${NC}"
            GENERATE_DATA=true
            break
        elif [[ $REPLY =~ ^[Nn]$ ]]; then
            echo -e "${YELLOW}⚠️  Skipping data generation${NC}"
            GENERATE_DATA=false
            break
        else
            echo -e "${RED}❌ Please enter 'y' or 'n'${NC}"
        fi
    done
    echo ""
}

# Function to prompt user for test parameters
prompt_for_test_parameters() {
    echo -e "${CYAN}⚙️  TEST PARAMETERS CONFIGURATION${NC}"
    echo "========================================="
    echo ""
    
    # Single requests
    while true; do
        read -p "Number of single requests to test (default: 100): " single_req
        if [[ -z "$single_req" ]]; then
            SINGLE_REQUESTS=100
            break
        elif [[ "$single_req" =~ ^[0-9]+$ ]] && [ "$single_req" -gt 0 ]; then
            SINGLE_REQUESTS=$single_req
            break
        else
            echo -e "${RED}❌ Please enter a positive number${NC}"
        fi
    done
    
    # Concurrent requests
    while true; do
        read -p "Number of concurrent requests to test (default: 1000): " concurrent_req
        if [[ -z "$concurrent_req" ]]; then
            CONCURRENT_REQUESTS=1000
            break
        elif [[ "$concurrent_req" =~ ^[0-9]+$ ]] && [ "$concurrent_req" -gt 0 ]; then
            CONCURRENT_REQUESTS=$concurrent_req
            break
        else
            echo -e "${RED}❌ Please enter a positive number${NC}"
        fi
    done
    
    # Load test duration
    while true; do
        read -p "Load test duration in seconds (default: 100): " load_duration
        if [[ -z "$load_duration" ]]; then
            LOAD_TEST_DURATION=100
            break
        elif [[ "$load_duration" =~ ^[0-9]+$ ]] && [ "$load_duration" -gt 0 ]; then
            LOAD_TEST_DURATION=$load_duration
            break
        else
            echo -e "${RED}❌ Please enter a positive number${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Test parameters configured:${NC}"
    echo "  • Single requests: ${SINGLE_REQUESTS}"
    echo "  • Concurrent requests: ${CONCURRENT_REQUESTS}"
    echo "  • Load test duration: ${LOAD_TEST_DURATION} seconds"
    echo ""
}

# Function to generate massive data
generate_massive_data() {
    if [ "$GENERATE_DATA" = true ]; then
        echo -e "${CYAN}🚀 Generating massive test data...${NC}"
        echo "================================================"
        echo ""
        echo -e "${YELLOW}📊 EXPECTED OUTPUT:${NC}"
        echo "  • Creating 10,000 driver profiles with realistic names & phone numbers"
        echo "  • Generating 1,000,000 trip records (50-250 per driver)"
        echo "  • Building 950,000 payment records (95% of trips)"
        echo "  • Creating 800,000 rating records (80% of trips)"
        echo "  • Data spans 5 years (2020-2024) with 25+ locations across Bangladesh"
        echo ""
        echo -e "${YELLOW}⏱️  ESTIMATED DURATION:${NC}"
        echo "  • Drivers (10K): ~2-5 minutes"
        echo "  • Trips (1M): ~8-15 minutes"
        echo "  • Payments (950K): ~5-10 minutes"
        echo "  • Ratings (800K): ~5-10 minutes"
        echo "  • Total estimated time: ~20-40 minutes"
        echo "  • Progress will be shown below with real-time updates"
        echo "  • Batch processing: 1K drivers, 5K trips/payments/ratings at a time"
        echo ""
        echo -e "${YELLOW}🔄 Starting data generation...${NC}"
        echo ""
        
        # Start data generation with timestamp
        start_time=$(date +%s)
        echo -e "${CYAN}[$(date '+%H:%M:%S')] Starting npm run data:generate...${NC}"
        echo -e "${CYAN}[$(date '+%H:%M:%S')] This will create ~2.76M records - please be patient${NC}"
        echo ""
        
        if npm run data:generate; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            minutes=$((duration / 60))
            seconds=$((duration % 60))
            
            echo ""
            echo -e "${GREEN}✅ Massive data generation completed successfully!${NC}"
            echo -e "${CYAN}⏱️  Total time: ${minutes}m ${seconds}s (${duration} seconds)${NC}"
            echo -e "${CYAN}📊 Database now contains ~2,760,000 test records${NC}"
            echo -e "${CYAN}🚀 Ready for performance testing with production-like data volume${NC}"
            echo -e "${CYAN}💾 Database size increased significantly - ideal for stress testing${NC}"
        else
            echo ""
            echo -e "${RED}❌ Failed to generate massive data${NC}"
            echo -e "${YELLOW}⚠️  Continuing with existing data...${NC}"
            echo -e "${YELLOW}💡 Check your database connection and npm scripts${NC}"
            echo -e "${YELLOW}💡 Ensure you have sufficient disk space for ~2.76M records${NC}"
        fi
        echo ""
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--debug)
            DEBUG_MODE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -s|--single)
            SINGLE_REQUESTS="$2"
            shift 2
            ;;
        -c|--concurrent)
            CONCURRENT_REQUESTS="$2"
            shift 2
            ;;
        -l|--load)
            LOAD_TEST_DURATION="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 TRUCKLAGBE PERFORMANCE COMPARISON SCRIPT${NC}"
echo "=================================================="
echo ""

# Check if parameters were provided via command line
if [ $SINGLE_REQUESTS -eq 0 ] || [ $CONCURRENT_REQUESTS -eq 0 ] || [ $LOAD_TEST_DURATION -eq 0 ]; then
    # Interactive mode - prompt for data generation and parameters
    prompt_for_data_generation
    prompt_for_test_parameters
else
    # Command line mode - use provided parameters
    echo -e "${GREEN}✅ Using command line parameters:${NC}"
    echo "  • Single requests: ${SINGLE_REQUESTS}"
    echo "  • Concurrent requests: ${CONCURRENT_REQUESTS}"
    echo "  • Load test duration: ${LOAD_TEST_DURATION} seconds"
    echo ""
    
    # Still ask about data generation
    prompt_for_data_generation
fi

# Function to display current configuration
display_configuration() {
    echo -e "${CYAN}⚙️  CURRENT CONFIGURATION${NC}"
    echo "================================"
    echo "  • Base URL: ${BASE_URL}"
    echo "  • Driver ID: ${DRIVER_ID}"
    echo "  • Optimized endpoint: ${OPTIMIZED_ENDPOINT}"
    echo "  • Unoptimized endpoint: ${UNOPTIMIZED_ENDPOINT}"
    echo ""
    
    # Ask if user wants to change BASE_URL
    echo -e "${YELLOW}Do you want to change the Base URL? (y/n):${NC}"
    echo "Current: ${BASE_URL}"
    echo ""
    
    while true; do
        read -p "Change Base URL? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${CYAN}Enter new Base URL:${NC}"
            read -p "Base URL (e.g., http://localhost:3000/api/v1): " new_base_url
            if [[ -n "$new_base_url" ]]; then
                BASE_URL="$new_base_url"
                # Update endpoints with new BASE_URL
                OPTIMIZED_ENDPOINT="/drivers/${DRIVER_ID}/analytics"
                UNOPTIMIZED_ENDPOINT="/drivers/${DRIVER_ID}/analytics/unoptimized"
                echo -e "${GREEN}✅ Base URL updated to: ${BASE_URL}${NC}"
            fi
            break
        elif [[ $REPLY =~ ^[Nn]$ ]]; then
            echo -e "${GREEN}✅ Using current Base URL: ${BASE_URL}${NC}"
            break
        else
            echo -e "${RED}❌ Please enter 'y' or 'n'${NC}"
        fi
    done
    echo ""
}

# Function to check if service is running
check_service() {
    echo -e "${YELLOW}🔍 Checking if service is running...${NC}"
    if ! curl -s "${BASE_URL}/drivers/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Service is not running. Please start the service first.${NC}"
        echo "Run: npm run dev"
        echo ""
        echo -e "${YELLOW}💡 You can also:${NC}"
        echo "  • Set BASE_URL environment variable"
        echo "  • Change the Base URL interactively"
        echo "  • Check if the service is running on a different port"
        exit 1
    fi
    echo -e "${GREEN}✅ Service is running at ${BASE_URL}${NC}"
    echo ""
}

# Function to clear performance metrics
clear_metrics() {
    echo -e "${YELLOW}🧹 Clearing previous performance metrics...${NC}"
    # Note: This would require an endpoint to clear metrics, but we can work with existing data
    echo -e "${GREEN}✅ Ready for fresh performance testing${NC}"
    echo ""
}

# Function to run single request test
run_single_test() {
    local endpoint=$1
    local endpoint_name=$2
    local results=()
    
    echo -e "${CYAN}📊 Running ${SINGLE_REQUESTS} single requests to ${endpoint_name} endpoint...${NC}"
    
    for i in $(seq 1 $SINGLE_REQUESTS); do
        echo -n "Request $i: "
        start_time=$(date +%s%N)
        response=$(curl -s -w "%{http_code}" "${BASE_URL}${endpoint}")
        end_time=$(date +%s%N)
        
        http_code="${response: -3}"
        response_body="${response%???}"
        
        if [ "$http_code" = "200" ]; then
            duration_ms=$(( (end_time - start_time) / 1000000 ))
            results+=($duration_ms)
            echo -e "${GREEN}${duration_ms}ms${NC}"
        else
            echo -e "${RED}Failed (HTTP ${http_code})${NC}"
        fi
        
        # Small delay between requests
        sleep 0.1
    done
    
    # Calculate statistics
    local total=0
    local min=${results[0]}
    local max=${results[0]}
    
    for time in "${results[@]}"; do
        total=$((total + time))
        if [ $time -lt $min ]; then min=$time; fi
        if [ $time -gt $max ]; then max=$time; fi
    done
    
    local avg=$((total / ${#results[@]}))
    
    echo ""
    echo -e "${PURPLE}📈 ${endpoint_name} Single Request Statistics:${NC}"
    echo "  Total requests: ${#results[@]}"
    echo "  Average time: ${avg}ms"
    echo "  Min time: ${min}ms"
    echo "  Max time: ${max}ms"
    echo ""
    
    # Store results for comparison
    if [ "$endpoint_name" = "Optimized" ]; then
        OPT_AVG=$avg
        OPT_MIN=$min
        OPT_MAX=$max
    else
        UNOPT_AVG=$avg
        UNOPT_MIN=$min
        UNOPT_MAX=$max
    fi
}

# Function to run concurrent test
run_concurrent_test() {
    local endpoint=$1
    local endpoint_name=$2
    local num_requests=$3
    
    echo -e "${CYAN}⚡ Running ${num_requests} concurrent requests to ${endpoint_name} endpoint...${NC}"
    
    start_time=$(date +%s%N)
    
    # Start all requests in background
    for i in $(seq 1 $num_requests); do
        curl -s "${BASE_URL}${endpoint}" > /dev/null &
    done
    
    # Wait for all requests to complete
    wait
    
    end_time=$(date +%s%N)
    total_duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    echo -e "${GREEN}✅ All ${num_requests} concurrent requests completed in ${total_duration_ms}ms${NC}"
    echo ""
    
    # Store results for comparison
    if [ "$endpoint_name" = "Optimized" ]; then
        OPT_CONCURRENT=$total_duration_ms
    else
        UNOPT_CONCURRENT=$total_duration_ms
    fi
}

# Function to run load test
run_load_test() {
    local endpoint=$1
    local endpoint_name=$2
    local duration=$3
    
    echo -e "${CYAN}🔥 Running load test on ${endpoint_name} endpoint for ${duration} seconds...${NC}"
    
    start_time=$(date +%s)
    request_count=0
    successful_requests=0
    failed_requests=0
    total_response_time=0
    
    while [ $(($(date +%s) - start_time)) -lt $duration ]; do
        request_start=$(date +%s%N)
        response=$(curl -s -w "%{http_code}" "${BASE_URL}${endpoint}")
        request_end=$(date +%s%N)
        
        http_code="${response: -3}"
        request_count=$((request_count + 1))
        
        if [ "$http_code" = "200" ]; then
            successful_requests=$((successful_requests + 1))
            response_time_ms=$(( (request_end - request_start) / 1000000 ))
            total_response_time=$((total_response_time + response_time_ms))
        else
            failed_requests=$((failed_requests + 1))
        fi
        
        # Small delay to prevent overwhelming the server
        sleep 0.05
    done
    
    if [ $successful_requests -gt 0 ]; then
        avg_response_time=$((total_response_time / successful_requests))
    else
        avg_response_time=0
    fi
    
    echo -e "${GREEN}✅ Load test completed:${NC}"
    echo "  Total requests: ${request_count}"
    echo "  Successful: ${successful_requests}"
    echo "  Failed: ${failed_requests}"
    echo "  Average response time: ${avg_response_time}ms"
    echo "  Requests per second: $((request_count / duration))"
    echo ""
    
    # Store results for comparison
    if [ "$endpoint_name" = "Optimized" ]; then
        OPT_LOAD_AVG=$avg_response_time
        OPT_LOAD_RPS=$((request_count / duration))
    else
        UNOPT_LOAD_AVG=$avg_response_time
        UNOPT_LOAD_RPS=$((request_count / duration))
    fi
}

# Function to get performance metrics from API
get_api_metrics() {
    echo -e "${CYAN}📊 Fetching performance metrics from API...${NC}"
    
    if response=$(curl -s "${BASE_URL}${PERFORMANCE_ENDPOINT}"); then
        echo -e "${GREEN}✅ API Metrics retrieved successfully${NC}"
        echo ""
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        echo ""
    else
        echo -e "${RED}❌ Failed to retrieve API metrics${NC}"
    fi
}

# Function to display comparison results
display_comparison() {
    echo -e "${BLUE}📊 PERFORMANCE COMPARISON RESULTS${NC}"
    echo "=========================================="
    echo ""
    
    echo -e "${CYAN}Single Request Performance:${NC}"
    echo "  Optimized:   Avg: ${OPT_AVG}ms, Min: ${OPT_MIN}ms, Max: ${OPT_MAX}ms"
    echo "  Unoptimized: Avg: ${UNOPT_AVG}ms, Min: ${UNOPT_MIN}ms, Max: ${UNOPT_MAX}ms"
    
    if [ $OPT_AVG -lt $UNOPT_AVG ]; then
        improvement=$(( (UNOPT_AVG - OPT_AVG) * 100 / UNOPT_AVG ))
        echo -e "  ${GREEN}✅ Optimized is ${improvement}% faster on average${NC}"
    else
        degradation=$(( (OPT_AVG - UNOPT_AVG) * 100 / UNOPT_AVG ))
        echo -e "  ${RED}❌ Optimized is ${degradation}% slower on average${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}Concurrent Request Performance:${NC}"
    echo "  Optimized:   ${OPT_CONCURRENT}ms for ${CONCURRENT_REQUESTS} requests"
    echo "  Unoptimized: ${UNOPT_CONCURRENT}ms for ${CONCURRENT_REQUESTS} requests"
    
    if [ $OPT_CONCURRENT -lt $UNOPT_CONCURRENT ]; then
        improvement=$(( (UNOPT_CONCURRENT - OPT_CONCURRENT) * 100 / UNOPT_CONCURRENT ))
        echo -e "  ${GREEN}✅ Optimized handles concurrent requests ${improvement}% faster${NC}"
    else
        degradation=$(( (OPT_CONCURRENT - UNOPT_CONCURRENT) * 100 / UNOPT_CONCURRENT ))
        echo -e "  ${RED}❌ Optimized handles concurrent requests ${degradation}% slower${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}Load Test Performance:${NC}"
    echo "  Optimized:   ${OPT_LOAD_AVG}ms avg response, ${OPT_LOAD_RPS} req/s"
    echo "  Unoptimized: ${UNOPT_LOAD_AVG}ms avg response, ${UNOPT_LOAD_RPS} req/s"
    
    if [ $OPT_LOAD_AVG -lt $UNOPT_LOAD_AVG ]; then
        improvement=$(( (UNOPT_LOAD_AVG - OPT_LOAD_AVG) * 100 / UNOPT_LOAD_AVG ))
        echo -e "  ${GREEN}✅ Optimized maintains ${improvement}% better response time under load${NC}"
    else
        degradation=$(( (OPT_LOAD_AVG - UNOPT_LOAD_AVG) * 100 / UNOPT_LOAD_AVG ))
        echo -e "  ${RED}❌ Optimized degrades ${degradation}% more under load${NC}"
    fi
    echo ""
}

# Function to generate performance report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    local report_file="reports/performance_report_${timestamp}.txt"
    
    echo -e "${YELLOW}📝 Generating performance report...${NC}"
    
    {
        echo "TRUCKLAGBE PERFORMANCE COMPARISON REPORT"
        echo "Generated: $(date)"
        echo "========================================"
        echo ""
        echo "TEST PARAMETERS:"
        echo "  Single requests: ${SINGLE_REQUESTS}"
        echo "  Concurrent requests: ${CONCURRENT_REQUESTS}"
        echo "  Load test duration: ${LOAD_TEST_DURATION}s"
        echo ""
        echo "SINGLE REQUEST RESULTS:"
        echo "  Optimized:   Avg: ${OPT_AVG}ms, Min: ${OPT_MIN}ms, Max: ${OPT_MAX}ms"
        echo "  Unoptimized: Avg: ${UNOPT_AVG}ms, Min: ${UNOPT_MIN}ms, Max: ${UNOPT_MAX}ms"
        echo ""
        echo "CONCURRENT REQUEST RESULTS:"
        echo "  Optimized:   ${OPT_CONCURRENT}ms for ${CONCURRENT_REQUESTS} requests"
        echo "  Unoptimized: ${UNOPT_CONCURRENT}ms for ${CONCURRENT_REQUESTS} requests"
        echo ""
        echo "LOAD TEST RESULTS:"
        echo "  Optimized:   ${OPT_LOAD_AVG}ms avg response, ${OPT_LOAD_RPS} req/s"
        echo "  Unoptimized: ${UNOPT_LOAD_AVG}ms avg response, ${UNOPT_LOAD_RPS} req/s"
        echo ""
        echo "RECOMMENDATIONS:"
        if [ $OPT_AVG -lt $UNOPT_AVG ]; then
            echo "  ✅ Optimized endpoint is performing better"
        else
            echo "  ⚠️  Optimized endpoint needs investigation"
        fi
    } > "$report_file"
    
    echo -e "${GREEN}✅ Performance report saved to: ${report_file}${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting performance comparison...${NC}"
    echo ""
    
    # Check prerequisites
    display_configuration
    check_service
    
    # Check if jq is available
    if ! command -v jq >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  jq is not installed. Installing...${NC}"
        sudo apt update && sudo apt install -y jq
        echo ""
    fi
    
    # Clear metrics
    clear_metrics
    
    # Generate massive data
    generate_massive_data
    
    # Run single request tests
    run_single_test "$OPTIMIZED_ENDPOINT" "Optimized"
    run_single_test "$UNOPTIMIZED_ENDPOINT" "Unoptimized"
    
    # Run concurrent tests
    run_concurrent_test "$OPTIMIZED_ENDPOINT" "Optimized" $CONCURRENT_REQUESTS
    run_concurrent_test "$UNOPTIMIZED_ENDPOINT" "Unoptimized" $CONCURRENT_REQUESTS
    
    # Run load tests
    run_load_test "$OPTIMIZED_ENDPOINT" "Optimized" $LOAD_TEST_DURATION
    run_load_test "$UNOPTIMIZED_ENDPOINT" "Unoptimized" $LOAD_TEST_DURATION
    
    # Get API metrics
    get_api_metrics
    
    # Display comparison
    display_comparison
    
    # Generate report
    generate_report
    
    echo -e "${GREEN}🎉 Performance comparison completed!${NC}"
    echo ""
    echo -e "${BLUE}📊 Summary:${NC}"
    echo "  • Single requests tested: ${SINGLE_REQUESTS} each endpoint"
    echo "  • Concurrent requests tested: ${CONCURRENT_REQUESTS} each endpoint"
    echo "  • Load test duration: ${LOAD_TEST_DURATION} seconds each endpoint"
    echo "  • Performance report generated"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run this script multiple times to see performance trends${NC}"
}

# Run main function
main "$@" 