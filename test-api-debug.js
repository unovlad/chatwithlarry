#!/usr/bin/env node

/**
 * Debug test for our API
 */

async function testAPI() {
  console.log(`🔍 Testing our API...`);

  try {
    const response = await fetch("http://localhost:3000/api/turbulence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flightNumber: "AA100",
      }),
    });

    if (!response.ok) {
      console.log(`❌ API error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log(`✅ API Response:`);
    console.log(`   Flight: ${data.flightNumber}`);
    console.log(`   Route: ${data.route.from} → ${data.route.to}`);
    console.log(`   Data Source: ${JSON.stringify(data.dataSource, null, 2)}`);
    console.log(`   Forecast: ${JSON.stringify(data.forecast, null, 2)}`);
  } catch (error) {
    console.log(`❌ API error:`, error.message);
  }
}

testAPI().catch(console.error);

