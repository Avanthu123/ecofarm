import React, { useState, useEffect } from 'react';
import { GameSession } from '@/entities/GameSession';
import { User } from '@/entities/User';
import StartMenu from '../components/game/StartMenu';
import FarmPlot from '../components/game/FarmPlot';
import ClimateDataDisplay from '../components/game/ClimateDataDisplay';
import ActionPanel from '../components/game/ActionPanel';
import FeedbackModal from '../components/game/FeedbackModal';
import ResultsScreen from '../components/game/ResultsScreen';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, PlayCircle } from 'lucide-react';

// Simulated NASA climate data for 14 weeks (placeholder - can be replaced with real API)
const generateClimateData = (week) => {
  const baseTemp = 25 + Math.sin(week / 2) * 5;
  const baseRainfall = 50 + Math.random() * 100;
  const baseSoilMoisture = 60 + Math.random() * 20;
  const baseIrradiance = 15 + Math.random() * 5;

  return {
    week,
    temperature: baseTemp + Math.random() * 3,
    rainfall: baseRainfall,
    soilMoisture: baseSoilMoisture,
    irradiance: baseIrradiance
  };
};

const GROWTH_STAGES = {
  1: 'seedling',
  5: 'vegetative',
  9: 'reproductive',
  13: 'maturity'
};

