import React, { useState } from 'react';
import { QrCode, Copy, Check, BookOpen, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEffects';

interface TeacherShareModalProps {
  onClose: () => void;
}

export const TeacherShareModal: React.FC<TeacherShareModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://cyberquest-ar.web.app';

  // Generate Google Chart API or SVG QR Code URL for easy projection
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    currentUrl
  )}&color=00ffcc&bgcolor=05101a&margin=10`;

  const copyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#05111f] border-2 border-cyan-400 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,255,204,0.35)] text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Panduan Guru & Bagikan ke Siswa</h2>
              <p className="text-xs text-cyan-300 font-mono">Tampilkan di Proyektor Layar Kelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Classroom Projection Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 mb-4">
          <div className="w-44 h-44 shrink-0 rounded-xl overflow-hidden border-2 border-cyan-400/80 bg-slate-950 p-2 shadow-[0_0_20px_rgba(0,255,204,0.3)] flex items-center justify-center">
            <img
              src={qrCodeUrl}
              alt="QR Code Kelas"
              className="w-full h-full object-contain rounded-lg"
              loading="lazy"
            />
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
              <Smartphone className="w-3 h-3" /> SIAP SCAN DARI HP SISWA
            </span>
            <h3 className="text-sm font-bold text-white">Scan QR ini dengan Kamera HP Siswa</h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Siswa tidak perlu instal aplikasi apapun dari Play Store. Cukup arahkan kamera HP bawaan atau Google Lens ke kode QR di atas untuk membuka WebAR langsung di Chrome/Safari.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-cyan-200 font-mono truncate"
              />
              <button
                onClick={copyLink}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Step Lesson Plan for Teachers (RPP Informatika Kelas 7) */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <BookOpen className="w-4 h-4" />
            <span>Alur Pembelajaran Kelas 7 (1 Jam Pelajaran / 40 Menit):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <span className="font-bold text-cyan-400 block mb-0.5">1. Apersepsi (10 Menit)</span>
              <p className="text-slate-300 leading-normal">
                Guru menjelaskan fungsi CPU, RAM, GPU, dan bahaya malware di internet.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <span className="font-bold text-cyan-400 block mb-0.5">2. Praktik WebAR (20 Menit)</span>
              <p className="text-slate-300 leading-normal">
                Siswa merakit komputer secara visual dan membasmi 5 jenis malware di ruang kelas.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <span className="font-bold text-cyan-400 block mb-0.5">3. Evaluasi & Sertifikat (10 Menit)</span>
              <p className="text-slate-300 leading-normal">
                Siswa menjawab kuis pemahaman dan mengunduh Sertifikat Agen Siber untuk penilaian portofolio.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg"
          >
            TUTUP & MULAI SESI KELAS
          </button>
        </div>
      </div>
    </div>
  );
};
