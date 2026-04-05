import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Trophy, RefreshCcw } from 'lucide-react';
import MathFormula from './MathFormula';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizProps {
  questions: Question[];
  onComplete: (score: number, details?: { questionId: number, isCorrect: boolean }[]) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [numQuestions, setNumQuestions] = useState(Math.min(questions.length, 5));
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answerDetails, setAnswerDetails] = useState<{ questionId: number, isCorrect: boolean }[]>([]);

  const startQuiz = () => {
    let filtered = [...questions];
    if (difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficulty || !q.difficulty);
    }
    
    // Shuffle and slice
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    setActiveQuestions(shuffled.slice(0, numQuestions));
    setIsConfiguring(false);
    setAnswerDetails([]);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === activeQuestions[currentQuestion].correctAnswer;
    if (isCorrect) setScore(prev => prev + 1);
    
    setAnswerDetails(prev => [
      ...prev,
      { questionId: activeQuestions[currentQuestion].id, isCorrect }
    ]);
    
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < activeQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      onComplete(score, answerDetails);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setIsConfiguring(true);
  };

  if (isConfiguring) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Settings size={24} className="" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ustawienia testu</h2>
            <p className="text-slate-500 text-sm">Dostosuj poziom trudności i liczbę pytań.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4">Liczba pytań</label>
            <div className="grid grid-cols-4 gap-4">
              {[3, 5, 10, questions.length].filter((n, i, self) => n > 0 && self.indexOf(n) === i).map(n => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${numQuestions === n ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                >
                  {n === questions.length ? 'Wszystkie' : n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4">Poziom trudności</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-xl font-bold border-2 transition-all capitalize ${difficulty === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                >
                  {d === 'all' ? 'Wszystkie' : d === 'easy' ? 'Łatwy' : d === 'medium' ? 'Średni' : 'Trudny'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            Rozpocznij test
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center"
      >
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Wynik: {percentage}%</h2>
        <p className="text-slate-500 mb-8">
          Zdobyłeś {score} z {activeQuestions.length} punktów. 
          {percentage >= 80 ? ' Świetna robota!' : ' Musisz jeszcze trochę poćwiczyć.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={resetQuiz}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            <RefreshCcw size={20} />
            Spróbuj ponownie
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Następna lekcja
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  const question = activeQuestions[currentQuestion];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
          Pytanie {currentQuestion + 1} z {activeQuestions.length}
        </span>
        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500" 
            style={{ width: `${((currentQuestion + 1) / activeQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
          <MathFormula formula={question.text} />
        </h3>

        <div className="space-y-4">
          {question.options.map((option, index) => {
            let statusClass = "border-slate-200 hover:border-indigo-600 hover:bg-indigo-50";
            if (isAnswered) {
              if (index === question.correctAnswer) {
                statusClass = "border-green-500 bg-green-50 text-green-700";
              } else if (index === selectedOption) {
                statusClass = "border-red-500 bg-red-50 text-red-700";
              } else {
                statusClass = "border-slate-100 opacity-50";
              }
            } else if (selectedOption === index) {
              statusClass = "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600 ring-offset-2";
            }

            return (
              <button
                key={index}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${statusClass}`}
              >
                <span className="font-medium">
                  <MathFormula formula={option} />
                </span>
                {isAnswered && index === question.correctAnswer && <CheckCircle2 className="text-green-600" size={20} />}
                {isAnswered && index === selectedOption && index !== question.correctAnswer && <XCircle className="text-red-600" size={20} />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Info size={18} className="text-indigo-600" />
                Wyjaśnienie
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                <MathFormula formula={question.explanation} />
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-end">
          {!isAnswered ? (
            <button
              disabled={selectedOption === null}
              onClick={handleConfirm}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              Sprawdź odpowiedź
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              {currentQuestion === activeQuestions.length - 1 ? 'Zakończ test' : 'Następne pytanie'}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Settings({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function Info({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
