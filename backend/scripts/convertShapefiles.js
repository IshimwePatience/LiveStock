const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

const DATASET_DIR = 'C:\\Users\\PC\\Downloads\\fofo\\rwanda_data_set';
const BACKEND_OUTPUT_DIR = path.join(__dirname, '../data/geojson');
const FRONTEND_OUTPUT_DIR = path.join(__dirname, '../../frontend/src/assets/geojson');

// Ensure output directories exist
if (!fs.existsSync(BACKEND_OUTPUT_DIR)) fs.mkdirSync(BACKEND_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(FRONTEND_OUTPUT_DIR)) fs.mkdirSync(FRONTEND_OUTPUT_DIR, { recursive: true });

async function convertShpToGeoJson(shpPath, dbfPath, outputName) {
  try {
    console.log(`Converting ${outputName}...`);
    if (!fs.existsSync(shpPath)) {
      console.error(`Shapefile not found: ${shpPath}`);
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      features: []
    };

    const source = await shapefile.open(shpPath, fs.existsSync(dbfPath) ? dbfPath : undefined);
    
    while (true) {
      const result = await source.read();
      if (result.done) break;
      geojson.features.push(result.value);
    }

    const outJson = JSON.stringify(geojson);

    // Save to backend data/geojson/
    const bPath = path.join(BACKEND_OUTPUT_DIR, `${outputName}.json`);
    fs.writeFileSync(bPath, outJson);
    console.log(`Saved ${outputName}.json to backend (${(outJson.length / (1024 * 1024)).toFixed(2)} MB)`);

    // Save to frontend assets/geojson/
    const fPath = path.join(FRONTEND_OUTPUT_DIR, `${outputName}.json`);
    fs.writeFileSync(fPath, outJson);
    console.log(`Saved ${outputName}.json to frontend`);

  } catch (err) {
    console.error(`Error converting ${outputName}:`, err);
  }
}

async function run() {
  await convertShpToGeoJson(
    path.join(DATASET_DIR, 'Country_Boundary', 'Country_Boundary.shp'),
    path.join(DATASET_DIR, 'Country_Boundary', 'Country_Boundary.dbf'),
    'country'
  );

  await convertShpToGeoJson(
    path.join(DATASET_DIR, 'District_Boundaries', 'District_Boundary.shp'),
    path.join(DATASET_DIR, 'District_Boundaries', 'District_Boundary.dbf'),
    'districts'
  );

  await convertShpToGeoJson(
    path.join(DATASET_DIR, 'Sector_Boundaries', 'Sector_Boundary.shp'),
    path.join(DATASET_DIR, 'Sector_Boundaries', 'Sector_Boundary.dbf'),
    'sectors'
  );

  console.log('Shapefile conversion completed successfully!');
}

run();
