const fs = require('fs');
const Papa = require('papaparse');

async function geocode(name) {
  try {
    // We add a polite custom User-Agent as required by Nominatim's TOS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}`,
      { headers: { 'User-Agent': 'Alpinismo-Geocoder-App' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon };
    }
  } catch (error) {
    console.error(`Failed to geocode "${name}":`, error);
  }
  return null;
}

(async () => {
  const inputPath = 'sources/csv/vie_t.csv';  // FIXED: Point to your actual source file
  const outputPath = 'sources/csv/vie.csv';   // Point to your output destination

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Source file not found at ${inputPath}`);
    process.exit(1);
  }

  const csv = fs.readFileSync(inputPath, 'utf-8');
  
  // skipEmptyLines: true ignores trailing blank rows that break scripts
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }); 
  const data = parsed.data;

  console.log(`Loaded ${data.length} rows. Starting geocoding...`);

  for (let row of data) {
    // Checks if 'name' exists and coordinates are missing/empty
    if (row.name && (!row.latitude || !row.longitude || row.latitude.trim() === '')) {
      console.log(`Geocoding: ${row.name}`);
      const coords = await geocode(row.name);
      
      if (coords) {
        row.latitude = coords.lat;
        row.longitude = coords.lng;
        console.log(`   Found: ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`   Result not found for: ${row.name}`);
      }
      
      // Respect Nominatim's usage policy (strictly max 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  const updatedCsv = Papa.unparse(data);
  fs.writeFileSync(outputPath, updatedCsv);
  console.log(`Success! Updated CSV saved to: ${outputPath}`);
})();
