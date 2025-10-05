import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sprout, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActionPanel({ onAction, disabled }) {
  const actions = [
    { id: 'irrigate', icon: Droplets, label: 'Irrigate', color: 'bg-blue-500' },
    { id: 'fertilize', icon: Sprout, label: 'Fertilize', color: 'bg-green-500' },
    { id: 'rest', icon: Coffee, label: 'Rest', color: 'bg-amber-500' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 text-center">Your Action This Week</h3>

      {/* FIX: 
        1. Added 'flex-wrap' to ensure proper wrapping if buttons exceed container width.
        2. Removed 'overflow-x-auto no-scrollbar' since we don't want horizontal scrolling.
      */}
      <div className="flex flex-row flex-wrap gap-4 p-4 justify-center">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}

            >
              <Button
                variant="menu"
                /* FIX: 
                  1. Changed default width from w-36 (too wide for mobile) to w-24 (96px, fits 3 buttons on a 320px screen).
                  2. Set sm:w-36 to restore the larger size on tablets and above.
                  3. Removed 'flex-wrap' from the button itself, as that was unnecessary.
                */
                className={`${disabled ? 'opacity-50 cursor-not-allowed' : ''} w-24 sm:w-36 md:w-52 h-12 flex flex-row items-center justify-center gap-3`}
                onClick={() => !disabled && onAction(action.id)}
                disabled={disabled}
              >
                <div className={`rounded-full flex items-center justify-center w-8 h-8 ${action.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs md:text-sm font-bold text-gray-900">{action.label.toUpperCase()}</span>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-blue-100 border-2 border-blue-700 p-4 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Tip:</span> Consider the current climate data before making your decision. Too much or too little of any resource can harm your crops!
        </p>
      </div>
    </div>
  );
}
