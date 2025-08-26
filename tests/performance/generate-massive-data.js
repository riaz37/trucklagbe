const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration for massive data generation
const CONFIG = {
  DRIVERS_COUNT: 10000, // 10,000 drivers
  TRIPS_PER_DRIVER: 100, // 100 trips per driver on average
  TOTAL_TRIPS: 1000000, // 1 million trips
  PAYMENTS_COUNT: 950000, // 95% of trips have payments
  RATINGS_COUNT: 800000, // 80% of trips have ratings
  LOCATIONS: [
    'Dhaka',
    'Chittagong',
    'Sylhet',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Rangpur',
    'Mymensingh',
    'Comilla',
    'Narayanganj',
    'Gazipur',
    'Tangail',
    'Bogura',
    'Pabna',
    'Sirajganj',
    'Natore',
    'Naogaon',
    'Joypurhat',
    'Kushtia',
    'Meherpur',
    'Jhenaidah',
    'Magura',
    'Jessore',
    'Satkhira',
    'Bagerhat',
  ],
  START_DATE: new Date('2020-01-01'),
  END_DATE: new Date('2024-12-31'),
};

// Utility functions
function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function getRandomLocation() {
  return CONFIG.LOCATIONS[Math.floor(Math.random() * CONFIG.LOCATIONS.length)];
}

function getRandomAmount() {
  return Math.floor(Math.random() * 5000) + 100; // 100 to 5100
}

function getRandomRating() {
  // Generate more realistic rating distribution
  const rand = Math.random();
  if (rand < 0.1) return (Math.random() * 1 + 1).toFixed(2); // 10% chance of 1.0-2.0
  if (rand < 0.2) return (Math.random() * 1 + 2).toFixed(2); // 10% chance of 2.0-3.0
  if (rand < 0.4) return (Math.random() * 1 + 3).toFixed(2); // 20% chance of 3.0-4.0
  if (rand < 0.7) return (Math.random() * 1 + 4).toFixed(2); // 30% chance of 4.0-5.0
  return (Math.random() * 0.5 + 4.5).toFixed(2); // 30% chance of 4.5-5.0
}

function getRandomPhoneNumber() {
  return `01${Math.floor(Math.random() * 9)}${Math.floor(
    Math.random() * 100000000,
  )
    .toString()
    .padStart(8, '0')}`;
}

