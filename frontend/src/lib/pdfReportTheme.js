/**
 * PDF Report Styling Generator Utility
 * Clones the visual layout, typography, font colors, text size, and cyan table styling
 * using RAB_Logo2.png, normal text casing (no forced uppercase/lowercase), and clean white background (no bg gray).
 */

import rabLogo from '../assets/images/RAB_Logo2.png';

const resolveLogoUrl = (url) => {
  const logo = url || rabLogo;
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin + (logo.startsWith('/') ? logo : '/' + logo);
  }
  return logo;
};

export const generatePdfReportHTML = ({
  titleMain = 'RWANDA LIVESTOCK SYSTEM',
  titleSub = '',
  subtitle = 'Official Audit & Registry Report',
  logoUrl = '',
  meta = [],
  columns = [],
  rowsHtml = ''
}) => {
  const finalLogoUrl = resolveLogoUrl(logoUrl);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${titleMain}${titleSub} — Official Report</title>
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
          .report-header {
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
            gap: 16px;
          }

          .header-logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 54px;
            flex-shrink: 0;
          }

          .header-logo-img {
            max-height: 54px;
            width: auto;
            object-fit: contain;
          }

          .header-titles h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            color: #00a0e9;
            letter-spacing: normal;
            text-transform: none;
          }

          .header-titles h1 .title-dark {
            color: #0f172a;
            font-weight: 700;
            text-transform: none;
          }

          .header-titles p {
            margin: 3px 0 0 0;
            color: #6b7280;
            font-size: 12px;
            font-weight: 400;
            text-transform: none;
          }

          /* KPI Metadata Summary Grid (Clean White - No BG Gray) */
          .meta-container {
            background-color: #ffffff;
            border: none;
            padding: 4px 0 16px 0;
            margin-bottom: 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
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
            text-transform: none;
            letter-spacing: normal;
            margin-bottom: 2px;
          }

          .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: none;
          }

          /* Cyan Table Design */
          .report-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #00a0e9;
            font-size: 11px;
            background: #ffffff;
          }

          .report-table th {
            background-color: #00a0e9;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
            text-transform: none;
            letter-spacing: normal;
            padding: 10px 12px;
            text-align: left;
            border-right: 1px solid rgba(255, 255, 255, 0.4);
            border-bottom: 1.5px solid #00a0e9;
          }

          .report-table th:last-child {
            border-right: none;
          }

          .report-table td {
            border: 1px solid #7ed6fa;
            padding: 9px 12px;
            color: #1f2937;
            font-size: 11px;
            vertical-align: middle;
            text-transform: none;
          }

          .report-table tr:nth-child(even) {
            background-color: #ffffff;
          }

          .report-table tr:hover {
            background-color: #f0f9ff;
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
            font-weight: 700;
            text-transform: none;
            letter-spacing: normal;
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
            text-transform: none;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="report-header">
          <div class="header-left">
            <div class="header-logo-container">
              <img src="${finalLogoUrl}" alt="RAB Logo" class="header-logo-img" />
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

        <!-- Report Table -->
        <table class="report-table">
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
