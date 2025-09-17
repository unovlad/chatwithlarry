#!/usr/bin/env node

/**
 * Test NOAA PIREPs API directly
 */

async function testNOAAPireps() {
  console.log(`🌪️  Testing NOAA PIREPs API directly...`);

  try {
    // Test with global bounding box
    const response = await fetch(
      "https://aviationweather.gov/api/data/pirep?format=json&bbox=-180,-90,180,90",
    );

    if (!response.ok) {
      console.log(
        `❌ NOAA API error: ${response.status} ${response.statusText}`,
      );
      return;
    }

    const pireps = await response.json();

    console.log(`✅ NOAA PIREPs API working`);
    console.log(`   Total PIREPs: ${pireps.length}`);

    // Count turbulence reports
    const turbulenceReports = pireps.filter(
      (pirep) => pirep.tbInt1 && pirep.tbInt1 !== "" && pirep.tbInt1 !== "NEG",
    );

    console.log(`   Turbulence Reports: ${turbulenceReports.length}`);

    if (turbulenceReports.length > 0) {
      console.log(`   Recent turbulence:`);
      turbulenceReports.slice(0, 5).forEach((report) => {
        console.log(
          `     - ${report.tbInt1} turbulence at FL${report.fltLvl} (${report.lat.toFixed(2)}, ${report.lon.toFixed(2)})`,
        );
      });
    }

    // Test with specific bounding box for JFK-LHR route
    console.log(`\n🌪️  Testing with JFK-LHR bounding box...`);
    const jfkLhrResponse = await fetch(
      "https://aviationweather.gov/api/data/pirep?format=json&bbox=-85,35,-70,55",
    );

    if (!jfkLhrResponse.ok) {
      console.log(
        `❌ NOAA API error: ${jfkLhrResponse.status} ${jfkLhrResponse.statusText}`,
      );
      return;
    }

    const jfkLhrPireps = await jfkLhrResponse.json();

    console.log(`   JFK-LHR region PIREPs: ${jfkLhrPireps.length}`);

    const jfkLhrTurbulence = jfkLhrPireps.filter(
      (pirep) => pirep.tbInt1 && pirep.tbInt1 !== "" && pirep.tbInt1 !== "NEG",
    );

    console.log(`   JFK-LHR region turbulence: ${jfkLhrTurbulence.length}`);

    if (jfkLhrTurbulence.length > 0) {
      console.log(`   JFK-LHR region turbulence:`);
      jfkLhrTurbulence.forEach((report) => {
        console.log(
          `     - ${report.tbInt1} turbulence at FL${report.fltLvl} (${report.lat.toFixed(2)}, ${report.lon.toFixed(2)})`,
        );
      });
    }
  } catch (error) {
    console.log(`❌ NOAA API error:`, error.message);
  }
}

testNOAAPireps().catch(console.error);
