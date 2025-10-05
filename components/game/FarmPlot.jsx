import React from 'react';
import { motion } from 'framer-motion';

const GROWTH_STAGES = {
  seedling: {
    color: '#86efac',
    height: 20,
    label: 'Seedling Stage',
    description: 'Young rice plants establishing roots'
  },
  vegetative: {
    color: '#4ade80',
    height: 40,
    label: 'Vegetative Stage',
    description: 'Rapid leaf and stem growth'
  },
  reproductive: {
    color: '#22c55e',
    height: 60,
    label: 'Reproductive Stage',
    description: 'Flowering and grain formation'
  },
  maturity: {
    color: '#fbbf24',
    height: 60,
    label: 'Maturity Stage',
    description: 'Golden grains ready for harvest'
  }
};

export default function FarmPlot({ growthStage, soilMoisture, healthScore, climateData, climateHistory = [], currentWeek = 1, climateSourceInfo = null, isNight = false }) {
  const stage = GROWTH_STAGES[growthStage] || GROWTH_STAGES.seedling;

  const formatDateRange = (start, end) => {
    try {
      if (!start || !end) return '';
      const s = `${start.substring(0,4)}-${start.substring(4,6)}-${start.substring(6,8)}`;
      const e = `${end.substring(0,4)}-${end.substring(4,6)}-${end.substring(6,8)}`;
      const sd = new Date(s);
      const ed = new Date(e);
      const options = { month: 'short' };
      if (sd.getFullYear() === ed.getFullYear()) {
        return `${sd.toLocaleString('en-US', options)} to ${ed.toLocaleString('en-US', options)} ${sd.getFullYear()}`;
      }
      return `${sd.toLocaleString('en-US', options)} ${sd.getFullYear()} to ${ed.toLocaleString('en-US', options)} ${ed.getFullYear()}`;
    } catch (e) {
      return '';
    }
  };

  // Friendly label for the climate data source
  const dataSourceLabel = (() => {
    if (!climateSourceInfo) return 'Data source: unknown';
    const { source, start, end } = climateSourceInfo;
    if (source === 'fallback') return 'Data from: Fallback simulated data';
    if (source === 'mixed') return `Data from: MIXED (API + simulated) - ${formatDateRange(start, end)}`;
    if (source === 'NASA Power API') return `Data from: NASA Power API - ${formatDateRange(start, end)}`;
    if (source && source.startsWith('local')) {
      // For local files show compact month-year range when available
      if (start && end) return `Data from: ${formatDateRange(start, end)}`;
      const m = source.match(/local-(\d{4})/);
      if (m) return `Data from: ${m[1]}`;
      return 'Data source: local';
    }
    return 'Data source: unknown';
  })();
  
  const getSoilColor = () => {
    if (soilMoisture > 80) return '#92400e'; // Too wet, dark brown
    if (soilMoisture > 60) return '#a16207'; // Good moisture
    if (soilMoisture > 40) return '#ca8a04'; // Moderate
    return '#d97706'; // Dry
  };

  const plants = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Container with field or rainfield background */}
      <div
        className="relative rounded-3xl shadow-2xl bg-no-repeat bg-center bg-cover flex flex-col justify-end"
        style={{
          // If resting (isNight) show nightfield, else use rainfield for rainfall > 40mm or normal field.
          backgroundImage: isNight ? `url('/images/nightfield.png')` : (climateData && climateData.rainfall > 40 ? `url('/images/rainfield.png')` : `url('/images/field.png')`),
          minHeight: '450px',
          paddingTop: '32px',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingBottom: '32px',
        }}
      >
        {/* Sky */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-no-repeat bg-center bg-cover rounded-t-3xl" style={{ backgroundImage: "url('/images/bg.png')" }} />
        
        {/* Crop background covering bottom half */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-no-repeat bg-center bg-cover rounded-b-3xl"
          style={{
            backgroundImage: `url('/images/cropbg.jpg')`,
            height: '50%',
            minHeight: '150px',
          }}
        />
        
        {/* Content over backgrounds */}
        <div className="relative z-10 p-8" style={{ minHeight: '300px' }}>
        {/* Soil Moisture Indicator */}
        {soilMoisture > 70 && (
          <div className="absolute inset-0 bg-blue-400/20 rounded-b-3xl pointer-events-none" />
        )}

        {/* Small data source line above stage/health */}
        <div
          className="absolute top-2 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1 shadow-sm text-xs flex items-center justify-between cursor-pointer"
          onClick={() => {
            try {
              console.log('Climate history:', climateHistory);
              console.log('Climate source info:', climateSourceInfo);
            } catch (e) {}
          }}
        >
          <div className="text-xs text-gray-600">{dataSourceLabel}</div>
          <div className="text-xs text-gray-600">Week {currentWeek}</div>
        </div>

        {/* Stage Label and Health Indicator in same line, smaller and on top */}
        <div className="absolute top-20 left-4 right-4 flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1 shadow-lg text-sm">
          <div>
            <div className="font-semibold text-gray-900">{stage.label}</div>
            <div className="text-xs text-gray-600">{stage.description}</div>
          </div>
          <div className="min-w-[140px]">
            <div className="text-xs text-gray-600 mb-1">Crop Health</div>
            <div className="flex items-center gap-2">
              <div className="status-bar-track" style={{ width: '100px', height: '10px', margin: '0' }}>
                <motion.div
                  className={`status-bar ${healthScore > 70 ? 'heart-color' : healthScore > 40 ? 'lightning-color' : 'heart-color'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold">{Math.round(healthScore)}%</span>
            </div>
          </div>
        </div>

        {/* Rice Plants */}
        <div className="grid grid-cols-8 gap-4 mt-32">
          {plants.map((i) => (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: stage.height, 
                opacity: healthScore > 30 ? 1 : 0.5 
              }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              className="relative"
            >
              {/* Plant Stem */}
              <div 
                className="w-2 mx-auto rounded-t-full"
                style={{ 
                  height: `${stage.height}px`,
                  background: `linear-gradient(to top, ${stage.color}, #15803d)`
                }}
              />
              
              {/* Grain (maturity stage) */}
              {growthStage === 'maturity' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-400 rounded-full"
                />
              )}

              {/* Leaves */}
              {growthStage !== 'seedling' && (
                <>
                  <div 
                    className="absolute top-1/3 left-0 w-4 h-1 rounded-full"
                    style={{ background: stage.color }}
                  />
                  <div 
                    className="absolute top-1/2 right-0 w-4 h-1 rounded-full"
                    style={{ background: stage.color }}
                  />
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Soil Surface Detail */}
        {/* Removed the line below the box as requested */}
        {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900/50 via-yellow-900/50 to-amber-900/50" /> */}
      </div>
      </div>

      {/* Ground Shadow */}
      <div className="h-4 bg-gradient-to-b from-gray-900/20 to-transparent rounded-b-3xl" />
    </div>
  );
}
