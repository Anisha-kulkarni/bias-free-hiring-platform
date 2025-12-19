import React, { useState } from 'react';
import { LearningMode } from '../types';
import { AVAILABLE_MODES } from '../constants';
import { generateScenario } from '../services/geminiService';

interface CoursePlayerProps {
  onBack: () => void;
  topic?: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ onBack, topic = "Learning Concept" }) => {
  const [difficulty, setDifficulty] = useState(50);
  const [mode, setMode] = useState<LearningMode>(LearningMode.VIDEO);
  const [scenario, setScenario] = useState<string | null>(null);
  const [interest, setInterest] = useState('Sci-Fi');
  
  const handleScenarioGen = async () => {
    setScenario("Generating personalized scenario...");
    const result = await generateScenario(topic, interest);
    setScenario(result);
  };

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explanation")}`;

  return (
    <div className="bg-space-dark/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
      {/* Header Controls */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/20">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <i className="fas fa-arrow-left"></i> Back to Map
            </button>
            <a 
                href={youtubeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold transition-all"
                title="Search Topic on YouTube"
            >
                <i className="fab fa-youtube"></i>
                <span className="hidden sm:inline">Search Topic</span>
            </a>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
          {AVAILABLE_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                mode === m.id 
                  ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className={`fas ${m.icon}`}></i>
              <span className="hidden md:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 p-6 md:p-10 bg-transparent relative min-h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 pointer-events-none"></div>
            
            {mode === LearningMode.VIDEO && (
                <div className="text-center z-10">
                    <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <i className="fas fa-play text-neon-blue text-2xl"></i>
                    </div>
                    <h3 className="text-xl text-white font-bold mb-2 text-shadow-lg">Video Micro-Lecture: {topic}</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">Watch a curated explanation to master this concept. The knowledge awaits.</p>
                    
                    <a 
                        href={youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-[#FF0000]/90 hover:bg-[#FF0000] text-white font-bold rounded-full transition-transform hover:scale-105 shadow-lg backdrop-blur-sm"
                    >
                        <i className="fab fa-youtube text-xl mr-2"></i>
                        Watch on YouTube
                    </a>
                </div>
            )}
            {mode === LearningMode.SIMULATION && (
                <div className="w-full h-full border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    <p className="text-neon-cyan"><i className="fas fa-flask mr-2"></i> Interactive Lab Loaded for {topic}</p>
                </div>
            )}
             {mode === LearningMode.STORY && (
                <div className="max-w-md mx-auto z-10">
                    <div className="mb-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <label className="text-xs text-gray-400 block mb-1">Personalize Context:</label>
                        <select 
                            value={interest} 
                            onChange={(e) => setInterest(e.target.value)}
                            className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-full outline-none focus:border-neon-purple"
                        >
                            <option>Sci-Fi</option>
                            <option>Sports</option>
                            <option>Music</option>
                            <option>Business</option>
                        </select>
                        <button 
                            onClick={handleScenarioGen}
                            className="mt-2 w-full bg-neon-purple/20 text-neon-purple text-xs font-bold py-1.5 rounded hover:bg-neon-purple/30 transition-colors border border-neon-purple/30"
                        >
                            Generate Story
                        </button>
                    </div>
                    {scenario && (
                        <div className="bg-white/10 p-4 rounded-xl border-l-4 border-neon-purple animate-fade-in backdrop-blur-md shadow-lg">
                            <p className="text-gray-200 italic">"{scenario}"</p>
                        </div>
                    )}
                </div>
            )}
            {/* Fallback for other modes */}
            {mode !== LearningMode.VIDEO && mode !== LearningMode.SIMULATION && mode !== LearningMode.STORY && (
                <div className="text-gray-500 z-10">Content Mode: {mode}</div>
            )}
        </div>

        {/* Sidebar: Difficulty & Interactions */}
        <div className="p-6 border-l border-white/10 bg-white/5 backdrop-blur-sm">
            {/* Difficulty Slider */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-300">Difficulty</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        difficulty < 30 ? 'bg-green-500/20 text-green-400' : 
                        difficulty > 70 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                        {difficulty < 30 ? 'Easy' : difficulty > 70 ? 'Challenge' : 'Balanced'}
                    </span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Adjusts problem complexity and pacing in real-time.
                </p>
            </div>

            {/* Engagement Triggers (Mock) */}
            <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-gray-300 mb-2"> <i className="fas fa-brain text-neon-purple"></i> Adaptive Insights</h4>
                    <ul className="space-y-2 text-xs text-gray-400">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success-green shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                            Pace is optimal
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
                            Suggest: Try Simulation Mode
                        </li>
                    </ul>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                    <h4 className="text-sm font-bold text-white mb-3">Zen Focus Mode</h4>
                    <button className="w-full py-2 rounded-xl border border-white/20 hover:bg-white/10 text-gray-300 text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                        <i className="fas fa-infinity"></i> Enter Zen Mode
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};