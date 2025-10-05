import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null;

  // Choose a character image based on feedback type:
  // success -> bluebird (right), warning -> redbird (left), otherwise farmer (left)
  const chosen = (() => {
    if (feedback.type === 'success') return { name: 'bluebird', src: '/images/bluebird.png', corner: 'right' };
    if (feedback.type === 'warning') return { name: 'redbird', src: '/images/redbird.png', corner: 'left' };
    // default / info / rest / natural growth cases
    return { name: 'normalman', src: '/images/normalman.PNG', corner: 'left' };
  })();

  const getIcon = () => {
    switch (feedback.type) {
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (feedback.type) {
      case 'warning':
        return 'from-amber-50 to-orange-50';
      case 'success':
        return 'from-green-50 to-emerald-50';
      default:
        return 'from-blue-50 to-cyan-50';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-gradient-to-br ${getBgColor()} rounded-3xl shadow-2xl max-w-lg w-full p-8 relative`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative character placed at left or right based on chosen.corner */}
          <img
            src={chosen.src}
            alt={chosen.name}
            className={`absolute ${chosen.corner === 'right' ? 'right-0' : 'left-0'} bottom-6 w-36 h-36 md:w-36 md:h-36 object-contain pointer-events-none`} 
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              {getIcon()}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {feedback.title}
            </h3>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {feedback.message}
            </p>

            {feedback.impact && (
              <div className="w-full bg-white/70 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Impact on Crops:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between items-center">
                    <span>Soil Moisture:</span>
                    <span className={`font-bold ${feedback.impact.soilMoisture > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {feedback.impact.soilMoisture > 0 ? '+' : ''}{feedback.impact.soilMoisture}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Health:</span>
                    <span className={`font-bold ${feedback.impact.health > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {feedback.impact.health > 0 ? '+' : ''}{feedback.impact.health}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {feedback.learningPoint && (
              <div className="w-full bg-white/70 rounded-2xl p-4 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  📚 Learning Point
                </h4>
                <p className="text-sm text-gray-700">
                  {feedback.learningPoint}
                </p>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl"
            >
              Continue to Week {feedback.nextWeek}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}