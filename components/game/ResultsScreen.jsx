import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Book, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ResultsScreen({ gameData, onRestart }) {
  const getYieldRating = (yield_val) => {
    if (yield_val >= 8000) return { label: 'Excellent!', color: 'text-green-600', emoji: '🌟' };
    if (yield_val >= 6000) return { label: 'Good', color: 'text-blue-600', emoji: '👍' };
    if (yield_val >= 4000) return { label: 'Fair', color: 'text-yellow-600', emoji: '👌' };
    return { label: 'Needs Improvement', color: 'text-orange-600', emoji: '💪' };
  };

  const rating = getYieldRating(gameData.total_yield);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Harvest Complete! {rating.emoji}
          </h1>
          <p className="text-xl text-gray-600">
            You've completed your 14-week rice growing season
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-white to-green-50 border-none shadow-2xl mb-6">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Yield</h2>
              <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                {gameData.total_yield.toFixed(0)} kg/ha
              </div>
              <div className={`text-2xl font-semibold ${rating.color} mb-6`}>
                {rating.label}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (gameData.total_yield / 10000) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-600">
                Average global rice yield: 4,500 kg/ha | Top farmers: 10,000+ kg/ha
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Season Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Final Health Score:</span>
                    <span className="font-bold text-gray-900">{gameData.health_score.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Growth Stage:</span>
                    <span className="font-bold text-gray-900 capitalize">{gameData.growth_stage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Weeks:</span>
                    <span className="font-bold text-gray-900">14 weeks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Crop Type:</span>
                    <span className="font-bold text-gray-900 capitalize">{gameData.crop_type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5 text-blue-500" />
                  Key Learnings
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Balanced irrigation during reproductive stage is crucial for high yields</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Excessive water + rainfall can lead to flooding and reduced yield</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Temperature stress during flowering reduces grain formation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>NASA climate data helps optimize farming decisions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Button
            onClick={onRestart}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-6 rounded-xl text-lg flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Season
          </Button>
        </motion.div>
      </div>
    </div>
  );
}