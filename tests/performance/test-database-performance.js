const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient();

// Performance test configurations
const PERFORMANCE_TESTS = {
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_MEMORY_USAGE: 500 * 1024 * 1024, // 500MB
  EXPECTED_RESPONSE_TIME: 1000, // 1 second
  CONCURRENT_QUERIES: 50
};

// Test scenarios for heavy load
const TEST_SCENARIOS = [
  {
    name: 'Single Driver Analytics - Heavy Data',
    description: 'Fetch analytics for a driver with 1000+ trips',
    query: async () => {
      const startTime = performance.now();
      const result = await prisma.$queryRaw`
        SELECT 
          d.id as driver_id,
          d.driver_name,
          d.phone_number,
          d.onboarding_date,
          COUNT(t.id) as total_trips,
          COALESCE(SUM(p.amount), 0) as total_earnings,
          COALESCE(AVG(r.rating_value), 0) as average_rating,
          COUNT(r.id) as total_ratings
        FROM drivers d
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE d.id = ${Math.floor(Math.random() * 10000) + 1}
        GROUP BY d.id, d.driver_name, d.phone_number, d.onboarding_date
      `;
      const endTime = performance.now();
      return { result, executionTime: endTime - startTime };
    }
  },
  
  {
    name: 'Complex Trip Search - Multiple Filters',
    description: 'Search trips with complex filtering and sorting',
    query: async () => {
      const startTime = performance.now();
      const result = await prisma.$queryRaw`
        SELECT 
          t.id,
          t.start_location,
          t.end_location,
          t.trip_date,
          p.amount,
          r.rating_value,
          r.comment,
          d.driver_name
        FROM trips t
        JOIN drivers d ON t.driver_id = d.id
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE t.trip_date BETWEEN '2023-01-01' AND '2024-12-31'
          AND p.amount BETWEEN 500 AND 3000
          AND r.rating_value >= 4.0
          AND t.start_location IN ('Dhaka', 'Chittagong', 'Sylhet')
        ORDER BY t.trip_date DESC, p.amount DESC
        LIMIT 100
      `;
      const endTime = performance.now();
      return { result, executionTime: endTime - startTime };
    }
  },
  
  {
    name: 'Revenue Analytics - Date Range Aggregation',
    description: 'Calculate revenue analytics across date ranges',
    query: async () => {
      const startTime = performance.now();
      const result = await prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(t.trip_date, '%Y-%m') as month,
          COUNT(t.id) as total_trips,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COALESCE(AVG(p.amount), 0) as average_trip_value,
          COUNT(DISTINCT t.driver_id) as active_drivers
        FROM trips t
        LEFT JOIN payments p ON t.id = p.trip_id
        WHERE t.trip_date BETWEEN '2023-01-01' AND '2024-12-31'
        GROUP BY DATE_FORMAT(t.trip_date, '%Y-%m')
        ORDER BY month DESC
      `;
      const endTime = performance.now();
      return { result, executionTime: endTime - startTime };
    }
  },
  
  {
    name: 'Driver Performance Ranking - Complex Scoring',
    description: 'Rank drivers by complex performance metrics',
    query: async () => {
      const startTime = performance.now();
      const result = await prisma.$queryRaw`
        SELECT 
          d.id,
          d.driver_name,
          COUNT(t.id) as total_trips,
          COALESCE(SUM(p.amount), 0) as total_earnings,
          COALESCE(AVG(r.rating_value), 0) as average_rating,
          COUNT(r.id) as total_ratings,
          DATEDIFF(CURDATE(), d.onboarding_date) as days_active,
          (COUNT(t.id) * 0.3 + COALESCE(AVG(r.rating_value), 0) * 0.4 + 
           (COALESCE(SUM(p.amount), 0) / 1000) * 0.3) as performance_score
        FROM drivers d
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE t.trip_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY d.id, d.driver_name, d.onboarding_date
        HAVING total_trips >= 10
        ORDER BY performance_score DESC
        LIMIT 50
      `;
      const endTime = performance.now();
      return { result, executionTime: endTime - startTime };
    }
  },
  
  {
    name: 'Location-based Analytics - Geographic Distribution',
    description: 'Analyze trip patterns by location',
    query: async () => {
      const startTime = performance.now();
      const result = await prisma.$queryRaw`
        SELECT 
          t.start_location,
          t.end_location,
          COUNT(*) as trip_count,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COALESCE(AVG(p.amount), 0) as average_fare,
          COALESCE(AVG(r.rating_value), 0) as average_rating,
          COUNT(DISTINCT t.driver_id) as unique_drivers
        FROM trips t
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE t.trip_date BETWEEN '2024-01-01' AND '2024-12-31'
        GROUP BY t.start_location, t.end_location
        HAVING trip_count >= 5
        ORDER BY trip_count DESC
        LIMIT 100
      `;
      const endTime = performance.now();
      return { result, executionTime: endTime - startTime };
    }
  }
];

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      totalExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      executionTimes: [],
      memoryUsage: [],
      errors: []
    };
  }
  
  recordQuery(executionTime, success = true, error = null) {
    this.metrics.totalQueries++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.executionTimes.push(executionTime);
    
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
      if (error) this.metrics.errors.push(error);
    }
    
    this.metrics.minExecutionTime = Math.min(this.metrics.minExecutionTime, executionTime);
    this.metrics.maxExecutionTime = Math.max(this.metrics.maxExecutionTime, executionTime);
    
    // Record memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });
  }
  
  getStatistics() {
    const avgExecutionTime = this.metrics.totalExecutionTime / this.metrics.totalQueries;
    const sortedTimes = [...this.metrics.executionTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    return {
      totalQueries: this.metrics.totalQueries,
      successfulQueries: this.metrics.successfulQueries,
      failedQueries: this.metrics.failedQueries,
      successRate: (this.metrics.successfulQueries / this.metrics.totalQueries * 100).toFixed(2) + '%',
      averageExecutionTime: avgExecutionTime.toFixed(2) + 'ms',
      minExecutionTime: this.metrics.minExecutionTime.toFixed(2) + 'ms',
      maxExecutionTime: this.metrics.maxExecutionTime.toFixed(2) + 'ms',
      p95ExecutionTime: sortedTimes[p95Index]?.toFixed(2) + 'ms' || 'N/A',
      p99ExecutionTime: sortedTimes[p99Index]?.toFixed(2) + 'ms' || 'N/A',
      totalExecutionTime: (this.metrics.totalExecutionTime / 1000).toFixed(2) + 's',
      currentMemoryUsage: this.getCurrentMemoryUsage()
    };
  }
  
  getCurrentMemoryUsage() {
    const mem = process.memoryUsage();
    return {
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
      external: (mem.external / 1024 / 1024).toFixed(2) + 'MB',
      rss: (mem.rss / 1024 / 1024).toFixed(2) + 'MB'
    };
  }
  
  checkMemoryLimit() {
    const currentMemory = process.memoryUsage().heapUsed;
    return currentMemory < PERFORMANCE_TESTS.MAX_MEMORY_USAGE;
  }
}

// Run performance tests
async function runPerformanceTests() {
  console.log('🚀 Starting Database Performance Tests...');
  console.log(`📊 Test scenarios: ${TEST_SCENARIOS.length}`);
  console.log(`⚡ Concurrent queries: ${PERFORMANCE_TESTS.CONCURRENT_QUERIES}`);
  console.log(`⏱️ Query timeout: ${PERFORMANCE_TESTS.QUERY_TIMEOUT}ms`);
  console.log(`💾 Memory limit: ${PERFORMANCE_TESTS.MAX_MEMORY_USAGE / 1024 / 1024}MB\n`);
  
  const monitor = new PerformanceMonitor();
  const results = [];
  
  try {
    // Run each test scenario multiple times
    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n🔍 Testing: ${scenario.name}`);
      console.log(`📝 Description: ${scenario.description}`);
      
      const scenarioResults = [];
      
      // Run scenario multiple times to get average performance
      for (let i = 0; i < 5; i++) {
        try {
          const startTime = performance.now();
          const result = await Promise.race([
            scenario.query(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Query timeout')), PERFORMANCE_TESTS.QUERY_TIMEOUT)
            )
          ]);
          
          const executionTime = performance.now() - startTime;
          monitor.recordQuery(executionTime, true);
          
          scenarioResults.push({
            iteration: i + 1,
            executionTime,
            resultCount: Array.isArray(result.result) ? result.result.length : 1,
            success: true
          });
          
          console.log(`  ✅ Iteration ${i + 1}: ${executionTime.toFixed(2)}ms`);
          
          // Check memory usage
          if (!monitor.checkMemoryLimit()) {
            console.log(`  ⚠️ Memory limit exceeded!`);
            break;
          }
          
        } catch (error) {
          const executionTime = performance.now() - startTime;
          monitor.recordQuery(executionTime, false, error.message);
          
          scenarioResults.push({
            iteration: i + 1,
            executionTime,
            error: error.message,
            success: false
          });
          
          console.log(`  ❌ Iteration ${i + 1}: Failed - ${error.message}`);
        }
      }
      
      results.push({
        scenario: scenario.name,
        results: scenarioResults,
        averageExecutionTime: scenarioResults.reduce((sum, r) => sum + r.executionTime, 0) / scenarioResults.length
      });
    }
    
    // Run concurrent load test
    console.log('\n🔥 Running Concurrent Load Test...');
    await runConcurrentLoadTest(monitor);
    
    // Print final results
    console.log('\n📊 Performance Test Results:');
    console.log('=' .repeat(60));
    
    const stats = monitor.getStatistics();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`${key.padEnd(25)}: ${value}`);
    });
    
    console.log('\n📈 Scenario Performance Summary:');
    console.log('-'.repeat(60));
    results.forEach(scenario => {
      console.log(`${scenario.scenario.padEnd(40)}: ${scenario.averageExecutionTime.toFixed(2)}ms avg`);
    });
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('-'.repeat(60));
    providePerformanceRecommendations(stats, results);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Concurrent load testing
