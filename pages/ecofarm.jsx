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
// Local static climate files (choose randomly among these)
import mawsynram2024 from '../src/data/mawsynram-2024.json';
import mawsynram2023 from '../src/data/mawsynram-2023.json';
import mawsynram2022 from '../src/data/mawsynram-2022.json';

// Use local static climate files only. Randomly select one of the available years.
const fetchClimateDataArray = async () => {
  const options = [mawsynram2024, mawsynram2023, mawsynram2022];
  const selected = options[Math.floor(Math.random() * options.length)];

  // If the selected file already contains a weeklyData array, use it directly
  if (selected && selected.weeklyData && Array.isArray(selected.weeklyData)) {
    return {
      weeklyData: selected.weeklyData,
      start: selected.start || (selected.header && selected.header.start) || null,
      end: selected.end || (selected.header && selected.header.end) || null,
      source: selected.source || `local-${selected.header?.start || 'unknown'}`
    };
  }

  // Otherwise assume the file follows NASA POWER format and aggregate daily -> weekly
  try {
    const data = selected;
    const properties = data.properties || data;
    const t2m = properties.parameter && properties.parameter.T2M ? properties.parameter.T2M : {};
    const prec = properties.parameter && properties.parameter.PRECTOTCORR ? properties.parameter.PRECTOTCORR : {};
    const gw = properties.parameter && properties.parameter.GWETPROF ? properties.parameter.GWETPROF : {};
    const irr = properties.parameter && properties.parameter.ALLSKY_SFC_SW_DWN ? properties.parameter.ALLSKY_SFC_SW_DWN : {};

    const dates = Object.keys(t2m).sort();
    const weeklyData = [];

    for (let w = 0; w < 14; w++) {
      const weekStart = w * 7;
      const weekDays = dates.slice(weekStart, weekStart + 7);
      let temp = 0, rain = 0, soil = 0, irrad = 0;
      let count = 0;

      for (const date of weekDays) {
        if (t2m[date] !== -999 && t2m[date] != null) {
          temp += t2m[date];
          rain += prec[date] || 0;
          soil += gw[date] || 0;
          irrad += irr[date] || 0;
          count++;
        }
      }

      if (count > 0) {
        weeklyData.push({
          week: w + 1,
          temperature: temp / count,
          rainfall: rain / count,
          soilMoisture: (soil / count) * 100,
          irradiance: irrad / count,
          source: 'local'
        });
      } else {
        const fb = generateClimateDataFallback(w + 1);
        fb.source = 'fallback';
        weeklyData.push(fb);
      }
    }

    const start = (data.header && data.header.start) || null;
    const end = (data.header && data.header.end) || null;
    return { weeklyData, start, end, source: `local-${start || 'unknown'}` };
  } catch (e) {
    // Fallback simulated data
    const arr = [];
    for (let i = 1; i <= 14; i++) {
      const fb = generateClimateDataFallback(i);
      fb.source = 'fallback';
      arr.push(fb);
    }
    return { weeklyData: arr, start: null, end: null, source: 'fallback' };
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
  const [climateSourceInfo, setClimateSourceInfo] = useState(null);
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
  const restSoundRef = React.useRef(null);
  const buttonClickSoundRef = React.useRef(null);
  const popupSoundRef = React.useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  // Fetch the full climate data array once on mount so we can display the timeline
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchClimateDataArray();
        if (mounted) {
          setClimateDataArray(res.weeklyData || []);
          setClimateSourceInfo({ start: res.start, end: res.end, source: res.source });
        }
      } catch (e) {
        // ignore - fallback is handled elsewhere
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Play background music when game starts (gameState changes to 'playing') or on menu
  useEffect(() => {
      if ((gameState === 'menu' || gameState === 'playing') && audioRef.current) {
      // Set background music to 70% volume so action sounds are more clearly heard
      audioRef.current.volume = 0.5;
      audioRef.current.loop = true;

      // Try to play immediately; if browser blocks autoplay, wait for first user interaction
      const tryPlay = async () => {
        try {
          await audioRef.current.play();
        } catch (err) {
          // Autoplay blocked - attach one-time listeners to resume on first user gesture
          const resumeOnUserGesture = () => {
            try {
              audioRef.current.play().catch(() => {});
            } catch (e) {}
            window.removeEventListener('click', resumeOnUserGesture);
            window.removeEventListener('keydown', resumeOnUserGesture);
            window.removeEventListener('pointerdown', resumeOnUserGesture);
          };
          window.addEventListener('click', resumeOnUserGesture, { once: true });
          window.addEventListener('keydown', resumeOnUserGesture, { once: true });
          window.addEventListener('pointerdown', resumeOnUserGesture, { once: true });
        }
      };

      tryPlay();

      // Do not automatically show the welcome on every transition to 'playing'.
      // The welcome should only appear when starting a new game (handled in startGame).
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
    // Ensure background music starts on this user gesture if it was blocked earlier
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {}
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
    // Show welcome instructions only when a new game is started
    setShowWelcome(true);
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

    // Play sound effect for fertilize at 2x speed with background ducking similar to irrigate
    if (action === 'fertilize' && fertilizeSoundRef.current) {
      const f = fertilizeSoundRef.current;
      const bgAudio = document.querySelector('audio[src="/sounds/gametheme.mp3"]');

      if (bgAudio) {
        const originalVolume = bgAudio.volume;
        // Lower background music volume while fertilize sound plays
        try { bgAudio.volume = 0.02; } catch (e) {}

        try {
          f.currentTime = 0;
          f.playbackRate = 2.0;
          f.play().catch(() => {});
        } catch (e) {}

        f.onended = () => {
          try { bgAudio.volume = originalVolume; } catch (e) {}
          try { f.playbackRate = 1.0; } catch (e) {}
        };
      } else {
        // Fallback: just play the sound without ducking
        try {
          f.currentTime = 0;
          f.playbackRate = 2.0;
          f.play().catch(() => {});
          f.onended = () => { try { f.playbackRate = 1.0; } catch (e) {} };
        } catch (e) {}
      }
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
      // Irrigate: wait 2s for sound effects then show popup
      setTimeout(showFeedback, 2000);
    } else if (action === 'fertilize') {
      // Fertilize: wait 2s (to let the 2x sped-up sound play) then show popup
      setTimeout(showFeedback, 2000);
    } else if (action === 'rest') {
      // Rest: show night background for 2s, play rest sound (with ducking), then show popup
      setIsResting(true);

      if (restSoundRef.current) {
        const r = restSoundRef.current;
        const bgAudio = document.querySelector('audio[src="/sounds/gametheme.mp3"]');
        let originalVolume = null;

        if (bgAudio) {
          originalVolume = bgAudio.volume;
          try { bgAudio.volume = 0.02; } catch (e) {}
        }

        try {
          r.currentTime = 0;
          r.play().catch(() => {});
        } catch (e) {}

        // Restore bg audio volume when rest sound ends (best-effort)
        r.onended = () => {
          if (bgAudio && originalVolume != null) {
            try { bgAudio.volume = originalVolume; } catch (e) {}
          }
        };
      }

      setTimeout(() => {
        setIsResting(false);
        showFeedback();
      }, 2000);
    } else {
      showFeedback();
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
        ref={restSoundRef}
        src="/sounds/rest.mp3"
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
            {/* Night background for rest is handled inside <FarmPlot /> via isNight prop */}
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
                climateHistory={climateDataArray}
                currentWeek={currentSession?.current_week}
                climateSourceInfo={climateSourceInfo}
                isNight={isResting}
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
            {/* Right column intentionally left without duplicate ClimateDataDisplay */}
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
