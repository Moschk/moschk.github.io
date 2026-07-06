const fs = require('fs');
const Papa = require('papaparse');

async function geocode(name) {
  try {
    // Aggiungiamo anche "Dolomiti" alla ricerca per aiutare Nominatim a essere più preciso con le montagne
    const query = `${name}, Dolomites, Italy`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Alpinismo-Geocoder-App' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon };
    }
  } catch (error) {
    console.error(`Errore durante il geocoding di "${name}":`, error);
  }
  return null;
}

(async () => {
  const inputPath = 'sources/csv/vie_t.csv';
  const outputPath = 'sources/csv/vie.csv';

  if (!fs.existsSync(inputPath)) {
    console.error(`Errore: File sorgente non trovato in ${inputPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(inputPath, 'utf-8');
  
  // Dividiamo il file in righe per saltare i commenti iniziali dell'alpinismo
  const lines = rawContent.split(/\r?\n/);
  
  // Trova l'indice della riga che contiene l'intestazione effettiva delle colonne
  const headerIndex = lines.findIndex(line => line.includes('NOME CIMA') && line.includes('VIA'));
  
  if (headerIndex === -1) {
    console.error("Errore: Impossibile trovare la riga di intestazione (CN, Grado, NOME CIMA...) nel CSV.");
    process.exit(1);
  }

  // Conserviamo le righe di commento iniziali per poterle riscrivere identiche nel file finale
  const commentHeader = lines.slice(0, headerIndex).join('\n') + '\n';
  
  // Uniamo il resto del CSV (dall'intestazione in poi) per passarlo a PapaParse
  const csvDataToParse = lines.slice(headerIndex).join('\n');

  const parsed = Papa.parse(csvDataToParse, { 
    header: true, 
    skipEmptyLines: true 
  }); 
  
  const data = parsed.data;
  console.log(`Caricate ${data.length} vie alpine. Inizio geocoding...`);

  for (let row of data) {
    const nomeCima = row['NOME CIMA'];
    
    // Controlla se la cima ha un nome e se mancano le coordinate lat/lng
    if (nomeCima && (!row['lat'] || !row['lng'] || row['lat'].trim() === '')) {
      console.log(`Geocoding in corso per: ${nomeCima}`);
      const coords = await geocode(nomeCima);
      
      if (coords) {
        row['lat'] = coords.lat;
        row['lng'] = coords.lng;
        console.log(`   Trovato: ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`   Nessun risultato per: ${nomeCima}`);
      }
      
      // Rispetta la policy di Nominatim (massimo 1 richiesta al secondo)
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  // Ricreiamo il CSV unendo i commenti iniziali con i dati aggiornati
  const updatedCsvRows = Papa.unparse(data);
  const finalCsvContent = commentHeader + updatedCsvRows;

  fs.writeFileSync(outputPath, finalCsvContent);
  console.log(`Successo! Il nuovo CSV con le coordinate è stato salvato in: ${outputPath}`);
})();