async function runConcurrentLoadTest(monitor) {
  const concurrentQueries = [];
  
  for (let i = 0; i < PERFORMANCE_TESTS.CONCURRENT_QUERIES; i++) {
    const randomScenario = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)];
    
    concurrentQueries.push(
      (async () => {
        try {
          const startTime = performance.now();
          await randomScenario.query();
          const executionTime = performance.now() - startTime;
          monitor.recordQuery(executionTime, true);
          return { success: true, executionTime };
        } catch (error) {
          const executionTime = performance.now() - startTime;
          monitor.recordQuery(executionTime, false, error.message);
          return { success: false, error: error.message };
        }
      })()
    );
  }
  
  console.log(`  🚀 Executing ${PERFORMANCE_TESTS.CONCURRENT_QUERIES} concurrent queries...`);
  const concurrentResults = await Promise.allSettled(concurrentQueries);
  
  const successful = concurrentResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = concurrentResults.length - successful;
  
  console.log(`  ✅ Concurrent test completed: ${successful} successful, ${failed} failed`);
}

// Provide performance recommendations
function providePerformanceRecommendations(stats, results) {
  const recommendations = [];
  
  if (parseFloat(stats.successRate) < 95) {
    recommendations.push('🔴 Low success rate detected - investigate query failures and database connectivity');
  }
  
  if (parseFloat(stats.averageExecutionTime) > PERFORMANCE_TESTS.EXPECTED_RESPONSE_TIME) {
    recommendations.push('🟡 Slow query performance - consider adding database indexes or query optimization');
  }
  
  if (parseFloat(stats.p95ExecutionTime) > PERFORMANCE_TESTS.EXPECTED_RESPONSE_TIME * 2) {
    recommendations.push('🟠 High p95 response time - investigate slow queries and database bottlenecks');
  }
  
  // Find slowest scenario
  const slowestScenario = results.reduce((slowest, current) => 
    current.averageExecutionTime > slowest.averageExecutionTime ? current : slowest
  );
  
  if (slowestScenario.averageExecutionTime > PERFORMANCE_TESTS.EXPECTED_RESPONSE_TIME) {
    recommendations.push(`🟡 Slowest scenario: ${slowestScenario.scenario} - consider optimization`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('🟢 All performance metrics are within acceptable ranges');
  }
  
  recommendations.forEach(rec => console.log(rec));
}

// Run the script
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\n✅ Performance tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance tests failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, PerformanceMonitor }; 