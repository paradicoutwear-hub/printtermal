# PRD — ThermalPrint Studio
### PWA · Cetak Thermal via Bluetooth · Mobile First · Offline
**Version:** 3.0.0  
**Tanggal:** 28 Mei 2026

---

## 1. Produk

ThermalPrint Studio adalah PWA yang memungkinkan siapa saja mencetak PDF ke printer thermal Bluetooth langsung dari smartphone — tanpa kabel, tanpa instalasi, bisa dipakai offline sepenuhnya.

**Alur inti: Buka → Sambung printer → Upload PDF → Cetak. Selesai.**

### Masalah yang Diselesaikan
- Tidak ada cara mudah cetak resi/label dari HP ke printer thermal Bluetooth
- Seller marketplace harus pakai laptop atau install driver untuk cetak
- Mass printing resi dilakukan manual satu per satu, lambat

### Batasan yang Disengaja
Berikut yang **tidak** dibangun agar aplikasi tetap sederhana:

- ❌ Template editor / desain label
- ❌ Barcode / QR generator
- ❌ Import CSV / Excel
- ❌ Integrasi API marketplace
- ❌ Akun user / login / cloud sync
- ❌ Riwayat print
- ❌ Koneksi Wi-Fi / LAN printer
- ❌ Zebra ZPL

---

## 2. Target Pengguna

| Siapa | Kebutuhan |
|---|---|
| Seller Shopee / Tokopedia / TikTok Shop | Cetak resi PDF dari HP ke printer label |
| UMKM & kasir | Cetak struk tanpa laptop |
| Reseller volume tinggi | Mass print 50–300 resi sekaligus |

---

## 3. Printer yang Didukung

Fokus: **printer thermal Bluetooth terlaris di marketplace Indonesia.**

### Tier 1 — Prioritas Utama

| Printer | Lebar | Koneksi | Keterangan |
|---|---|---|---|
| **Xprinter XP-420B** | 104mm | Bluetooth + USB | Label resi A6, terlaris |
| **Xprinter XP-4601B** | 104mm | Bluetooth + USB | Varian XP-420B |
| **Iware DT-360** | 80mm | Bluetooth + USB | Terlaris label 80mm Tokopedia |
| **Iware C58BT** | 58mm | Bluetooth + USB | Terlaris kasir/PPOB |
| **Iware RPP02N** | 58mm | Bluetooth + USB | Populer PPOB & kasir |
| **Epson TM-T82X** | 80mm | USB | Standar kasir retail |

### Tier 2 — Generic ESC/POS (Otomatis)
Semua printer ESC/POS standar langsung kompatibel tanpa konfigurasi tambahan. Mencakup: Blueprint ECO-58D, Rongta RP326, GP-2120TF, Panda PRJ-R58B, EPPOS 58mm, dan merek lain.

### Koneksi
- **Web Bluetooth API** — utama (Chrome Android / Chrome Desktop / Edge)
- **WebUSB API** — fallback kabel USB
- **Web Serial API** — fallback serial port

> Browser yang didukung: Chrome Android 90+, Chrome Desktop 90+, Edge 90+.  
> Safari iOS tidak support Web Bluetooth — tampilkan panduan alternatif.

---

## 4. Ukuran Kertas Thermal

Semua ukuran yang umum beredar di pasar Indonesia:

| Nama | Ukuran | Kegunaan |
|---|---|---|
| **A6 / 4×6"** | 100 × 150 mm | ⭐ Resi Shopee, Tokopedia, Lazada — paling umum |
| **A6 Standar** | 105 × 148 mm | Resi marketplace format A6 |
| **80 × 100 mm** | 80 × 100 mm | Label resi standar, ekspedisi lokal |
| **78 × 100 mm** | 78 × 100 mm | Resi online shop (Blueprint ECO) |
| **102 × 127 mm** | 102 × 127 mm | Label JNE standar |
| **80 × 60 mm** | 80 × 60 mm | Label produk / harga |
| **80 × 40 mm** | 80 × 40 mm | Label kecil, harga |
| **58 × 40 mm** | 58 × 40 mm | Label harga mini |
| **40 × 30 mm** | 40 × 30 mm | Label barcode kecil |
| **80mm Roll** | 80mm × ∞ | Struk kasir 80mm |
| **58mm Roll** | 58mm × ∞ | Struk kasir 58mm / PPOB |
| **Custom** | bebas input | Ukuran lain sesuai kebutuhan |

