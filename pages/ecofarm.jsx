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

// Fetch real NASA POWER API climate data for 14 weeks (June to September 2024, Mawsynram in Meghalaya)
const fetchClimateDataArray = async () => {
  const lat = 25.2970; // Mawsynram latitude
  const lon = 91.5822; // Mawsynram longitude
  const start = '20240601';
  const end = '20240930';
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?start=${start}&end=${end}&latitude=${lat}&longitude=${lon}&community=RE&parameters=T2M,PRECTOTCORR,GWETPROF,ALLSKY_SFC_SW_DWN&format=JSON`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const properties = data.properties;
    const dates = Object.keys(properties.parameter.T2M).sort();
    const weeklyData = [];

    for (let w = 0; w < 14; w++) {
      const weekStart = w * 7;
      const weekDays = dates.slice(weekStart, weekStart + 7);
      let temp = 0, rain = 0, soil = 0, irr = 0;
      let count = 0;

      for (const date of weekDays) {
        if (properties.parameter.T2M[date] !== -999 && properties.parameter.T2M[date] != null) {
          temp += properties.parameter.T2M[date];
          rain += properties.parameter.PRECTOTCORR[date] || 0;
          soil += properties.parameter.GWETPROF[date] || 0;
          irr += properties.parameter.ALLSKY_SFC_SW_DWN[date] || 0;
          count++;
        }
      }

      if (count > 0) {
        weeklyData.push({
          week: w + 1,
          temperature: temp / count,
          rainfall: rain / count,
          soilMoisture: (soil / count) * 100, // Convert to percentage
          irradiance: irr / count
        });
      } else {
        // Fallback to simulated if no data
        weeklyData.push(generateClimateDataFallback(w + 1));
      }
    }
    return weeklyData;
  } catch (error) {
    console.error('Failed to fetch NASA climate data:', error);
    // Fallback to simulated data
    const arr = [];
    for (let i = 1; i <= 14; i++) arr.push(generateClimateDataFallback(i));
    return arr;
  }
};

// Fallback simulated data
const generateClimateDataFallback = (week) => {
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

// Generate climate data for a given week from climateDataArray or fallback
const generateClimateData = (week, climateDataArray) => {
  if (climateDataArray && climateDataArray.length >= week) {
    return climateDataArray[week - 1];
  }
  return generateClimateDataFallback(week);
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
  const [climateDataArray, setClimateDataArray] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isResting, setIsResting] = useState(false); // New state for rest action background

  // Audio refs for sounds
  const audioRef = React.useRef(null);
  const irrigateSoundRef = React.useRef(null);
  const fertilizeSoundRef = React.useRef(null);
  const buttonClickSoundRef = React.useRef(null);
  const popupSoundRef = React.useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  // Play background music when game starts (gameState changes to 'playing') or on menu
  useEffect(() => {
    if ((gameState === 'menu' || gameState === 'playing') && audioRef.current) {
      audioRef.current.volume = 0.08; // consistent 80% reduction for better sound balance across all states
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => {
        // Handle autoplay restrictions silently
      });
      if (gameState === 'playing') {
        setShowWelcome(true);
      }
    }
  }, [gameState]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error('User not logged in');
    }
  };

  const startGame = async (cropType) => {
    if (buttonClickSoundRef.current) {
      buttonClickSoundRef.current.currentTime = 0;
      buttonClickSoundRef.current.play().catch(() => {});
    }
    setIsProcessing(true);
    const initialClimate = generateClimateData(1, climateDataArray);

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

    // Play button click sound for all actions including rest
    if (buttonClickSoundRef.current) {
      buttonClickSoundRef.current.currentTime = 0;
      buttonClickSoundRef.current.play().catch(() => {});
    }

    // Remove any action from clicking on rest except the popup, so no background change
    // if (action === 'rest') {
    //   setIsResting(true);
    // }

    // Play sound effect for irrigate with background music volume ducking
    if (action === 'irrigate' && irrigateSoundRef.current) {
      const bgAudio = document.querySelector('audio[src="/sounds/gametheme.mp3"]');
      const irrigateAudio = irrigateSoundRef.current;

      if (bgAudio) {
        // Lower background music volume
        const originalVolume = bgAudio.volume;
        bgAudio.volume = 0.02;

        irrigateAudio.currentTime = 0; // Reset to start
        irrigateAudio.play().catch(e => {
          // Handle play restrictions silently
        });

        // When irrigate sound ends, restore background music volume
        irrigateAudio.onended = () => {
          bgAudio.volume = originalVolume;
        };
      } else {
        // Fallback if background audio not found
        irrigateAudio.currentTime = 0;
        irrigateAudio.play().catch(e => {
          // Handle play restrictions silently
        });
      }
    }

    // Play sound effect for fertilize
    if (action === 'fertilize' && fertilizeSoundRef.current) {
      fertilizeSoundRef.current.currentTime = 0; // Reset to start
      fertilizeSoundRef.current.play().catch(e => {
        // Handle play restrictions silently
      });
    }

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
      setIsResting(false); // Reset resting background on game end
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

    // Delay feedback for irrigate action
    const showFeedback = () => {
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
      // Play popup sound when feedback modal shows
      if (popupSoundRef.current) {
        popupSoundRef.current.currentTime = 0;
        popupSoundRef.current.play().catch(() => {});
      }
    };

    if (action === 'irrigate') {
      setTimeout(showFeedback, 2000); // 2 seconds delay
    } else if (action === 'rest') {
      setTimeout(showFeedback, 1000); // 1 second delay for rest to show nightfield background
    } else {
      showFeedback(); // Immediate for other actions
    }
  };

  const closeFeedback = () => {
    setFeedback(null);
    const nextClimate = generateClimateData(currentSession.current_week, climateDataArray);
    setClimateData(nextClimate);
    setIsProcessing(false);
    setIsResting(false); // Reset resting background when feedback closes
  };

  const restartGame = () => {
    if (buttonClickSoundRef.current) {
      buttonClickSoundRef.current.currentTime = 0;
      buttonClickSoundRef.current.play().catch(() => {});
    }
    setGameState('menu');
    setCurrentSession(null);
    setClimateData(null);
    setFeedback(null);
    setIsResting(false); // Reset resting background on restart
  };

  const closeWelcome = () => {
    setShowWelcome(false);
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const handleTutorialNext = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const tutorialContent = [
    {
      image: "/images/normalman.PNG",
      title: "Game Actions",
      message: "You have three actions to choose from each week: Irrigate, Fertilize, and Rest. Each choice affects your rice crop differently based on the climate data."
    },
    {
      image: "/images/irrigateman.PNG",
      title: "Irrigate",
      message: "Irrigation adds water to your fields. Use it when soil moisture is low, but be careful not to over-irrigate during rainy periods to avoid flooding."
    },
    {
      image: "/images/fertilizeman.PNG",
      title: "Fertilize",
      message: "Fertilizing provides nutrients to your plants. It's most effective during the reproductive stage, but can be counterproductive if applied too late."
    },
    {
      image: "/images/normalman.PNG",
      title: "Rest",
      message: "Resting lets nature take its course. This can be good in favorable weather, but may lead to drought or heat stress in extreme conditions."
    }
  ];

  return (
    <>
      {/* Background Music - always rendered */}
      <audio
        ref={audioRef}
        src="/sounds/gametheme.mp3"
        preload="auto"
      />
      {/* Action Sound Effects */}
      <audio
        ref={irrigateSoundRef}
        src="/sounds/irrigate.mp3"
        preload="auto"
      />
      <audio
        ref={fertilizeSoundRef}
        src="/sounds/fertilize.mp3"
        preload="auto"
      />
      <audio
        ref={buttonClickSoundRef}
        src="/sounds/buttonclick.mp3"
        preload="auto"
      />
      <audio
        ref={popupSoundRef}
        src="/sounds/popup.mp3"
        preload="auto"
      />

      {gameState === 'menu' && <StartMenu onStartGame={startGame} />}

      {gameState === 'results' && <ResultsScreen gameData={currentSession} onRestart={restartGame} />}

      {gameState === 'playing' && (
        <div
          className="min-h-screen p-4 md:p-8"
          style={{
            // Always use the game background for the overall page. The field background
            // inside FarmPlot will switch to rainfield when rainfall > 90mm.
            backgroundImage: "url('/images/gamebg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
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
          <div className="lg:col-span-2 space-y-8 relative">
            {isResting && (
              <div
                className="absolute inset-0 z-0 rounded-3xl pointer-events-none"
                style={{
                  backgroundImage: "url('/images/gamebg.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.7,
                }}
              />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <FarmPlot
                growthStage={currentSession?.growth_stage}
                soilMoisture={currentSession?.soil_moisture}
                healthScore={currentSession?.health_score}
                climateData={climateData}
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

        {/* Welcome Modal */}
        <AnimatePresence>
          {showWelcome && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={closeWelcome}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute left-[calc(5%)] top-[calc(40%)] z-50 pointer-events-auto flex items-center gap-4 bg-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src="/images/normalman.PNG"
                  alt="Welcome"
                  className="w-48 h-48 object-contain z-50"
                />
                <div className="relative bg-white rounded-xl p-4 shadow-lg max-w-xs z-50">
                  <button
                    onClick={closeWelcome}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close welcome message"
                  >
                    &#x2715;
                  </button>
                  <div className="absolute -left-4 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Welcome to EcoFarm!
                  </h2>
                  <p className="text-gray-700">
                    Where farming meets science, and every choice grows a story.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowTutorial(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute left-[calc(5%)] top-[calc(40%)] z-50 pointer-events-auto flex items-center gap-4 bg-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={tutorialContent[tutorialStep].image}
                  alt="Tutorial"
                  className="w-48 h-48 object-contain z-50"
                />
                <div className="relative bg-white rounded-xl p-4 shadow-lg max-w-xs z-50">
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close tutorial"
                  >
                    &#x2715;
                  </button>
                  <div className="absolute -left-4 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {tutorialContent[tutorialStep].title}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    {tutorialContent[tutorialStep].message}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {tutorialStep + 1} of 4
                    </div>
                    <Button
                      onClick={handleTutorialNext}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {tutorialStep < 3 ? 'Next' : 'Start Playing'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
      )}
    </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