function getRandomDriverName() {
  const firstNames = [
    'Abdul',
    'Mohammad',
    'Rahman',
    'Hossain',
    'Ali',
    'Ahmed',
    'Karim',
    'Rahim',
    'Salam',
    'Aziz',
    'Nasir',
    'Jabbar',
    'Momin',
    'Sattar',
    'Hafiz',
    'Mannan',
    'Rashid',
    'Siddique',
    'Mazhar',
    'Qadir',
    'Wadud',
    'Zaman',
    'Farooq',
    'Iqbal',
  ];
  const lastNames = [
    'Khan',
    'Chowdhury',
    'Miah',
    'Uddin',
    'Haque',
    'Sarkar',
    'Mollah',
    'Sheikh',
    'Talukder',
    'Biswas',
    'Das',
    'Roy',
    'Mandal',
    'Ghosh',
    'Banerjee',
    'Chatterjee',
    'Mukherjee',
    'Dutta',
    'Sen',
    'Bose',
    'Nath',
    'Pal',
    'Saha',
    'Chakraborty',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

// Generate massive amounts of data
async function generateMassiveData() {
  console.log('🚀 Starting massive data generation...');
  console.log(
    `📊 Target: ${CONFIG.DRIVERS_COUNT} drivers, ${CONFIG.TOTAL_TRIPS} trips`,
  );

  try {
    // Step 1: Generate Drivers
    console.log('\n👥 Generating drivers...');
    const drivers = [];
    for (let i = 0; i < CONFIG.DRIVERS_COUNT; i++) {
      drivers.push({
        driver_name: getRandomDriverName(),
        phone_number: getRandomPhoneNumber(),
        onboarding_date: getRandomDate(
          CONFIG.START_DATE,
          new Date('2024-06-01'),
        ),
      });

      // Batch insert every 1000 drivers
      if (drivers.length === 1000 || i === CONFIG.DRIVERS_COUNT - 1) {
        await prisma.driver.createMany({
          data: drivers,
          skipDuplicates: true,
        });
        console.log(
          `✅ Created ${drivers.length} drivers (${i + 1}/${CONFIG.DRIVERS_COUNT})`,
        );
        drivers.length = 0;
      }
    }

    // Step 2: Generate Trips
    console.log('\n🚛 Generating trips...');
    const trips = [];
    let tripCount = 0;

    for (let driverId = 1; driverId <= CONFIG.DRIVERS_COUNT; driverId++) {
      const tripsForDriver = Math.floor(Math.random() * 200) + 50; // 50-250 trips per driver

      for (
        let j = 0;
        j < tripsForDriver && tripCount < CONFIG.TOTAL_TRIPS;
        j++
      ) {
        trips.push({
          driver_id: driverId,
          start_location: getRandomLocation(),
          end_location: getRandomLocation(),
          trip_date: getRandomDate(CONFIG.START_DATE, CONFIG.END_DATE),
        });
        tripCount++;

        // Batch insert every 5000 trips
        if (trips.length === 5000 || tripCount === CONFIG.TOTAL_TRIPS) {
          await prisma.trip.createMany({
            data: trips,
            skipDuplicates: true,
          });
          console.log(
            `✅ Created ${trips.length} trips (${tripCount}/${CONFIG.TOTAL_TRIPS})`,
          );
          trips.length = 0;
        }
      }
    }

    // Step 3: Generate Payments
    console.log('\n💰 Generating payments...');
    const payments = [];
    let paymentCount = 0;

    // Get all trip IDs
    const tripIds = await prisma.trip.findMany({
      select: { id: true },
      take: CONFIG.PAYMENTS_COUNT,
    });

    for (const trip of tripIds) {
      payments.push({
        trip_id: trip.id,
        amount: getRandomAmount(),
        payment_date: getRandomDate(CONFIG.START_DATE, CONFIG.END_DATE),
      });
      paymentCount++;

      // Batch insert every 5000 payments
      if (payments.length === 5000 || paymentCount === CONFIG.PAYMENTS_COUNT) {
        await prisma.payment.createMany({
          data: payments,
          skipDuplicates: true,
        });
        console.log(
          `✅ Created ${payments.length} payments (${paymentCount}/${CONFIG.PAYMENTS_COUNT})`,
        );
        payments.length = 0;
      }
    }

    // Step 4: Generate Ratings
    console.log('\n⭐ Generating ratings...');
    const ratings = [];
    let ratingCount = 0;

    // Get trip IDs for ratings (different from payments)
    const ratingTripIds = await prisma.trip.findMany({
      select: { id: true },
      take: CONFIG.RATINGS_COUNT,
    });

    for (const trip of ratingTripIds) {
      ratings.push({
        trip_id: trip.id,
        rating_value: parseFloat(getRandomRating()), // Convert to number
        comment: Math.random() > 0.3 ? getRandomComment() : '', // Use empty string instead of null
      });
      ratingCount++;

      // Batch insert every 5000 ratings
      if (ratings.length === 5000 || ratingCount === CONFIG.RATINGS_COUNT) {
        await prisma.rating.createMany({
          data: ratings,
          skipDuplicates: true,
        });
        console.log(
          `✅ Created ${ratings.length} ratings (${ratingCount}/${CONFIG.RATINGS_COUNT})`,
        );
        ratings.length = 0;
      }
    }

    console.log('\n🎉 Massive data generation completed successfully!');
    console.log(`📈 Final counts:`);
    console.log(`   - Drivers: ${CONFIG.DRIVERS_COUNT}`);
    console.log(`   - Trips: ${tripCount}`);
    console.log(`   - Payments: ${paymentCount}`);
    console.log(`   - Ratings: ${ratingCount}`);
  } catch (error) {
    console.error('❌ Error generating data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getRandomComment() {
  const comments = [
    'Excellent service, very professional driver',
    'Safe and comfortable journey throughout',
    'Driver was punctual and very courteous',
    'Clean vehicle and smooth ride experience',
    'Great communication throughout the trip',
    'Driver knew the route very well',
    'Very helpful with luggage handling',
    'Professional and friendly service',
    'On time pickup and drop off',
    'Highly recommended driver service',
    'Vehicle was in excellent condition',
    'Driver followed all safety protocols',
    'Very reasonable pricing for the service',
    'Driver was well-dressed and presentable',
    'Excellent knowledge of local areas',
    'Very patient and understanding driver',
    'Clean and well-maintained vehicle',
    'Driver was very respectful and polite',
    'Great value for money service',
    'Driver was very experienced and skilled',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

// Run the script
if (require.main === module) {
  generateMassiveData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateMassiveData };
