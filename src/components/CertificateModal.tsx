import React, { useState } from 'react';
import { Award, Printer, RotateCcw, CheckCircle, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CertificateModalProps {
  score: number;
  onRestartGame: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ score, onRestartGame }) => {
  const [studentName, setStudentName] = useState('Siswa Teladan');
  const [schoolName, setSchoolName] = useState('SMP Negeri 1 Cyber City');
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#030d17] border-2 border-cyan-400 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,255,204,0.4)] text-white relative">
        {/* Printable Certificate Area */}
        <div id="certificate-print-area" className="border-4 border-double border-cyan-500/50 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#061527] to-[#040e1c] text-center relative overflow-hidden">
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Shield className="w-96 h-96 text-cyan-300" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-mono tracking-widest uppercase text-cyan-400">
              KEMENTERIAN PENDIDIKAN & KEBUDAYAAN // INFORMATIKA KELAS 7
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300 uppercase tracking-wider mb-2">
            SERTIFIKAT KELULUSAN AGEN SIBER
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
            Diberikan sebagai bukti kelulusan praktik <b>Augmented Reality (WebAR)</b> Perakitan Hardware Komputer dan Pertahanan Keamanan Siber.
          </p>

          <div className="mb-4">
            <label className="block text-[11px] font-mono text-cyan-400 mb-1">NAMA SISWA / AGEN SIBER:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="text-center font-bold text-lg sm:text-2xl text-amber-300 bg-transparent border-b-2 border-cyan-400/50 pb-1 focus:outline-none focus:border-amber-400 w-full max-w-sm"
              placeholder="Ketik Nama Kamu..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">ASAL SEKOLAH:</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="text-center text-xs sm:text-sm text-slate-200 bg-transparent border-b border-slate-700 pb-1 focus:outline-none focus:border-cyan-400 w-full max-w-xs"
              placeholder="Nama Sekolah..."
            />
          </div>

          {/* Badges and Score Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block">Level 1</span>
              <span className="text-xs font-bold text-emerald-400">Hardware Pro</span>
            </div>
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block">Level 2</span>
              <span className="text-xs font-bold text-cyan-400">Malware Cleaner</span>
            </div>
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block">Skor Evaluasi</span>
              <span className="text-xs font-black text-amber-300">{score} / 100</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-cyan-500/20 pt-4 text-[11px] text-slate-400 px-4">
            <div>
              <p className="font-semibold text-slate-300">Tanggal Terbit:</p>
              <p>{currentDate}</p>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-[10px]">VERIFIED // AR-INFORMATIKA</span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            💡 Klik cetak atau simpan ke PDF untuk diserahkan ke Guru Informatika!
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2 shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onRestartGame}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Lagi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
