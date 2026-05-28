// server/index.js — Express entry point
import express from 'express';
import cors    from 'cors';
import morgan  from 'morgan';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, unlinkSync } from 'fs';
import os from 'os';

import printersRouter   from './routes/printers.js';
import paperSizesRouter from './routes/paperSizes.js';
import settingsRouter   from './routes/settings.js';
import printJobsRouter  from './routes/printJobs.js';
import uploadsRouter    from './routes/uploads.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const UPLOAD_DIR = join(ROOT, 'uploads');
const PORT       = process.env.PORT || 3030;

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static: serve uploaded PDFs ───────────────────────────────
app.use('/uploads', express.static(UPLOAD_DIR));

// ── Static: serve frontend ────────────────────────────────────
app.use(express.static(ROOT));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/printers',   printersRouter);
app.use('/api/paper-sizes', paperSizesRouter);
app.use('/api/settings',   settingsRouter);
app.use('/api/jobs',       printJobsRouter);
app.use('/api/upload',     uploadsRouter);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── SPA fallback ──────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(ROOT, 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('');
  console.log('🖨️  ThermalPrint Studio Backend');
  console.log('─────────────────────────────────');
  console.log(`   Local  →  http://localhost:${PORT}`);
  console.log(`   LAN    →  http://${localIP}:${PORT}`);
  console.log('─────────────────────────────────');
  console.log('');
});

// ── Cleanup uploads on exit ───────────────────────────────────
function cleanupUploads() {
  try {
    const files = readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.pdf'));
    files.forEach(f => unlinkSync(join(UPLOAD_DIR, f)));
    if (files.length) console.log(`🗑️  Dibersihkan ${files.length} file PDF sesi`);
  } catch { /* ignore */ }
}

process.on('SIGINT',  () => { cleanupUploads(); process.exit(0); });
process.on('SIGTERM', () => { cleanupUploads(); process.exit(0); });

// ── Util ──────────────────────────────────────────────────────
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '0.0.0.0';
}
