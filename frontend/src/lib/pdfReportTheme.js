/**
 * PDF Report Styling Generator Utility
 * Clones the visual layout, typography, font colors, text size, and cyan table styling
 * using RAB_Logo2.png (compact sizing max-height: 38px), normal text casing, clean white background, and direct file download.
 */

import rabLogo from '../assets/images/RAB_Logo2.png';
import toast from 'react-hot-toast';

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
            margin: 8mm 10mm;
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
            padding: 16px 20px;
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
            padding-bottom: 10px;
            margin-bottom: 14px;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .header-logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            flex-shrink: 0;
          }

          .header-logo-img {
            max-height: 38px;
            max-width: 120px;
            width: auto;
            object-fit: contain;
          }

          .header-titles h1 {
            font-size: 18px;
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
            margin: 2px 0 0 0;
            color: #6b7280;
            font-size: 11px;
            font-weight: 400;
            text-transform: none;
          }

          /* KPI Metadata Summary Grid */
          .meta-container {
            background-color: #ffffff;
            border: none;
            padding: 2px 0 12px 0;
            margin-bottom: 12px;
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
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
            text-transform: none;
            letter-spacing: normal;
            margin-bottom: 1px;
          }

          .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            text-transform: none;
          }

          /* Cyan Table Design */
          .report-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #00a0e9;
            font-size: 10.5px;
            background: #ffffff;
          }

          .report-table th {
            background-color: #00a0e9;
            color: #ffffff;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: none;
            letter-spacing: normal;
            padding: 8px 10px;
            text-align: left;
            border-right: 1px solid rgba(255, 255, 255, 0.4);
            border-bottom: 1.5px solid #00a0e9;
          }

          .report-table th:last-child {
            border-right: none;
          }

          .report-table td {
            border: 1px solid #7ed6fa;
            padding: 7px 10px;
            color: #1f2937;
            font-size: 10.5px;
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
            font-size: 9.5px;
            color: #64748b;
            margin-top: 1px;
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
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8.5px;
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
            font-size: 9.5px;
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

const ensureHtml2Pdf = () => {
  return new Promise((resolve) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

/**
 * Downloads the PDF directly to user's laptop downloads without opening a new tab
 */
export const downloadPdfReport = async (htmlContent, filename = 'Report.pdf') => {
  const toastId = toast.loading('Downloading PDF report...');

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1050px';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise((resolve) => setTimeout(resolve, 400));

    const html2pdf = await ensureHtml2Pdf();
    if (html2pdf) {
      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await html2pdf().set(opt).from(doc.body).save();
      document.body.removeChild(iframe);
      toast.success(`${filename} downloaded!`, { id: toastId });
    } else {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
      toast.success(`PDF file processing completed`, { id: toastId });
    }
  } catch (err) {
    console.error('PDF download error:', err);
    toast.error('Failed to download PDF report.', { id: toastId });
  }
};
