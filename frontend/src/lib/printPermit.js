import rabLogo from '../assets/images/RAB_Logo2.png';
import toast from 'react-hot-toast';

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

const getBase64FromUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

export const printOfficialPermit = async (permit) => {
  if (!permit) return;

  const toastId = toast.loading('Generating permit PDF...');

  try {
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const permitCode = permit.permit_number || permit.id?.substring(0, 16).toUpperCase() || 'RAB20260903001';
    const issueDate = formatDate(permit.createdAt || Date.now());
    const validUntilDate = formatDate(permit.valid_until);

    const animals = permit.Animals && permit.Animals.length > 0
      ? permit.Animals
      : [{
          tag_number: permit.tag_number || '1079000',
          sex: permit.sex || 'F',
          breed: permit.breed || 'Cross',
          color: permit.color || 'Ikibamba',
          quantity: 1,
          vaccines: permit.vaccines || '-'
        }];

    const rawQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(permitCode)}`;
    const coatOfArmsRaw = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png";

    // Convert images to Base64 to prevent html2canvas CORS canvas tainting
    const [qrCodeUrl, coatOfArmsUrl, rabLogoBase64] = await Promise.all([
      getBase64FromUrl(rawQrCodeUrl),
      getBase64FromUrl(coatOfArmsRaw),
      getBase64FromUrl(rabLogo)
    ]);

    // Create an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: white; font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .page-container { background: white; padding: 32px 32px 32px 72px; position: relative; box-sizing: border-box; width: 794px; margin: 0 auto; }
            .page-break { page-break-before: always; margin-top: 24px; padding-top: 16px; }
            table.animal-table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 11px; margin-top: 10px; }
            table.animal-table th, table.animal-table td { border: 1px solid #d1d5db; padding: 8px 10px; }
            table.animal-table th { background: #f3f4f6; color: #111827; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <div class="page-container">
            <!-- PAGE 1: PERMIT DETAILS -->
            <div style="min-height: 1000px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <!-- Header Logos Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: none;">
                  <tr>
                    <td style="width: 80px; vertical-align: middle; border: none; padding: 0;">
                      <img src="${coatOfArmsUrl}" alt="Rwanda Coat of Arms" style="width: 64px; height: 64px; object-fit: contain;" />
                    </td>
                    <td style="text-align: center; vertical-align: middle; border: none; padding: 0 12px;">
                      <h1 style="font-size: 15px; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">REPUBULIKA Y'U RWANDA</h1>
                      <h2 style="font-size: 11px; font-weight: bold; margin: 3px 0; color: #1f2937;">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
                      <p style="font-size: 9px; color: #4b5563; margin: 0;">
                        Ubuyobozi bwa serivisi z'ubuvuzi bw'amatungo Agasanduku k'Iposita 5016 Kigali / Nomero itishyuzwa: 4673
                      </p>
                    </td>
                    <td style="width: 80px; text-align: right; vertical-align: middle; border: none; padding: 0;">
                      <img src="${rabLogoBase64}" alt="RAB Logo" style="width: 68px; height: 68px; object-fit: contain; float: right;" />
                    </td>
                  </tr>
                </table>

                <!-- Flag Bar -->
                <div style="height: 5px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 12px 0 16px 0;"></div>

                <!-- Banner -->
                <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 8px 0; text-align: center; background: #f9fafb; margin-bottom: 16px;">
                  <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
                    URUHUSHYA RWO KWIMURA AMATUNGO
                  </h2>
                </div>

                <!-- Owner Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: none;">
                  <tr>
                    <td style="width: 50%; border: none; padding: 4px 0; vertical-align: top;">
                      <span style="font-size: 11px; color: #6b7280; display: block;">Amazina</span>
                      <span style="font-size: 13px; font-weight: bold; text-transform: uppercase;">${permit.owner_name || 'N/A'}</span>
                    </td>
                    <td style="width: 50%; border: none; padding: 4px 0; vertical-align: top;">
                      <span style="font-size: 11px; color: #6b7280; display: block;">Nomero y'icyangombwa</span>
                      <span style="font-size: 13px; font-weight: bold;">${permit.owner_id_number || 'N/A'}</span>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 12px;">
                  <span style="font-size: 11px; color: #6b7280; display: block;">Impamvu y'iyimuka</span>
                  <span style="font-size: 13px; font-weight: bold;">${permit.reason || 'Kubaga amatungo'}</span>
                </div>

                <!-- Transportation Details Table -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                  <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; color: #374151;">Ibisobanuro birambuye by'ubwikorezi (Transportation Details)</h4>
                  <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px;">
                    <tr>
                      <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;">
                        <span style="color: #6b7280; display: block;">Uburyo bwo kugenda</span>
                        <span style="font-weight: 600; color: #111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Umunyamaguru / Person' : (permit.transport_type || 'Imodoka')}</span>
                      </td>
                      <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;">
                        <span style="color: #6b7280; display: block;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Nyir\'amatungo' : 'Nomero ya pulaki'}</span>
                        <span style="font-weight: 600; color: #111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? (permit.driver_name || 'N/A') : (permit.plate_number || 'N/A')}</span>
                      </td>
                      <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;">
                        <span style="color: #6b7280; display: block;">Utwara Amatungo</span>
                        <span style="font-weight: 600; color: #111827;">${permit.driver_name || 'N/A'} (${permit.driver_phone || ''})</span>
                      </td>
                    </tr>
                  </table>
                </div>

                ${permit.cargo_photo ? `
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                    <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; color: #374151;">Ifoto y'Amatungo Yapakijwe / Arimo Kwimuka</h4>
                    <img src="${permit.cargo_photo}" alt="Loaded Cargo" style="height: 120px; max-width: 260px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db;" />
                  </div>
                ` : ''}

                ${permit.buyer_name ? `
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                    <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; color: #374151;">Amakuru y'Umuguzi (Buyer / Company Details)</h4>
                    <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px;">
                      <tr>
                        <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Ubwoko bw'Umuguzi</span><span style="font-weight: 600;">${permit.buyer_type || 'Person'}</span></td>
                        <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Amazina / Isociete</span><span style="font-weight: 600;">${permit.buyer_name}</span></td>
                        <td style="width: 33.3%; padding: 10px; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Telephoni / NID</span><span style="font-weight: 600;">${permit.buyer_phone || ''} ${permit.buyer_id_tin ? `(${permit.buyer_id_tin})` : ''}</span></td>
                      </tr>
                    </table>
                  </div>
                ` : ''}

                <!-- Origin Table -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                  <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; color: #374151;">Ahantu aturuka: (Origin)</h4>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: none;">
                    <tr>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Akarere:</span><span style="font-weight: bold;">${permit.origin_district || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Umurenge:</span><span style="font-weight: bold;">${permit.origin_sector || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Akagari:</span><span style="font-weight: bold;">${permit.origin_cell || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Umudugudu:</span><span style="font-weight: bold;">${permit.origin_village || 'N/A'}</span></td>
                    </tr>
                  </table>
                </div>

                <!-- Destination Table -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                  <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; color: #374151;">Aho yerekeza: (Destination)</h4>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: none;">
                    <tr>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Akarere:</span><span style="font-weight: bold;">${permit.dest_district || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Umurenge:</span><span style="font-weight: bold;">${permit.dest_sector || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Akagari:</span><span style="font-weight: bold;">${permit.dest_cell || 'N/A'}</span></td>
                      <td style="width: 25%; border: none; padding: 4px 0; vertical-align: top;"><span style="color: #6b7280; display: block;">Umudugudu:</span><span style="font-weight: bold;">${permit.dest_village || 'N/A'}</span></td>
                    </tr>
                  </table>
                </div>

                <!-- Validity Table -->
                <div style="border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; padding: 12px 0; margin-top: 14px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: none;">
                    <tr>
                      <td style="width: 33.3%; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Rutanzwe ku wa:</span><span style="font-weight: bold; font-size: 13px;">${issueDate}</span></td>
                      <td style="width: 33.3%; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Inyandiko ifite agaciro kugeza:</span><span style="font-weight: bold; font-size: 13px;">${validUntilDate}</span></td>
                      <td style="width: 33.3%; border: none; vertical-align: top;"><span style="color: #6b7280; display: block;">Nomero y'icyemezo:</span><span style="font-weight: bold; font-size: 13px; color: #0052cc;">${permitCode}</span></td>
                    </tr>
                  </table>
                </div>

                <div style="padding-top: 14px;">
                  <p style="font-size: 11px; font-style: italic; color: #374151; margin: 0;">Uru ruhushya rutanzwe mu izina ry'Umuyobozi Ushinzwe Iby'amatungo mu Karere</p>
                  <p style="font-size: 11px; color: #6b7280; margin: 6px 0 0 0;">Rwatanzwe na:</p>
                  <p style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 2px 0;">${permit.Approver?.name || permit.approver_name || 'SHINGIRO Eugene'}</p>
                  <p style="font-size: 11px; color: #4b5563; font-weight: 500; margin: 0;">Umuyobozi Ushinzwe Iby'amatungo mu Karere (${permit.origin_district || 'District'})</p>
                </div>
              </div>

              <!-- Footer Table with QR Code -->
              <div style="border-top: 2px solid black; padding-top: 14px; margin-top: 20px;">
                <table style="width: 100%; border-collapse: collapse; border: none;">
                  <tr>
                    <td style="width: 70px; border: none; vertical-align: middle;">
                      <img src="${qrCodeUrl}" alt="QR Code" style="width: 56px; height: 56px; border: 1px solid #d1d5db; padding: 4px;" />
                    </td>
                    <td style="border: none; vertical-align: middle; padding-left: 12px;">
                      <span style="font-size: 9px; color: #6b7280; display: block; font-weight: bold; text-transform: uppercase;">INYANDIKO ITANGIWE KU</span>
                      <span style="font-size: 11px; font-weight: 800; color: #1e3a8a; display: block;">
                        RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- PAGE 2: ANIMAL SPECIFICATIONS LIST (CLEAN PAGE: NO LOGOS, NO QR CODE, NO BANNER) -->
            <div class="page-break">
              <div>
                <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 10px 0; border-bottom: 2px solid #111827; padding-bottom: 6px; color: #111827;">
                  Ibisobanuro by'Amatungo (Animal Specifications)
                </h3>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: none; margin-bottom: 12px;">
                  <tr>
                    <td style="border: none; padding: 4px 0;"><span style="color: #6b7280;">Ubwoko bw'Amatungo:</span> <span style="font-weight: bold; font-size: 12px; margin-left: 4px;">${permit.animal_type || 'Inka'}</span></td>
                    <td style="text-align: right; border: none; padding: 4px 0;"><span style="color: #6b7280;">Nomero y'icyemezo:</span> <span style="font-weight: bold; font-size: 12px; color: #0052cc; margin-left: 4px;">${permitCode}</span></td>
                  </tr>
                </table>

                <table class="animal-table">
                  <thead>
                    <tr>
                      <th style="text-align: center; width: 40px;">#</th>
                      <th style="text-align: left;">Nomero y'iherena cyangwa izina</th>
                      <th style="text-align: center; width: 60px;">Igitsina</th>
                      <th style="text-align: center; width: 60px;">Ingano</th>
                      <th style="text-align: left;">Ubwoko</th>
                      <th style="text-align: left;">Ibara</th>
                      <th style="text-align: left;">Ibisobanuro</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${animals.map((anim, idx) => `
                      <tr>
                        <td style="text-align: center; font-weight: 500; color: #6b7280;">${idx + 1}</td>
                        <td style="font-weight: bold; color: #000;">${anim.tag_number || `TAG-${idx+1}`}</td>
                        <td style="text-align: center; text-transform: uppercase; font-weight: 600;">${anim.sex || 'F'}</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-transform: capitalize;">${anim.breed || 'Cross'}</td>
                        <td style="text-transform: capitalize;">${anim.color || 'Ikibamba'}</td>
                        <td style="color: #4b5563;">${anim.vaccines ? `Vaccines: ${anim.vaccines}` : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </body>
      </html>
    `);
    doc.close();

    await new Promise(resolve => setTimeout(resolve, 300));

    const html2pdf = await ensureHtml2Pdf();
    if (html2pdf) {
      const opt = {
        margin:       [8, 8, 8, 14],
        filename:     `Permit_${permitCode}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(doc.body).save();
      document.body.removeChild(iframe);
      toast.success(`Permit_${permitCode}.pdf downloaded!`, { id: toastId });
    } else {
      const htmlContent = doc.body.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Permit_${permitCode}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
      toast.success(`Permit saved as Permit_${permitCode}.html`, { id: toastId });
    }
  } catch (err) {
    console.error('PDF download error:', err);
    toast.error('Failed to download permit PDF.', { id: toastId });
  }
};
