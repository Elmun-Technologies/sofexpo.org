#!/usr/bin/env node
/**
 * Local demo of the backend with believable data — for clicking through the CRM, the
 * exhibitor cabinet and the site's live exhibitor directory without production data.
 *
 *   npm run backend:demo                 # http://127.0.0.1:8790/admin, /cabinet
 *   DEMO_PORT=8790 DEMO_HOST=0.0.0.0 DEMO_ORIGINS=https://site.example npm run backend:demo
 *
 * Every start uses a fresh SQLite file and uploads folder in the OS temp dir (removed on
 * exit), so it can never touch a real database. Stdlib only, like the backend itself:
 * the demo logos are drawn into PNGs by hand and the brochures are one-page PDFs.
 *
 * Then build the site against it to see the directory:
 *   PUBLIC_EXHIBITORS_API=http://127.0.0.1:8790 PUBLIC_PORTAL_URL=http://127.0.0.1:8790 npm run build
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createLeadServer, normalizeLead } from './server.mjs';
import { normalizeShowcase } from './showcase.mjs';

const host = process.env.DEMO_HOST || '127.0.0.1';
const port = Number(process.env.DEMO_PORT || 8790);
const ADMIN = { email: 'admin@sof-expo.com', password: 'admin-password-2026' };
const MANAGERS = ['dilshod.sales@sof-expo.com', 'malika.sales@sof-expo.com'];
const EXHIBITOR_PASSWORD = 'exhibitor-password-2026';

/* ---------- tiny PNG / PDF writers (no dependencies) ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
};
const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));

/** a 240×240 mark: the brand colour as a rounded tile with a simple white figure */
function logoPng(color, figure) {
  const size = 240;
  const [r, g, b] = hex(color);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const inside = (x, y) => {
    const cx = x - size / 2;
    const cy = y - size / 2;
    switch (figure) {
      case 'circle': return Math.hypot(cx, cy) < 62 && Math.hypot(cx, cy) > 34;
      case 'diamond': return Math.abs(cx) + Math.abs(cy) < 70;
      case 'bars': return Math.abs(cy) < 64 && [-44, 0, 44].some((bx) => Math.abs(cx - bx) < 14) && cy > -64 + Math.abs(cx) * 0.6;
      case 'leaf': return Math.hypot(cx + 22, cy) < 52 && Math.hypot(cx - 22, cy) < 52;
      case 'stack': return [-36, 0, 36].some((sy) => Math.abs(cy - sy) < 12 && Math.abs(cx) < 70 - Math.abs(sy) * 0.4);
      case 'cap': return (Math.abs(cx) * 0.55 + Math.abs(cy + 10) < 44) || (Math.abs(cx) < 30 && cy > 10 && cy < 46);
      default: return Math.abs(cx) < 50 && Math.abs(cy) < 50;
    }
  };
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * 4;
      const corner = 44;
      const dx = Math.max(corner - x, x - (size - 1 - corner), 0);
      const dy = Math.max(corner - y, y - (size - 1 - corner), 0);
      const tile = Math.hypot(dx, dy) <= corner;
      const white = tile && inside(x, y);
      raw[i] = white ? 255 : r;
      raw[i + 1] = white ? 255 : g;
      raw[i + 2] = white ? 255 : b;
      raw[i + 3] = tile ? 255 : 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** a one-page A4 PDF with a title and a few lines */
function pdf(lines) {
  const esc = (s) => String(s).replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '');
  const text = lines.map((line, i) => `BT /F1 ${i === 0 ? 26 : 13} Tf 64 ${760 - i * (i === 0 ? 0 : 26) - (i ? 40 : 0)} Td (${esc(line)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

/* ---------- the demo companies ---------- */
const COMPANIES = [
  {
    email: 'aziz@beton.uz', contact: 'Aziz Karimov', name: 'Beton Group', industry: 'Construction', color: '#0b3d7a', figure: 'stack',
    tagline: 'Ready-mix concrete and precast elements for Samarkand region', category: 'Building materials', city: 'Samarkand', country: 'Uzbekistan',
    about: 'One of the largest concrete plants in Samarkand region: 15 years, 3 batching plants, our own fleet of 40 mixers.\nWe supply residential and road projects across Samarkand, Navoi and Kashkadarya.',
    website: 'https://beton.uz', socials: { instagram: 'https://instagram.com/betongroup.uz', telegram: 'https://t.me/betongroup' },
    participation: [{ event: 'buildpro-expo', year: 2026, stand: 'A-12' }, { event: 'buildpro-expo', year: 2025, stand: 'B-03' }],
    files: [['catalog', 'Product catalogue 2026'], ['pricelist', 'Price list — Q4 2026']],
  },
  {
    email: 'sales@ipakyoli-ceramics.uz', contact: 'Nodira Yusupova', name: 'Ipak Yo‘li Ceramics', industry: 'Construction', color: '#9a3b1f', figure: 'diamond',
    tagline: 'Porcelain tiles with Samarkand ornaments, made in Uzbekistan', category: 'Finishing materials', city: 'Tashkent', country: 'Uzbekistan',
    about: 'Porcelain stoneware and wall tiles: 120 designs, 2 million m² a year. Export to Kazakhstan, Kyrgyzstan and Afghanistan.',
    website: 'https://ipakyoli-ceramics.uz', socials: { instagram: 'https://instagram.com/ipakyoli.ceramics', facebook: 'https://facebook.com/ipakyoliceramics' },
    participation: [{ event: 'buildpro-expo', year: 2026, stand: 'C-21' }, { event: 'buildpro-expo', year: 2024, stand: '' }],
    files: [['catalog', 'Collections 2026'], ['brochure', 'Ornament series brochure']],
  },
  {
    email: 'info@samsut.uz', contact: 'Jasur Rahimov', name: 'Samarqand Sut', industry: 'Food manufacturing', color: '#2490cc', figure: 'circle',
    tagline: 'Dairy from Zarafshan valley farms — milk, kefir, suzma, cheese', category: 'Dairy', city: 'Samarkand', country: 'Uzbekistan',
    about: 'Family dairy since 2009. 60 tonnes of milk a day from 400 partner farms; HoReCa and retail packaging; HACCP and ISO 22000.',
    website: 'https://samsut.uz', socials: { telegram: 'https://t.me/samsut', instagram: 'https://instagram.com/samarqandsut' },
    participation: [{ event: 'foodera-expo', year: 2026, stand: 'F-08' }],
    files: [['catalog', 'Product range 2026'], ['flyer', 'HoReCa offer']],
  },
  {
    email: 'export@bakerytech.uz', contact: 'Sardor Ismoilov', name: 'Bukhara Bakery Tech', industry: 'Food equipment', color: '#b07a2c', figure: 'leaf',
    tagline: 'Tandoor ovens and bakery lines — installation and service', category: 'Food equipment', city: 'Bukhara', country: 'Uzbekistan',
    about: 'Electric and gas tandoors, deck ovens and complete lines for non bread. Installation, staff training and 24-month warranty.',
    website: 'https://bakerytech.uz', socials: { youtube: 'https://youtube.com/@bakerytech' },
    participation: [{ event: 'foodera-expo', year: 2026, stand: 'F-15' }],
    files: [['presentation', 'Bakery line presentation'], ['pricelist', 'Equipment prices 2026']],
  },
  {
    email: 'hello@zarafshan-agro.uz', contact: 'Bekzod Tursunov', name: 'Zarafshan AgroTech', industry: 'Agriculture', color: '#3f7a1c', figure: 'bars',
    tagline: 'Drip irrigation and greenhouse systems, design to harvest', category: 'Irrigation', city: 'Samarkand', country: 'Uzbekistan',
    about: 'Drip irrigation for orchards and cotton, turnkey greenhouses, agronomy support. 2,300 ha equipped since 2018.',
    website: 'https://zarafshan-agro.uz', socials: { telegram: 'https://t.me/zarafshanagro', linkedin: 'https://linkedin.com/company/zarafshan-agrotech' },
    participation: [{ event: 'agropro-expo', year: 2027, stand: 'H-02' }, { event: 'agropro-expo', year: 2026, stand: 'H-02' }, { event: 'agropro-expo', year: 2025, stand: '' }],
    files: [['brochure', 'Drip irrigation brochure'], ['catalog', 'Greenhouse catalogue']],
  },
  {
    email: 'trade@fergana-fruit.uz', contact: 'Dilnoza Aliyeva', name: 'Fergana Fruit Export', industry: 'Agriculture', color: '#d1541b', figure: 'circle',
    tagline: 'Dried fruit and nuts for export — EU and GCC certified', category: 'Fruit & nuts', city: 'Fergana', country: 'Uzbekistan',
    about: 'Dried apricots, raisins, almonds and walnuts. Own sorting and packing line; GlobalG.A.P., BRC and Halal.',
    website: 'https://fergana-fruit.uz', socials: { instagram: 'https://instagram.com/ferganafruit' },
    participation: [{ event: 'agropro-expo', year: 2026, stand: 'K-10' }, { event: 'agropro-expo', year: 2025, stand: 'K-10' }],
    files: [['catalog', 'Export catalogue']],
  },
  {
    email: 'office@edubridge.uz', contact: 'Kamola Nazarova', name: 'EduBridge Consulting', industry: 'Education', color: '#0d6f8f', figure: 'cap',
    tagline: 'Admission to universities in Europe, Korea and Turkey', category: 'Education agency', city: 'Tashkent', country: 'Uzbekistan',
    about: 'Official representative of 40 universities. Free consultation, document preparation, visa support. 1,200 students placed.',
    website: 'https://edubridge.uz', socials: { instagram: 'https://instagram.com/edubridge.uz', telegram: 'https://t.me/edubridge', tiktok: 'https://tiktok.com/@edubridge.uz' },
    participation: [{ event: 'world-edu-expo', year: 2027, stand: 'E-05' }, { event: 'world-edu-expo', year: 2026, stand: 'E-05' }],
    files: [['brochure', 'Partner universities 2027']],
  },
  {
    email: 'b2b@tezyetkaz.uz', contact: 'Otabek Saidov', name: 'TezYetkaz Logistics', industry: 'E-commerce', color: '#00838a', figure: 'diamond',
    tagline: 'Fulfilment and next-day delivery for online stores', category: 'Logistics', city: 'Tashkent', country: 'Uzbekistan',
    about: 'Warehouses in Tashkent and Samarkand, delivery to 160 towns, cash on delivery and returns. API for marketplaces.',
    website: 'https://tezyetkaz.uz', socials: { telegram: 'https://t.me/tezyetkaz', linkedin: 'https://linkedin.com/company/tezyetkaz' },
    participation: [{ event: 'ecom-retail-expo', year: 2027, stand: '' }, { event: 'ecom-retail-expo', year: 2025, stand: 'R-07' }],
    files: [['presentation', 'Fulfilment for marketplaces'], ['pricelist', 'Delivery tariffs']],
  },
  {
    email: 'service@samauto.uz', contact: 'Rustam Qodirov', name: 'SamAuto Detailing', industry: 'Automotive', color: '#b3121f', figure: 'bars',
    tagline: 'Detailing, ceramic coating and PPF studio', category: 'Auto services', city: 'Samarkand', country: 'Uzbekistan',
    about: 'Ceramic coating, paint protection film and interior restoration. Official XPEL installer in Samarkand.',
    website: 'https://samauto.uz', socials: { instagram: 'https://instagram.com/samauto.detailing' },
    participation: [{ event: 'promotors-show-samarkand', year: 2026, stand: 'P-01' }],
    files: [['flyer', 'Show offer flyer']],
  },
];

/* leads at every stage of the lifecycle; `days` = how long ago they came in */
const LEADS = [
  { days: 1, name: 'Shahzod Mirzayev', company: 'Mirzayev Foods', phone: '+998 90 123 45 01', email: 'shahzod@mirzayevfoods.uz', formType: 'exhibitor', event: 'FOODERA EXPO 2026', industry: 'Food', area: '18 м²', status: 'new', source: 'header', utm_source: 'instagram', utm_campaign: 'foodera-oct' },
  { days: 0, name: 'Laylo Hamidova', company: '', phone: '+998 93 555 10 20', email: 'laylo.h@gmail.com', formType: 'visitor', event: 'FOODERA EXPO 2026', visitorType: 'private', status: 'new', source: 'tickets' },
  { days: 2, name: 'Timur Ganiev', company: 'Ganiev Steel', phone: '+998 91 222 33 44', email: 'timur@ganievsteel.uz', formType: 'exhibitor', event: 'BUILD PRO EXPO 2026', industry: 'Build', area: '36 м²', status: 'contacted', assignee: 0, next: [1, 'Send the floor plan and package prices'], source: 'quiz', utm_source: 'google', utm_medium: 'cpc' },
  { days: 4, name: 'Aleksandr Petrov', company: 'Ural Machinery', phone: '+7 912 345 67 89', email: 'a.petrov@uralmach.ru', formType: 'exhibitor', event: 'AGROPRO EXPO 2027', industry: 'Agro', area: '54 м²', status: 'qualified', assignee: 1, amount: 8900, standArea: 54, next: [-1, 'Call back about the corner stand'], source: 'request-stand', utm_source: 'linkedin' },
  { days: 6, name: 'Mehmet Yılmaz', company: 'Anadolu Ambalaj', phone: '+90 532 111 22 33', email: 'mehmet@anadoluambalaj.com.tr', formType: 'exhibitor', event: 'FOODERA EXPO 2026', industry: 'Food', area: '24 м²', status: 'proposal', assignee: 0, amount: 4200, standArea: 24, next: [0, 'Contract draft follow-up'], source: 'request-stand', utm_source: 'newsletter' },
  { days: 9, name: 'Gulnora Sobirova', company: 'Sobirova Textiles', phone: '+998 97 444 55 66', email: 'g.sobirova@textile.uz', formType: 'sponsor', event: 'ECOM & RETAIL EXPO 2027', status: 'negotiation', assignee: 1, amount: 15000, next: [3, 'Agree on the logo placement'], source: 'sponsorship' },
  { days: 14, name: 'Wang Lei', company: 'Shandong Agri Equipment', phone: '+86 138 0000 1234', email: 'wang.lei@sdagri.cn', formType: 'exhibitor', event: 'AGROPRO EXPO 2027', industry: 'Agro', area: '72 м²', status: 'won', assignee: 1, amount: 11800, standArea: 72, source: 'request-stand', utm_source: 'google', utm_medium: 'cpc' },
  { days: 18, name: 'Farrux Ergashev', company: 'Ergashev Build', phone: '+998 99 888 77 66', email: 'farrux@ergashevbuild.uz', formType: 'exhibitor', event: 'BUILD PRO EXPO 2026', industry: 'Build', area: '18 м²', status: 'won', assignee: 0, amount: 3100, standArea: 18, source: 'quiz' },
  { days: 21, name: 'Olga Kim', company: 'Kim Cosmetics', phone: '+998 90 321 65 87', email: 'olga@kimcosmetics.uz', formType: 'exhibitor', event: 'ECOM & RETAIL EXPO 2027', industry: 'Retail', area: '12 м²', status: 'lost', assignee: 0, lostReason: 'Budget moved to next year', source: 'request-stand' },
  { days: 25, name: 'Bobur Xolmatov', company: 'Xolmatov Agro', phone: '+998 95 147 25 83', email: 'bobur@xagro.uz', formType: 'exhibitor', event: 'AGROPRO EXPO 2027', industry: 'Agro', area: '18 м²', status: 'lost', assignee: 1, lostReason: 'Chose another exhibition', source: 'callback' },
  { days: 11, name: 'Sevara Qosimova', company: 'Tashkent State University', phone: '+998 71 200 00 11', email: 'sevara@tsu.uz', formType: 'group', event: 'WORLD EDU EXPO 2027', count: '40', status: 'contacted', assignee: 1, next: [-3, 'Confirm the bus and arrival time'], source: 'group-visit' },
  { days: 3, name: 'Jamshid Usmonov', company: 'Usmonov & Co', phone: '+998 90 765 43 21', email: 'jamshid@usmonov.uz', formType: 'visitor', event: 'BUILD PRO EXPO 2026', visitorType: 'company', status: 'new', source: 'tickets', utm_source: 'telegram' },
];

/* ---------- boot ---------- */
const dir = mkdtempSync(join(tmpdir(), 'sofexpo-demo-'));
const uploadsDir = join(dir, 'uploads');
mkdirSync(uploadsDir, { recursive: true });
const origins = [
  `http://127.0.0.1:${port}`, `http://localhost:${port}`, 'http://127.0.0.1:4321', 'http://localhost:4321',
  ...String(process.env.DEMO_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean),
];
const server = createLeadServer({
  host, port, dbPath: join(dir, 'demo.sqlite'), uploadsDir, legacyLeadsPath: '', legacyEventsPath: '',
  adminEmail: ADMIN.email, adminPassword: ADMIN.password, origins, trustProxy: true,
});
const store = server.backendStore;

const ago = (days, hours = 0) => new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
const inDays = (days) => new Date(Date.now() + days * 86_400_000).toISOString();

for (const email of MANAGERS) store.createUser({ email, password: 'manager-password-2026', role: 'manager' });

for (const c of COMPANIES) {
  const account = store.createPortalAccount({
    email: c.email, password: EXHIBITOR_PASSWORD, accountType: 'exhibitor',
    profile: { name: c.contact, phone: '+998 90 000 00 00', company: c.name, country: c.country, industry: c.industry, website: c.website, interests: '' },
  });
  const save = (buffer, kind, title, originalName, mime) => {
    const storageName = `${randomUUID()}.${mime === 'application/pdf' ? 'pdf' : 'png'}`;
    writeFileSync(join(uploadsDir, storageName), buffer);
    return store.addPortalFile({
      accountId: account.id, kind, title, originalName, mime, size: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'), storageName,
    }).file;
  };
  const logo = save(logoPng(c.color, c.figure), 'logo', 'Logo', 'logo.png', 'image/png');
  for (const [kind, title] of c.files) {
    const lines = [title, c.name, c.tagline, `${c.city}, ${c.country}`, c.website, 'Demo document generated for the SOF EXPO staging backend.'];
    save(pdf(lines), kind, title, `${title}.pdf`, 'application/pdf');
  }
  const { value, errors } = normalizeShowcase({ ...c, logoFileId: logo.id });
  if (Object.keys(errors).length) throw new Error(`${c.name}: ${JSON.stringify(errors)}`);
  store.saveShowcaseDraft(account.id, value, { submit: true });
  /* the last one stays in the moderation queue, so the admin has something to review */
  if (c !== COMPANIES.at(-1)) store.reviewShowcase(account.id, { action: 'publish', note: '' }, ADMIN.email);
}

const FLOW = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
for (const item of LEADS) {
  const { days, status, assignee, amount, standArea, next, lostReason, ...input } = item;
  const sessionId = `${Date.now() - days * 86_400_000}-${Math.random().toString(36).slice(2, 9)}`;
  const lead = store.createLead(normalizeLead({ ...input, consent: 'on', locale: 'en', page: '/en/request-stand/', sessionId }));
  /* a short visit journey for the lead card */
  const pages = ['/en/', `/en/events/${['foodera-expo', 'buildpro-expo', 'agropro-expo'][days % 3]}/`, '/en/exhibitors/packages/', '/en/request-stand/'];
  pages.forEach((path, i) => store.insertEvent({ eventName: 'page_view', sessionId, path, locale: 'en', receivedAt: ago(days, 1 - i * 0.1) }));
  store.insertEvent({ eventName: 'cta_click', sessionId, path: pages[2], cta: 'Book a stand', receivedAt: ago(days, 0.6) });
  const owner = assignee === undefined ? '' : MANAGERS[assignee];
  const target = status === 'lost' ? 'lost' : status;
  const path = target === 'lost' ? ['contacted', 'qualified', 'lost'] : FLOW.slice(1, FLOW.indexOf(target) + 1);
  for (const step of path) {
    store.updateLead(lead.id, {
      status: step, assignee: owner, priority: amount > 10000 ? 'high' : 'normal',
      ...(amount ? { dealAmount: amount, currency: 'USD' } : {}),
      ...(standArea ? { standArea } : {}),
      ...(step === 'lost' ? { lostReason } : {}),
    }, owner || ADMIN.email);
  }
  if (next) store.updateLead(lead.id, { nextAction: next[1], nextActionAt: inDays(next[0]) }, owner || ADMIN.email);
  if (status !== 'new') {
    store.addLeadNote(lead.id, { authorEmail: owner || ADMIN.email, kind: 'call', body: 'First call: interested, asked for the floor plan and the package prices.' });
  }
  /* spread the history over the real timeline, so time-in-stage and trends are not all "today" */
  const created = ago(days, 2);
  store.db.prepare('UPDATE leads SET created_at = ?, updated_at = ? WHERE id = ?').run(created, created, lead.id);
  const history = store.db.prepare('SELECT id FROM lead_stage_history WHERE lead_id = ? ORDER BY id').all(lead.id);
  history.forEach((row, i) => {
    const at = new Date(Date.parse(created) + ((i + 1) * days * 86_400_000) / (history.length + 1)).toISOString();
    store.db.prepare('UPDATE lead_stage_history SET created_at = ? WHERE id = ?').run(at, row.id);
    if (i === 0) store.db.prepare('UPDATE leads SET first_contact_at = ? WHERE id = ?').run(at, lead.id);
    if (i === history.length - 1) store.db.prepare('UPDATE leads SET stage_changed_at = ?, closed_at = CASE WHEN closed_at IS NULL THEN NULL ELSE ? END WHERE id = ?').run(at, at, lead.id);
  });
}

await server.listenBackend();
const base = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
console.log(`SOF EXPO demo backend — ${base}
  admin     ${base}/admin     ${ADMIN.email} / ${ADMIN.password}
  managers  ${MANAGERS.join(', ')} / manager-password-2026
  cabinet   ${base}/cabinet   ${COMPANIES[0].email} / ${EXHIBITOR_PASSWORD} (any company e-mail above)
  directory ${base}/api/public/exhibitors (${COMPANIES.length - 1} published, 1 waiting for review)
  data      ${dir} (removed on exit)
ready`);

const stop = () => {
  server.close(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
    process.exit(0);
  });
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