Setiap ukuran menyimpan: lebar (mm), tinggi (mm untuk label / 0 untuk roll), dan gap antar label (mm).

---

## 5. Fitur

### F-01: Sambung Printer Bluetooth
- Tap "Sambung Printer" → browser minta izin Bluetooth → daftar perangkat muncul
- Pilih printer dari daftar → terhubung
- Simpan printer yang pernah dipakai → reconnect 1 tap
- Status real-time: Terhubung / Terputus / Kertas habis / Error
- Test print (cetak halaman uji kecil)
- Ganti printer kapan saja

### F-02: Import PDF
- Pilih file PDF dari penyimpanan HP (file picker)
- Terima PDF via **Web Share Target** — share langsung dari browser/app lain ke PWA
- Preview thumbnail semua halaman
- Pilih halaman: semua / tertentu saja

### F-03: Cetak (Single & Mass Print)
- Cetak halaman terpilih ke printer aktif
- **Mass print** — setiap halaman dikirim sebagai job berurutan otomatis
- Progress: "Mencetak 12 / 45 halaman..."
- Pause / Resume / Cancel kapan saja
- Retry otomatis 1x jika halaman gagal
- Laporan ringkas: "45 berhasil · 0 gagal"

### F-04: Ukuran & Fit Kertas
- Pilih ukuran kertas sebelum cetak
- **Fit-to-paper otomatis** — PDF di-scale agar pas di kertas, aspect ratio terjaga
- Pilihan orientasi: Portrait / Landscape
- Simpan ukuran default per printer

### F-05: Offline Mode
- 100% berfungsi tanpa internet setelah first load
- Service Worker (Workbox) cache seluruh app shell
- Printer config tersimpan di IndexedDB
- PDF yang diupload tersimpan sementara di IndexedDB selama sesi

### F-06: Pengaturan
- Printer default
- Ukuran kertas default
- Jeda antar halaman saat mass print (ms)
- Dark mode / Light mode

---

## 6. Tech Stack

### Frontend (satu-satunya layer)
```
Framework        : React 18 + Vite 5
Styling          : Tailwind CSS 3.4
State            : Zustand 4
Routing          : React Router v6
PWA              : vite-plugin-pwa (Workbox)
Offline Storage  : Dexie.js (IndexedDB)
PDF Rendering    : PDF.js (Mozilla)
PDF Processing   : pdf-lib (split halaman, scale ke ukuran kertas)
Printer Comms    : Web Bluetooth API + WebUSB API + Web Serial API
ESC/POS Encoder  : escpos-buffer (wrapper custom)
Icons            : Lucide React
Toast            : react-hot-toast
Form             : React Hook Form + Zod
Type Safety      : TypeScript 5
Package Manager  : pnpm
Testing          : Vitest + Playwright
```

**Tidak ada backend.** Semua berjalan di browser.  
Backend MySQL/SQLite + Drizzle ORM disiapkan hanya jika di masa depan dibutuhkan cloud sync.

---

## 7. Arsitektur

```
┌───────────────────────────────────────────────┐
│               BROWSER / PWA                   │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │           React UI (Vite)               │  │
│  └──────────────────┬──────────────────────┘  │
│                     │                         │
│  ┌──────────────────▼──────────────────────┐  │
│  │           Core Services                 │  │
│  │  PDFService │ PrinterService │ QueueSvc  │  │
│  └──────┬───────────────────────┬──────────┘  │
│         │                       │             │
│  ┌──────▼──────┐        ┌───────▼──────────┐  │
│  │  Printer    │        │   IndexedDB      │  │
│  │  Adapter    │        │   (Dexie.js)     │  │
│  │  BT/USB/    │        │                  │  │
│  │  Serial     │        │  printers        │  │
│  └──────┬──────┘        │  pdfFiles        │  │
│         │               │  printJobs       │  │
│  ┌──────▼──────┐        │  settings        │  │
│  │ EscPos      │        └──────────────────┘  │
│  │ Encoder     │                              │
│  └──────┬──────┘                              │
└─────────│─────────────────────────────────────┘
          │ Bluetooth
          ▼
  ┌────────────────────┐
  │   THERMAL PRINTER  │
  │  XP-420B · Iware   │
  │  Epson · Generic   │
  └────────────────────┘

  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  │  Service Worker (Workbox)    │
  │  Cache-First: app shell      │
  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### PDF → Print Pipeline
```
Upload PDF
  ↓
