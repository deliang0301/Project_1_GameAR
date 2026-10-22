/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GameLevel, HardwarePart, VirusEntity } from './types/game';
import { INITIAL_HARDWARE_PARTS, INITIAL_VIRUS_LIST } from './data/curriculumData';
import { ARView } from './components/ARView';
import { HUD } from './components/HUD';
import { QuizModal } from './components/QuizModal';
import { CertificateModal } from './components/CertificateModal';
import { TeacherShareModal } from './components/TeacherShareModal';
import { sound } from './audio/soundEffects';
import { Shield, Sparkles, Video, Play, Award, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState<GameLevel>('intro');
  const [parts, setParts] = useState<HardwarePart[]>(INITIAL_HARDWARE_PARTS);
  const [viruses, setViruses] = useState<VirusEntity[]>(INITIAL_VIRUS_LIST);
  const [score, setScore] = useState<number>(0);

  const [isVirtualLabMode, setIsVirtualLabMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [activeInspectPart, setActiveInspectPart] = useState<HardwarePart | null>(null);
  const [lastDestroyedVirus, setLastDestroyedVirus] = useState<VirusEntity | null>(null);
  const [crosshairLockedVirus, setCrosshairLockedVirus] = useState<VirusEntity | null>(null);
  const [laserTriggerCounter, setLaserTriggerCounter] = useState<number>(0);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Toggle Virtual Lab / Camera AR mode
  const handleToggleVirtualLab = () => {
    sound.playClick();
    setIsVirtualLabMode((prev) => !prev);
  };

  // Start game from intro
  const handleStartGame = (virtualMode: boolean) => {
    sound.playClick();
    setIsVirtualLabMode(virtualMode);
    setCurrentLevel('level1');
  };

  // Level 1: Install Hardware Component
  const handleInstallPart = (partId: HardwarePart['id']) => {
    sound.playSnap();
    setParts((prev) => {
      const updated = prev.map((p) => (p.id === partId ? { ...p, installed: true } : p));
      const allDone = updated.every((p) => p.installed);
      if (allDone) {
        setScore((s) => s + 50);
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      }
      return updated;
    });
  };

  // Advance from Level 1 to Level 2
  const handleAdvanceToLevel2 = () => {
    sound.playBootChime();
    setCurrentLevel('level2');
  };

  // Level 2: Trigger Shoot Laser
  const handleShootLaser = () => {
    setLaserTriggerCounter((prev) => prev + 1);
  };

  // Level 2: Virus Destroyed Callback
  const handleVirusDestroyed = useCallback((destroyedVirus: VirusEntity) => {
    setScore((prev) => prev + 20);
    setLastDestroyedVirus(destroyedVirus);
    setViruses((prev) => prev.filter((v) => v.id !== destroyedVirus.id));
  }, []);

  // Level 2: All Viruses Cleared
  const handleAllVirusesCleared = useCallback(() => {
    sound.playVictory();
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    setTimeout(() => {
      setIsQuizModalOpen(true);
    }, 1200);
  }, []);

  // Level 3: Quiz Completed Callback
  const handleQuizCompleted = (quizScore: number) => {
    sound.playVictory();
    setScore((prev) => prev + quizScore);
    setIsQuizModalOpen(false);
    setIsCertificateModalOpen(true);
    setCurrentLevel('victory');
  };

  // Restart Entire Game
  const handleRestartGame = () => {
    sound.playClick();
    setParts(INITIAL_HARDWARE_PARTS);
    setViruses(INITIAL_VIRUS_LIST);
    setScore(0);
    setIsCertificateModalOpen(false);
    setIsQuizModalOpen(false);
    setLastDestroyedVirus(null);
    setCurrentLevel('intro');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebAR / WebGL Canvas View */}
      <ARView
        currentLevel={currentLevel}
        parts={parts}
        viruses={viruses}
        onVirusDestroyed={handleVirusDestroyed}
        onAllVirusesCleared={handleAllVirusesCleared}
        isVirtualLabMode={isVirtualLabMode}
        onToggleVirtualLab={handleToggleVirtualLab}
        crosshairLockedVirus={crosshairLockedVirus}
        setCrosshairLockedVirus={setCrosshairLockedVirus}
        laserTriggerCounter={laserTriggerCounter}
      />

      {/* Cyber HUD Overlay */}
      {currentLevel !== 'intro' && (
        <HUD
          currentLevel={currentLevel}
          parts={parts}
          onInstallPart={(id) => {
            if (parts.every((p) => p.installed)) {
              handleAdvanceToLevel2();
            } else {
              handleInstallPart(id);
            }
          }}
          activeInspectPart={activeInspectPart}
          setActiveInspectPart={setActiveInspectPart}
          virusesRemaining={viruses.length}
          totalViruses={INITIAL_VIRUS_LIST.length}
          lastDestroyedVirus={lastDestroyedVirus}
          onCloseVirusModal={() => setLastDestroyedVirus(null)}
          crosshairLockedVirus={crosshairLockedVirus}
          onShootLaser={handleShootLaser}
          onOpenTeacherGuide={() => setIsTeacherModalOpen(true)}
          onOpenQuiz={() => setIsQuizModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          score={score}
        />
      )}

      {/* INTRO WELCOME BRIEFING MODAL */}
      {currentLevel === 'intro' && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#040e1a] border-2 border-cyan-400 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,204,0.4)] text-white text-center">
            {/* Mission Badge */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 mx-auto flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_20px_rgba(0,255,204,0.5)]">
              <Shield className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> INFORMATIKA KELAS 7 SMP
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-100 to-blue-400 mb-3">
              CYBERQUEST AR
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
              Selamat datang Agen Siber! Server sekolah diserang malware <b>Trojan-X</b>.
              Selesaikan misi perakitan sistem komputer 3D dan basmi virus di ruang kelasmu menggunakan kamera Augmented Reality!
            </p>

            {/* Level Roadmap Preview */}
            <div className="grid grid-cols-2 gap-2.5 text-left mb-6 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">Level 1</span>
                <span className="font-bold text-white block">Hardware Assembler</span>
                <span className="text-[11px] text-slate-400">Rakit Processor, RAM, GPU, SSD, & Cooler.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-red-500/30">
                <span className="text-[10px] uppercase font-bold text-red-400 block">Level 2</span>
                <span className="font-bold text-white block">Firewall Blaster</span>
                <span className="text-[11px] text-slate-400">Tembak laser ke malware Trojan-X di ruangan nyata.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleStartGame(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,204,0.6)] flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4 fill-current" />
                <span>IZINKAN KAMERA & MULAI WEBAR</span>
              </button>

              <button
                onClick={() => handleStartGame(true)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 font-semibold text-xs transition"
              >
                🎮 Main di Mode Lab 3D Virtual (Tanpa Kamera)
              </button>
            </div>

            {/* Teacher Guide Link */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsTeacherModalOpen(true)}
                className="text-xs text-slate-400 hover:text-cyan-300 font-medium underline flex items-center justify-center gap-1 mx-auto"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Panduan Guru & Proyeksikan QR Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ EVALUATION MODAL */}
      {isQuizModalOpen && (
        <QuizModal
          onComplete={handleQuizCompleted}
          onClose={() => setIsQuizModalOpen(false)}
        />
      )}

      {/* CERTIFICATE MODAL */}
      {isCertificateModalOpen && (
        <CertificateModal
          score={score}
          onRestartGame={handleRestartGame}
        />
      )}

      {/* TEACHER SHARE / QR CODE MODAL */}
      {isTeacherModalOpen && (
        <TeacherShareModal onClose={() => setIsTeacherModalOpen(false)} />
      )}
    </div>
  );
}
