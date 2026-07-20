/**
 * domExtractor.ts
 *
 * Extracts a compact, token-efficient structural snapshot from a live DOM.
 * Designed for same-origin iframe scraping inside the Copilot autonomous agent.
 *
 * Output per page: ~200-600 tokens (vs 5,000-50,000 for raw HTML).
 */

export interface FieldDescriptor {
  label: string;
  name: string;
  type: string;
  id?: string;
  placeholder?: string;
  value?: string;
}

export interface FormDescriptor {
  id?: string;
  action?: string;
  fields: FieldDescriptor[];
  submitLabel?: string;
}

export interface TableRow {
  [header: string]: string;
}

export interface TableDescriptor {
  id?: string;
  caption?: string;
  headers: string[];
  rows: TableRow[]; // max 8 rows
  totalRows: number;
}

export interface ButtonDescriptor {
  id?: string;
  text: string;
  type?: string;
  dataAttr?: string; // data-action or similar
}

export interface StatDescriptor {
  label: string;
  value: string;
}

export interface SelectDescriptor {
  label: string;
  name: string;
  options: string[];
}

export interface PageSnapshot {
  url: string;
  title: string;
  headings: string[]; // h1-h3
  stats: StatDescriptor[];
  forms: FormDescriptor[];
  tables: TableDescriptor[];
  buttons: ButtonDescriptor[];
  selects: SelectDescriptor[];
  keyText: string; // first 400 chars of meaningful body text
  extractedAt: number;
}

/** Safely get trimmed innerText, never throws */
function safeText(el: Element | null): string {
  if (!el) return '';
  return ((el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Find the label text for a form control */
function findLabel(doc: Document, input: Element): string {
  const id = input.getAttribute('id');
  if (id) {
    const label = doc.querySelector(`label[for="${id}"]`);
    if (label) return safeText(label);
  }
  // Check parent for wrapping label
  let el: Element | null = input.parentElement;
  for (let i = 0; i < 3; i++) {
    if (!el) break;
    if (el.tagName === 'LABEL') return safeText(el).replace(safeText(input), '').trim();
    const sibling = el.querySelector('label');
    if (sibling) return safeText(sibling);
    el = el.parentElement;
  }
  return input.getAttribute('placeholder') ?? input.getAttribute('name') ?? '';
}

export function extractPageSnapshot(doc: Document, url: string): PageSnapshot {
  const snapshot: PageSnapshot = {
    url,
    title: doc.title || '',
    headings: [],
    stats: [],
    forms: [],
    tables: [],
    buttons: [],
    selects: [],
    keyText: '',
    extractedAt: Date.now(),
  };

  // ── Headings ──────────────────────────────────────────────────────────────
  doc.querySelectorAll('h1, h2, h3').forEach((h) => {
    const t = safeText(h);
    if (t && t.length < 120) snapshot.headings.push(t);
  });
  snapshot.headings = [...new Set(snapshot.headings)].slice(0, 8);

  // ── Stat cards (common pattern: label + big number next to it) ────────────
  const statSelectors = [
    '[class*="stat"]', '[class*="card"]', '[class*="summary"]',
    '[class*="metric"]', '[class*="count"]',
  ];
  statSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      const text = safeText(el);
      // Heuristic: contains a digit and is short
      if (text && /\d/.test(text) && text.length < 80 && snapshot.stats.length < 12) {
        const parts = text.split('\n').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          snapshot.stats.push({ label: parts[0], value: parts.slice(1).join(' ') });
        }
      }
    });
  });
  snapshot.stats = snapshot.stats.slice(0, 8);

  // ── Forms ─────────────────────────────────────────────────────────────────
  doc.querySelectorAll('form').forEach((form) => {
    const fd: FormDescriptor = {
      id: form.id || undefined,
      action: form.getAttribute('action') || undefined,
      fields: [],
      submitLabel: undefined,
    };

    form.querySelectorAll('input, textarea').forEach((input) => {
      const type = input.getAttribute('type') || 'text';
      if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(type)) return;
      fd.fields.push({
        label: findLabel(doc, input),
        name: input.getAttribute('name') || input.getAttribute('id') || '',
        type,
        id: input.getAttribute('id') || undefined,
        placeholder: input.getAttribute('placeholder') || undefined,
        value: (input instanceof HTMLInputElement ? input.value : '') || undefined,
      });
    });

    const submitBtn = form.querySelector('[type="submit"], button:not([type="button"])');
    if (submitBtn) fd.submitLabel = safeText(submitBtn);

    if (fd.fields.length > 0) snapshot.forms.push(fd);
  });

  // ── Tables ────────────────────────────────────────────────────────────────
  doc.querySelectorAll('table').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th, thead td')).map(safeText).filter(Boolean);
    if (headers.length === 0) {
      // Try first row as headers
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        Array.from(firstRow.querySelectorAll('th, td')).map(safeText).filter(Boolean).forEach(h => headers.push(h));
      }
    }

    const allRows = Array.from(table.querySelectorAll('tbody tr'));
    const rows: TableRow[] = allRows.slice(0, 8).map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td')).map(safeText);
      const row: TableRow = {};
      headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
      return row;
    });

    snapshot.tables.push({
      id: table.id || undefined,
      caption: safeText(table.querySelector('caption')),
      headers,
      rows,
      totalRows: allRows.length,
    });
  });
  // Max 3 tables
  snapshot.tables = snapshot.tables.slice(0, 3);

  // ── Buttons (interactive actions) ─────────────────────────────────────────
  const seenBtnTexts = new Set<string>();
  doc.querySelectorAll('button, [role="button"], a[class*="btn"]').forEach((btn) => {
    const text = safeText(btn).slice(0, 60);
    if (!text || text.length < 2) return;
    if (seenBtnTexts.has(text)) return;
    seenBtnTexts.add(text);
    snapshot.buttons.push({
      id: btn.id || undefined,
      text,
      type: (btn as HTMLButtonElement).type || btn.getAttribute('role') || 'button',
      dataAttr: btn.getAttribute('data-action') || btn.getAttribute('data-type') || undefined,
    });
  });
  snapshot.buttons = snapshot.buttons.slice(0, 12);

  // ── Select dropdowns ──────────────────────────────────────────────────────
  doc.querySelectorAll('select').forEach((select) => {
    const options = Array.from(select.options).map(o => o.text.trim()).filter(Boolean).slice(0, 10);
    snapshot.selects.push({
      label: findLabel(doc, select),
      name: select.name || select.id || '',
      options,
    });
  });
  snapshot.selects = snapshot.selects.slice(0, 5);

  // ── Key body text (first 400 chars of meaningful paragraph text) ──────────
  const mainEl = doc.querySelector('main') || doc.querySelector('[role="main"]') || doc.body;
  const paragraphs = Array.from(mainEl.querySelectorAll('p, li')).map(safeText).filter(t => t.length > 20);
  snapshot.keyText = paragraphs.join(' ').slice(0, 400);

  return snapshot;
}

