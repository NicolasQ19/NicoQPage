const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n  Uso: npm run add -- "Nombre del tema" ruta/al/archivo.mp3\n');
  console.log('  Opciones extra:');
  console.log('    --year 2026');
  console.log('    --image https://...\n');
  console.log('  Ejemplo:');
  console.log('    npm run add -- "Mi nuevo tema" C:/Music/tema.mp3 --year 2025\n');
  process.exit(1);
}

const songName = args[0];
const filePath = args[1];

// Parse optional flags
let year = new Date().getFullYear().toString();
let image = '';

for (let i = 2; i < args.length; i++) {
  if (args[i] === '--year' && args[i + 1]) { year = args[++i]; }
  if (args[i] === '--image' && args[i + 1]) { image = args[++i]; }
}

// Validate source file exists
if (!fs.existsSync(filePath)) {
  console.error(`\n  Error: no se encontro el archivo "${filePath}"\n`);
  process.exit(1);
}

const ext = path.extname(filePath);
const destName = songName + ext;
const destPath = path.join(__dirname, '..', 'public', 'audio', destName);

// Copy file to public/audio/
fs.copyFileSync(filePath, destPath);
console.log(`  Copiado -> public/audio/${destName}`);

// Update tracks.json
const tracksPath = path.join(__dirname, '..', 'tracks.json');
const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf-8'));

const maxId = tracks.reduce((max, t) => Math.max(max, t.id), 0);

const newTrack = {
  id: maxId + 1,
  artist: 'NicoQ',
  songName,
  year,
  audioUrl: `/audio/${destName}`,
};

if (image) newTrack.image = image;

tracks.unshift(newTrack); // Add to the top of the list
fs.writeFileSync(tracksPath, JSON.stringify(tracks, null, 2) + '\n');

console.log(`  Agregado "${songName}" a tracks.json (id: ${newTrack.id})`);
console.log('\n  Listo! Corre "npm run dev" para verlo.\n');
