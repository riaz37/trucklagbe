const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trucklagbe',
  port: parseInt(process.env.DB_PORT) || 3306,
};

// Sample data for testing
const sampleData = {
  drivers: [
    { driver_id: 1, driver_name: 'John Doe', phone_number: '+1234567890', onboarding_date: '2023-01-15' },
    { driver_id: 2, driver_name: 'Jane Smith', phone_number: '+1234567891', onboarding_date: '2023-02-20' }
  ],
  trips: [
    { trip_id: 1, driver_id: 1, start_location: 'New York', end_location: 'Boston', trip_date: '2024-01-15' },
    { trip_id: 2, driver_id: 1, start_location: 'Boston', end_location: 'Philadelphia', trip_date: '2024-01-20' },
    { trip_id: 3, driver_id: 1, start_location: 'Philadelphia', end_location: 'Washington DC', trip_date: '2024-01-25' },
    { trip_id: 4, driver_id: 2, start_location: 'Los Angeles', end_location: 'San Francisco', trip_date: '2024-01-18' },
    { trip_id: 5, driver_id: 2, start_location: 'San Francisco', end_location: 'Seattle', trip_date: '2024-01-22' }
  ],
  payments: [
    { payment_id: 1, trip_id: 1, amount: 150.00, payment_date: '2024-01-16' },
    { payment_id: 2, trip_id: 2, amount: 200.00, payment_date: '2024-01-21' },
    { payment_id: 3, trip_id: 3, amount: 180.00, payment_date: '2024-01-26' },
    { payment_id: 4, trip_id: 4, amount: 120.00, payment_date: '2024-01-19' },
    { payment_id: 5, trip_id: 5, amount: 250.00, payment_date: '2024-01-23' }
  ],
  ratings: [
    { rating_id: 1, trip_id: 1, rating_value: 4.5, comment: 'Great service!' },
    { rating_id: 2, trip_id: 2, rating_value: 5.0, comment: 'Excellent driver' },
    { rating_id: 3, trip_id: 3, rating_value: 4.0, comment: 'Good trip' },
    { rating_id: 4, trip_id: 4, rating_value: 4.8, comment: 'Very professional' },
    { rating_id: 5, trip_id: 5, rating_value: 4.2, comment: 'Safe driving' }
  ]
};

// UN-OPTIMIZED APPROACH: Single complex JOIN query
async function getDriverAnalyticsUnoptimized(connection, driverId) {
  const query = `
    SELECT 
      d.driver_id,
      d.driver_name,
      d.phone_number,
      d.onboarding_date,
      COUNT(t.trip_id) as total_trips,
      COALESCE(SUM(p.amount), 0) as total_earnings,
      COALESCE(AVG(r.rating_value), 0) as average_rating,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'trip_id', t.trip_id,
          'start_location', t.start_location,
          'end_location', t.end_location,
          'trip_date', t.trip_date,
          'amount', COALESCE(p.amount, 0),
          'rating_value', COALESCE(r.rating_value, 0),
          'comment', COALESCE(r.comment, '')
        )
      ) as trips
    FROM drivers d
    LEFT JOIN trips t ON d.driver_id = t.driver_id
    LEFT JOIN payments p ON t.trip_id = p.trip_id
    LEFT JOIN ratings r ON t.trip_id = r.trip_id
    WHERE d.driver_id = ?
    GROUP BY d.driver_id, d.driver_name, d.phone_number, d.onboarding_date
  `;

  const [rows] = await connection.execute(query, [driverId]);
  return rows[0];
}

