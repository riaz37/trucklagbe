// Custom functions for Artillery load testing
function generateRandomDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function generateRandomLocation() {
  const locations = [
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
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateRandomDriverName() {
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
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

function generateRandomPhoneNumber() {
  return `01${Math.floor(Math.random() * 9)}${Math.floor(
    Math.random() * 100000000,
  )
    .toString()
    .padStart(8, '0')}`;
}

function generateRandomAmount(min = 100, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomRating() {
  return (Math.random() * 2 + 3).toFixed(2); // 3.0 to 5.0
}

function generateRandomComment() {
  const comments = [
    'Great service, very professional driver',
    'Safe and comfortable journey',
    'Driver was punctual and courteous',
    'Clean vehicle and smooth ride',
    'Excellent communication throughout the trip',
    'Driver knew the route well',
    'Very helpful with luggage',
    'Professional and friendly service',
    'On time pickup and drop',
    'Highly recommended driver',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

// Export functions for Artillery
export {
  generateRandomDate,
  generateRandomLocation,
  generateRandomDriverName,
  generateRandomPhoneNumber,
  generateRandomAmount,
  generateRandomRating,
  generateRandomComment,
};

// Artillery hook functions
export function beforeRequest(requestParams, context, ee, next) {
  // Add random delays to simulate real user behavior
  if (Math.random() < 0.1) {
    // 10% chance of delay
    context.vars.thinkTime = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
  }

  // Add realistic user agent
  if (!requestParams.headers) requestParams.headers = {};
  requestParams.headers['User-Agent'] = getRandomUserAgent();

  // Add realistic referrer for some requests
  if (Math.random() < 0.3) {
    requestParams.headers['Referer'] = getRandomReferrer();
  }

  return next();
}

export function afterResponse(requestParams, response, context, ee, next) {
  // Log slow responses
  if (
    response.timings &&
    response.timings.phases &&
    response.timings.phases.firstByte > 2000
  ) {
    console.log(
      `Slow response detected: ${response.timings.phases.firstByte}ms for ${requestParams.url}`,
    );
  }

  // Track response times for analysis
  if (!context.vars.responseTimes) context.vars.responseTimes = [];
  context.vars.responseTimes.push(
    response.timings ? response.timings.phases.firstByte : 0,
  );

  return next();
}

function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomReferrer() {
  const referrers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://www.linkedin.com/',
    'https://trucklagbe.com/',
    'https://trucklagbe.com/drivers',
    'https://trucklagbe.com/trips',
    'https://trucklagbe.com/analytics',
  ];
  return referrers[Math.floor(Math.random() * referrers.length)];
}
