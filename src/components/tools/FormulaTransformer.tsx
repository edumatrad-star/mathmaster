import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowRight, Info, Calculator, BookOpen, Search } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Formula {
  id: string;
  name: string;
  latex: string;
  variables: string[];
  transformations: Record<string, { result: string; steps: string[] }>;
}

const FORMULAS: Formula[] = [
  {
    id: 'speed',
    name: 'Prędkość',
    latex: 'v = \\frac{s}{t}',
    variables: ['v', 's', 't'],
    transformations: {
      s: {
        result: 's = v \\cdot t',
        steps: ['Pomnóż obie strony przez $t$', '$v \\cdot t = s$', 'Zamień strony: $s = v \\cdot t$']
      },
      t: {
        result: 't = \\frac{s}{v}',
        steps: ['Pomnóż obie strony przez $t$', '$v \\cdot t = s$', 'Podziel obie strony przez $v$', '$t = \\frac{s}{v}$']
      },
      v: {
        result: 'v = \\frac{s}{t}',
        steps: ['Wzór jest już wyznaczony dla $v$']
      }
    }
  },
  {
    id: 'triangle-area',
    name: 'Pole trójkąta',
    latex: 'P = \\frac{1}{2} a h',
    variables: ['P', 'a', 'h'],
    transformations: {
      a: {
        result: 'a = \\frac{2P}{h}',
        steps: ['Pomnóż obie strony przez $2$', '$2P = a \\cdot h$', 'Podziel obie strony przez $h$', '$a = \\frac{2P}{h}$']
      },
      h: {
        result: 'h = \\frac{2P}{a}',
        steps: ['Pomnóż obie strony przez $2$', '$2P = a \\cdot h$', 'Podziel obie strony przez $a$', '$h = \\frac{2P}{a}$']
      },
      P: {
        result: 'P = \\frac{1}{2} a h',
        steps: ['Wzór jest już wyznaczony dla $P$']
      }
    }
  },
  {
    id: 'trapezoid-area',
    name: 'Pole trapezu',
    latex: 'P = \\frac{(a + b)h}{2}',
    variables: ['P', 'a', 'b', 'h'],
    transformations: {
      h: {
        result: 'h = \\frac{2P}{a + b}',
        steps: ['Pomnóż obie strony przez $2$', '$2P = (a + b)h$', 'Podziel obie strony przez $(a + b)$', '$h = \\frac{2P}{a + b}$']
      },
      a: {
        result: 'a = \\frac{2P}{h} - b',
        steps: ['Pomnóż obie strony przez $2$', '$2P = (a + b)h$', 'Podziel obie strony przez $h$', '$\\frac{2P}{h} = a + b$', 'Odejmij $b$ od obu stron', '$a = \\frac{2P}{h} - b$']
      },
      b: {
        result: 'b = \\frac{2P}{h} - a',
        steps: ['Pomnóż obie strony przez $2$', '$2P = (a + b)h$', 'Podziel obie strony przez $h$', '$\\frac{2P}{h} = a + b$', 'Odejmij $a$ od obu stron', '$b = \\frac{2P}{h} - a$']
      }
    }
  },
  {
    id: 'density',
    name: 'Gęstość',
    latex: 'd = \\frac{m}{V}',
    variables: ['d', 'm', 'V'],
    transformations: {
      m: {
        result: 'm = d \\cdot V',
        steps: ['Pomnóż obie strony przez $V$', '$d \\cdot V = m$', 'Zamień strony: $m = d \\cdot V$']
      },
      V: {
        result: 'V = \\frac{m}{d}',
        steps: ['Pomnóż obie strony przez $V$', '$d \\cdot V = m$', 'Podziel obie strony przez $d$', '$V = \\frac{m}{d}$']
      }
    }
  },
  {
    id: 'ohm',
    name: 'Prawo Ohma',
    latex: 'R = \\frac{U}{I}',
    variables: ['R', 'U', 'I'],
    transformations: {
      U: {
        result: 'U = R \\cdot I',
        steps: ['Pomnóż obie strony przez $I$', '$R \\cdot I = U$', 'Zamień strony: $U = R \\cdot I$']
      },
      I: {
        result: 'I = \\frac{U}{R}',
        steps: ['Pomnóż obie strony przez $I$', '$R \\cdot I = U$', 'Podziel obie strony przez $R$', '$I = \\frac{U}{R}$']
      }
    }
  },
  {
    id: 'acceleration',
    name: 'Przyspieszenie',
    latex: 'a = \\frac{v_k - v_p}{t}',
    variables: ['a', 'v_k', 'v_p', 't'],
    transformations: {
      t: {
        result: 't = \\frac{v_k - v_p}{a}',
        steps: ['Pomnóż obie strony przez $t$', '$a \\cdot t = v_k - v_p$', 'Podziel obie strony przez $a$', '$t = \\frac{v_k - v_p}{a}$']
      },
      v_k: {
        result: 'v_k = a \\cdot t + v_p',
        steps: ['Pomnóż obie strony przez $t$', '$a \\cdot t = v_k - v_p$', 'Dodaj $v_p$ do obu stron', '$a \\cdot t + v_p = v_k$', 'Zamień strony: $v_k = a \\cdot t + v_p$']
      },
      v_p: {
        result: 'v_p = v_k - a \\cdot t',
        steps: ['Pomnóż obie strony przez $t$', '$a \\cdot t = v_k - v_p$', 'Dodaj $v_p$ do obu stron', '$a \\cdot t + v_p = v_k$', 'Odejmij $a \\cdot t$ od obu stron', '$v_p = v_k - a \\cdot t$']
      }
    }
  },
  {
    id: 'kinetic-energy',
    name: 'Energia kinetyczna',
    latex: 'E_k = \\frac{m v^2}{2}',
    variables: ['E_k', 'm', 'v'],
    transformations: {
      m: {
        result: 'm = \\frac{2E_k}{v^2}',
        steps: ['Pomnóż obie strony przez $2$', '$2E_k = m v^2$', 'Podziel obie strony przez $v^2$', '$m = \\frac{2E_k}{v^2}$']
      },
      v: {
        result: 'v = \\sqrt{\\frac{2E_k}{m}}',
        steps: ['Pomnóż obie strony przez $2$', '$2E_k = m v^2$', 'Podziel obie strony przez $m$', '$\\frac{2E_k}{m} = v^2$', 'Wyciągnij pierwiastek kwadratowy', '$v = \\sqrt{\\frac{2E_k}{m}}$']
      }
    }
  },
  {
    id: 'ideal-gas',
    name: 'Równanie Clapeyrona',
    latex: 'pV = nRT',
    variables: ['p', 'V', 'n', 'R', 'T'],
    transformations: {
      p: {
        result: 'p = \\frac{nRT}{V}',
        steps: ['Podziel obie strony przez $V$', '$p = \\frac{nRT}{V}$']
      },
      V: {
        result: 'V = \\frac{nRT}{p}',
        steps: ['Podziel obie strony przez $p$', '$V = \\frac{nRT}{p}$']
      },
      n: {
        result: 'n = \\frac{pV}{RT}',
        steps: ['Podziel obie strony przez $RT$', '$n = \\frac{pV}{RT}$']
      },
      T: {
        result: 'T = \\frac{pV}{nR}',
        steps: ['Podziel obie strony przez $nR$', '$T = \\frac{pV}{nR}$']
      }
    }
  },
  {
    id: 'gravitation',
    name: 'Prawo powszechnego ciążenia',
    latex: 'F = G \\frac{m_1 m_2}{r^2}',
    variables: ['F', 'G', 'm_1', 'm_2', 'r'],
    transformations: {
      m_1: {
        result: 'm_1 = \\frac{F r^2}{G m_2}',
        steps: ['Pomnóż obie strony przez $r^2$', '$F r^2 = G m_1 m_2$', 'Podziel obie strony przez $G m_2$', '$m_1 = \\frac{F r^2}{G m_2}$']
      },
      r: {
        result: 'r = \\sqrt{\\frac{G m_1 m_2}{F}}',
        steps: ['Pomnóż obie strony przez $r^2$', '$F r^2 = G m_1 m_2$', 'Podziel obie strony przez $F$', '$r^2 = \\frac{G m_1 m_2}{F}$', 'Wyciągnij pierwiastek kwadratowy', '$r = \\sqrt{\\frac{G m_1 m_2}{F}}$']
      }
    }
  },
  {
    id: 'complex-linear',
    name: 'Złożone równanie liniowe',
    latex: 'a = \\frac{b + c}{d - c}',
    variables: ['a', 'b', 'c', 'd'],
    transformations: {
      c: {
        result: 'c = \\frac{ad - b}{a + 1}',
        steps: [
          'Pomnóż obie strony przez $(d - c)$',
          '$a(d - c) = b + c$',
          'Rozwiń nawias: $ad - ac = b + c$',
          'Przenieś wyrazy z $c$ na jedną stronę: $ad - b = ac + c$',
          'Wyłącz $c$ przed nawias: $ad - b = c(a + 1)$',
          'Podziel obie strony przez $(a + 1)$',
          '$c = \\frac{ad - b}{a + 1}$'
        ]
      },
      b: {
        result: 'b = a(d - c) - c',
        steps: ['Pomnóż obie strony przez $(d - c)$', '$a(d - c) = b + c$', 'Odejmij $c$ od obu stron', '$b = a(d - c) - c$']
      },
      d: {
        result: 'd = \\frac{b + c}{a} + c',
        steps: ['Pomnóż obie strony przez $(d - c)$', '$a(d - c) = b + c$', 'Podziel obie strony przez $a$', '$d - c = \\frac{b + c}{a}$', 'Dodaj $c$ do obu stron', '$d = \\frac{b + c}{a} + c$']
      }
    }
  },
  {
    id: 'homographic',
    name: 'Funkcja wymierna (homograficzna)',
    latex: 'y = \\frac{ax + b}{cx + d}',
    variables: ['y', 'a', 'b', 'c', 'd', 'x'],
    transformations: {
      x: {
        result: 'x = \\frac{b - yd}{yc - a}',
        steps: [
          'Pomnóż obie strony przez $(cx + d)$',
          '$y(cx + d) = ax + b$',
          'Rozwiń nawias: $ycx + yd = ax + b$',
          'Przenieś wyrazy z $x$ na jedną stronę: $ycx - ax = b - yd$',
          'Wyłącz $x$ przed nawias: $x(yc - a) = b - yd$',
          'Podziel obie strony przez $(yc - a)$',
          '$x = \\frac{b - yd}{yc - a}$'
        ]
      },
      a: {
        result: 'a = \\frac{y(cx + d) - b}{x}',
        steps: ['Pomnóż obie strony przez $(cx + d)$', '$y(cx + d) = ax + b$', 'Odejmij $b$ od obu stron', '$y(cx + d) - b = ax$', 'Podziel obie strony przez $x$', '$a = \\frac{y(cx + d) - b}{x}$']
      }
    }
  },
  {
    id: 'complex-fraction',
    name: 'Wzór z nawiasami i ułamkiem',
    latex: 'x = \\frac{a(b - c)}{d + c}',
    variables: ['x', 'a', 'b', 'c', 'd'],
    transformations: {
      c: {
        result: 'c = \\frac{ab - xd}{x + a}',
        steps: [
          'Pomnóż obie strony przez $(d + c)$',
          '$x(d + c) = a(b - c)$',
          'Rozwiń nawiasy: $xd + xc = ab - ac$',
          'Przenieś wyrazy z $c$ na jedną stronę: $xc + ac = ab - xd$',
          'Wyłącz $c$ przed nawias: $c(x + a) = ab - xd$',
          'Podziel obie strony przez $(x + a)$',
          '$c = \\frac{ab - xd}{x + a}$'
        ]
      }
    }
  }
];

