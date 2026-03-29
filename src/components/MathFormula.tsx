import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import React from 'react';

interface MathFormulaProps {
  formula: string;
  block?: boolean;
}

export default function MathFormula({ formula, block = false }: MathFormulaProps) {
  if (block) {
    return (
      <div className="my-6 overflow-x-auto text-center">
        <BlockMath math={formula.replace(/\$/g, '')} />
      </div>
    );
  }

  // Handle mixed text and math (e.g. "Calculate $x^2$")
  const parts = formula.split(/(\$.*?\$)/g);
  
  // If no $ delimiters are found, treat the whole string as a formula if it contains math indicators
  if (parts.length === 1 && !formula.includes('$')) {
    const hasMathIndicators = /[\^_{}\\]|[\w\d]+[\/][\w\d]+|[=+\-*:]/.test(formula);
    if (hasMathIndicators) {
      // Convert fractions like 1/2 or x/y to \frac{1}{2} or \frac{x}{y}
      // Also handle parentheses like (a+b)/c
      let processedFormula = formula
        .replace(/\(([^)]+)\)\/(\w+)/g, '\\frac{$1}{$2}')
        .replace(/(\w+)\/\(([^)]+)\)/g, '\\frac{$1}{$2}')
        .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}')
        .replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}');
      
      return <InlineMath math={processedFormula} />;
    }
  }
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          const processedMath = math
            .replace(/\(([^)]+)\)\/(\w+)/g, '\\frac{$1}{$2}')
            .replace(/(\w+)\/\(([^)]+)\)/g, '\\frac{$1}{$2}')
            .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}')
            .replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}');
          return <InlineMath key={i} math={processedMath} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
