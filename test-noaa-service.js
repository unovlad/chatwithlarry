#!/usr/bin/env node

/**
 * Test NOAA service directly
 */

async function testNOAAService() {
  console.log(`🌪️  Testing NOAA service directly...`);

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
    console.log(`📊 Received ${pireps.length} PIREPs from NOAA`);

    if (pireps.length === 0) {
      console.log(`❌ No PIREPs received`);
      return;
    }

    // Count reports with turbulence data
    const turbulencePireps = pireps.filter(
      (pirep) => pirep.tbInt1 && pirep.tbInt1 !== "" && pirep.tbInt1 !== "NEG",
    );
    console.log(
      `🌪️  Found ${turbulencePireps.length} PIREPs with turbulence data`,
    );

    if (turbulencePireps.length > 0) {
      console.log(`   Recent turbulence:`);
      turbulencePireps.slice(0, 3).forEach((report) => {
        console.log(
          `     - ${report.tbInt1} turbulence at FL${report.fltLvl} (${report.lat.toFixed(2)}, ${report.lon.toFixed(2)})`,
        );
      });
    }

    // Test with JFK-LHR bounding box
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

testNOAAService().catch(console.error);

