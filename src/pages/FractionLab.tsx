import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, HelpCircle, RefreshCw, Plus, Minus, X, Divide, Info, Pizza } from 'lucide-react';
import MathFormula from '../components/MathFormula';

interface Fraction {
  n: number;
  d: number;
}

const FractionCircle = ({ 
  fraction, 
  color, 
  size = 120, 
  showCommon = false, 
  commonD = 1 
}: { 
  fraction: Fraction; 
  color: string; 
  size?: number;
  showCommon?: boolean;
  commonD?: number;
}) => {
  const radius = size / 2 - 5;
  const center = size / 2;
  
  // When showing common denominator, we use commonD for lines but keep original fraction for filling
  const displaySlices = showCommon ? commonD : fraction.d;
  const filledCount = showCommon ? (fraction.n * (commonD / fraction.d)) : fraction.n;
  const totalSlices = showCommon ? commonD : fraction.d;

  return (
    <div className="relative flex flex-col items-center">
      <motion.svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
        animate={{ rotate: -90 }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        
        {/* Slices lines */}
        <AnimatePresence>
          {Array.from({ length: displaySlices }).map((_, i) => {
            const angle = (i * 360) / displaySlices;
            const x2 = center + radius * Math.cos((angle * Math.PI) / 180);
            const y2 = center + radius * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.line
                key={`line-${displaySlices}-${i}`}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            );
          })}
        </AnimatePresence>

        {/* Filled slices */}
        <AnimatePresence>
          {Array.from({ length: filledCount }).map((_, i) => {
            const startAngle = (i * 360) / totalSlices;
            const endAngle = ((i + 1) * 360) / totalSlices;
            const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
            const largeArcFlag = 0;

            return (
              <motion.path
                key={`slice-${totalSlices}-${i}`}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 0.6, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: i * 0.05 
                }}
                d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </AnimatePresence>
      </motion.svg>
      <motion.div 
        layout
        className="mt-4 font-bold text-slate-700"
      >
        <MathFormula formula={`\\frac{${fraction.n}}{${fraction.d}}`} />
        {showCommon && fraction.d !== commonD && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-indigo-500 mt-1"
          >
            = <MathFormula formula={`\\frac{${filledCount}}{${commonD}}`} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default function FractionLab() {
  const [f1, setF1] = useState<Fraction>({ n: 1, d: 2 });
  const [f2, setF2] = useState<Fraction>({ n: 1, d: 4 });
  const [op, setOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCommon, setShowCommon] = useState(false);
  const [explanationType, setExplanationType] = useState<'pizza' | 'box' | 'line'>('pizza');

  const explanationRef = React.useRef<HTMLDivElement>(null);

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

  const commonDenominator = useMemo(() => lcm(f1.d, f2.d), [f1.d, f2.d]);

  const result = useMemo(() => {
    let n = 0;
    let d = 1;
    if (op === '+') {
      d = lcm(f1.d, f2.d);
      n = (f1.n * (d / f1.d)) + (f2.n * (d / f2.d));
    } else if (op === '-') {
      d = lcm(f1.d, f2.d);
      n = (f1.n * (d / f1.d)) - (f2.n * (d / f2.d));
    } else if (op === '*') {
      n = f1.n * f2.n;
      d = f1.d * f2.d;
    } else if (op === '/') {
      n = f1.n * f2.d;
      d = f1.d * f2.n;
    }
    const common = Math.abs(gcd(n, d));
    return { n: n / common, d: d / common };
  }, [f1, f2, op]);

  const getExplanation = () => {
    const commonD = lcm(f1.d, f2.d);
    const m1 = commonD / f1.d;
    const m2 = commonD / f2.d;

    if (explanationType === 'line') {
      const commonD = lcm(f1.d, f2.d);
      const val1 = f1.n / f1.d;
      const val2 = f2.n / f2.d;
      const total = result.n / result.d;

      return (
        <div className="space-y-6">
          <p className="text-slate-600 italic">"Skaczemy po osi liczbowej jak żabka!"</p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="relative h-24 flex items-end pb-8">
              {/* Axis Line */}
              <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-slate-300" />
              {/* Ticks */}
              {Array.from({ length: Math.ceil(Math.max(2, total)) * commonD + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bottom-8 h-2 w-px bg-slate-300" 
                  style={{ left: `${(i / (Math.ceil(Math.max(2, total)) * commonD)) * 100}%` }}
                >
                  {i % commonD === 0 && (
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">
                      {i / commonD}
                    </span>
                  )}
                </div>
              ))}
              
              {/* Jump 1 */}
              <motion.div 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                className="absolute bottom-8 left-0 h-12 border-t-2 border-l-2 border-r-2 border-indigo-500 rounded-t-full"
                style={{ width: `${(val1 / Math.ceil(Math.max(2, total))) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600">
                  +{f1.n}/{f1.d}
                </div>
              </motion.div>

              {/* Jump 2 */}
              {op === '+' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-8 h-8 border-t-2 border-l-2 border-r-2 border-pink-500 rounded-t-full"
                  style={{ 
                    left: `${(val1 / Math.ceil(Math.max(2, total))) * 100}%`,
                    width: `${(val2 / Math.ceil(Math.max(2, total))) * 100}%` 
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-pink-600">
                    +{f2.n}/{f2.d}
                  </div>
                </motion.div>
              )}
              {op === '-' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-8 h-8 border-t-2 border-l-2 border-r-2 border-rose-500 rounded-t-full"
                  style={{ 
                    left: `${((val1 - val2) / Math.ceil(Math.max(2, total))) * 100}%`,
                    width: `${(val2 / Math.ceil(Math.max(2, total))) * 100}%` 
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-600">
                    -{f2.n}/{f2.d}
                  </div>
                </motion.div>
              )}
              {op === '*' && (
                <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
                   <p className="text-[10px] text-slate-400 italic">Mnożenie na osi to branie kawałka pierwszego skoku.</p>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              {op === '+' && 'Każdy skok to dodanie kolejnego ułamka. Idziemy w prawo!'}
              {op === '-' && 'Odejmowanie to skok w lewo. Zabieramy kawałek drogi!'}
              {op === '*' && 'Mnożenie to wyznaczanie części z już wykonanego skoku.'}
              {op === '/' && 'Dzielenie to sprawdzanie, ile razy mniejszy skok mieści się w większym.'}
            </p>
          </div>
        </div>
      );
    }

    if (explanationType === 'box') {
      if (op === '+') {
        return (
          <div className="space-y-6">
            <p className="text-slate-600 italic">"Wyobraź sobie ułamki jako prostokątne pudełka czekoladek!"</p>
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <p className="font-bold text-blue-900 mb-3">1. Narysujmy pudełka</p>
              <div className="flex justify-around items-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-blue-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: f1.d }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-blue-200 last:border-0 ${i < f1.n ? 'bg-blue-400' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-blue-700"><MathFormula formula={`\\frac{${f1.n}}{${f1.d}}`} /></span>
                </div>
                <Plus size={16} className="text-blue-400" />
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-blue-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: f2.d }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-blue-200 last:border-0 ${i < f2.n ? 'bg-blue-400' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-blue-700"><MathFormula formula={`\\frac{${f2.n}}{${f2.d}}`} /></span>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <p className="font-bold text-indigo-900 mb-3">2. Podzielmy je na tyle samo części</p>
              <p className="text-sm text-indigo-700 mb-4">
                Żeby móc je dodać, oba pudełka muszą mieć tyle samo przegródek. Wspólna liczba to {commonD}.
              </p>
              <div className="flex justify-around items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-indigo-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: commonD }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-indigo-200 last:border-0 ${i < f1.n * m1 ? 'bg-indigo-400' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-indigo-700"><MathFormula formula={`\\frac{${f1.n * m1}}{${commonD}}`} /></span>
                </div>
                <Plus size={16} className="text-indigo-400" />
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-indigo-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: commonD }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-indigo-200 last:border-0 ${i < f2.n * m2 ? 'bg-indigo-400' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-indigo-700"><MathFormula formula={`\\frac{${f2.n * m2}}{${commonD}}`} /></span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      if (op === '-') {
        return (
          <div className="space-y-6">
            <p className="text-slate-600 italic">"Odejmowanie to po prostu zabieranie kawałków z pudełka!"</p>
            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
              <p className="font-bold text-rose-900 mb-3">Sprowadź do wspólnego mianownika</p>
              <p className="text-sm text-rose-700 mb-4">
                Tak jak przy dodawaniu, musimy mieć takie same kawałki ({commonD}).
              </p>
              <div className="flex justify-around items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-rose-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: commonD }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-rose-200 last:border-0 ${i < f1.n * m1 ? 'bg-rose-400' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-rose-700"><MathFormula formula={`\\frac{${f1.n * m1}}{${commonD}}`} /></span>
                </div>
                <Minus size={16} className="text-rose-400" />
                <div className="flex flex-col items-center">
                  <div className="w-24 h-12 border-2 border-rose-300 flex overflow-hidden rounded-md bg-white">
                    {Array.from({ length: commonD }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-rose-200 last:border-0 ${i < f2.n * m2 ? 'bg-rose-200' : ''}`} />
                    ))}
                  </div>
                  <span className="text-xs mt-2 font-bold text-rose-700"><MathFormula formula={`\\frac{${f2.n * m2}}{${commonD}}`} /></span>
                </div>
              </div>
              <p className="text-xs text-rose-600 mt-4 text-center">
                Zabieramy {f2.n * m2} kawałków z {f1.n * m1}. Zostaje {(f1.n * m1) - (f2.n * m2)}.
              </p>
            </div>
          </div>
        );
      }
      if (op === '*') {
        return (
          <div className="space-y-6">
            <p className="text-slate-600 italic">"Mnożenie to nakładanie na siebie dwóch siatek!"</p>
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
              <p className="font-bold text-emerald-900 mb-3">Metoda siatki</p>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 border-2 border-emerald-300 rounded-lg overflow-hidden bg-white">
                  {/* Vertical slices for f1 */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: f1.d }).map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-emerald-200/30 last:border-0 ${i < f1.n ? 'bg-blue-400/30' : ''}`} />
                    ))}
                  </div>
                  {/* Horizontal slices for f2 */}
                  <div className="absolute inset-0 flex flex-col">
                    {Array.from({ length: f2.d }).map((_, i) => (
                      <div key={i} className={`flex-1 border-b border-emerald-200/30 last:border-0 ${i < f2.n ? 'bg-pink-400/30' : ''}`} />
                    ))}
                  </div>
                  {/* Overlap */}
                  <div className="absolute inset-0 flex flex-col">
                    {Array.from({ length: f2.d }).map((_, row) => (
                      <div key={row} className="flex-1 flex">
                        {Array.from({ length: f1.d }).map((_, col) => (
                          <div key={col} className={`flex-1 ${row < f2.n && col < f1.n ? 'bg-emerald-500' : ''}`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-emerald-700 mt-4 text-center">
                  Zamalowane pole to wynik. Mamy {f1.n * f2.n} kratek z {f1.d * f2.d} wszystkich.
                </p>
                <div className="mt-2">
                  <MathFormula formula={`\\frac{${f1.n}}{${f1.d}} \\cdot \\frac{${f2.n}}{${f2.d}} = \\frac{${f1.n * f2.n}}{${f1.d * f2.d}}`} />
                </div>
              </div>
            </div>
          </div>
        );
      }
      if (op === '/') {
        return (
          <div className="space-y-6">
            <p className="text-slate-600 italic">"Dzielenie to mnożenie przez odwrócone pudełko!"</p>
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
              <p className="font-bold text-amber-900 mb-3">Odwróć i pomnóż</p>
              <p className="text-sm text-amber-700 mb-4">
                Dzielenie przez <MathFormula formula={`\\frac{${f2.n}}{${f2.d}}`} /> to to samo co mnożenie przez <MathFormula formula={`\\frac{${f2.d}}{${f2.n}}`} />.
              </p>
              <div className="flex justify-center items-center gap-4">
                <MathFormula formula={`\\frac{${f1.n}}{${f1.d}} : \\frac{${f2.n}}{${f2.d}} = \\frac{${f1.n}}{${f1.d}} \\cdot \\frac{${f2.d}}{${f2.n}}`} />
              </div>
              <p className="text-xs text-amber-600 mt-4 text-center italic">
                Teraz użyj metody mnożenia (góra przez górę, dół przez dół).
              </p>
            </div>
          </div>
        );
      }
    }

    // Default Pizza Style
    if (op === '+') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600 italic">"Hej! Nie rozumiem... Jak mam dodać połówkę pizzy do ćwiartki? Przecież to inne kawałki!"</p>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="font-bold text-indigo-900 mb-2">Krok 1: Zróbmy takie same kawałki!</p>
            <p className="text-sm text-indigo-700">
              Musimy podzielić pizzę tak, żeby kawałki były tej samej wielkości. 
              Wspólny mianownik to {commonD}.
            </p>
            <div className="mt-2 text-center">
              <MathFormula formula={`\\frac{${f1.n}}{${f1.d}} = \\frac{${f1.n} \\cdot ${m1}}{${f1.d} \\cdot ${m1}} = \\frac{${f1.n * m1}}{${commonD}}`} />
              <span className="mx-4 text-slate-400">oraz</span>
              <MathFormula formula={`\\frac{${f2.n}}{${f2.d}} = \\frac{${f2.n} \\cdot ${m2}}{${f2.d} \\cdot ${m2}} = \\frac{${f2.n * m2}}{${commonD}}`} />
            </div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="font-bold text-emerald-900 mb-2">Krok 2: Teraz po prostu dodaj góry!</p>
            <p className="text-sm text-emerald-700">
              Skoro kawałki są już takie same, liczymy ile ich mamy razem.
            </p>
            <div className="mt-2 text-center">
              <MathFormula formula={`\\frac{${f1.n * m1}}{${commonD}} + \\frac{${f2.n * m2}}{${commonD}} = \\frac{${f1.n * m1} + ${f2.n * m2}}{${commonD}} = \\frac{${(f1.n * m1) + (f2.n * m2)}}{${commonD}}`} />
            </div>
          </div>
          {gcd((f1.n * m1) + (f2.n * m2), commonD) > 1 && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="font-bold text-amber-900 mb-2">Krok 3: Skracanie ułamka</p>
              <p className="text-sm text-amber-700">
                Możemy uprościć wynik dzieląc przez {gcd((f1.n * m1) + (f2.n * m2), commonD)}.
              </p>
              <div className="mt-2 text-center">
                <MathFormula formula={`\\frac{${(f1.n * m1) + (f2.n * m2)}}{${commonD}} = \\frac{${((f1.n * m1) + (f2.n * m2)) / gcd((f1.n * m1) + (f2.n * m2), commonD)}}{${commonD / gcd((f1.n * m1) + (f2.n * m2), commonD)}}`} />
              </div>
            </div>
          )}
        </div>
      );
    }
    if (op === '-') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600 italic">"Zabieranie kawałków pizzy? To jak jedzenie!"</p>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <p className="font-bold text-rose-900 mb-2">Krok 1: Wspólne kawałki</p>
            <p className="text-sm text-rose-700">
              Znowu potrzebujemy takich samych kawałków ({commonD}).
            </p>
            <div className="mt-2 text-center">
              <MathFormula formula={`\\frac{${f1.n * m1}}{${commonD}} - \\frac{${f2.n * m2}}{${commonD}} = \\frac{${f1.n * m1} - ${f2.n * m2}}{${commonD}} = \\frac{${(f1.n * m1) - (f2.n * m2)}}{${commonD}}`} />
            </div>
          </div>
          {gcd(Math.abs((f1.n * m1) - (f2.n * m2)), commonD) > 1 && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-900 mb-2">Krok 2: Skracanie ułamka</p>
              <p className="text-sm text-emerald-700">
                Możemy uprościć wynik dzieląc przez {gcd(Math.abs((f1.n * m1) - (f2.n * m2)), commonD)}.
              </p>
              <div className="mt-2 text-center">
                <MathFormula formula={`\\frac{${(f1.n * m1) - (f2.n * m2)}}{${commonD}} = \\frac{${((f1.n * m1) - (f2.n * m2)) / gcd(Math.abs((f1.n * m1) - (f2.n * m2)), commonD)}}{${commonD / gcd(Math.abs((f1.n * m1) - (f2.n * m2)), commonD)}}`} />
              </div>
            </div>
          )}
        </div>
      );
    }
    if (op === '*') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600 italic">"Mnożenie ułamków? To brzmi strasznie... Ale czekaj, to znaczy 'część z części'!"</p>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="font-bold text-indigo-900 mb-2">To najprostsza rzecz na świecie!</p>
            <p className="text-sm text-indigo-700">
              Mnożymy "górę przez górę" i "dół przez dół". Wyobraź sobie, że bierzesz połowę z połowy pizzy. To ćwiartka!
            </p>
            <div className="mt-2 text-center">
              <MathFormula formula={`\\frac{${f1.n}}{${f1.d}} \\cdot \\frac{${f2.n}}{${f2.d}} = \\frac{${f1.n} \\cdot ${f2.n}}{${f1.d} \\cdot ${f2.d}} = \\frac{${f1.n * f2.n}}{${f1.d * f2.d}}`} />
            </div>
          </div>
          {gcd(f1.n * f2.n, f1.d * f2.d) > 1 && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-900 mb-2">Krok 2: Skracanie ułamka</p>
              <p className="text-sm text-emerald-700">
                Możemy uprościć wynik dzieląc przez {gcd(f1.n * f2.n, f1.d * f2.d)}.
              </p>
              <div className="mt-2 text-center">
                <MathFormula formula={`\\frac{${f1.n * f2.n}}{${f1.d * f2.d}} = \\frac{${(f1.n * f2.n) / gcd(f1.n * f2.n, f1.d * f2.d)}}{${(f1.d * f2.d) / gcd(f1.n * f2.n, f1.d * f2.d)}}`} />
              </div>
            </div>
          )}
        </div>
      );
    }
    if (op === '/') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600 italic">"Dzielenie? To jak odwracanie kota ogonem!"</p>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="font-bold text-amber-900 mb-2">Zasada: Odwróć i pomnóż</p>
            <p className="text-sm text-amber-700">
              Drugi ułamek staje na głowie, a dzielenie zmienia się w mnożenie.
            </p>
            <div className="mt-2 text-center">
              <MathFormula formula={`\\frac{${f1.n}}{${f1.d}} : \\frac{${f2.n}}{${f2.d}} = \\frac{${f1.n}}{${f1.d}} \\cdot \\frac{${f2.d}}{${f2.n}} = \\frac{${f1.n * f2.d}}{${f1.d * f2.n}}`} />
            </div>
          </div>
          {gcd(result.n, result.d) > 1 && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-900 mb-2">Krok 2: Skracanie ułamka</p>
              <p className="text-sm text-emerald-700">
                Możemy podzielić górę i dół przez {gcd(result.n, result.d)}.
              </p>
              <div className="mt-2 text-center">
                <MathFormula formula={`\\frac{${result.n}}{${result.d}} = \\frac{${result.n} : ${gcd(result.n, result.d)}}{${result.d} : ${gcd(result.n, result.d)}} = \\frac{${result.n / gcd(result.n, result.d)}}{${result.d / gcd(result.n, result.d)}}`} />
              </div>
            </div>
          )}
        </div>
      );
    }
    return <p className="text-slate-500 italic">Wybierz operację, aby zobaczyć proste wyjaśnienie!</p>;
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl mb-4">
          <Pizza size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Laboratorium Ułamków</h1>
        <p className="text-slate-600 mt-2 italic">"Ułamki? Nic nie rozumiem! Pomóż mi to ogarnąć..." — Mati</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Interactive Area */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center justify-around gap-4">
            {/* Fraction 1 */}
            <div className="space-y-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ułamek 1</p>
              <div className="flex flex-col items-center gap-2">
                <input 
                  type="number" 
                  min="1" max="12"
                  value={f1.n} 
                  onChange={(e) => setF1({ ...f1, n: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-16 p-2 text-center border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
                <div className="w-12 h-1 bg-slate-200 rounded-full" />
                <input 
                  type="number" 
                  min="1" max="12"
                  value={f1.d} 
                  onChange={(e) => setF1({ ...f1, d: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-16 p-2 text-center border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
              </div>
              <FractionCircle 
                fraction={f1} 
                color="#6366f1" 
                showCommon={showCommon || (showExplanation && (op === '+' || op === '-'))}
                commonD={commonDenominator}
              />
            </div>

            {/* Operation Selector */}
            <div className="flex flex-col gap-2">
              {[
                { symbol: '+', icon: Plus, color: 'bg-indigo-600' },
                { symbol: '-', icon: Minus, color: 'bg-rose-600' },
                { symbol: '*', icon: X, color: 'bg-emerald-600' },
                { symbol: '/', icon: Divide, color: 'bg-amber-600' },
              ].map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => {
                    setOp(item.symbol as any);
                    if (item.symbol === '*' || item.symbol === '/') setShowCommon(false);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    op === item.symbol ? `${item.color} text-white scale-110 shadow-lg` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <item.icon size={20} />
                </button>
              ))}
            </div>

            {/* Fraction 2 */}
            <div className="space-y-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ułamek 2</p>
              <div className="flex flex-col items-center gap-2">
                <input 
                  type="number" 
                  min="1" max="12"
                  value={f2.n} 
                  onChange={(e) => setF2({ ...f2, n: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-16 p-2 text-center border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
                <div className="w-12 h-1 bg-slate-200 rounded-full" />
                <input 
                  type="number" 
                  min="1" max="12"
                  value={f2.d} 
                  onChange={(e) => setF2({ ...f2, d: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-16 p-2 text-center border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
              </div>
              <FractionCircle 
                fraction={f2} 
                color="#ec4899" 
                showCommon={showCommon || (showExplanation && (op === '+' || op === '-'))}
                commonD={commonDenominator}
              />
            </div>
          </div>

          {(op === '+' || op === '-') && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowCommon(!showCommon)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  showCommon ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <RefreshCw size={14} className={showCommon ? 'animate-spin-slow' : ''} />
                {showCommon ? 'Pokaż wspólne kawałki' : 'Podziel na wspólne kawałki'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-100">
            <div className="text-2xl font-bold text-slate-400">=</div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Wynik</p>
              <FractionCircle fraction={result} color="#10b981" size={140} />
            </div>
          </div>

          <button
            onClick={() => {
              setShowExplanation(!showExplanation);
              if (!showExplanation) {
                setTimeout(() => {
                  explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <HelpCircle size={20} />
            {showExplanation ? 'Ukryj wyjaśnienie' : 'Jak to się stało? Wyjaśnij mi!'}
          </button>
        </div>

        {/* Explanation Area */}
        <div className="space-y-6" ref={explanationRef}>
          <AnimatePresence mode="wait">
            {showExplanation ? (
              <motion.div
                key="explanation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Info size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Tłumaczenie dla Matiego</h2>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wybierz sposób tłumaczenia:</p>
                  {/* Explanation Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
                  {[
                    { id: 'pizza', label: 'Pizza', icon: Pizza, visible: true },
                    { id: 'box', label: 'Pudełka', icon: X, visible: op !== '*' && op !== '/' },
                    { id: 'line', label: 'Oś liczbowa', icon: ArrowRight, visible: op !== '*' && op !== '/' },
                  ].filter(tab => tab.visible).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExplanationType(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                        explanationType === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                  </div>
                </div>

                {getExplanation()}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200"
              >
                <h3 className="text-2xl font-bold mb-4">Zmień liczby i zobacz co się dzieje!</h3>
                <p className="text-indigo-100 mb-6">
                  Ułamki to po prostu części całości. Wyobraź sobie pizzę podzieloną na kawałki. 
                  Licznik (góra) mówi ile masz kawałków, a mianownik (dół) na ile części podzielono całą pizzę.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <RefreshCw size={24} />
                  </div>
                  <p className="text-sm font-medium">Kliknij przycisk poniżej, aby Mati zrozumiał jak to działa!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-indigo-600" />
              Szybkie przypomnienie:
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">1</div>
                <span>Góra to <strong>licznik</strong> (ile mamy części).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
                <span>Dół to <strong>mianownik</strong> (na ile części pocięto całość).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">3</div>
                <span>Kreska ułamkowa to tak naprawdę znak <strong>dzielenia</strong>.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