/** Serialize a snapshot to a compact string for the LLM prompt (~200-500 tokens) */
export function snapshotToPromptString(s: PageSnapshot): string {
  const lines: string[] = [];
  lines.push(`=== صفحة: ${s.url} | العنوان: ${s.title} ===`);

  if (s.headings.length) lines.push(`العناوين: ${s.headings.join(' | ')}`);
  if (s.keyText) lines.push(`النص: ${s.keyText}`);

  if (s.stats.length) {
    lines.push('الإحصائيات:');
    s.stats.forEach(st => lines.push(`  ${st.label}: ${st.value}`));
  }

  s.tables.forEach((t, i) => {
    lines.push(`جدول ${i + 1} (${t.totalRows} صف) | أعمدة: ${t.headers.join(', ')}`);
    if (t.rows.length) {
      t.rows.slice(0, 5).forEach(row => {
        lines.push('  ' + Object.values(row).join(' | '));
      });
      if (t.totalRows > 5) lines.push(`  ... و ${t.totalRows - 5} صفوف أخرى`);
    }
  });

  s.forms.forEach((f, i) => {
    lines.push(`نموذج ${i + 1}:`);
    f.fields.forEach(field => {
      const val = field.value ? ` [قيمة: ${field.value}]` : '';
      lines.push(`  • ${field.label || field.name} (${field.type})${val}`);
    });
    if (f.submitLabel) lines.push(`  زر الإرسال: ${f.submitLabel}`);
  });

  if (s.buttons.length) {
    lines.push(`الأزرار: ${s.buttons.map(b => b.text).join(' | ')}`);
  }

  return lines.join('\n');
}

/** Fill a form field by label or name inside an iframe's document */
export function fillField(doc: Document, labelOrName: string, value: string): boolean {
  // Try by name
  let input = doc.querySelector<HTMLInputElement>(`[name="${labelOrName}"]`);
  if (!input) input = doc.querySelector<HTMLInputElement>(`[id="${labelOrName}"]`);
  if (!input) {
    // Try by label text
    const labels = Array.from(doc.querySelectorAll('label'));
    const matchedLabel = labels.find(l => safeText(l).includes(labelOrName));
    if (matchedLabel) {
      const forId = matchedLabel.getAttribute('for');
      if (forId) input = doc.getElementById(forId) as HTMLInputElement;
    }
  }
  if (!input) return false;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/** Click a button by its text content inside an iframe's document */
export function clickButton(doc: Document, buttonText: string): boolean {
  const buttons = Array.from(doc.querySelectorAll('button, [role="button"]'));
  const target = buttons.find(b => safeText(b).includes(buttonText));
  if (!target) return false;
  (target as HTMLElement).click();
  return true;
}

/** Type into a search input and trigger React's onChange */
export function typeIntoSearch(doc: Document, selector: string, value: string): boolean {
  const input = doc.querySelector<HTMLInputElement>(selector);
  if (!input) return false;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input), 'value'
  )?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
