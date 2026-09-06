/**
 * Bincard PDF Report Generator Utility
 * Clones the clean Bincard theme (cyan header #00a0e9, light cyan grid borders #7ed6fa, 
 * stat KPI metadata bar, bold column identifiers, and soft status pill badges).
 */

export const generateBincardReport = ({
  titleMain = 'RWANDA LIVESTOCK SYSTEM',
  titleSub = '',
  subtitle = 'Official Audit & Registry Report',
  logoUrl = '',
  meta = [],
  columns = [],
  rowsHtml = ''
}) => {
  const coatOfArmsSvg = `
    <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#00A0E9" fill-opacity="0.1" stroke="#00A0E9" stroke-width="2"/>
      <path d="M50 15 L62 38 L87 40 L67 57 L73 82 L50 68 L27 82 L33 57 L13 40 L38 38 Z" fill="#00A0E9"/>
      <circle cx="50" cy="50" r="18" fill="#FFFFFF"/>
      <path d="M50 38 L54 46 L63 47 L56 53 L58 62 L50 57 L42 62 L44 53 L37 47 L46 46 Z" fill="#FACC15"/>
    </svg>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${titleMain}${titleSub} — Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 20px 24px;
            color: #111827;
            background-color: #ffffff;
            margin: 0;
            line-height: 1.4;
          }

          /* Header Section */
          .bincard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #00a0e9;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .header-logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            flex-shrink: 0;
          }

          .header-logo-img {
            max-width: 48px;
            max-height: 48px;
            object-fit: contain;
          }

          .header-titles h1 {
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            color: #00a0e9;
            letter-spacing: -0.3px;
          }

          .header-titles h1 .title-dark {
            color: #0f172a;
          }

          .header-titles p {
            margin: 3px 0 0 0;
            color: #6b7280;
            font-size: 12px;
            font-weight: 500;
          }

          /* KPI Metadata Summary Grid */
          .meta-container {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 18px;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 36px;
            align-items: center;
          }

          .meta-item {
            display: flex;
            flex-direction: column;
          }

          .meta-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }

          .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }

          /* Bincard Cyan Table */
          .bincard-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #00a0e9;
            font-size: 11px;
            background: #ffffff;
          }

          .bincard-table th {
            background-color: #00a0e9;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
            border-right: 1px solid rgba(255, 255, 255, 0.4);
            border-bottom: 1.5px solid #00a0e9;
          }

          .bincard-table th:last-child {
            border-right: none;
          }

          .bincard-table td {
            border: 1px solid #7ed6fa;
            padding: 9px 12px;
            color: #1f2937;
            font-size: 11px;
            vertical-align: middle;
          }

          .bincard-table tr:nth-child(even) {
            background-color: #f4fbfe;
          }

          .bincard-table tr:hover {
            background-color: #e0f2fe;
          }

          /* Content Styling inside table */
          .col-bold {
            font-weight: 700;
            color: #0f172a;
          }

          .sub-text {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
            display: block;
          }

          .mode-car {
            color: #0284c7;
            font-weight: 700;
          }

          .mode-foot {
            color: #d97706;
            font-weight: 700;
          }

          /* Badges */
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
            border: 1px solid transparent;
          }

          .badge-active, .badge-approved, .badge-solved, .badge-completed {
            background-color: #e6f9f0;
            color: #00a65a;
            border-color: #a3e9c5;
          }

          .badge-pending, .badge-following {
            background-color: #fff8e6;
            color: #d97706;
            border-color: #fde68a;
          }

          .badge-inactive, .badge-rejected, .badge-open {
            background-color: #ffebee;
            color: #d32f2f;
            border-color: #ffcdd2;
          }

          .role-pill {
            display: inline-block;
            padding: 2px 6px;
            background-color: #f1f5f9;
            color: #334155;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            border: 1px solid #cbd5e1;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="bincard-header">
          <div class="header-left">
            <div class="header-logo-container">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="header-logo-img" />` : coatOfArmsSvg}
            </div>
            <div class="header-titles">
              <h1>
                ${titleMain} <span class="title-dark">${titleSub}</span>
              </h1>
              <p>${subtitle}</p>
            </div>
          </div>
        </div>

        <!-- Meta Bar -->
        ${meta && meta.length > 0 ? `
          <div class="meta-container">
            ${meta.map(m => `
              <div class="meta-item">
                <span class="meta-label">${m.label}</span>
                <span class="meta-value">${m.value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Bincard Table -->
        <table class="bincard-table">
          <thead>
            <tr>
              ${columns.map(c => `<th style="${c.align ? `text-align:${c.align};` : ''}${c.width ? `width:${c.width};` : ''}">${c.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;
};
