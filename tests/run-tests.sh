#!/bin/bash

# TruckLagBE Test Runner
# Usage: ./run-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configurations
LOAD_TESTS_DIR="tests/load"
PERFORMANCE_TESTS_DIR="tests/performance"
REPORTS_DIR="tests/reports"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🚀 TruckLagBE Test Runner${NC}"
echo "================================"

# Function to show usage
show_usage() {
    echo "Usage: $0 [test-type] [options]"
    echo ""
    echo "Test Types:"
    echo "  load-optimized     - Run load test on optimized endpoints only"
    echo "  load-unoptimized   - Run load test on unoptimized endpoints only"
    echo "  performance        - Run database performance tests"
    echo "  generate-data      - Generate massive test data"
    echo "  all                - Run all tests sequentially"
    echo ""
    echo "Options:"
    echo "  --output-dir DIR   - Specify output directory for reports"
    echo "  --help             - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 load-optimized"
    echo "  $0 load-unoptimized --output-dir ./custom-reports"
    echo "  $0 all"
}

# Function to run load test
run_load_test() {
    local test_type=$1
    local output_dir=${2:-"$REPORTS_DIR"}
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    echo -e "${YELLOW}📊 Running $test_type load test...${NC}"
    
    case $test_type in
        "load-optimized")
            artillery run "$LOAD_TESTS_DIR/artillery-optimized-only.yml" \
                --output "$output_dir/optimized-only_$timestamp.json"
            ;;
        "load-unoptimized")
            artillery run "$LOAD_TESTS_DIR/artillery-unoptimized-only.yml" \
                --output "$output_dir/unoptimized-only_$timestamp.json"
            ;;
        *)
            echo -e "${RED}❌ Unknown load test type: $test_type${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ $test_type load test completed!${NC}"
}

# Function to run performance tests
run_performance_tests() {
    local output_dir=${1:-"$REPORTS_DIR"}
    
    echo -e "${YELLOW}⚡ Running database performance tests...${NC}"
    
    # Run database performance test
    node "$PERFORMANCE_TESTS_DIR/test-database-performance.js" > "$output_dir/database-performance_$(date +"%Y%m%d_%H%M%S").log" 2>&1
    
    echo -e "${GREEN}✅ Performance tests completed!${NC}"
}

# Function to generate test data
generate_test_data() {
    local output_dir=${1:-"$REPORTS_DIR"}
    
    echo -e "${YELLOW}📈 Generating massive test data...${NC}"
    
    # Run data generation script
    node "$PERFORMANCE_TESTS_DIR/generate-massive-data.js" > "$output_dir/data-generation_$(date +"%Y%m%d_%H%M%S").log" 2>&1
    
    echo -e "${GREEN}✅ Test data generation completed!${NC}"
}

# Function to run all tests
run_all_tests() {
    local output_dir=${1:-"$REPORTS_DIR"}
    
    echo -e "${BLUE}🔄 Running all tests sequentially...${NC}"
    
    # 1. Generate test data
    generate_test_data "$output_dir"
    
    # 2. Run performance tests
    run_performance_tests "$output_dir"
    
    # 3. Run load tests
    run_load_test "load-optimized" "$output_dir"
    run_load_test "load-unoptimized" "$output_dir"
    
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${BLUE}📁 Reports saved to: $output_dir${NC}"
}

# Main script logic
main() {
    local test_type=""
    local output_dir="$REPORTS_DIR"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output-dir)
                output_dir="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
            *)
                test_type="$1"
                shift
                ;;
        esac
    done
    
    # Check if test type is provided
    if [[ -z "$test_type" ]]; then
        echo -e "${RED}❌ Test type is required${NC}"
        show_usage
        exit 1
    fi
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Run the specified test
    case $test_type in
        "load-optimized"|"load-unoptimized")
            run_load_test "$test_type" "$output_dir"
            ;;
        "performance")
            run_performance_tests "$output_dir"
            ;;
        "generate-data")
            generate_test_data "$output_dir"
            ;;
        "all")
            run_all_tests "$output_dir"
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            show_usage
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Test execution completed!${NC}"
    echo -e "${BLUE}📁 Reports saved to: $output_dir${NC}"
}

# Run main function with all arguments
main "$@" 