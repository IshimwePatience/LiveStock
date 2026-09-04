import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

const OfficialRabPermitModal = ({ isOpen, onClose, permit }) => {
  const printRef = useRef();

  if (!isOpen || !permit) return null;

  // Format dates DD/MM/YYYY
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

  const handlePrint = () => {
    const printContent = printRef.current;
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
            .page-break { page-break-after: always; }
            @media print {
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // QR Code URL via free QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(permitCode)}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Modal Top Control Bar */}
        <div className="bg-gray-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight text-white">Official RAB Livestock Movement Permit</h3>
              <p className="text-[11px] text-gray-400">Permit No: {permitCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#0052cc] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-200 flex justify-center">
          <div ref={printRef} className="w-full max-w-[794px] space-y-8">

            {/* PAGE 1: PERMIT DETAILS */}
            <div className="bg-white p-8 rounded-sm shadow-md border border-gray-200 relative overflow-hidden min-h-[1120px] flex flex-col justify-between">
              
              {/* RAB Watermark Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 select-none">
                <div className="text-[140px] font-black tracking-widest text-center text-gray-900 leading-none">
                  RAB<br />
                  <span className="text-[32px] tracking-normal font-normal">AGRICULTURE AND ANIMAL RESOURCES</span>
                </div>
              </div>

              <div className="relative z-10 space-y-5">
                {/* Header Logos */}
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
                  {/* Left: Coat of Arms */}
                  <div className="flex items-center gap-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                      alt="Rwanda Coat of Arms"
                      className="w-16 h-16 object-contain"
                    />
                  </div>

                  {/* Center Text */}
                  <div className="text-center space-y-0.5">
                    <h1 className="text-base font-bold text-gray-900 uppercase tracking-wide">REPUBULIKA Y'U RWANDA</h1>
                    <h2 className="text-xs font-bold text-gray-800 max-w-md mx-auto leading-tight">
                      IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)
                    </h2>
                    <p className="text-[10px] text-gray-600">
                      Ubuyobozi bwa serivisi z'ubuvuzi bw'amatungo Agasanduku k'Iposita 5016 Kigali / Nomero itishyuzwa: 4673
                    </p>
                  </div>

                  {/* Right: RAB Logo */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-600 p-1 flex flex-col items-center justify-center bg-emerald-50 text-center">
                      <span className="font-black text-emerald-800 text-xs leading-none">RAB</span>
                      <span className="text-[7px] text-emerald-700 font-bold leading-tight mt-0.5">RWANDA</span>
                    </div>
                  </div>
                </div>

                {/* Flag Bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-sky-500 rounded-full"></div>

                {/* Document Main Banner */}
                <div className="border-y-2 border-black py-2 text-center bg-gray-50/50 my-2">
                  <h2 className="text-lg font-bold text-black tracking-wide uppercase">
                    URUHUSHYA RWO KWIMURA AMATUNGO
                  </h2>
                </div>

                {/* Owner & Identification Grid */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Amazina</span>
                    <span className="text-sm font-bold text-black uppercase">{permit.owner_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Nomero y'icyangombwa</span>
                    <span className="text-sm font-bold text-black">{permit.owner_id_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <span className="text-xs text-gray-500 block">Impamvu y'iyimuka</span>
                  <span className="text-sm font-bold text-black">{permit.reason || 'Kubaga amatungo'}</span>
                </div>

                {/* Transporter Details */}
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Ibisobanuro birambuye by'ubwikorezi (Transportation Details)</h4>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-500 block">Uburyo bwo kugenda</span>
                      <span className="font-semibold text-gray-900">{permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Umunyamaguru / Person' : (permit.transport_type || 'Imodoka')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{permit.transporter_mode === 'PERSON_ON_FOOT' ? 'Nyir\'amatungo / Moving Person' : 'Nomero ya pulaki'}</span>
                      <span className="font-semibold text-gray-900">{permit.transporter_mode === 'PERSON_ON_FOOT' ? (permit.driver_name || 'N/A') : (permit.plate_number || 'N/A')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Utwara Amatungo</span>
                      <span className="font-semibold text-gray-900">{permit.driver_name || 'N/A'} ({permit.driver_phone || ''})</span>
                    </div>
                  </div>
                </div>

                {/* Cargo Photo (If attached) */}
                {permit.cargo_photo && (
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Ifoto y'Amatungo Yapakijwe / Arimo Kwimuka</h4>
                    <img src={permit.cargo_photo} alt="Loaded Cargo" className="h-36 max-w-xs object-cover rounded-lg border border-gray-300 shadow-sm" />
                  </div>
                )}

                {/* Buyer Details (If provided) */}
                {permit.buyer_name && (
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Amakuru y'Umuguzi (Buyer / Company Details)</h4>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-500 block">Ubwoko bw'Umuguzi</span>
                        <span className="font-semibold text-gray-900">{permit.buyer_type || 'Person'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Amazina / Isociete</span>
                        <span className="font-semibold text-gray-900">{permit.buyer_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Telephoni / NID / TIN</span>
                        <span className="font-semibold text-gray-900">{permit.buyer_phone || ''} {permit.buyer_id_tin ? `(${permit.buyer_id_tin})` : ''}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Origin Grid */}
                <div className="border-t border-gray-200 pt-3 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Ahantu aturuka: (Origin)</h4>
                  <div className="grid grid-cols-4 gap-2 bg-white p-2 text-xs">
                    <div><span className="text-gray-500 block">Akarere:</span><span className="font-bold text-gray-900">{permit.origin_district || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Umurenge:</span><span className="font-bold text-gray-900">{permit.origin_sector || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Akagari:</span><span className="font-bold text-gray-900">{permit.origin_cell || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Umudugudu:</span><span className="font-bold text-gray-900">{permit.origin_village || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Destination Grid */}
                <div className="border-t border-gray-200 pt-3 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Aho yerekeza: (Destination)</h4>
                  <div className="grid grid-cols-4 gap-2 bg-white p-2 text-xs">
                    <div><span className="text-gray-500 block">Akarere:</span><span className="font-bold text-gray-900">{permit.dest_district || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Umurenge:</span><span className="font-bold text-gray-900">{permit.dest_sector || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Akagari:</span><span className="font-bold text-gray-900">{permit.dest_cell || 'N/A'}</span></div>
                    <div><span className="text-gray-500 block">Umudugudu:</span><span className="font-bold text-gray-900">{permit.dest_village || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Issue Date, Validity & Code Row */}
                <div className="grid grid-cols-3 gap-4 border-t-2 border-b-2 border-gray-200 py-3 mt-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Rutanzwe ku wa:</span>
                    <span className="font-bold text-black text-sm">{issueDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Inyandiko ifite agaciro kugeza:</span>
                    <span className="font-bold text-black text-sm">{validUntilDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Nomero y'icyemezo:</span>
                    <span className="font-bold text-[#0052cc] text-sm tracking-wider">{permitCode}</span>
                  </div>
                </div>

                {/* Approval Authority Signature */}
                <div className="pt-4 space-y-1">
                  <p className="text-xs text-gray-700 italic">
                    Uru ruhushya rutanzwe mu izina ry'Umuyobozi Ushinzwe Iby'amatungo mu Karere
                  </p>
                  <p className="text-xs text-gray-500">Rwatanzwe na:</p>
                  <p className="text-base font-bold text-black uppercase mt-1">
                    {permit.Approver?.name || permit.approver_name || 'SHINGIRO Eugene'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    Umuyobozi Ushinzwe Iby'amatungo mu Karere ({permit.origin_district || 'District'})
                  </p>
                </div>

              </div>

              {/* Page 1 Footer */}
              <div className="relative z-10 border-t-2 border-black pt-4 mt-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border p-1 rounded bg-white" />
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">INYANDIKO ITANGIWE KU</span>
                      <span className="text-xs font-extrabold text-blue-900 block leading-tight">
                        RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-3 leading-relaxed text-justify border-t border-gray-100 pt-2">
                  <strong>Icyitonderwa:</strong> Uru ruhushya rwemejwe mu buryo bw'ikoranabuhanga n' <strong>Ikigo gishinzwe iterambere ry'ubuhinzi n'ubworozi mu Rwanda (RAB)</strong>. Mu rwego rwo kwirinda uburiganya, genzura niba iki cyangombwa cyujuje ubuziranenge ushakisha nomero ya dosiye <span className="font-bold text-black">{permitCode}</span> ku RAB System mbere yo kugikoresha.
                </p>
              </div>

            </div>

            {/* PAGE 2: ANIMAL SPECIFICATIONS LIST */}
            <div className="bg-white p-8 rounded-sm shadow-md border border-gray-200 relative overflow-hidden min-h-[1120px] flex flex-col justify-between">
              
              <div className="relative z-10 space-y-5">
                {/* Header Logos */}
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png"
                    alt="Rwanda Coat of Arms"
                    className="w-14 h-14 object-contain"
                  />
                  <div className="text-center space-y-0.5">
                    <h1 className="text-base font-bold text-gray-900 uppercase">REPUBULIKA Y'U RWANDA</h1>
                    <h2 className="text-xs font-bold text-gray-800">IKIGO GISHINZWE ITERAMBERE RY'UBUHINZI N'UBWOROZI MU RWANDA (RAB)</h2>
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-emerald-50 text-center font-bold text-emerald-800 text-xs">
                    RAB
                  </div>
                </div>

                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-sky-500 rounded-full"></div>

                <div className="border-y-2 border-black py-2 text-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-black tracking-wide uppercase">
                    URUHUSHYA RWO KWIMURA AMATUNGO - LIST OF ANIMALS
                  </h2>
                </div>

                <div className="flex justify-between items-center text-xs py-2 border-b border-gray-200">
                  <div><span className="text-gray-500">Ubwoko:</span> <span className="font-bold text-black text-sm ml-1">{permit.animal_type || 'Inka'}</span></div>
                  <div><span className="text-gray-500">Nomero y'icyemezo:</span> <span className="font-bold text-[#0052cc] text-sm ml-1">{permitCode}</span></div>
                </div>

                {/* Animals Table */}
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
                      <th className="border border-gray-300 p-2.5 text-center w-12">#</th>
                      <th className="border border-gray-300 p-2.5 text-left">Nomero y'iherena cyangwa izina</th>
                      <th className="border border-gray-300 p-2.5 text-center w-16">Igitsina</th>
                      <th className="border border-gray-300 p-2.5 text-center w-16">Ingano</th>
                      <th className="border border-gray-300 p-2.5 text-left">Ubwoko</th>
                      <th className="border border-gray-300 p-2.5 text-left">Ibara</th>
                      <th className="border border-gray-300 p-2.5 text-left">Ibisobanuro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((anim, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center font-medium text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-300 p-2 font-bold text-black">{anim.tag_number || `TAG-${idx+1}`}</td>
                        <td className="border border-gray-300 p-2 text-center uppercase font-semibold">{anim.sex || 'F'}</td>
                        <td className="border border-gray-300 p-2 text-center">1</td>
                        <td className="border border-gray-300 p-2 capitalize">{anim.breed || 'Cross'}</td>
                        <td className="border border-gray-300 p-2 capitalize">{anim.color || 'Ikibamba'}</td>
                        <td className="border border-gray-300 p-2 text-gray-600">{anim.vaccines ? `Vaccines: ${anim.vaccines}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Page 2 Footer */}
              <div className="relative z-10 border-t-2 border-black pt-4 mt-6">
                <div className="flex items-center gap-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 border p-1 rounded bg-white" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">INYANDIKO ITANGIWE KU</span>
                    <span className="text-xs font-extrabold text-blue-900 block">
                      RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficialRabPermitModal;
