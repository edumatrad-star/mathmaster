import React from 'react';
import UnitConverter from '../../components/tools/UnitConverter';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnitConverterPage() {
  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link to="/applications" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <ArrowLeft size={20} />
          Powrót do aplikacji
        </Link>
      </div>
      <UnitConverter />
    </div>
  );
}
