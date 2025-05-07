/**
 * Performance test for booking API
 * This script simulates multiple concurrent booking requests
 * to test the performance and race condition handling
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = 'http://localhost:5000/api/bookings';
const NUM_CONCURRENT_REQUESTS = 10;
const TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

// Test data
const generateTestData = (userId) => ({
  court_id: 1,
  start_time: '2025-06-01T10:00:00Z',
  end_time: '2025-06-01T11:00:00Z',
  user_id: userId
});

// Function to make a booking request
const makeBookingRequest = async (userId) => {
  const startTime = performance.now();
  
  try {
    const response = await axios.post(
      API_URL,
      generateTestData(userId),
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      userId,
      success: true,
      status: response.status,
      duration,
      data: response.data
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      userId,
      success: false,
      status: error.response?.status || 500,
      duration,
      error: error.response?.data?.message || error.message
    };
  }
};

// Main function to run the performance test
const runPerformanceTest = async () => {
  console.log(`Starting performance test with ${NUM_CONCURRENT_REQUESTS} concurrent requests`);
  console.log('-----------------------------------------------------------');
  
  const startTime = performance.now();
  
  // Create an array of promises for concurrent requests
  const requests = Array.from({ length: NUM_CONCURRENT_REQUESTS }, (_, i) => 
    makeBookingRequest(i + 1)
  );
  
  // Wait for all requests to complete
  const results = await Promise.all(requests);
  
  const endTime = performance.now();
  const totalDuration = endTime - startTime;
  
  // Analyze results
  const successfulRequests = results.filter(r => r.success);
  const failedRequests = results.filter(r => !r.success);
  
  // Calculate statistics
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  
  // Print results
  console.log('Performance Test Results:');
  console.log('-----------------------------------------------------------');
  console.log(`Total Requests: ${NUM_CONCURRENT_REQUESTS}`);
  console.log(`Successful Requests: ${successfulRequests.length}`);
  console.log(`Failed Requests: ${failedRequests.length}`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
  console.log(`Average Request Duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Min Request Duration: ${minDuration.toFixed(2)}ms`);
  console.log(`Max Request Duration: ${maxDuration.toFixed(2)}ms`);
  console.log('-----------------------------------------------------------');
  
  // Check if any request took more than 5 seconds
  const slowRequests = results.filter(r => r.duration > 5000);
  if (slowRequests.length > 0) {
    console.log(`WARNING: ${slowRequests.length} requests took more than 5 seconds to complete`);
    slowRequests.forEach(r => {
      console.log(`  User ${r.userId}: ${r.duration.toFixed(2)}ms`);
    });
  } else {
    console.log('All requests completed within the 5-second threshold');
  }
  
  // Print detailed results for each request
  console.log('\nDetailed Results:');
  console.log('-----------------------------------------------------------');
  results.forEach(r => {
    if (r.success) {
      console.log(`User ${r.userId}: SUCCESS (${r.duration.toFixed(2)}ms) - Status: ${r.status}`);
    } else {
      console.log(`User ${r.userId}: FAILED (${r.duration.toFixed(2)}ms) - Status: ${r.status} - Error: ${r.error}`);
    }
  });
};

// Run the test
runPerformanceTest()
  .then(() => {
    console.log('\nPerformance test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running performance test:', error);
    process.exit(1);
  });
