const fs = require('fs');
const Papa = require('papaparse');

async function geocode(name) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}`,
      { headers: { 'User-Agent': 'Alpinismo-Geocoder' } }
    );
    const data = await response.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon };
    }
  } catch (error) {
    console.error(`Failed to geocode ${name}:`, error);
  }
  return null;
}

(async () => {
  const csv = fs.readFileSync('sources/csv/vie.csv', 'utf-8');
  // header: true treats the first row as column names
  const parsed = Papa.parse(csv, { header: true }); 
  const data = parsed.data;

  for (let row of data) {
    // Assuming your CSV columns are named 'name', 'latitude', and 'longitude'
    if (row.name && (!row.latitude || !row.longitude)) {
      console.log(`Geocoding: ${row.name}`);
      const coords = await geocode(row.name);
      if (coords) {
        row.latitude = coords.lat;
        row.longitude = coords.lng;
      }
      // Respect Nominatim's usage policy (max 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const updatedCsv = Papa.unparse(data);
  fs.writeFileSync('sources/csv/gps_test.csv', updatedCsv);
  console.log('CSV update complete.');
})();
