// Test script for Turbulence API
// Run with: node test-turbulence-api.js

const API_BASE_URL = "http://localhost:3000";

async function testTurbulenceAPI() {
  console.log("🧪 Testing Turbulence Forecast API...\n");

  const testCases = [
    { flightNumber: "AA100" },
    { flightNumber: "UA2457" },
    { flightNumber: "DL1234" },
    { flightNumber: "BA789" },
    { flightNumber: "LH456" },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`✈️  Testing flight: ${testCase.flightNumber}`);

      const response = await fetch(`${API_BASE_URL}/api/turbulence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Success for ${testCase.flightNumber}:`);
      console.log(`   Route: ${data.route.from} → ${data.route.to}`);
      console.log(`   Segments: ${data.forecast.length}`);
      console.log(`   Last Updated: ${data.lastUpdated}`);

      // Show data source information
      console.log(`   📊 Data Sources:`);
      console.log(`      Flight Route: ${data.dataSource.flightRoute} ✅`);
      console.log(
        `      Turbulence Reports: ${data.dataSource.turbulenceReports} ${data.dataSource.turbulenceReports === "real" ? "✅" : "ℹ️"}`,
      );
      console.log(`      PIREPs Count: ${data.dataSource.pirepsCount}`);
      console.log(
        `      FlightAware Available: ${data.dataSource.aviationStackAvailable ? "✅" : "❌"}`,
      );

      // Show forecast details
      data.forecast.forEach((segment, index) => {
        console.log(
          `   ${index + 1}. ${segment.segment}: ${segment.severity} (${Math.round(segment.probability * 100)}%)`,
        );
      });

      console.log("");
    } catch (error) {
      console.error(
        `❌ Error testing ${testCase.flightNumber}:`,
        error.message,
      );
      console.log("");
    }
  }

  // Test API documentation endpoint
  try {
    console.log("📚 Testing API documentation endpoint...");
    const response = await fetch(`${API_BASE_URL}/api/turbulence`);
    const data = await response.json();
    console.log("✅ API Documentation:", data.message);
    console.log("");
  } catch (error) {
    console.error("❌ Error testing documentation:", error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log("🚨 Testing error cases...\n");

  const errorCases = [
    { flightNumber: "" }, // Empty flight number
    { flightNumber: "INVALID" }, // Invalid format
    { flightNumber: "123" }, // Numbers only
    { flightNumber: "ABCDEFGHIJK" }, // Too long
  ];

  for (const testCase of errorCases) {
    try {
      console.log(`🔍 Testing invalid input: "${testCase.flightNumber}"`);

      const response = await fetch(`${API_BASE_URL}/api/turbulence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(
          `⚠️  Unexpected success for invalid input: ${testCase.flightNumber}`,
        );
      } else {
        console.log(`✅ Correctly rejected: ${data.error}`);
      }

      console.log("");
    } catch (error) {
      console.error(
        `❌ Network error testing ${testCase.flightNumber}:`,
        error.message,
      );
      console.log("");
    }
  }
}

// Test caching
async function testCaching() {
  console.log("💾 Testing caching...\n");

  const flightNumber = "AA100";

  try {
    console.log(`🔄 First request for ${flightNumber}...`);
    const start1 = Date.now();
    const response1 = await fetch(`${API_BASE_URL}/api/turbulence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightNumber }),
    });
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`✅ First request completed in ${time1}ms`);

    console.log(`🔄 Second request for ${flightNumber} (should be cached)...`);
    const start2 = Date.now();
    const response2 = await fetch(`${API_BASE_URL}/api/turbulence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightNumber }),
    });
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`✅ Second request completed in ${time2}ms`);

    if (time2 < time1) {
      console.log(
        "✅ Caching appears to be working (second request was faster)",
      );
    } else {
      console.log(
        "⚠️  Caching might not be working (second request was not faster)",
      );
    }

    console.log("");
  } catch (error) {
    console.error("❌ Error testing caching:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Turbulence API Tests\n");
  console.log(
    "Make sure your Next.js server is running on http://localhost:3000\n",
  );

  await testTurbulenceAPI();
  await testErrorCases();
  await testCaching();

  console.log("🏁 All tests completed!");
}

runAllTests().catch(console.error);
