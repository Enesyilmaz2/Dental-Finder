
import React from 'react';
import { DentalClinic } from '../types';

interface ClinicListProps {
  clinics: DentalClinic[];
}

const ClinicList: React.FC<ClinicListProps> = ({ clinics }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Klinik Adı</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Telefon</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Şehir</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">İlçe</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clinics.map((clinic) => (
            <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                    <i className="fas fa-hospital-user text-sm"></i>
                  </div>
                  <span className="font-medium text-slate-800">{clinic.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <a href={`tel:${clinic.phone}`} className="text-blue-600 hover:underline font-mono">
                  {clinic.phone}
                </a>
              </td>
              <td className="px-6 py-4 text-slate-600">{clinic.city}</td>
              <td className="px-6 py-4">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                  {clinic.district}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClinicList;
