import { formatDate } from './formatDate';

const CURRENCY = 'INR';
const LOCALE = 'en-IN';

async function loadXlsx() {
    return import('xlsx');
}

/** Format a cell value for display */
export function formatCellValue(val, format = 'text') {
    if (val == null || val === '') return '—';
    if (format === 'currency') return formatCurrency(val);
    if (format === 'number') return formatNumber(val);
    if (format === 'date') return formatDate(val);
    if (val instanceof Date) {
        return formatDate(val);
    }
    if (typeof val === 'object' && val.toString) return String(val);
    return String(val);
}

export function formatCurrency(amount) {
    const n = Number(amount);
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

export function formatNumber(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return '—';
    return new Intl.NumberFormat(LOCALE).format(num);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeExportPayload(data) {
    if (data?.document && Array.isArray(data.sections)) {
        return { document: data.document, sections: data.sections };
    }

    const headers = data?.headers || [];
    const rows = data?.rows || [];
    return {
        document: {
            title: 'Export',
            solutionName: '',
            period: '',
            generatedAt: new Date().toISOString(),
            type: data?.type || 'report',
            appName: 'Expense Tracker',
        },
        sections: [
            {
                id: 'data',
                title: 'Data',
                kind: 'table',
                headers,
                rows,
                columnFormats: headers.map(() => 'text'),
                columnAlign: headers.map(() => 'left'),
            },
        ],
    };
}

function hasExportContent({ sections }) {
    return sections.some((section) => {
        if (section.kind === 'stats') return (section.items || []).length > 0;
        if (section.kind === 'table') return (section.rows || []).length > 0;
        return false;
    });
}

function formatGeneratedAt(iso) {
    try {
        return new Date(iso).toLocaleString(LOCALE, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return new Date().toLocaleString(LOCALE);
    }
}

const TONE_COLORS = {
    success: '#0f766e',
    warning: '#c2410c',
    danger: '#dc2626',
    default: '#1e293b',
};

/** Raw value for Excel cells — numbers stay numeric for proper formatting */
function rawExcelValue(val, format = 'text') {
    if (val == null || val === '') return '';
    if (format === 'currency' || format === 'number') {
        const n = Number(val);
        return Number.isNaN(n) ? String(val) : n;
    }
    if (val instanceof Date) return formatCellValue(val, 'text');
    return String(val);
}

function sheetNameFromType(type) {
    const names = {
        summary: 'Summary',
        expenses: 'Expenses',
        'collected-cash': 'Collected Cash',
    };
    return (names[type] || 'Report').slice(0, 31);
}

function buildWorkbookSheet(XLSX, payload) {
    const { document: doc, sections } = payload;
    const rows = [];
    const numberCells = [];

    rows.push([doc.title]);
    rows.push([]);
    rows.push(['Solution', doc.solutionName || '—']);
    rows.push(['Period', doc.period || 'All time']);
    rows.push(['Generated', formatGeneratedAt(doc.generatedAt)]);
    rows.push([]);

    let rowIndex = rows.length;

    sections.forEach((section) => {
        if (section.title) {
            rows.push([section.title]);
            rowIndex += 1;
        }
        if (section.description) {
            rows.push([section.description]);
            rowIndex += 1;
        }

        if (section.kind === 'stats') {
            rows.push(['Metric', 'Value']);
            rowIndex += 1;
            (section.items || []).forEach((item) => {
                const val = rawExcelValue(item.value, item.format);
                rows.push([item.label, val]);
                if (typeof val === 'number') {
                    numberCells.push({ r: rowIndex, c: 1, format: item.format });
                }
                rowIndex += 1;
            });
        } else if (section.kind === 'table') {
            const headers = section.headers || [];
            const formats = section.columnFormats || headers.map(() => 'text');
            rows.push(headers);
            rowIndex += 1;

            (section.rows || []).forEach((row) => {
                const excelRow = (Array.isArray(row) ? row : []).map((cell, i) =>
                    rawExcelValue(cell, formats[i])
                );
                rows.push(excelRow);
                excelRow.forEach((val, c) => {
                    if (typeof val === 'number') {
                        numberCells.push({ r: rowIndex, c, format: formats[c] });
                    }
                });
                rowIndex += 1;
            });
        }

        rows.push([]);
        rowIndex += 1;
    });

    rows.push([`Generated by ${doc.appName || 'Expense Tracker'}`]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    numberCells.forEach(({ r, c, format }) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell && cell.t === 'n') {
            cell.z = format === 'currency' ? '#,##0.00' : '#,##0';
        }
    });

    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 2);
    ws['!cols'] = Array.from({ length: maxCols }, (_, i) => ({
        wch: i === 0 ? 32 : i === 1 ? 22 : 16,
    }));

    return ws;
}

function renderStatsSection(section) {
    const items = section.items || [];
    if (!items.length) return '';

    const cards = items
        .map((item) => {
            const color = TONE_COLORS[item.tone] || TONE_COLORS.default;
            return `<div class="stat-card"><div class="stat-label">${escapeHtml(item.label)}</div><div class="stat-value" style="color:${color}">${escapeHtml(formatCellValue(item.value, item.format))}</div></div>`;
        })
        .join('');

    return `<div class="stats-grid">${cards}</div>`;
}

function renderTableSection(section) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    const formats = section.columnFormats || headers.map(() => 'text');
    const aligns = section.columnAlign || headers.map(() => 'left');

    const head = headers
        .map((h, i) => `<th style="text-align:${aligns[i] || 'left'}">${escapeHtml(h)}</th>`)
        .join('');

    const body = rows.length
        ? rows
              .map((row, rowIndex) => {
                  const rowClass = rowIndex % 2 === 1 ? ' class="zebra"' : '';
                  const cells = (Array.isArray(row) ? row : [])
                      .map((cell, i) => {
                          const align = aligns[i] || 'left';
                          return `<td data-align="${align}">${escapeHtml(formatCellValue(cell, formats[i]))}</td>`;
                      })
                      .join('');
                  return `<tr${rowClass}>${cells}</tr>`;
              })
              .join('')
        : `<tr><td colspan="${headers.length || 1}" class="empty">No records for this period</td></tr>`;

    return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderSection(section) {
    const title = section.title ? `<h2 class="section-title">${escapeHtml(section.title)}</h2>` : '';
    const desc = section.description
        ? `<p class="section-desc">${escapeHtml(section.description)}</p>`
        : '';

    let body = '';
    if (section.kind === 'stats') body = renderStatsSection(section);
    else if (section.kind === 'table') body = renderTableSection(section);

    return `<section class="report-section">${title}${desc}${body}</section>`;
}

function buildPdfHtml(payload) {
    const { document: doc, sections } = payload;
    const generated = formatGeneratedAt(doc.generatedAt);
    const sectionHtml = sections.map((s) => renderSection(s)).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 32px 36px;
    font-size: 13px;
    line-height: 1.5;
    background: #fff;
  }
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 3px solid #0f766e;
    margin-bottom: 28px;
  }
  .report-brand {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0f766e;
    margin-bottom: 6px;
  }
  .report-title {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
    line-height: 1.2;
  }
  .report-solution { font-size: 15px; color: #475569; margin: 0; }
  .report-meta { text-align: right; font-size: 12px; color: #64748b; min-width: 180px; }
  .report-meta strong { display: block; color: #334155; font-size: 13px; margin-bottom: 2px; }
  .report-meta div { margin-bottom: 10px; }
  .period-badge {
    display: inline-block;
    background: #ecfdf5;
    color: #0f766e;
    border: 1px solid #99f6e4;
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 12px;
  }
  .report-section { margin-bottom: 32px; page-break-inside: avoid; }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  .section-desc { color: #64748b; margin: 0 0 14px; font-size: 12px; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }
  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 6px;
  }
  .stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .data-table th {
    background: #0f766e;
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 10px 12px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .data-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .data-table td[data-align="right"] { text-align: right; font-variant-numeric: tabular-nums; }
  .data-table tr.zebra { background: #f8fafc; }
  .data-table .empty { text-align: center; color: #94a3b8; padding: 24px; }
  .report-footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <header class="report-header">
    <div>
      <div class="report-brand">${escapeHtml(doc.appName || 'Expense Tracker')}</div>
      <h1 class="report-title">${escapeHtml(doc.title)}</h1>
      <p class="report-solution">${escapeHtml(doc.solutionName || '')}</p>
    </div>
    <div class="report-meta">
      <div><strong>Reporting period</strong><span class="period-badge">${escapeHtml(doc.period || 'All time')}</span></div>
      <div><strong>Generated on</strong>${escapeHtml(generated)}</div>
    </div>
  </header>
  ${sectionHtml}
  <footer class="report-footer">
    <span>${escapeHtml(doc.appName || 'Expense Tracker')}</span>
    <span>Confidential — for internal sharing</span>
  </footer>
</body>
</html>`;
}

/** Download as a real .xlsx Excel workbook */
export async function downloadExcel(filename, payload) {
    const XLSX = await loadXlsx();
    const normalized = normalizeExportPayload(payload);
    const ws = buildWorkbookSheet(XLSX, normalized);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetNameFromType(normalized.document.type));

    const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, name, { bookType: 'xlsx', compression: true });
}

/** Structured CSV fallback */
export function downloadCsv(filename, payload) {
    const { document: doc, sections } = normalizeExportPayload(payload);
    const lines = [
        doc.title,
        `Solution,${doc.solutionName || ''}`,
        `Period,${doc.period || 'All time'}`,
        `Generated,${formatGeneratedAt(doc.generatedAt)}`,
        '',
    ];

    sections.forEach((section) => {
        if (section.title) lines.push(section.title);
        if (section.description) lines.push(section.description);

        if (section.kind === 'stats') {
            lines.push('Metric,Value');
            (section.items || []).forEach((item) => {
                lines.push(
                    `"${String(item.label).replace(/"/g, '""')}","${formatCellValue(item.value, item.format).replace(/"/g, '""')}"`
                );
            });
        } else if (section.kind === 'table') {
            const headers = section.headers || [];
            const formats = section.columnFormats || [];
            lines.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));
            (section.rows || []).forEach((row) => {
                lines.push(
                    (Array.isArray(row) ? row : [])
                        .map((cell, i) => `"${formatCellValue(cell, formats[i]).replace(/"/g, '""')}"`)
                        .join(',')
                );
            });
        }
        lines.push('');
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open printable PDF view */
export function printAsPdf(payload) {
    const html = buildPdfHtml(normalizeExportPayload(payload));

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const printFrame = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1500);
    };

    setTimeout(printFrame, 200);
}

export async function fetchAndExport(api, solutionId, type, format = 'excel', extraParams = {}) {
    const res = await api.get(`/reports/${solutionId}/export`, {
        params: { type, ...extraParams },
    });

    const payload = normalizeExportPayload(res.data || {});

    if (!hasExportContent(payload)) {
        throw new Error('No data to export for the selected filters');
    }

    const slug = (payload.document.solutionName || 'report')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 30);
    const date = new Date().toISOString().slice(0, 10);
    const baseName = `${slug}-${type}-${date}`;

    if (format === 'pdf') {
        printAsPdf(payload);
    } else {
        await downloadExcel(baseName, payload);
    }
}
