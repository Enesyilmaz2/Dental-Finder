
import React from 'react';
import { DentalClinic } from '../types';

interface ClinicCardProps {
  clinic: DentalClinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <i className="fas fa-tooth text-xl"></i>
        </div>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">
          {clinic.district}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{clinic.name}</h3>
      <p className="text-sm text-slate-500 mb-4">{clinic.city}, Turkey</p>
      
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <a 
          href={`tel:${clinic.phone}`} 
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <i className="fas fa-phone-alt"></i>
          {clinic.phone}
        </a>
      </div>
    </div>
  );
};

export default ClinicCard;
