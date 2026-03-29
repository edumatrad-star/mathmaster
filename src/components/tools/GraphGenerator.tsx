import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LineChart as ChartIcon, Settings, RefreshCw, Info } from 'lucide-react';

export default function GraphGenerator() {
  const [equation, setEquation] = useState('2 * x + 1');
  const [range, setRange] = useState({ min: -10, max: 10 });
  const [step, setStep] = useState(0.5);

  const data = useMemo(() => {
    const points = [];
    for (let x = range.min; x <= range.max; x += step) {
      try {
        // Simple evaluation logic
        // Replace x with the value and evaluate
        const evalStr = equation.replace(/x/g, `(${x})`);
        // We can use a simple eval for this educational tool, but in production we'd use mathjs
        // For safety and robustness, let's use a basic parser or mathjs if available
        // Since I installed mathjs, let's use it!
        const y = Number(window.math?.evaluate(equation, { x }) || 0);
        
        if (!isNaN(y) && isFinite(y)) {
          points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
        }
      } catch (err) {
        // Skip invalid points
      }
    }
    return points;
  }, [equation, range, step]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Settings size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Ustawienia</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Funkcja f(x) =</label>
                <input 
                  type="text"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg font-mono font-bold text-indigo-600"
                  placeholder="2 * x + 1"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {['x^2', '2 * x + 1', 'sin(x)', 'abs(x)', '1/x'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setEquation(f)}
                      className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors uppercase tracking-wider"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Zakres od</label>
                  <input 
                    type="number"
                    value={range.min}
                    onChange={(e) => setRange({ ...range, min: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Zakres do</label>
                  <input 
                    type="number"
                    value={range.max}
                    onChange={(e) => setRange({ ...range, max: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Gęstość punktów (krok)</label>
                <input 
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>DOKŁADNY</span>
                  <span>SZYBKI</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
            <div className="flex items-center gap-3 mb-4">
              <Info size={20} />
              <h4 className="font-bold">Wskazówka</h4>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Używaj gwiazdki (*) do mnożenia i daszka (^) do potęgowania. 
              Przykład: <code className="bg-indigo-700 px-1.5 py-0.5 rounded">x^2 + 2*x + 1</code>
            </p>
          </div>
        </div>

        {/* Graph */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ChartIcon size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Wykres Funkcji</h3>
              </div>
              <button 
                onClick={() => { setEquation('2*x+1'); setRange({min: -10, max: 10}); }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                title="Resetuj"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={[range.min, range.max]} 
                    stroke="#94a3b8"
                    fontSize={12}
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    fontWeight="bold"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px 16px',
                      fontWeight: 'bold'
                    }}
                    labelFormatter={(val) => `x = ${val}`}
                  />
                  <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add mathjs to window for the component to use
declare global {
  interface Window {
    math: any;
  }
}
import * as math from 'mathjs';
window.math = math;