pdf.js  →  render halaman ke <canvas>
  ↓
canvas  →  ImageBitmap (rasterize @ DPI printer, sesuai lebar kertas)
  ↓
escpos-buffer: image() → ESC/POS Uint8Array
  ↓
Bluetooth write → Printer cetak
```

### Printer Adapter
```
PrinterManager
  ├── scan()               → cari perangkat Bluetooth/USB
  ├── connect(device)      → sambung
  ├── disconnect()
  ├── getStatus()          → online / offline / paper-out / error
  ├── print(data: Uint8Array)
  └── adapters:
        BluetoothAdapter   (Web Bluetooth API — utama)
        USBAdapter         (WebUSB API — fallback)
        SerialAdapter      (Web Serial API — fallback)
```

---

## 8. Database Schema (IndexedDB — Dexie.js)

Hanya 4 tabel, sesederhana mungkin:

```typescript
interface Printer {
  id: string
  name: string              // label user: "Printer Gudang"
  deviceName: string        // nama Bluetooth: "XP-420B"
  deviceId: string          // ID Bluetooth
  connectionType: 'bluetooth' | 'usb' | 'serial'
  paperWidth: number        // mm: 58 | 80 | 104
  defaultPaperSizeId: string
  dpi: 203 | 300
  isDefault: boolean
  lastConnectedAt?: Date
  createdAt: Date
}

interface PaperSize {
  id: string
  name: string              // "A6 Resi", "80mm Roll", "Custom"
  width: number             // mm
  height: number            // mm — 0 jika roll (panjang tak terbatas)
  gap: number               // mm jeda antar label, 0 untuk roll
  isBuiltIn: boolean        // true = preset bawaan, false = buatan user
  createdAt: Date
}

interface PdfFile {
  id: string
  fileName: string
  fileSize: number          // bytes
  totalPages: number
  data: ArrayBuffer         // isi PDF (sesi saja, dibersihkan saat app tutup)
  importedAt: Date
}

interface AppSettings {
  id: 'singleton'
  defaultPrinterId?: string
  defaultPaperSizeId?: string
  printDelayMs: number      // jeda antar halaman mass print, default 300ms
  theme: 'light' | 'dark' | 'system'
  updatedAt: Date
}
```

---

## 9. Halaman

Hanya 5 halaman:

```
/                Beranda
                   ├─ Status printer (terhubung / tidak)
                   ├─ Tombol: Cetak PDF  [CTA utama]
                   └─ Tombol: Sambung Printer

/connect         Sambung Printer
                   ├─ Scan Bluetooth
                   ├─ Daftar perangkat ditemukan
                   ├─ Printer tersimpan (tap untuk reconnect)
                   └─ Test print

/print           Cetak PDF
                   ├─ Upload / share PDF
                   ├─ Preview thumbnail grid halaman
                   ├─ Pilih halaman
                   ├─ Pilih ukuran kertas
                   └─ Tombol Cetak

/print/progress  Progress Cetak
                   ├─ Progress bar besar
                   ├─ "Mencetak X / Y halaman"
                   ├─ Pause · Resume · Cancel
                   └─ Laporan selesai

/settings        Pengaturan
                   ├─ Printer default
                   ├─ Ukuran kertas default
                   ├─ Tambah ukuran kertas custom
                   ├─ Jeda mass print
                   └─ Tema (light / dark)
```

---

## 10. User Flow

### Setup Pertama
```
Buka PWA di Chrome Android
  ↓
Tap "Sambung Printer"
  ↓
Browser minta izin Bluetooth → Izinkan
  ↓
Pilih printer dari daftar (misal: XP-420B)
  ↓
"Terhubung ✓" → Test Print
  ↓
Pilih ukuran kertas default → Simpan
  ↓
Beranda siap
```

### Cetak Resi Setiap Hari
```
Buka PWA (offline pun bisa)
  ↓