export default function EcoFarmGame() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, results
  const [currentSession, setCurrentSession] = useState(null);
  const [climateData, setClimateData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error('User not logged in');
    }
  };

  const startGame = async (cropType) => {
    setIsProcessing(true);
    const initialClimate = generateClimateData(1);
    
    const newSession = await GameSession.create({
      current_week: 1,
      crop_type: cropType,
      soil_moisture: 60,
      growth_stage: 'seedling',
      health_score: 100,
      total_yield: 0,
      decisions: [],
      game_status: 'active'
    });

    setCurrentSession(newSession);
    setClimateData(initialClimate);
    setGameState('playing');
    setIsProcessing(false);
  };

  const calculateOutcome = (action, climate, currentState) => {
    let soilMoistureChange = 0;
    let healthChange = 0;
    let feedbackType = 'info';
    let feedbackTitle = '';
    let feedbackMessage = '';
    let learningPoint = '';

    const { rainfall, temperature } = climate;
    const { soil_moisture, growth_stage } = currentState;

    switch (action) {
      case 'irrigate':
        soilMoistureChange = 20;
        
        if (rainfall > 100) {
          healthChange = -15;
          feedbackType = 'warning';
          feedbackTitle = 'Over-Irrigation Warning!';
          feedbackMessage = `Heavy rainfall (${rainfall.toFixed(0)}mm) combined with irrigation caused flooding. Your rice plants are stressed from waterlogged conditions.`;
          learningPoint = 'During high rainfall periods, additional irrigation can lead to flooding and root damage. Monitor weather forecasts before irrigating.';
        } else if (soil_moisture > 80) {
          healthChange = -8;
          feedbackType = 'warning';
          feedbackTitle = 'Excess Moisture';
          feedbackMessage = 'Soil was already well-saturated. Over-irrigation can lead to nutrient leaching and disease.';
          learningPoint = 'Rice needs consistent moisture, but excessive water reduces oxygen availability to roots.';
        } else if (soil_moisture < 40) {
          healthChange = 10;
          feedbackType = 'success';
          feedbackTitle = 'Good Decision!';
          feedbackMessage = 'Your irrigation helped restore optimal moisture levels. Plants are thriving!';
          learningPoint = 'Rice requires 4-6 inches of standing water during active growth, especially in the reproductive stage.';
        } else {
          healthChange = 5;
          feedbackType = 'success';
          feedbackTitle = 'Moisture Maintained';
          feedbackMessage = 'Irrigation maintained good soil moisture levels for healthy growth.';
        }
        break;

      case 'fertilize':
        if (growth_stage === 'reproductive') {
          healthChange = 15;
          feedbackType = 'success';
          feedbackTitle = 'Perfect Timing!';
          feedbackMessage = 'Fertilizing during the reproductive stage boosts grain formation. Excellent choice!';
          learningPoint = 'The reproductive stage is critical for yield. Proper nutrition during flowering maximizes grain production.';
        } else if (growth_stage === 'maturity') {
          healthChange = -5;
          feedbackType = 'warning';
          feedbackTitle = 'Too Late';
          feedbackMessage = 'Fertilizing at maturity has minimal benefit and can delay harvest.';
          learningPoint = 'Late-season fertilization is generally ineffective. Focus on earlier growth stages.';
        } else {
          healthChange = 8;
          feedbackType = 'success';
          feedbackTitle = 'Growth Boost';
          feedbackMessage = 'Fertilizer provides essential nutrients for plant development.';
          learningPoint = 'Split fertilizer applications throughout the season optimize nutrient uptake.';
        }
        soilMoistureChange = -5;
        break;

      case 'rest':
        soilMoistureChange = rainfall > 50 ? 10 : -10;
        
        if (temperature > 32) {
          healthChange = -12;
          feedbackType = 'warning';
          feedbackTitle = 'Heat Stress';
          feedbackMessage = `High temperature (${temperature.toFixed(1)}°C) without intervention caused heat stress. Plants need more water!`;
          learningPoint = 'Rice is sensitive to temperatures above 35°C, especially during flowering. Consider irrigation during heat waves.';
        } else if (rainfall < 20 && soil_moisture < 40) {
          healthChange = -10;
          feedbackType = 'warning';
          feedbackTitle = 'Drought Stress';
          feedbackMessage = 'Low rainfall and you chose to rest. Plants are experiencing drought stress.';
          learningPoint = 'During dry periods, active management is crucial to maintain crop health.';
        } else if (rainfall > 80 && soil_moisture > 70) {
          healthChange = -5;
          feedbackType = 'info';
          feedbackTitle = 'Natural Conditions';
          feedbackMessage = 'High rainfall led to waterlogged conditions. Sometimes less intervention is better, but monitor closely.';
        } else {
          healthChange = 3;
          feedbackType = 'success';
          feedbackTitle = 'Nature Balanced';
          feedbackMessage = 'Weather conditions were favorable. Your crops grew steadily with minimal intervention.';
          learningPoint = 'Optimal conditions allow plants to thrive naturally, reducing the need for inputs.';
        }
        break;
    }

    return {
      soilMoistureChange,
      healthChange,
      feedbackType,
      feedbackTitle,
      feedbackMessage,
      learningPoint
    };
  };

  const handleAction = async (action) => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    const outcome = calculateOutcome(action, climateData, currentSession);
    
    const newSoilMoisture = Math.max(0, Math.min(100, 
      currentSession.soil_moisture + outcome.soilMoistureChange + (climateData.rainfall / 10)
    ));
    
    const newHealth = Math.max(0, Math.min(100, 
      currentSession.health_score + outcome.healthChange
    ));

    const nextWeek = currentSession.current_week + 1;
    const newGrowthStage = GROWTH_STAGES[nextWeek] || currentSession.growth_stage;

    const updatedDecisions = [
      ...(currentSession.decisions || []),
      {
        week: currentSession.current_week,
        action,
        climate_data: climateData,
        outcome: outcome.feedbackMessage
      }
    ];

    if (nextWeek > 14) {
      // Calculate final yield
      const baseYield = 5000;
      const healthMultiplier = newHealth / 100;
      const moistureMultiplier = Math.max(0.5, 1 - Math.abs(newSoilMoisture - 70) / 100);
      const finalYield = baseYield * healthMultiplier * moistureMultiplier * (0.8 + Math.random() * 0.4);

      const finalSession = await GameSession.update(currentSession.id, {
        current_week: 14,
        soil_moisture: newSoilMoisture,
        health_score: newHealth,
        growth_stage: 'maturity',
        total_yield: finalYield,
        decisions: updatedDecisions,
        game_status: 'completed'
      });

      setCurrentSession(finalSession);
      setGameState('results');
      setIsProcessing(false);
      return;
    }

    const updatedSession = await GameSession.update(currentSession.id, {
      current_week: nextWeek,
      soil_moisture: newSoilMoisture,
      health_score: newHealth,
      growth_stage: newGrowthStage,
      decisions: updatedDecisions
    });

    setCurrentSession(updatedSession);
    
    setFeedback({
      type: outcome.feedbackType,
      title: outcome.feedbackTitle,
      message: outcome.feedbackMessage,
      learningPoint: outcome.learningPoint,
      impact: {
        soilMoisture: outcome.soilMoistureChange,
        health: outcome.healthChange
      },
      nextWeek
    });
  };

  const closeFeedback = () => {
    setFeedback(null);
    const nextClimate = generateClimateData(currentSession.current_week);
    setClimateData(nextClimate);
    setIsProcessing(false);
  };

  const restartGame = () => {
    setGameState('menu');
    setCurrentSession(null);
    setClimateData(null);
    setFeedback(null);
  };

  if (gameState === 'menu') {
    return <StartMenu onStartGame={startGame} />;
  }

  if (gameState === 'results') {
    return <ResultsScreen gameData={currentSession} onRestart={restartGame} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundImage: "url('/images/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              EcoFarm Rice Simulator
            </h1>
            <p className="text-gray-600 mt-1">Grow your rice with real NASA climate data</p>
          </div>
          <Button
            variant="menu"
            onClick={restartGame}
            className="flex md:hidden items-center gap-2 justify-center mb-4"
          >
            <PlayCircle className="w-4 h-4" />
            New Game
          </Button>
          <Button
            variant="menu"
            onClick={restartGame}
            className="hidden md:flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            New Game
          </Button>
        </div>

        {/* Week Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Week {currentSession?.current_week} of 14
                </h2>
                <p className="text-sm text-gray-600 capitalize">
                  {currentSession?.growth_stage} stage
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Season Progress</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((currentSession?.current_week / 14) * 100)}%
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentSession?.current_week / 14) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Climate Data below Week Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <ClimateDataDisplay
            climateData={climateData}
            week={currentSession?.current_week}
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <FarmPlot
                growthStage={currentSession?.growth_stage}
                soilMoisture={currentSession?.soil_moisture}
                healthScore={currentSession?.health_score}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ActionPanel
                onAction={handleAction}
                disabled={isProcessing || !!feedback}
              />
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ClimateDataDisplay
                climateData={climateData}
                week={currentSession?.current_week}
              />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <FeedbackModal
              feedback={feedback}
              onClose={closeFeedback}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}