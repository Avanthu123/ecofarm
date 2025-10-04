import React from 'react';
import { Cloud, Thermometer, Droplets, Sun } from 'lucide-react';

export default function ClimateDataDisplay({ climateData, week }) {
  if (!climateData) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-900">Week {week} Climate Data</h3>
      <div className="grid grid-cols-4 gap-4 justify-center text-center">
        <div className="bg-white rounded-lg p-3 flex flex-col items-center border border-gray-200">
          <Cloud className="w-3 h-3 text-blue-500 mb-1" />
          <div className="text-sm font-extrabold text-gray-900">{climateData.rainfall.toFixed(1)} mm</div>
          <div className="text-xs text-gray-600">Rainfall</div>
        </div>
        <div className="bg-white rounded-lg p-3 flex flex-col items-center border border-gray-200">
          <Thermometer className="w-3 h-3 text-red-500 mb-1" />
          <div className="text-sm font-extrabold text-gray-900">{climateData.temperature.toFixed(1)}°C</div>
          <div className="text-xs text-gray-600">Temperature</div>
        </div>
        <div className="bg-white rounded-lg p-3 flex flex-col items-center border border-gray-200">
          <Droplets className="w-3 h-3 text-blue-500 mb-1" />
          <div className="text-sm font-extrabold text-gray-900">{climateData.soilMoisture.toFixed(0)}%</div>
          <div className="text-xs text-gray-600">Soil Moisture</div>
        </div>
        <div className="bg-white rounded-lg p-3 flex flex-col items-center border border-gray-200">
          <Sun className="w-3 h-3 text-yellow-400 mb-1" />
          <div className="text-sm font-extrabold text-gray-900">{climateData.irradiance.toFixed(1)} MJ/m²</div>
          <div className="text-xs text-gray-600">Irradiance</div>
        </div>
      </div>
    </div>
  );
}
