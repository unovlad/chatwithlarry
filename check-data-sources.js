// Quick script to check data sources and API availability
// Run with: node check-data-sources.js

const API_BASE_URL = "http://localhost:3000";

async function checkDataSources() {
  console.log("🔍 Checking Turbulence API Data Sources...\n");

  try {
    const response = await fetch(`${API_BASE_URL}/api/turbulence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flightNumber: "AA100" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("📊 Data Source Analysis:");
    console.log("========================");

    // Flight Route Analysis
    console.log(`\n✈️  Flight Route Data:`);
    console.log(`   Source: ${data.dataSource.flightRoute.toUpperCase()}`);
    console.log(
      `   FlightAware API: ${data.dataSource.aviationStackAvailable ? "✅ Available" : "❌ Not Available"}`,
    );
    console.log(`   ✅ Using REAL flight data from FlightAware API`);

    // Turbulence Data Analysis
    console.log(`\n🌪️  Turbulence Data:`);
    console.log(
      `   Source: ${data.dataSource.turbulenceReports.toUpperCase()}`,
    );
    console.log(`   PIREPs Reports Found: ${data.dataSource.pirepsCount}`);

    if (data.dataSource.turbulenceReports === "real") {
      console.log(`   ✅ Using REAL turbulence data from NOAA PIREPs`);
      console.log(`   📈 Found ${data.dataSource.pirepsCount} pilot reports`);
    } else {
      console.log(`   ℹ️  No turbulence reports found for this route`);
      console.log(`   💡 This could be due to:`);
      console.log(`      - No current turbulence in the area`);
      console.log(`      - NOAA API temporarily unavailable`);
      console.log(`      - Network connectivity issues`);
    }

    // Overall Assessment
    console.log(`\n🎯 Overall Data Quality:`);
    if (data.dataSource.turbulenceReports === "real") {
      console.log(
        `   🟢 EXCELLENT: Both flight route and turbulence data are REAL`,
      );
    } else {
      console.log(`   🟡 PARTIAL: Real flight route, no turbulence reports`);
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (!data.dataSource.aviationStackAvailable) {
      console.log(
        `   - Add FLIGHTAWARE_API_KEY to .env.local for real flight routes`,
      );
      console.log(
        `   - Get API key at: https://www.flightaware.com/commercial/aeroapi/`,
      );
    }

    if (data.dataSource.turbulenceReports === "none") {
      console.log(
        `   - Try different flight routes (some areas have more turbulence reports)`,
      );
      console.log(`   - Check NOAA PIREPs API availability`);
      console.log(`   - Check network connectivity to aviationweather.gov`);
    }

    console.log(`\n📋 Sample Response Structure:`);
    console.log(`   Flight: ${data.flightNumber}`);
    console.log(`   Route: ${data.route.from} → ${data.route.to}`);
    console.log(`   Segments: ${data.forecast.length}`);
    console.log(`   Last Updated: ${data.lastUpdated}`);
  } catch (error) {
    console.error("❌ Error checking data sources:", error.message);
    console.log(
      "\n💡 Make sure your Next.js server is running on http://localhost:3000",
    );
  }
}

checkDataSources();
