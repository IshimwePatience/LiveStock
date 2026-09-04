import rabLogo from '../assets/images/RAB_Logo2.png';

export const printOfficialPermit = (permit) => {
  if (!permit) return;

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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(permitCode)}`;

  const windowUrl = 'about:blank';
  const uniqueName = new Date().getTime();
  const printWindow = window.open(windowUrl, uniqueName, 'left=100,top=100,width=900,height=900');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>URUHUSHYA RWO KWIMURA AMATUNGO - ${permitCode}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white; font-family: system-ui, -apple-system, sans-serif; }
          .page-break { page-break-before: always; }
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); window.close(); }, 300)">
        <div style="width:100%;max-width:794px;margin:0 auto;padding:24px;box-sizing:border-box;">

          <!-- PAGE 1: PERMIT DETAILS -->
          <div style="background:white;padding:32px;border:1px solid #e5e7eb;position:relative;overflow:hidden;min-height:1050px;display:flex;flex-direction:column;justify-between;">
            <div style="position:relative;z-index:10;">
              
              <!-- Header Logos -->
              <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #f3f4f6;padding-bottom:12px;">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                  alt="Rwanda Coat of Arms"
                  style="width:64px;height:64px;object-fit:contain;"
                />
                <div style="text-align:center;">
                  <h1 style="font-size:16px;font-weight:bold;text-transform:uppercase;margin:0;">REPUBULIKA Y'U RWANDA</h1>
                  <h2 style="font-size:12px;font-weight:bold;margin:2px 0;">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
                  <p style="font-size:10px;color:#4b5563;margin:0;">
                    Ubuyobozi bwa serivisi z'ubuvuzi bw'amatungo Agasanduku k'Iposita 5016 Kigali / Nomero itishyuzwa: 4673
                  </p>
                </div>
                <img
                  src="${rabLogo}"
                  alt="RAB Logo"
                  style="width:72px;height:72px;object-fit:contain;"
                />
              </div>

              <!-- Flag Bar -->
              <div style="height:6px;width:100%;background:linear-gradient(to right, #10b981, #facc15, #0284c7);border-radius:9999px;margin:12px 0;"></div>

              <!-- Banner -->
              <div style="border-top:2px solid black;border-bottom:2px solid black;padding:8px 0;text-align:center;background:#f9fafb;margin-bottom:16px;">
                <h2 style="font-size:18px;font-weight:bold;text-transform:uppercase;margin:0;">
                  URUHUSHYA RWO KWIMURA AMATUNGO
                </h2>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:8px;">
                <div>
                  <span style="font-size:12px;color:#6b7280;display:block;">Amazina</span>
                  <span style="font-size:14px;font-weight:bold;text-transform:uppercase;">${permit.owner_name || 'N/A'}</span>
                </div>
                <div>
                  <span style="font-size:12px;color:#6b7280;display:block;">Nomero y'icyangombwa</span>
                  <span style="font-size:14px;font-weight:bold;">${permit.owner_id_number || 'N/A'}</span>
                </div>
              </div>

              <div style="margin-top:12px;">
                <span style="font-size:12px;color:#6b7280;display:block;">Impamvu y'iyimuka</span>
                <span style="font-size:14px;font-weight:bold;">${permit.reason || 'Kubaga amatungo'}</span>
              </div>

              <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                <h4 style="font-size:12px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">Ibisobanuro birambuye by'ubwikorezi (Transportation Details)</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #f3f4f6;font-size:12px;">
                  <div>
                    <span style="color:#6b7280;display:block;">Uburyo bwo kugenda</span>
                    <span style="font-weight:600;color:#111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Umunyamaguru / Person' : (permit.transport_type || 'Imodoka')}</span>
                  </div>
                  <div>
                    <span style="color:#6b7280;display:block;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Nyir\'amatungo / Moving Person' : 'Nomero ya pulaki'}</span>
                    <span style="font-weight:600;color:#111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? (permit.driver_name || 'N/A') : (permit.plate_number || 'N/A')}</span>
                  </div>
                  <div>
                    <span style="color:#6b7280;display:block;">Utwara Amatungo</span>
                    <span style="font-weight:600;color:#111827;">${permit.driver_name || 'N/A'} (${permit.driver_phone || ''})</span>
                  </div>
                </div>
              </div>

              ${permit.cargo_photo ? `
                <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                  <h4 style="font-size:12px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">Ifoto y'Amatungo Yapakijwe / Arimo Kwimuka</h4>
                  <img src="${permit.cargo_photo}" alt="Loaded Cargo" style="height:140px;max-width:300px;object-fit:cover;border-radius:8px;border:1px solid #d1d5db;" />
                </div>
              ` : ''}

              ${permit.buyer_name ? `
                <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                  <h4 style="font-size:12px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">Amakuru y'Umuguzi (Buyer / Company Details)</h4>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #f3f4f6;font-size:12px;">
                    <div><span style="color:#6b7280;display:block;">Ubwoko bw'Umuguzi</span><span style="font-weight:600;">${permit.buyer_type || 'Person'}</span></div>
                    <div><span style="color:#6b7280;display:block;">Amazina / Isociete</span><span style="font-weight:600;">${permit.buyer_name}</span></div>
                    <div><span style="color:#6b7280;display:block;">Telephoni / NID / TIN</span><span style="font-weight:600;">${permit.buyer_phone || ''} ${permit.buyer_id_tin ? `(${permit.buyer_id_tin})` : ''}</span></div>
                  </div>
                </div>
              ` : ''}

              <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                <h4 style="font-size:12px;font-weight:bold;text-transform:uppercase;">Ahantu aturuka: (Origin)</h4>
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;font-size:12px;padding:8px 0;">
                  <div><span style="color:#6b7280;display:block;">Akarere:</span><span style="font-weight:bold;">${permit.origin_district || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Umurenge:</span><span style="font-weight:bold;">${permit.origin_sector || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Akagari:</span><span style="font-weight:bold;">${permit.origin_cell || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Umudugudu:</span><span style="font-weight:bold;">${permit.origin_village || 'N/A'}</span></div>
                </div>
              </div>

              <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                <h4 style="font-size:12px;font-weight:bold;text-transform:uppercase;">Aho yerekeza: (Destination)</h4>
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;font-size:12px;padding:8px 0;">
                  <div><span style="color:#6b7280;display:block;">Akarere:</span><span style="font-weight:bold;">${permit.dest_district || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Umurenge:</span><span style="font-weight:bold;">${permit.dest_sector || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Akagari:</span><span style="font-weight:bold;">${permit.dest_cell || 'N/A'}</span></div>
                  <div><span style="color:#6b7280;display:block;">Umudugudu:</span><span style="font-weight:bold;">${permit.dest_village || 'N/A'}</span></div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;border-top:2px solid #e5e7eb;border-bottom:2px solid #e5e7eb;padding:12px 0;margin-top:16px;font-size:12px;">
                <div><span style="color:#6b7280;display:block;">Rutanzwe ku wa:</span><span style="font-weight:bold;font-size:14px;">${issueDate}</span></div>
                <div><span style="color:#6b7280;display:block;">Inyandiko ifite agaciro kugeza:</span><span style="font-weight:bold;font-size:14px;">${validUntilDate}</span></div>
                <div><span style="color:#6b7280;display:block;">Nomero y'icyemezo:</span><span style="font-weight:bold;font-size:14px;color:#0052cc;">${permitCode}</span></div>
              </div>

              <div style="padding-top:16px;">
                <p style="font-size:12px;font-style:italic;color:#374151;margin:0;">Uru ruhushya rutanzwe mu izina ry'Umuyobozi Ushinzwe Iby'amatungo mu Karere</p>
                <p style="font-size:12px;color:#6b7280;margin:4px 0 0 0;">Rwatanzwe na:</p>
                <p style="font-size:16px;font-weight:bold;text-transform:uppercase;margin:4px 0;">${permit.Approver?.name || permit.approver_name || 'SHINGIRO Eugene'}</p>
                <p style="font-size:12px;color:#4b5563;font-weight:500;margin:0;">Umuyobozi Ushinzwe Iby'amatungo mu Karere (${permit.origin_district || 'District'})</p>
              </div>
            </div>

            <div style="border-top:2px solid black;padding-top:16px;margin-top:24px;">
              <div style="display:flex;align-items:center;gap:16px;">
                <img src="${qrCodeUrl}" alt="QR Code" style="width:72px;height:72px;border:1px solid #d1d5db;padding:4px;" />
                <div>
                  <span style="font-size:10px;color:#6b7280;display:block;font-weight:bold;text-transform:uppercase;">INYANDIKO ITANGIWE KU</span>
                  <span style="font-size:12px;font-weight:800;color:#1e3a8a;display:block;">
                    RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- PAGE 2: ANIMAL SPECIFICATIONS LIST -->
          <div className="page-break" style="page-break-before:always;margin-top:32px;"></div>

          <div style="background:white;padding:32px;border:1px solid #e5e7eb;position:relative;overflow:hidden;min-height:1050px;display:flex;flex-direction:column;justify-between;">
            <div style="position:relative;z-index:10;">
              <div style="display:flex;align-items:center;justify-between;border-bottom:2px solid #f3f4f6;padding-bottom:12px;">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                  alt="Rwanda Coat of Arms"
                  style="width:56px;height:56px;object-fit:contain;"
                />
                <div style="text-align:center;">
                  <h1 style="font-size:16px;font-weight:bold;text-transform:uppercase;margin:0;">REPUBULIKA Y'U RWANDA</h1>
                  <h2 style="font-size:12px;font-weight:bold;margin:2px 0;">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
                </div>
                <img
                  src="${rabLogo}"
                  alt="RAB Logo"
                  style="width:60px;height:60px;object-fit:contain;"
                />
              </div>

              <div style="height:6px;width:100%;background:linear-gradient(to right, #10b981, #facc15, #0284c7);border-radius:9999px;margin:12px 0;"></div>

              <div style="border-top:2px solid black;border-bottom:2px solid black;padding:8px 0;text-align:center;background:#f9fafb;margin-bottom:16px;">
                <h2 style="font-size:18px;font-weight:bold;text-transform:uppercase;margin:0;">
                  URUHUSHYA RWO KWIMURA AMATUNGO - LIST OF ANIMALS
                </h2>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:8px 0;border-bottom:1px solid #e5e7eb;">
                <div><span style="color:#6b7280;">Ubwoko:</span> <span style="font-weight:bold;font-size:14px;margin-left:4px;">${permit.animal_type || 'Inka'}</span></div>
                <div><span style="color:#6b7280;">Nomero y'icyemezo:</span> <span style="font-weight:bold;font-size:14px;color:#0052cc;margin-left:4px;">${permitCode}</span></div>
              </div>

              <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;font-size:12px;margin-top:16px;">
                <thead>
                  <tr style="background:#f3f4f6;color:#111827;font-weight:bold;border-bottom:1px solid #d1d5db;">
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:center;width:48px;">#</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:left;">Nomero y'iherena cyangwa izina</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:center;width:64px;">Igitsina</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:center;width:64px;">Ingano</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:left;">Ubwoko</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:left;">Ibara</th>
                    <th style="border:1px solid #d1d5db;padding:10px;text-align:left;">Ibisobanuro</th>
                  </tr>
                </thead>
                <tbody>
                  ${animals.map((anim, idx) => `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                      <td style="border:1px solid #d1d5db;padding:8px;text-align:center;font-weight:500;color:#6b7280;">${idx + 1}</td>
                      <td style="border:1px solid #d1d5db;padding:8px;font-weight:bold;color:#000;">${anim.tag_number || `TAG-${idx+1}`}</td>
                      <td style="border:1px solid #d1d5db;padding:8px;text-align:center;text-transform:uppercase;font-weight:600;">${anim.sex || 'F'}</td>
                      <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">1</td>
                      <td style="border:1px solid #d1d5db;padding:8px;text-transform:capitalize;">${anim.breed || 'Cross'}</td>
                      <td style="border:1px solid #d1d5db;padding:8px;text-transform:capitalize;">${anim.color || 'Ikibamba'}</td>
                      <td style="border:1px solid #d1d5db;padding:8px;color:#4b5563;">${anim.vaccines ? `Vaccines: ${anim.vaccines}` : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="border-top:2px solid black;padding-top:16px;margin-top:24px;">
              <div style="display:flex;align-items:center;gap:16px;">
                <img src="${qrCodeUrl}" alt="QR Code" style="width:64px;height:64px;border:1px solid #d1d5db;padding:4px;" />
                <div>
                  <span style="font-size:10px;color:#6b7280;display:block;font-weight:bold;text-transform:uppercase;">INYANDIKO ITANGIWE KU</span>
                  <span style="font-size:12px;font-weight:800;color:#1e3a8a;display:block;">
                    RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};
