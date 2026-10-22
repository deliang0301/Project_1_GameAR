import React, { useState } from 'react';
import { GameLevel, HardwarePart, VirusEntity } from '../types/game';
import { sound } from '../audio/soundEffects';
import {
  Cpu,
  Server,
  MonitorPlay,
  HardDrive,
  Fan,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HelpCircle,
  Share2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Award,
} from 'lucide-react';

interface HUDProps {
  currentLevel: GameLevel;
  parts: HardwarePart[];
  onInstallPart: (partId: HardwarePart['id']) => void;
  activeInspectPart: HardwarePart | null;
  setActiveInspectPart: (p: HardwarePart | null) => void;
  virusesRemaining: number;
  totalViruses: number;
  lastDestroyedVirus: VirusEntity | null;
  onCloseVirusModal: () => void;
  crosshairLockedVirus: VirusEntity | null;
  onShootLaser: () => void;
  onOpenTeacherGuide: () => void;
  onOpenQuiz: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  score: number;
}

export const HUD: React.FC<HUDProps> = ({
  currentLevel,
  parts,
  onInstallPart,
  activeInspectPart,
  setActiveInspectPart,
  virusesRemaining,
  totalViruses,
  lastDestroyedVirus,
  onCloseVirusModal,
  crosshairLockedVirus,
  onShootLaser,
  onOpenTeacherGuide,
  onOpenQuiz,
  soundEnabled,
  onToggleSound,
  score,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getPartIcon = (id: string) => {
    switch (id) {
      case 'cpu':
        return <Cpu className="w-5 h-5" />;
      case 'ram':
        return <Server className="w-5 h-5" />;
      case 'gpu':
        return <MonitorPlay className="w-5 h-5" />;
      case 'ssd':
        return <HardDrive className="w-5 h-5" />;
      case 'cooler':
        return <Fan className="w-5 h-5" />;
      case 'psu':
        return <Zap className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  const allInstalled = parts.every((p) => p.installed);
  const installedCount = parts.filter((p) => p.installed).length;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* TOP HEADER */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Main Banner Bar */}
        <div className="w-full bg-[#05111c]/90 border border-cyan-400/40 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(0,255,204,0.25)] flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 font-black text-sm shadow-[0_0_10px_rgba(0,255,204,0.4)]">
              CQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                  {currentLevel === 'level1'
                    ? 'Level 1: Hardware Assembler'
                    : currentLevel === 'level2'
                    ? 'Level 2: Firewall Blaster'
                    : 'Level 3: Evaluasi Agen Siber'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500/30">
                  Kelas 7 SMP
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {currentLevel === 'level1'
                  ? 'Rakit Sistem Komputer Lengkap'
                  : currentLevel === 'level2'
                  ? 'Pertahankan Server Sekolah dari Malware'
                  : 'Sertifikasi Keamanan & Sistem Digital'}
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition"
              title="Aktif/Nonaktifkan Suara"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <button
              onClick={onOpenTeacherGuide}
              className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition"
              title="Panduan Guru & Bagikan QR Kelas"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition hidden sm:flex"
              title="Mode Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress & Stat Pill */}
        <div className="mt-2 flex items-center gap-3">
          {currentLevel === 'level1' && (
            <div className="bg-slate-950/85 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 flex items-center gap-2 shadow">
              <span>Komponen Terpasang:</span>
              <span className="text-amber-300 font-bold">{installedCount} / {parts.length}</span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(installedCount / parts.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {currentLevel === 'level2' && (
            <div className="bg-slate-950/85 border border-red-500/40 px-3 py-1 rounded-full text-xs font-semibold text-red-300 flex items-center gap-2 shadow">
              <span>Malware Tersisa:</span>
              <span className="text-amber-400 font-black">{virusesRemaining} / {totalViruses}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400">Skor: {score}</span>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 2: CENTER TARGETING RETICLE / CROSSHAIR */}
      {currentLevel === 'level2' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div
            className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              crosshairLockedVirus
                ? 'border-red-500 bg-red-500/10 scale-110 shadow-[0_0_20px_#ef4444]'
                : 'border-cyan-400/70 border-dashed scale-100 shadow-[0_0_10px_#00ffcc]'
            }`}
          >
            {/* Center target dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                crosshairLockedVirus ? 'bg-red-500 animate-ping' : 'bg-cyan-400'
              }`}
            />
            {/* Cross ticks */}
            <div className="absolute w-full h-[1px] bg-cyan-400/40" />
            <div className="absolute h-full w-[1px] bg-cyan-400/40" />
          </div>

          {/* Threat Lock Alert Badge */}
          {crosshairLockedVirus ? (
            <div className="mt-3 px-3 py-1 rounded-md bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>LOCK ON: {crosshairLockedVirus.name}</span>
            </div>
          ) : (
            <div className="mt-3 px-2.5 py-0.5 rounded-md bg-slate-900/70 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wider">
              ARAHKAN BIDIKAN KE VIRUS
            </div>
          )}
        </div>
      )}

      {/* BOTTOM UNIFIED CONTROL DOCK */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center pointer-events-auto mb-2">
        {/* Collapse / Expand Tab */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-0.5 text-[11px] font-medium bg-slate-950/85 border border-cyan-500/30 text-cyan-300 rounded-t-lg hover:text-white flex items-center gap-1 shadow-md transition-colors"
        >
          {isDockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isDockCollapsed ? 'Tampilkan Kontrol' : 'Sembunyikan Panel'}</span>
        </button>

        {/* The Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full bg-[#05101a]/95 border border-cyan-400/40 rounded-2xl p-3 shadow-[0_0_25px_rgba(0,255,204,0.3)] flex flex-col gap-2.5">
            {/* Level 1: Hardware Dock */}
            {currentLevel === 'level1' && (
              <div>
                <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-2 px-1">
                  <span>Pilih & Pasang Komponen ke Motherboard:</span>
                  <span className="text-[11px] text-slate-400">Ketuk ikon untuk info & pasang</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {parts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveInspectPart(part);
                      }}
                      className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        part.installed
                          ? 'border-emerald-500/60 bg-emerald-950/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'border-cyan-500/40 bg-slate-900/80 text-white hover:border-cyan-400 hover:bg-cyan-950/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 ${
                          part.installed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-300'
                        }`}
                      >
                        {getPartIcon(part.id)}
                      </div>
                      <span className="text-xs font-bold leading-tight">{part.name}</span>
                      <span className="text-[10px] text-slate-300 font-mono mt-0.5">
                        {part.installed ? '✓ Terpasang' : '+ Pasang'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* If all installed: Big Next Level Button */}
                {allInstalled && (
                  <div className="mt-3 pt-2 border-t border-cyan-500/30 flex justify-center">
                    <button
                      onClick={() => {
                        sound.playBootChime();
                        onInstallPart('cpu'); // triggers level advance in App
                      }}
                      className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:opacity-95 shadow-[0_0_20px_rgba(0,255,204,0.6)] flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>PC MENYALA! LANJUT KE LEVEL 2 (FIREWALL BLASTER)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Level 2: Firewall Blaster Controls */}
            {currentLevel === 'level2' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-cyan-300">MISI: Hancurkan semua virus Trojan-X & malware</p>
                  <p className="text-[11px] text-slate-400">Putar HP atau geser layar untuk membidik target.</p>
                </div>

                <button
                  onClick={onShootLaser}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white font-extrabold text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(239,68,68,0.7)] flex items-center justify-center gap-2 border border-red-300/40"
                >
                  <Crosshair className="w-5 h-5" />
                  <span>TEMBAK LASER FIREWALL</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSPECT HARDWARE DETAIL MODAL (LEVEL 1) */}
      {activeInspectPart && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-md bg-[#071524] border-2 border-cyan-400 rounded-2xl p-5 shadow-[0_0_35px_rgba(0,255,204,0.4)] text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                  {getPartIcon(activeInspectPart.id)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                    {activeInspectPart.category}
                  </span>
                  <h3 className="text-lg font-bold">{activeInspectPart.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setActiveInspectPart(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-900/90 border border-cyan-500/20 rounded-xl p-3">
                <p className="text-cyan-300 font-bold mb-1">Fungsi Utama (Informatika SMP):</p>
                <p className="text-slate-200">{activeInspectPart.description}</p>
              </div>

              <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 font-bold mb-1">💡 Logika Analogi Sehari-hari:</p>
                <p className="text-slate-300 italic">{activeInspectPart.analogy}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span>Spesifikasi Modul:</span>
                <span className="text-cyan-300">{activeInspectPart.specText}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  onInstallPart(activeInspectPart.id);
                  setActiveInspectPart(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition ${
                  activeInspectPart.installed
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110'
                }`}
              >
                {activeInspectPart.installed ? 'Sudah Terpasang di Motherboard' : 'Pasang Sekarang ke Soket'}
              </button>
              <button
                onClick={() => setActiveInspectPart(null)}
                className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIRUS DESTROYED & PREVENTION TIP MODAL (LEVEL 2) */}
      {lastDestroyedVirus && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-md bg-[#130718] border-2 border-pink-500 rounded-2xl p-5 shadow-[0_0_35px_rgba(236,72,153,0.4)] text-white text-center">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400 mx-auto flex items-center justify-center text-pink-400 text-xl font-bold mb-2">
              💥
            </div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400">
              MALWARE BERHASIL DIELIMINASI!
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">{lastDestroyedVirus.name}</h3>

            <div className="mt-4 text-left space-y-2.5 text-xs">
              <div className="bg-slate-900/90 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-300 font-bold mb-1">Bahaya Serangan:</p>
                <p className="text-slate-300">{lastDestroyedVirus.description}</p>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3">
                <p className="text-emerald-400 font-bold mb-1">🛡️ Tips Keamanan Siber Nyata (Kelas 7):</p>
                <p className="text-slate-200 font-medium">{lastDestroyedVirus.preventionTip}</p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onCloseVirusModal();
              }}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg"
            >
              LANJUTKAN MISI SIBER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