export default function FormulaTransformer() {
  const [selectedFormulaId, setSelectedFormulaId] = useState(FORMULAS[0].id);
  const [targetVar, setTargetVar] = useState(FORMULAS[0].variables[1]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedFormula = useMemo(() => 
    FORMULAS.find(f => f.id === selectedFormulaId) || FORMULAS[0]
  , [selectedFormulaId]);

  const filteredFormulas = useMemo(() => 
    FORMULAS.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.latex.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [searchQuery]);

  const transformation = selectedFormula.transformations[targetVar];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[600px]">
        {/* Sidebar - Formula List */}
        <div className="lg:w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Szukaj wzoru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredFormulas.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFormulaId(f.id);
                  setTargetVar(f.variables[0] === 'P' || f.variables[0] === 'v' || f.variables[0] === 'd' || f.variables[0] === 'R' || f.variables[0] === 'a' ? f.variables[1] : f.variables[0]);
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all group ${
                  selectedFormulaId === f.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'hover:bg-white text-slate-600'
                }`}
              >
                <div className="font-bold text-sm mb-1">{f.name}</div>
                <div className={`text-xs font-mono ${selectedFormulaId === f.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                  <InlineMath math={f.latex} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-8 md:p-12 border-b border-slate-100 bg-indigo-50/30">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Calculator size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedFormula.name}</h2>
                <p className="text-slate-500 font-medium">Wybierz zmienną, którą chcesz wyznaczyć</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 text-center">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Wzór podstawowy</p>
              <div className="text-4xl">
                <BlockMath math={selectedFormula.latex} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700">Wyznacz zmienną:</p>
              <div className="flex flex-wrap gap-3">
                {selectedFormula.variables.map(v => (
                  <button
                    key={v}
                    onClick={() => setTargetVar(v)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      targetVar === v 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 flex-1">
            <AnimatePresence mode="wait">
              {transformation ? (
                <motion.div
                  key={`${selectedFormulaId}-${targetVar}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <div className="bg-indigo-600 p-10 rounded-[3rem] text-white text-center shadow-xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Calculator size={120} />
                    </div>
                    <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-4">Przekształcony wzór</p>
                    <div className="text-5xl font-black">
                      <BlockMath math={transformation.result} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <RefreshCw size={20} />
                      </div>
                      Kroki przekształcenia
                    </h3>
                    <div className="space-y-6">
                      {transformation.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-6 group">
                          <div className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 font-black group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all group-hover:scale-110">
                            {index + 1}
                          </div>
                          <div className="pt-2">
                            <p className="text-slate-700 font-bold text-lg leading-relaxed">
                              {step.split(/(\$.*?\$)/g).map((part, i) => {
                                if (part.startsWith('$') && part.endsWith('$')) {
                                  return <InlineMath key={i} math={part.slice(1, -1)} />;
                                }
                                return <span key={i}>{part}</span>;
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Wybierz zmienną</h3>
                  <p className="text-slate-500 max-w-xs">Kliknij w jedną z dostępnych zmiennych powyżej, aby zobaczyć kroki przekształcenia.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
