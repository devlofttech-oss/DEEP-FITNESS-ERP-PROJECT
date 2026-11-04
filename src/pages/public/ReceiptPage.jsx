import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument } from '../../firebase/db';
import { buildReceiptHtml } from '../../utils/receipt';

// The branded receipt is authored as a standalone A4 document (src/utils/receipt.js)
// so the printed copy, the PDF and this shared link are always identical. Here it is
// rendered in an iframe and scaled down to whatever width the phone gives us.
const PAGE_W = 794;   // 210mm @96dpi
const PAGE_H = 1123;  // 297mm @96dpi

export default function ReceiptPage() {
  const { receiptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scale, setScale] = useState(1);
  const holderRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    getDocument('receipts', receiptId)
      .then(doc => { if (doc) setData(doc); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [receiptId]);

  useEffect(() => {
    const fit = () => {
      const w = holderRef.current?.clientWidth;
      if (w) setScale(Math.min(1, w / PAGE_W));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [data]);

  const html = useMemo(() => {
    if (!data) return '';
    return buildReceiptHtml({
      gymInfo: { name: data.gymName, location: data.gymAddress, contact: data.gymPhone, logoUrl: data.gymLogoUrl },
      member: {
        name: data.memberName,
        phone: data.memberPhone,
        membershipId: data.membershipId,
        planName: data.planName,
        planActiveFrom: data.planActiveFrom,
        expiryDate: data.expiryDate,
        totalFees: data.totalFees,
        paidFees: data.paidFees,
        balanceFees: data.balanceFees,
        gstPercent: data.gstPercent,
      },
      payment: data.generatedAt ? { date: data.generatedAt } : null,
    });
  }, [data]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
      <div className="text-4xl">🧾</div>
      <h2 className="text-lg font-bold text-gray-800">Receipt not found</h2>
      <p className="text-sm text-gray-500">This receipt link may have expired or is invalid.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex flex-col items-center p-3 sm:p-6 gap-4">
      <div ref={holderRef} className="w-full max-w-[794px]">
        <div
          className="rounded-xl overflow-hidden shadow-2xl bg-white mx-auto"
          style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
        >
          <iframe
            ref={frameRef}
            title="Membership receipt"
            srcDoc={html}
            scrolling="no"
            style={{
              width: PAGE_W, height: PAGE_H, border: 0,
              transform: `scale(${scale})`, transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      <button
        onClick={() => frameRef.current?.contentWindow?.print()}
        className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Download / Print
      </button>
    </div>
  );
}
