import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/curriculumData';
import { sound } from '../audio/soundEffects';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award } from 'lucide-react';

interface QuizModalProps {
  onComplete: (score: number, maxScore: number) => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const question = QUIZ_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;

  const handleSelectOption = (index: number) => {
    if (showAnswer) return;
    sound.playClick();
    setSelectedOption(index);
    setShowAnswer(true);

    const isCorrect = index === question.correctIndex;
    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (isLastQuestion) {
      const finalScore = Math.round((correctAnswersCount / QUIZ_QUESTIONS.length) * 100);
      onComplete(finalScore, 100);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#081726] border-2 border-cyan-400 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,255,204,0.4)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-cyan-300">
              Evaluasi Akhir: Uji Kompetensi Agen
            </h2>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            Soal {currentQuestionIndex + 1} dari {QUIZ_QUESTIONS.length}
          </span>
        </div>

        {/* Question Text */}
        <div className="mb-4">
          <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-100">
            {question.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-5">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctIndex;

            let btnClass = 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-cyan-400';
            if (showAnswer) {
              if (isCorrect) {
                btnClass = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
              } else if (isSelected) {
                btnClass = 'border-red-500 bg-red-950/70 text-red-200';
              } else {
                btnClass = 'border-slate-800 bg-slate-950/50 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={showAnswer}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-start gap-3 ${btnClass}`}
              >
                <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 mt-0.5">{opt}</span>
                {showAnswer && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                {showAnswer && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {showAnswer && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-xs text-cyan-200 leading-relaxed">
            <span className="font-bold text-cyan-300">💡 Penjelasan Guru: </span>
            {question.explanation}
          </div>
        )}

        {/* Footer Next Button */}
        <div className="flex justify-end gap-2">
          {showAnswer && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg"
            >
              {isLastQuestion ? 'LIHAT SERTIFIKAT KELULUSAN' : 'SOAL BERIKUTNYA →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
