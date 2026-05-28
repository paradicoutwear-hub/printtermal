// routes/paperSizes.js
import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/paper-sizes
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM paper_sizes ORDER BY is_built_in DESC, name ASC').all();
  res.json(rows.map(mapPaperSize));
});

// POST /api/paper-sizes — tambah custom
router.post('/', (req, res) => {
  const { name, width, height = 0, gap = 0 } = req.body;
  if (!name || !width) return res.status(400).json({ error: 'name dan width wajib diisi' });

  const id  = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO paper_sizes (id, name, width, height, gap, is_built_in, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(id, name, width, height, gap, now);

  const row = db.prepare('SELECT * FROM paper_sizes WHERE id = ?').get(id);
  res.status(201).json(mapPaperSize(row));
});

// DELETE /api/paper-sizes/:id — hapus custom saja
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM paper_sizes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ukuran kertas tidak ditemukan' });
  if (row.is_built_in) return res.status(403).json({ error: 'Ukuran bawaan tidak bisa dihapus' });
  db.prepare('DELETE FROM paper_sizes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

function mapPaperSize(p) {
  return {
    id:        p.id,
    name:      p.name,
    width:     p.width,
    height:    p.height,
    gap:       p.gap,
    isBuiltIn: p.is_built_in === 1,
    createdAt: p.created_at,
  };
}

export default router;
