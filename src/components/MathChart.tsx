import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import MathFormula from './MathFormula';

interface MathChartProps {
  data: any[];
  type?: 'line' | 'area';
  xKey: string;
  yKey: string;
  title?: string;
}

export default function MathChart({ data, type = 'line', xKey, yKey, title }: MathChartProps) {
  return (
    <div className="w-full h-[300px] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      {title && (
        <h3 className="text-sm font-semibold text-slate-600 mb-4 tracking-wide">
          <MathFormula formula={title} />
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey={xKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey={xKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorArea)" 
              strokeWidth={3}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