// OPTIMIZED APPROACH: Multiple smaller queries
async function getDriverAnalyticsOptimized(connection, driverId) {
  // Query 1: Get driver basic info
  const [driverRows] = await connection.execute('SELECT * FROM drivers WHERE driver_id = ?', [driverId]);
  const driver = driverRows[0];

  // Query 2: Get trips
  const [tripRows] = await connection.execute('SELECT * FROM trips WHERE driver_id = ?', [driverId]);
  const trips = tripRows;

  // Query 3: Get payments
  const tripIds = trips.map(t => t.trip_id);
  let payments = [];
  if (tripIds.length > 0) {
    const [paymentRows] = await connection.execute('SELECT * FROM payments WHERE trip_id IN (?)', [tripIds]);
    payments = paymentRows;
  }

  // Query 4: Get ratings
  let ratings = [];
  if (tripIds.length > 0) {
    const [ratingRows] = await connection.execute('SELECT * FROM ratings WHERE trip_id IN (?)', [tripIds]);
    ratings = ratingRows;
  }

  // Combine the data
  const tripDetails = trips.map(trip => {
    const payment = payments.find(p => p.trip_id === trip.trip_id);
    const rating = ratings.find(r => r.trip_id === trip.trip_id);
    
    return {
      trip_id: trip.trip_id,
      start_location: trip.start_location,
      end_location: trip.end_location,
      trip_date: trip.trip_date,
      amount: payment ? parseFloat(payment.amount) : 0,
      rating_value: rating ? parseFloat(rating.rating_value) : 0,
      comment: rating ? rating.comment : '',
    };
  });

  const totalEarnings = tripDetails.reduce((sum, trip) => sum + trip.amount, 0);
  const totalRatings = tripDetails.filter(trip => trip.rating_value > 0);
  const averageRating = totalRatings.length > 0 
    ? totalRatings.reduce((sum, trip) => sum + trip.rating_value, 0) / totalRatings.length 
    : 0;

  return {
    driver_id: driver.driver_id,
    driver_name: driver.driver_name,
    phone_number: driver.phone_number,
    onboarding_date: driver.onboarding_date,
    total_trips: trips.length,
    total_earnings: totalEarnings,
    average_rating: averageRating,
    trips: tripDetails,
  };
}

// Performance testing function
async function testPerformance(connection, driverId, iterations = 100) {
  console.log(`\n🚀 Testing performance for driver ${driverId} with ${iterations} iterations...`);
  
  // Test unoptimized approach
  console.log('\n📊 Testing UN-OPTIMIZED approach (complex JOIN)...');
  const unoptStart = Date.now();
  const unoptTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await getDriverAnalyticsUnoptimized(connection, driverId);
      const duration = Date.now() - start;
      unoptTimes.push(duration);
    } catch (error) {
      console.error(`Unoptimized query failed: ${error.message}`);
    }
  }
  
  const unoptTotal = Date.now() - unoptStart;
  const unoptAvg = unoptTimes.reduce((sum, time) => sum + time, 0) / unoptTimes.length;
  const unoptMin = Math.min(...unoptTimes);
  const unoptMax = Math.max(...unoptTimes);

  // Test optimized approach
  console.log('\n📊 Testing OPTIMIZED approach (multiple queries)...');
  const optStart = Date.now();
  const optTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await getDriverAnalyticsOptimized(connection, driverId);
      const duration = Date.now() - start;
      optTimes.push(duration);
    } catch (error) {
      console.error(`Optimized query failed: ${error.message}`);
    }
  }
  
  const optTotal = Date.now() - optStart;
  const optAvg = optTimes.reduce((sum, time) => sum + time, 0) / optTimes.length;
  const optMin = Math.min(...optTimes);
  const optMax = Math.max(...optTimes);

  // Results comparison
  console.log('\n📈 PERFORMANCE COMPARISON RESULTS');
  console.log('=====================================');
  
  console.log(`\n🔄 UN-OPTIMIZED (Complex JOIN):`);
  console.log(`   Total Time: ${unoptTotal}ms`);
  console.log(`   Average: ${unoptAvg.toFixed(2)}ms`);
  console.log(`   Min: ${unoptMin}ms`);
  console.log(`   Max: ${unoptMax}ms`);
  console.log(`   Requests/Second: ${(iterations / unoptTotal * 1000).toFixed(2)}`);
  
  console.log(`\n⚡ OPTIMIZED (Multiple Queries):`);
  console.log(`   Total Time: ${optTotal}ms`);
  console.log(`   Average: ${optAvg.toFixed(2)}ms`);
  console.log(`   Min: ${optMin}ms`);
  console.log(`   Max: ${optMax}ms`);
  console.log(`   Requests/Second: ${(iterations / optTotal * 1000).toFixed(2)}`);
  
  console.log(`\n🎯 IMPROVEMENT:`);
  const timeImprovement = ((unoptTotal / optTotal - 1) * 100).toFixed(2);
  const speedImprovement = ((optAvg / unoptAvg - 1) * 100).toFixed(2);
  console.log(`   Time: ${timeImprovement}% faster`);
  console.log(`   Speed: ${speedImprovement}% improvement in average response time`);
  
  if (optAvg < unoptAvg) {
    console.log(`\n🎉 The optimized approach is faster!`);
  } else {
    console.log(`\n⚠️  The unoptimized approach is faster (this might indicate an issue)`);
  }
}

// Main execution
async function main() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    // Test with driver ID 1
    await testPerformance(connection, 1, 50);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure your database is running and the connection details are correct.');
    console.log('   You can set environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  getDriverAnalyticsUnoptimized,
  getDriverAnalyticsOptimized,
  testPerformance
}; 