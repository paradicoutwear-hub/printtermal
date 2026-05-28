// routes/settings.js
import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  const row = db.prepare("SELECT * FROM settings WHERE id = 'singleton'").get();
  res.json(mapSettings(row));
});

// PUT /api/settings
router.put('/', (req, res) => {
  const { defaultPrinterId, defaultPaperSizeId, printDelayMs, theme } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE settings SET
      default_printer_id    = COALESCE(?, default_printer_id),
      default_paper_size_id = COALESCE(?, default_paper_size_id),
      print_delay_ms        = COALESCE(?, print_delay_ms),
      theme                 = COALESCE(?, theme),
      updated_at            = ?
    WHERE id = 'singleton'
  `).run(
    defaultPrinterId  ?? null,
    defaultPaperSizeId ?? null,
    printDelayMs      ?? null,
    theme             ?? null,
    now
  );

  const updated = db.prepare("SELECT * FROM settings WHERE id = 'singleton'").get();
  res.json(mapSettings(updated));
});

function mapSettings(s) {
  return {
    defaultPrinterId:    s.default_printer_id,
    defaultPaperSizeId:  s.default_paper_size_id,
    printDelayMs:        s.print_delay_ms,
    theme:               s.theme,
    updatedAt:           s.updated_at,
  };
}

export default router;
