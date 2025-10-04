import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sprout, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ActionPanel({ onAction, disabled }) {
  const actions = [
    {
      id: 'irrigate',
      icon: Droplets,
      label: 'Irrigate',
      description: 'Add water to increase soil moisture',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'fertilize',
      icon: Sprout,
      label: 'Fertilize',
      description: 'Boost crop growth with nutrients',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'rest',
      icon: Coffee,
      label: 'Rest',
      description: 'Let nature take its course',
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Your Action This Week</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <Button
              variant="menu"
              style={{ width: '320px', height: '120px' }}
              className={`flex flex-row items-center justify-start p-4 mb-4 md:mb-0 space-x-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onAction(action.id)}
              disabled={disabled}
            >
              <div className={`rounded-2xl flex items-center justify-center shadow-lg w-16 h-16 ${action.color}`}>
                <action.icon className={`w-8 h-8`} style={{ color: 'white' }} />
              </div>
              <div className="flex flex-col">
                <h4 className={`text-xl md:text-2xl font-bold`} style={{ color: action.color.replace('bg-', '') }}>
                  {action.label.toUpperCase()}
                </h4>
                <p className={`text-xs md:text-sm`} style={{ color: action.color.replace('bg-', ''), opacity: 0.8 }}>
                  {action.description.toUpperCase()}
                </p>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-100 border-2 border-blue-700 p-4 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Tip:</span> Consider the current climate data before making your decision. Too much or too little of any resource can harm your crops!
        </p>
      </div>
    </div>
  );
}
