import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Info, 
  Settings2, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  MousePointer2,
  Type,
  Ruler,
  Hash
} from 'lucide-react';

interface Point {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

interface Line {
  id: string;
  p1Id: string;
  p2Id: string;
  label: string;
  color: string;
}

const COLORS = [
  '#6366f1', // indigo
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
];

export default function AnalyticalGeometry() {
  const [points, setPoints] = useState<Point[]>([
    { id: 'p1', x: 2, y: 3, label: 'A', color: COLORS[0] },
    { id: 'p2', x: -4, y: -2, label: 'B', color: COLORS[1] },
  ]);
  const [lines, setLines] = useState<Line[]>([
    { id: 'l1', p1Id: 'p1', p2Id: 'p2', label: 'k', color: '#94a3b8' }
  ]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [lineStartPointId, setLineStartPointId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(40);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const toCanvasX = (x: number) => centerX + x * gridSize;
  const toCanvasY = (y: number) => centerY - y * gridSize;
  const fromCanvasX = (cx: number) => Math.round((cx - centerX) / gridSize);
  const fromCanvasY = (cy: number) => Math.round((centerY - cy) / gridSize);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const x = fromCanvasX(cx);
    const y = fromCanvasY(cy);

    const newPoint: Point = {
      id: `p${Date.now()}`,
      x,
      y,
      label: String.fromCharCode(65 + points.length % 26),
      color: COLORS[points.length % COLORS.length]
    };

    setPoints([...points, newPoint]);
  };

  const createLine = (p1Id: string, p2Id: string) => {
    if (p1Id === p2Id) return;
    const existing = lines.find(l => (l.p1Id === p1Id && l.p2Id === p2Id) || (l.p1Id === p2Id && l.p2Id === p1Id));
    if (existing) return;

    const p1 = points.find(p => p.id === p1Id);
    const p2 = points.find(p => p.id === p2Id);
    if (!p1 || !p2) return;

    const newLine: Line = {
      id: `l${Date.now()}`,
      p1Id,
      p2Id,
      label: `${p1.label}${p2.label}`.toLowerCase(),
      color: '#64748b'
    };
    setLines([...lines, newLine]);
    setLineStartPointId(null);
  };

  const updatePointPosition = (id: string, x: number, y: number) => {
    setPoints(points.map(p => p.id === id ? { ...p, x, y } : p));
  };

  const deletePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
    setLines(lines.filter(l => l.p1Id !== id && l.p2Id !== id));
    if (selectedPointId === id) setSelectedPointId(null);
    if (lineStartPointId === id) setLineStartPointId(null);
  };

  const deleteLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const calculateDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)).toFixed(2);
  };

  const calculateMidpoint = (p1: Point, p2: Point) => {
    return {
      x: ((p1.x + p2.x) / 2).toFixed(1),
      y: ((p1.y + p2.y) / 2).toFixed(1)
    };
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Maximize2 size={20} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Geometria Analityczna</h1>
        </div>
        <p className="text-slate-500">Interaktywny układ współrzędnych. Dodawaj punkty, twórz linie i badaj ich właściwości.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 size={16} />
              Ustawienia Widoku
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Hash size={16} className="text-slate-400" /> Siatka
                </span>
                <input 
                  type="checkbox" 
                  checked={showGrid} 
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Type size={16} className="text-slate-400" /> Etykiety
                </span>
                <input 
                  type="checkbox" 
                  checked={showLabels} 
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MousePointer2 size={16} className="text-slate-400" /> Współrzędne
                </span>
                <input 
                  type="checkbox" 
                  checked={showCoordinates} 
                  onChange={(e) => setShowCoordinates(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Skala siatki</span>
                <input 
                  type="range" 
                  min="20" 
                  max="80" 
                  value={gridSize} 
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Ruler size={16} />
              Punkty i Obliczenia
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {points.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  Kliknij na układzie, aby dodać punkt
                </div>
              )}
              {points.map((p) => (
                <div 
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedPointId === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}
                  onClick={() => setSelectedPointId(p.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.color }} />
                      <input 
                        type="text" 
                        value={p.label} 
                        onChange={(e) => setPoints(points.map(pt => pt.id === p.id ? { ...pt, label: e.target.value } : pt))}
                        className="w-12 bg-transparent border-b border-slate-200 focus:border-indigo-600 outline-none font-bold text-slate-900 px-1"
                      />
                      <span className="text-xs text-slate-400">({p.x}, {p.y})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (lineStartPointId === p.id) setLineStartPointId(null);
                          else if (lineStartPointId) createLine(lineStartPointId, p.id);
                          else setLineStartPointId(p.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${lineStartPointId === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'}`}
                        title="Połącz linią"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePoint(p.id); }}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Show distance to other points if selected */}
                  {selectedPointId === p.id && points.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Odległości:</div>
                      {points.filter(other => other.id !== p.id).map(other => (
                        <div key={other.id} className="text-xs text-indigo-700 flex justify-between">
                          <span>|{p.label}{other.label}|</span>
                          <span className="font-mono">{calculateDistance(p, other)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Linie i Odcinki</h3>
                <div className="space-y-2">
                  {lines.map(line => {
                    const p1 = points.find(p => p.id === line.p1Id);
                    const p2 = points.find(p => p.id === line.p2Id);
                    if (!p1 || !p2) return null;
                    return (
                      <div key={line.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold uppercase tracking-tighter">{p1.label}{p2.label}</span>
                          <input 
                            type="text" 
                            value={line.label} 
                            onChange={(e) => setLines(lines.map(l => l.id === line.id ? { ...l, label: e.target.value } : l))}
                            className="w-16 bg-transparent border-b border-slate-200 focus:border-indigo-600 outline-none font-medium text-slate-600 px-1"
                          />
                        </div>
                        <button onClick={() => deleteLine(line.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Interactive Canvas */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative cursor-crosshair group">
          <div 
            ref={containerRef}
            className="w-full h-full min-h-[600px] relative bg-slate-50"
            onClick={handleCanvasClick}
          >
            {/* Grid Lines */}
            {showGrid && dimensions.width > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse" x={centerX % gridSize} y={centerY % gridSize}>
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Axes */}
                <line x1="0" y1={centerY} x2={dimensions.width} y2={centerY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={centerX} y1="0" x2={centerX} y2={dimensions.height} stroke="#94a3b8" strokeWidth="2" />
                
                {/* Axis Arrows */}
                <path d={`M ${dimensions.width - 10} ${centerY - 5} L ${dimensions.width} ${centerY} L ${dimensions.width - 10} ${centerY + 5}`} fill="none" stroke="#94a3b8" strokeWidth="2" />
                <path d={`M ${centerX - 5} 10 L ${centerX} 0 L ${centerX + 5} 10`} fill="none" stroke="#94a3b8" strokeWidth="2" />
                
                <text x={dimensions.width - 20} y={centerY + 20} className="text-xs font-bold fill-slate-400">X</text>
                <text x={centerX - 20} y={20} className="text-xs font-bold fill-slate-400">Y</text>
              </svg>
            )}

            {/* Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {lines.map(line => {
                const p1 = points.find(p => p.id === line.p1Id);
                const p2 = points.find(p => p.id === line.p2Id);
                if (!p1 || !p2) return null;
                
                return (
                  <g key={line.id}>
                    <line 
                      x1={toCanvasX(p1.x)} 
                      y1={toCanvasY(p1.y)} 
                      x2={toCanvasX(p2.x)} 
                      y2={toCanvasY(p2.y)} 
                      stroke={line.color} 
                      strokeWidth="2" 
                      strokeDasharray="4"
                    />
                    {showLabels && (
                      <text 
                        x={(toCanvasX(p1.x) + toCanvasX(p2.x)) / 2 + 10} 
                        y={(toCanvasY(p1.y) + toCanvasY(p2.y)) / 2 - 10}
                        className="text-xs font-bold fill-slate-400 italic"
                      >
                        {line.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Points */}
            <AnimatePresence>
              {points.map((p) => (
                <motion.div
                  key={p.id}
                  layoutId={p.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    left: toCanvasX(p.x) - 8,
                    top: toCanvasY(p.y) - 8
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute w-4 h-4 rounded-full cursor-grab active:cursor-grabbing z-10 shadow-lg border-2 border-white transition-transform hover:scale-125 ${selectedPointId === p.id ? 'ring-4 ring-indigo-200' : ''}`}
                  style={{ backgroundColor: p.color }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPointId(p.id); }}
                  drag
                  dragMomentum={false}
                  onDrag={(e, info) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const cx = info.point.x - rect.left;
                    const cy = info.point.y - rect.top;
                    updatePointPosition(p.id, fromCanvasX(cx), fromCanvasY(cy));
                  }}
                >
                  {showLabels && (
                    <div className="absolute -top-6 -left-2 font-black text-slate-900 drop-shadow-sm select-none">
                      {p.label}
                    </div>
                  )}
                  {showCoordinates && (
                    <div className="absolute -bottom-6 -left-4 text-[10px] font-bold text-slate-400 whitespace-nowrap select-none">
                      ({p.x}, {p.y})
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Hint Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg max-w-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1">
                  <Info size={14} />
                  <span>Wskazówka</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Kliknij w dowolnym miejscu, aby dodać punkt. Przeciągaj punkty, aby zmieniać ich położenie. Wybierz punkt, aby zobaczyć odległości.
                </p>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setPoints([]); setLines([]); }}
                className="pointer-events-auto p-4 bg-white rounded-2xl border border-slate-200 shadow-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95"
                title="Wyczyść wszystko"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
