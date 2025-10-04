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

export default function FarmPlot({ growthStage, soilMoisture, healthScore }) {
  const stage = GROWTH_STAGES[growthStage] || GROWTH_STAGES.seedling;
  
  const getSoilColor = () => {
    if (soilMoisture > 80) return '#92400e'; // Too wet, dark brown
    if (soilMoisture > 60) return '#a16207'; // Good moisture
    if (soilMoisture > 40) return '#ca8a04'; // Moderate
    return '#d97706'; // Dry
  };

  const plants = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Sky */}
      <div className="h-32 bg-no-repeat bg-center bg-cover rounded-t-3xl" style={{ backgroundImage: "url('/images/bg.png')" }} />
      
      {/* Farm Plot */}
      <div 
        className="relative p-8 rounded-b-3xl shadow-2xl bg-no-repeat bg-center bg-cover"
        style={{ 
          backgroundImage: `url('/images/cropbg.jpg')`,
          minHeight: '300px'
        }}
      >
        {/* Soil Moisture Indicator */}
        {soilMoisture > 70 && (
          <div className="absolute inset-0 bg-blue-400/20 rounded-b-3xl pointer-events-none" />
        )}

        {/* Stage Label */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
          <div className="text-sm font-semibold text-gray-900">{stage.label}</div>
          <div className="text-xs text-gray-600">{stage.description}</div>
        </div>

        {/* Health Indicator */}
        <div className="absolute top-24 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg" style={{ minWidth: '180px', minHeight: '56px' }}>
          <div className="text-xs text-gray-600">Crop Health</div>
          <div className="flex items-center gap-2">
            <div className="status-bar-track" style={{ width: '120px', height: '12px', margin: '5px 0' }}>
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

      {/* Ground Shadow */}
      <div className="h-4 bg-gradient-to-b from-gray-900/20 to-transparent rounded-b-3xl" />
    </div>
  );
}
