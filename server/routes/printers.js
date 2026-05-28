// routes/printers.js
import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/printers
router.get('/', (req, res) => {
  const printers = db.prepare('SELECT * FROM printers ORDER BY is_default DESC, created_at ASC').all();
  res.json(printers.map(mapPrinter));
});

// POST /api/printers
router.post('/', (req, res) => {
  const { name, deviceName, deviceId = '', connectionType = 'bluetooth',
          paperWidth = 80, defaultPaperSizeId = null, dpi = 203, isDefault = false } = req.body;

  if (!name || !deviceName) {
    return res.status(400).json({ error: 'name dan deviceName wajib diisi' });
  }

  const id  = randomUUID();
  const now = new Date().toISOString();

  // If this is default, unset others
  if (isDefault) db.prepare('UPDATE printers SET is_default = 0').run();

  db.prepare(`
    INSERT INTO printers (id, name, device_name, device_id, connection_type,
      paper_width, default_paper_size_id, dpi, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, deviceName, deviceId, connectionType,
         paperWidth, defaultPaperSizeId, dpi, isDefault ? 1 : 0, now);

  // Update settings default_printer_id if first printer
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM printers').get();
  if (count.cnt === 1 || isDefault) {
    db.prepare("UPDATE settings SET default_printer_id = ?, updated_at = ? WHERE id = 'singleton'")
      .run(id, now);
  }

  const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(id);
  res.status(201).json(mapPrinter(printer));
});

// PUT /api/printers/:id
router.put('/:id', (req, res) => {
  const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  if (!printer) return res.status(404).json({ error: 'Printer tidak ditemukan' });

  const { name, deviceName, connectionType, paperWidth, defaultPaperSizeId, dpi, isDefault, lastConnectedAt } = req.body;
  const now = new Date().toISOString();

  if (isDefault) db.prepare('UPDATE printers SET is_default = 0').run();

  db.prepare(`
    UPDATE printers SET
      name = COALESCE(?, name),
      device_name = COALESCE(?, device_name),
      connection_type = COALESCE(?, connection_type),
      paper_width = COALESCE(?, paper_width),
      default_paper_size_id = COALESCE(?, default_paper_size_id),
      dpi = COALESCE(?, dpi),
      is_default = COALESCE(?, is_default),
      last_connected_at = COALESCE(?, last_connected_at)
    WHERE id = ?
  `).run(name, deviceName, connectionType, paperWidth,
         defaultPaperSizeId, dpi,
         isDefault !== undefined ? (isDefault ? 1 : 0) : null,
         lastConnectedAt, req.params.id);

  const updated = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  res.json(mapPrinter(updated));
});

// PUT /api/printers/:id/default — set as default
router.put('/:id/default', (req, res) => {
  const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  if (!printer) return res.status(404).json({ error: 'Printer tidak ditemukan' });

  const now = new Date().toISOString();
  db.prepare('UPDATE printers SET is_default = 0').run();
  db.prepare('UPDATE printers SET is_default = 1 WHERE id = ?').run(req.params.id);
  db.prepare("UPDATE settings SET default_printer_id = ?, updated_at = ? WHERE id = 'singleton'")
    .run(req.params.id, now);

  res.json({ success: true });
});

// DELETE /api/printers/:id
router.delete('/:id', (req, res) => {
  const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  if (!printer) return res.status(404).json({ error: 'Printer tidak ditemukan' });
  db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Helper: map snake_case DB → camelCase
function mapPrinter(p) {
  return {
    id:                 p.id,
    name:               p.name,
    deviceName:         p.device_name,
    deviceId:           p.device_id,
    connectionType:     p.connection_type,
    paperWidth:         p.paper_width,
    defaultPaperSizeId: p.default_paper_size_id,
    dpi:                p.dpi,
    isDefault:          p.is_default === 1,
    lastConnectedAt:    p.last_connected_at,
    createdAt:          p.created_at,
  };
}

export default router;
