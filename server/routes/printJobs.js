// routes/printJobs.js
import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/jobs?limit=20
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const rows  = db.prepare(`
    SELECT * FROM print_jobs ORDER BY started_at DESC LIMIT ?
  `).all(limit);
  res.json(rows.map(mapJob));
});

// POST /api/jobs — catat job baru
router.post('/', (req, res) => {
  const {
    printerId, printerName, paperSizeId, paperSizeName,
    fileName, totalPages
  } = req.body;

  if (!totalPages) return res.status(400).json({ error: 'totalPages wajib diisi' });

  const id  = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO print_jobs
      (id, printer_id, printer_name, paper_size_id, paper_size_name,
       file_name, total_pages, status, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'printing', ?)
  `).run(id, printerId, printerName, paperSizeId, paperSizeName, fileName, totalPages, now);

  const job = db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(id);
  res.status(201).json(mapJob(job));
});

// PUT /api/jobs/:id — update status (selesai / gagal)
router.put('/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan' });

  const { status, successPages, failedPages } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE print_jobs SET
      status        = COALESCE(?, status),
      success_pages = COALESCE(?, success_pages),
      failed_pages  = COALESCE(?, failed_pages),
      finished_at   = ?
    WHERE id = ?
  `).run(status ?? null, successPages ?? null, failedPages ?? null, now, req.params.id);

  const updated = db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(req.params.id);
  res.json(mapJob(updated));
});

// DELETE /api/jobs — hapus semua riwayat
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM print_jobs').run();
  res.json({ success: true });
});

function mapJob(j) {
  return {
    id:            j.id,
    printerId:     j.printer_id,
    printerName:   j.printer_name,
    paperSizeId:   j.paper_size_id,
    paperSizeName: j.paper_size_name,
    fileName:      j.file_name,
    totalPages:    j.total_pages,
    successPages:  j.success_pages,
    failedPages:   j.failed_pages,
    status:        j.status,
    startedAt:     j.started_at,
    finishedAt:    j.finished_at,
  };
}

export default router;
