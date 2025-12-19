import React, { useState } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { DailyGoal, MasteryLevel, SkillNode, UserStats } from '../types';
import { MOODS } from '../constants';

interface DashboardProps {
  stats: UserStats;
  goals: DailyGoal[];
  skills: SkillNode[];
  onToggleGoal: (id: string) => void;
  onUpdateMood: (mood: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, goals, skills, onToggleGoal, onUpdateMood }) => {
  const [draggedGoal, setDraggedGoal] = useState<string | null>(null);

  // Calculate mastery data for charts
  const masteryData = [
    { name: 'Mastered', count: skills.filter(s => s.level === MasteryLevel.MASTERED).length, fill: '#10b981' },
    { name: 'InProgress', count: skills.filter(s => s.level === MasteryLevel.INTERMEDIATE || s.level === MasteryLevel.BEGINNER).length, fill: '#3b82f6' },
    { name: 'Locked', count: skills.filter(s => s.level === MasteryLevel.LOCKED).length, fill: '#4b5563' },
  ];

  const handleDragStart = (id: string) => {
    setDraggedGoal(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: boolean) => {
    e.preventDefault();
    if (draggedGoal) {
      // In a real app, we'd reorder or change status via API
      onToggleGoal(draggedGoal);
      setDraggedGoal(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Welcome & Mood */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-space-dark/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Welcome back, Explorer.</h1>
          <p className="text-gray-300 mb-6 font-medium">Your neural pathways are looking bright today.</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/5">
            <span className="text-sm font-semibold text-gray-200">Mood Check-in:</span>
            <div className="flex gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => onUpdateMood(mood)}
                  className={`text-2xl hover:scale-125 transition-transform p-2 rounded-full ${stats.mood === mood ? 'bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''}`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Goals (Drag & Drop) */}
        <div className="bg-space-dark/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <i className="fas fa-bullseye text-neon-cyan mr-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></i> Daily Path
          </h2>
          <div className="space-y-3">
            {goals.map(goal => (
              <div
                key={goal.id}
                draggable
                onDragStart={() => handleDragStart(goal.id)}
                onClick={() => onToggleGoal(goal.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group backdrop-blur-sm ${
                  goal.completed 
                    ? 'bg-success-green/20 border-success-green/30' 
                    : 'bg-white/5 border-white/10 hover:border-neon-purple/50 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    goal.completed ? 'border-success-green bg-success-green' : 'border-gray-500'
                  }`}>
                    {goal.completed && <i className="fas fa-check text-xs text-black"></i>}
                  </div>
                  <span className={goal.completed ? 'line-through text-gray-400' : 'text-gray-200 font-medium'}>
                    {goal.title}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-grip-lines text-gray-500"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Column */}
      <div className="space-y-6">
        {/* Mastery Rings */}
        <div className="bg-space-dark/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-80 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-2">Skill Mastery</h3>
          <div className="w-full h-full -mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={15} data={masteryData}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  dataKey="count"
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{right: 0}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(20, 20, 35, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#fff' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-6 flex items-center justify-between shadow-lg shadow-orange-500/5">
            <div>
                <p className="text-orange-300 text-sm font-bold uppercase tracking-wider">Current Streak</p>
                <h4 className="text-4xl font-bold text-white drop-shadow-md">{stats.streak} <span className="text-lg text-orange-400">Days</span></h4>
            </div>
            <i className="fas fa-fire text-4xl text-orange-500 animate-pulse-slow drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]"></i>
        </div>
      </div>
    </div>
  );
};