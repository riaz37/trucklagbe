const axios = require('axios');
const { performance } = require('perf_hooks');
require('dotenv').config();

// Simple HTTP performance test
async function testHttpPerformance() {
  console.log('🚀 Testing HTTP Endpoint Performance...\n');

  // Get base URL from environment variables
  const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
  const driverId = 1; // Use driver ID 1 from seeded data 

  console.log(`🌐 Testing against: ${baseUrl}`);
  console.log(`📱 Driver ID: ${driverId}\n`);

  // Test optimized endpoint
  console.log('📊 Testing OPTIMIZED endpoint...');
  const optimizedStart = performance.now();
  try {
    const optimizedResponse = await axios.get(
      `${baseUrl}/api/v1/drivers/${driverId}/analytics`,
    );
    const optimizedTime = performance.now() - optimizedStart;
    console.log(
      `✅ Optimized: ${optimizedTime.toFixed(2)}ms - Status: ${optimizedResponse.status}`,
    );
  } catch (error) {
    console.log(`❌ Optimized failed: ${error.message}`);
  }

  // Test unoptimized endpoint
  console.log('\n📊 Testing UNOPTIMIZED endpoint...');
  const unoptimizedStart = performance.now();
  try {
    const unoptimizedResponse = await axios.get(
      `${baseUrl}/api/v1/drivers/${driverId}/analytics/unoptimized`,
    );
    const unoptimizedTime = performance.now() - unoptimizedStart;
    console.log(
      `✅ Unoptimized: ${unoptimizedTime.toFixed(2)}ms - Status: ${unoptimizedResponse.status}`,
    );
  } catch (error) {
    console.log(`❌ Unoptimized failed: ${error.message}`);
  }

  // Test cache hit performance
  console.log('\n📊 Testing CACHE HIT performance...');
  const cacheStart = performance.now();
  try {
    const cacheResponse = await axios.get(
      `${baseUrl}/api/v1/drivers/${driverId}/analytics`,
    );
    const cacheTime = performance.now() - cacheStart;
    console.log(
      `✅ Cache Hit: ${cacheTime.toFixed(2)}ms - Status: ${cacheResponse.status}`,
    );
  } catch (error) {
    console.log(`❌ Cache test failed: ${error.message}`);
  }

  console.log('\n🎯 HTTP Performance Test Complete!');
}

// Run the test
if (require.main === module) {
  testHttpPerformance().catch(console.error);
}

module.exports = { testHttpPerformance };