Beranda → "● XP-420B Terhubung" ✓
  ↓
Tap "Cetak PDF"
  ↓
Pilih file PDF resi dari galeri HP
  ↓
"45 halaman terdeteksi" — thumbnail semua resi tampil
  ↓
Pilih semua → Tap "Cetak 45 Halaman"
  ↓
Progress: "Mencetak 12 / 45..."
  ↓
"45 berhasil ✓" — selesai
```

### Share PDF dari Browser Marketplace
```
Buka Shopee di Chrome Android
  ↓
Download resi PDF → Tap Share
  ↓
Pilih "ThermalPrint Studio"
  ↓
Langsung masuk halaman /print dengan PDF terpilih
  ↓
Tap Cetak → Selesai
```

---

## 11. UI/UX

### Prinsip
- **Satu aksi per halaman** — tidak ada pilihan yang membingungkan
- **Minimal** — tidak ada elemen dekorasi yang tidak perlu
- **Zero learning curve** — bisa dipakai tanpa baca panduan
- **Feedback langsung** — setiap aksi ada respons visual instan

### Warna
```
Background   #FFFFFF  /  #0F0F0F  (dark)
Surface      #F5F5F5  /  #1C1C1E  (dark)
Teks utama   #111111  /  #F5F5F5  (dark)
Aksen (CTA)  #2563EB               hanya untuk tombol utama
Sukses       #10B981
Error        #EF4444
Muted        #9CA3AF
```

### Tipografi
```
Font    : Inter (Google Fonts)
Heading : 20–24px · weight 600
Body    : 14–16px · weight 400
Label   : 12px · weight 500
Mono    : JetBrains Mono (status/kode saja)
```

### Komponen Kunci
| Komponen | Deskripsi |
|---|---|
| `PrinterStatusBar` | Strip tipis di atas: "● XP-420B · Terhubung" atau "○ Belum ada printer" |
| `PDFThumbnailGrid` | Grid halaman PDF, tap untuk pilih / batalkan pilihan |
| `PaperSizeChips` | Scroll horizontal: A6 · 80×100 · 102×127 · 58mm Roll · … |
| `MassPrintSheet` | Bottom sheet besar saat mass print: progress bar + kontrol |
| `PrinterCard` | Card printer tersimpan dengan status dot + tombol Connect |

---

## 12. Roadmap

### Phase 1 — MVP (6 minggu)
- [ ] Project setup: Vite + React + Tailwind + PWA + TypeScript
- [ ] Web Bluetooth koneksi + ESC/POS encoder dasar
- [ ] Upload PDF + render halaman dengan PDF.js
- [ ] Print single halaman ke XP-420B
- [ ] Preset ukuran kertas lengkap (semua ukuran di atas)
- [ ] Fit-to-paper otomatis
- [ ] IndexedDB: simpan printer & settings
- [ ] Service Worker — full offline

### Phase 2 — Mass Print & Polish (3 minggu)
- [ ] Mass print (queue per halaman)
- [ ] Progress UI + pause / resume / cancel
- [ ] Retry otomatis halaman gagal
- [ ] Web Share Target (terima PDF dari app lain)
- [ ] Support Iware DT-360, C58BT, RPP02N
- [ ] Test di berbagai device Android

### Phase 3 — Finishing (2 minggu)
- [ ] Dark mode
- [ ] USBAdapter + SerialAdapter fallback
- [ ] Ukuran kertas custom (input manual)
- [ ] Panduan troubleshoot Bluetooth
- [ ] Onboarding screen pertama kali
- [ ] PWA installable (manifest, icon, splash screen)

---

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Web Bluetooth tidak support Safari iOS | Deteksi browser, tampilkan panduan: "Gunakan Chrome Android" |
| PDF resolusi tinggi, render lambat | Lazy render per halaman saat dibutuhkan, bukan sekaligus |
| Bluetooth putus saat mass print | Auto-reconnect, lanjutkan dari halaman yang gagal |
| IndexedDB penuh (PDF besar, banyak file) | Bersihkan data PDF otomatis saat app ditutup / sesi berakhir |
| ESC/POS tiap vendor sedikit berbeda | Printer-specific patch di adapter, fallback ke generic ESC/POS |

---

*Sambung. Upload. Cetak. Selesai.*