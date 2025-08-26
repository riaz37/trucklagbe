import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bangladesh cities and locations
const bangladeshCities = [
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
    'Bogra',
    'Kushtia',
    'Jessore',
    'Dinajpur',
    'Faridpur',
    'Pabna',
    'Noakhali',
    'Feni',
];

// Bangladeshi names
const bangladeshiNames = [
    'Abdul Rahman',
    'Mohammad Ali',
    'Ahmed Khan',
    'Fatima Begum',
    'Hassan Ahmed',
    'Ayesha Khan',
    'Imran Hossain',
    'Nusrat Jahan',
    'Kamal Uddin',
    'Sabina Yasmin',
    'Rashid Ahmed',
    'Nasreen Akter',
    'Shahid Islam',
    'Rehana Begum',
    'Mizanur Rahman',
    'Tahmina Khatun',
    'Azizul Haque',
    'Salma Khatun',
    'Jahangir Alam',
    'Rashida Begum',
];

// Generate random phone numbers
function generateBangladeshPhone(): string {
    const prefixes = [
        '+88017',
        '+88018',
        '+88019',
        '+88015',
        '+88016',
        '+88011',
        '+88013',
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 90000000) + 10000000;
    return `${prefix}${number}`;
}

// Generate random amount between 500-5000 BDT
function generateAmount(): number {
    return Math.floor(Math.random() * 4500) + 500;
}

// Generate random rating between 3.0-5.0
function generateRating(): number {
    return Math.round((Math.random() * 2 + 3) * 10) / 10;
}

// Generate random date within last 6 months
function generateRandomDate(): Date {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const randomTime =
        sixMonthsAgo.getTime() +
        Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime);
}

// Generate random comment
function generateComment(rating: number): string {
    const comments = {
        5.0: [
            'Excellent service, very professional driver',
            'Outstanding experience, highly recommended',
            'Perfect trip, driver was very courteous',
            'Amazing service, exceeded expectations',
            'Best driver I have ever had',
        ],
        4.5: [
            'Very good service, driver was professional',
            'Great experience, would recommend',
            'Good trip, driver was helpful',
            'Satisfactory service, driver was polite',
            'Nice journey, driver was friendly',
        ],
        4.0: [
            'Good service, driver was okay',
            'Decent trip, driver was professional',
            'Satisfactory experience',
            'Good journey, driver was helpful',
            'Nice service overall',
        ],
        3.5: [
            'Okay service, driver was average',
            'Decent trip, could be better',
            'Acceptable service',
            'Fair experience, driver was okay',
            'Satisfactory but room for improvement',
        ],
        3.0: [
            'Average service, driver was okay',
            'Basic trip, nothing special',
            'Acceptable but basic',
            'Fair service, driver was adequate',
            'Okay experience overall',
        ],
    };

    const ratingKey = Math.floor(rating * 2) / 2;
    const commentList =
        comments[ratingKey as keyof typeof comments] || comments[3.0];
    return commentList[Math.floor(Math.random() * commentList.length)];
}

async function main() {
    console.log('🌏 Starting Bangladesh Trip Analytics seed...');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await prisma.rating.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.trip.deleteMany();
        await prisma.driver.deleteMany();
        
        // Reset auto-increment counters
        console.log('🔄 Resetting auto-increment counters...');
        await prisma.$executeRaw`ALTER TABLE drivers AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`ALTER TABLE trips AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`ALTER TABLE payments AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`ALTER TABLE ratings AUTO_INCREMENT = 1`;

        // Create drivers
        console.log('👨‍💼 Creating drivers...');
        const drivers = [];
        for (let i = 1; i <= 20; i++) {
            const driver = await prisma.driver.create({
                data: {
                    driver_name: bangladeshiNames[i - 1],
                    phone_number: generateBangladeshPhone(),
                    onboarding_date: generateRandomDate(),
                },
            });
            drivers.push(driver);
            console.log(`✅ Created driver: ${driver.driver_name}`);
        }

        // Create trips
        console.log('🚛 Creating trips...');
        const trips: Array<{ id: number; trip_date: Date }> = [];
        for (let i = 1; i <= 100; i++) {
            const driver = drivers[Math.floor(Math.random() * drivers.length)];
            const startCity =
                bangladeshCities[Math.floor(Math.random() * bangladeshCities.length)];
            let endCity;
            do {
                endCity =
                    bangladeshCities[Math.floor(Math.random() * bangladeshCities.length)];
            } while (endCity === startCity);

            const trip = await prisma.trip.create({
                data: {
                    driver_id: driver.id,
                    start_location: startCity,
                    end_location: endCity,
                    trip_date: generateRandomDate(),
                },
            });
            trips.push(trip);

            if (i % 20 === 0) {
                console.log(`✅ Created ${i} trips...`);
            }
        }

        // Create payments
        console.log('💰 Creating payments...');
        for (let i = 0; i < trips.length; i++) {
            const trip = trips[i];
            const amount = generateAmount();

            await prisma.payment.create({
                data: {
                    trip_id: trip.id,
                    amount: amount,
                    payment_date: new Date(
                        trip.trip_date.getTime() + 24 * 60 * 60 * 1000,
                    ), // Next day
                },
            });

            if ((i + 1) % 20 === 0) {
                console.log(`✅ Created ${i + 1} payments...`);
            }
        }

        // Create ratings
        console.log('⭐ Creating ratings...');
        for (let i = 0; i < trips.length; i++) {
            const trip = trips[i];
            const rating = generateRating();
            const comment = generateComment(rating);

            await prisma.rating.create({
                data: {
                    trip_id: trip.id,
                    rating_value: rating,
                    comment: comment,
                },
            });

            if ((i + 1) % 20 === 0) {
                console.log(`✅ Created ${i + 1} ratings...`);
            }
        }

        console.log('\n🎉 Seed completed successfully!');
        console.log(`📊 Created:`);
        console.log(`   👨‍💼 ${drivers.length} drivers`);
        console.log(`   🚛 ${trips.length} trips`);
        console.log(`   💰 ${trips.length} payments`);
        console.log(`   ⭐ ${trips.length} ratings`);
        console.log(`\n🌏 All data is based on Bangladesh locations:`);
        console.log(`   Cities: ${bangladeshCities.slice(0, 5).join(', ')}...`);
        console.log(`   Names: ${bangladeshiNames.slice(0, 3).join(', ')}...`);
        console.log(`\n💡 You can now test the API endpoints:`);
        console.log(`   GET /api/v1/drivers/1/analytics`);
        console.log(`   GET /api/v1/drivers/1/analytics/optimized`);
        console.log(`   GET /api/v1/drivers/1/analytics/unoptimized`);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
