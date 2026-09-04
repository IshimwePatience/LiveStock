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

const waitForImages = (container) => {
  const imgs = container.querySelectorAll('img');
  const promises = Array.from(imgs).map(img => {
    if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });
  return Promise.all(promises);
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

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(permitCode)}`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-99999';
    container.style.width = '794px';
    container.style.background = 'white';

    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; background: white; color: #111827; box-sizing: border-box;">
        <!-- PAGE 1: PERMIT DETAILS -->
        <div style="background:white; padding: 32px; border: 1px solid #e5e7eb; position: relative; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
          <div>
            <!-- Header Logos -->
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                alt="Rwanda Coat of Arms"
                style="width: 64px; height: 64px; object-fit: contain;"
              />
              <div style="text-align: center;">
                <h1 style="font-size: 15px; font-weight: bold; text-transform: uppercase; margin: 0;">REPUBULIKA Y'U RWANDA</h1>
                <h2 style="font-size: 11px; font-weight: bold; margin: 2px 0;">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
                <p style="font-size: 9px; color: #4b5563; margin: 0;">
                  Ubuyobozi bwa serivisi z'ubuvuzi bw'amatungo Agasanduku k'Iposita 5016 Kigali / Nomero itishyuzwa: 4673
                </p>
              </div>
              <img
                src="${rabLogo}"
                alt="RAB Logo"
                style="width: 68px; height: 68px; object-fit: contain;"
              />
            </div>

            <!-- Flag Bar -->
            <div style="height: 5px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 10px 0;"></div>

            <!-- Banner -->
            <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 6px 0; text-align: center; background: #f9fafb; margin-bottom: 14px;">
              <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0;">
                URUHUSHYA RWO KWIMURA AMATUNGO
              </h2>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-top: 4px;">
              <div>
                <span style="font-size: 11px; color: #6b7280; display: block;">Amazina</span>
                <span style="font-size: 13px; font-weight: bold; text-transform: uppercase;">${permit.owner_name || 'N/A'}</span>
              </div>
              <div>
                <span style="font-size: 11px; color: #6b7280; display: block;">Nomero y'icyangombwa</span>
                <span style="font-size: 13px; font-weight: bold;">${permit.owner_id_number || 'N/A'}</span>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <span style="font-size: 11px; color: #6b7280; display: block;">Impamvu y'iyimuka</span>
              <span style="font-size: 13px; font-weight: bold;">${permit.reason || 'Kubaga amatungo'}</span>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
              <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">Ibisobanuro birambuye by'ubwikorezi (Transportation Details)</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #f3f4f6; font-size: 11px;">
                <div>
                  <span style="color: #6b7280; display: block;">Uburyo bwo kugenda</span>
                  <span style="font-weight: 600; color: #111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Umunyamaguru / Person' : (permit.transport_type || 'Imodoka')}</span>
                </div>
                <div>
                  <span style="color: #6b7280; display: block;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Nyir\'amatungo' : 'Nomero ya pulaki'}</span>
                  <span style="font-weight: 600; color: #111827;">${permit.transporter_mode === 'PERSON_ON_FOOT' ? (permit.driver_name || 'N/A') : (permit.plate_number || 'N/A')}</span>
                </div>
                <div>
                  <span style="color: #6b7280; display: block;">Utwara Amatungo</span>
                  <span style="font-weight: 600; color: #111827;">${permit.driver_name || 'N/A'} (${permit.driver_phone || ''})</span>
                </div>
              </div>
            </div>

            ${permit.cargo_photo ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
                <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">Ifoto y'Amatungo Yapakijwe / Arimo Kwimuka</h4>
                <img src="${permit.cargo_photo}" alt="Loaded Cargo" style="height: 120px; max-width: 260px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db;" />
              </div>
            ` : ''}

            ${permit.buyer_name ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
                <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">Amakuru y'Umuguzi (Buyer / Company Details)</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #f3f4f6; font-size: 11px;">
                  <div><span style="color: #6b7280; display: block;">Ubwoko bw'Umuguzi</span><span style="font-weight: 600;">${permit.buyer_type || 'Person'}</span></div>
                  <div><span style="color: #6b7280; display: block;">Amazina / Isociete</span><span style="font-weight: 600;">${permit.buyer_name}</span></div>
                  <div><span style="color: #6b7280; display: block;">Telephoni / NID</span><span style="font-weight: 600;">${permit.buyer_phone || ''} ${permit.buyer_id_tin ? `(${permit.buyer_id_tin})` : ''}</span></div>
                </div>
              </div>
            ` : ''}

            <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
              <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase;">Ahantu aturuka: (Origin)</h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 11px; padding: 6px 0;">
                <div><span style="color: #6b7280; display: block;">Akarere:</span><span style="font-weight: bold;">${permit.origin_district || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Umurenge:</span><span style="font-weight: bold;">${permit.origin_sector || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Akagari:</span><span style="font-weight: bold;">${permit.origin_cell || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Umudugudu:</span><span style="font-weight: bold;">${permit.origin_village || 'N/A'}</span></div>
              </div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
              <h4 style="font-size: 11px; font-weight: bold; text-transform: uppercase;">Aho yerekeza: (Destination)</h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 11px; padding: 6px 0;">
                <div><span style="color: #6b7280; display: block;">Akarere:</span><span style="font-weight: bold;">${permit.dest_district || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Umurenge:</span><span style="font-weight: bold;">${permit.dest_sector || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Akagari:</span><span style="font-weight: bold;">${permit.dest_cell || 'N/A'}</span></div>
                <div><span style="color: #6b7280; display: block;">Umudugudu:</span><span style="font-weight: bold;">${permit.dest_village || 'N/A'}</span></div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; padding: 10px 0; margin-top: 12px; font-size: 11px;">
              <div><span style="color: #6b7280; display: block;">Rutanzwe ku wa:</span><span style="font-weight: bold; font-size: 13px;">${issueDate}</span></div>
              <div><span style="color: #6b7280; display: block;">Inyandiko ifite agaciro kugeza:</span><span style="font-weight: bold; font-size: 13px;">${validUntilDate}</span></div>
              <div><span style="color: #6b7280; display: block;">Nomero y'icyemezo:</span><span style="font-weight: bold; font-size: 13px; color: #0052cc;">${permitCode}</span></div>
            </div>

            <div style="padding-top: 12px;">
              <p style="font-size: 11px; font-style: italic; color: #374151; margin: 0;">Uru ruhushya rutanzwe mu izina ry'Umuyobozi Ushinzwe Iby'amatungo mu Karere</p>
              <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">Rwatanzwe na:</p>
              <p style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 2px 0;">${permit.Approver?.name || permit.approver_name || 'SHINGIRO Eugene'}</p>
              <p style="font-size: 11px; color: #4b5563; font-weight: 500; margin: 0;">Umuyobozi Ushinzwe Iby'amatungo mu Karere (${permit.origin_district || 'District'})</p>
            </div>
          </div>

          <div style="border-top: 2px solid black; padding-top: 12px; margin-top: 16px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 56px; height: 56px; border: 1px solid #d1d5db; padding: 4px;" />
              <div>
                <span style="font-size: 9px; color: #6b7280; display: block; font-weight: bold; text-transform: uppercase;">INYANDIKO ITANGIWE KU</span>
                <span style="font-size: 11px; font-weight: 800; color: #1e3a8a; display: block;">
                  RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- PAGE BREAK -->
        <div class="html2pdf__page-break" style="page-break-before: always; height: 0;"></div>

        <!-- PAGE 2: ANIMAL SPECIFICATIONS LIST -->
        <div style="background:white; padding: 32px; border: 1px solid #e5e7eb; position: relative; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                alt="Rwanda Coat of Arms"
                style="width: 56px; height: 56px; object-fit: contain;"
              />
              <div style="text-align: center;">
                <h1 style="font-size: 15px; font-weight: bold; text-transform: uppercase; margin: 0;">REPUBULIKA Y'U RWANDA</h1>
                <h2 style="font-size: 11px; font-weight: bold; margin: 2px 0;">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
              </div>
              <img
                src="${rabLogo}"
                alt="RAB Logo"
                style="width: 60px; height: 60px; object-fit: contain;"
              />
            </div>

            <div style="height: 5px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 10px 0;"></div>

            <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 6px 0; text-align: center; background: #f9fafb; margin-bottom: 14px;">
              <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0;">
                URUHUSHYA RWO KWIMURA AMATUNGO - LIST OF ANIMALS
              </h2>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding: 6px 0; border-bottom: 1px solid #e5e7eb;">
              <div><span style="color: #6b7280;">Ubwoko:</span> <span style="font-weight: bold; font-size: 13px; margin-left: 4px;">${permit.animal_type || 'Inka'}</span></div>
              <div><span style="color: #6b7280;">Nomero y'icyemezo:</span> <span style="font-weight: bold; font-size: 13px; color: #0052cc; margin-left: 4px;">${permitCode}</span></div>
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 11px; margin-top: 14px;">
              <thead>
                <tr style="background: #f3f4f6; color: #111827; font-weight: bold; border-bottom: 1px solid #d1d5db;">
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; width: 40px;">#</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Nomero y'iherena cyangwa izina</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; width: 60px;">Igitsina</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; width: 60px;">Ingano</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Ubwoko</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Ibara</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Ibisobanuro</th>
                </tr>
              </thead>
              <tbody>
                ${animals.map((anim, idx) => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="border: 1px solid #d1d5db; padding: 7px; text-align: center; font-weight: 500; color: #6b7280;">${idx + 1}</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; font-weight: bold; color: #000;">${anim.tag_number || `TAG-${idx+1}`}</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; text-align: center; text-transform: uppercase; font-weight: 600;">${anim.sex || 'F'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; text-align: center;">1</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; text-transform: capitalize;">${anim.breed || 'Cross'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; text-transform: capitalize;">${anim.color || 'Ikibamba'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 7px; color: #4b5563;">${anim.vaccines ? `Vaccines: ${anim.vaccines}` : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="border-top: 2px solid black; padding-top: 12px; margin-top: 16px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 56px; height: 56px; border: 1px solid #d1d5db; padding: 4px;" />
              <div>
                <span style="font-size: 9px; color: #6b7280; display: block; font-weight: bold; text-transform: uppercase;">INYANDIKO ITANGIWE KU</span>
                <span style="font-size: 11px; font-weight: 800; color: #1e3a8a; display: block;">
                  RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Wait for images to load into DOM before capturing canvas
    await waitForImages(container);
    await new Promise(resolve => setTimeout(resolve, 300));

    const html2pdf = await ensureHtml2Pdf();
    if (html2pdf) {
      const opt = {
        margin:       0,
        filename:     `Permit_${permitCode}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      toast.success(`Permit_${permitCode}.pdf saved!`, { id: toastId });
    } else {
      const htmlContent = container.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Permit_${permitCode}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      document.body.removeChild(container);
      URL.revokeObjectURL(url);
      toast.success(`Permit saved as Permit_${permitCode}.html`, { id: toastId });
    }
  } catch (err) {
    console.error('PDF download error:', err);
    toast.error('Failed to download permit PDF.', { id: toastId });
  }
};
