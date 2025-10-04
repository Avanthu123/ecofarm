import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Wheat, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function StartMenu({ onStartGame }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: "url('/images/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-rice-green-400 rounded-3xl flex items-center justify-center">
              <Sprout className="w-12 h-12 text-rice-green-900" />
            </div>
          </motion.div>
          
          <h1 className="text-6xl font-bold text-rice-green-900 mb-4">
            EcoFarm
          </h1>
          <p className="text-xl text-rice-green-700 font-medium">Data-Driven Rice Farming</p>
          <p className="text-sm text-rice-green-600 mt-2 flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4 text-rice-green-900" />
            Learn sustainable farming with real NASA climate data
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-pointer bg-rice-green-200 border-rice-green-300">
              <CardContent className="p-8 text-center" onClick={() => onStartGame('rice')}>
                <div className="w-16 h-16 bg-rice-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-8 h-8 text-rice-green-900" />
                </div>
                <h3 className="text-2xl font-bold text-rice-green-900 mb-2">Rice Farming</h3>
                <p className="text-rice-green-700 mb-4">
                  Master the art of rice cultivation through 14 weeks of growth
                </p>
                <Button variant="menu" className="bg-rice-green-400 hover:bg-rice-green-500 text-white shadow-none">Available Now</Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-not-allowed bg-rice-yellow-50 border-rice-yellow-200 opacity-60">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-rice-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wheat className="w-8 h-8 text-rice-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-rice-yellow-800 mb-2">Wheat Farming</h3>
                <p className="text-rice-yellow-700 mb-4">
                  Coming soon! Explore wheat cultivation strategies
                </p>
                <Button variant="menu" className="bg-rice-yellow-400 hover:bg-rice-yellow-500 text-white cursor-not-allowed shadow-none" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-rice-green-100"
        >
          <h4 className="font-semibold text-rice-green-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rice-green-900" />
            What You'll Learn
          </h4>
          <ul className="space-y-2 text-rice-green-700">
            <li className="flex items-start gap-2">
              <span className="text-rice-green-500 mt-1">✓</span>
              <span>How temperature, rainfall, and soil moisture affect crop growth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rice-green-500 mt-1">✓</span>
              <span>Sustainable irrigation and fertilization practices</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rice-green-500 mt-1">✓</span>
              <span>Consequences of overwatering and overfertilizing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rice-green-500 mt-1">✓</span>
              <span>Real NASA climate data analysis for farming decisions</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
