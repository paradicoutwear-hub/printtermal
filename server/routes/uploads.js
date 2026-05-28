// routes/uploads.js
import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const router = Router();

// Multer: simpan di /uploads/, hanya PDF, max 50MB
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => cb(null, `${randomUUID()}.pdf`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Hanya file PDF yang diterima'));
  },
});

// POST /api/upload
router.post('/', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File PDF tidak ditemukan' });

  // Return metadata — pages counted by frontend using PDF.js
  res.json({
    id:          randomUUID(),
    fileName:    req.file.originalname,
    storedName:  req.file.filename,
    fileSize:    req.file.size,
    filePath:    `/uploads/${req.file.filename}`,
    importedAt:  new Date().toISOString(),
  });
});

// DELETE /api/upload/:filename — hapus file dari disk
router.delete('/:filename', (req, res) => {
  try {
    // Safety: strip any path traversal
    const safe = req.params.filename.replace(/[^a-zA-Z0-9\-_.]/g, '');
    unlinkSync(join(UPLOAD_DIR, safe));
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'File tidak ditemukan' });
  }
});

export default router;
