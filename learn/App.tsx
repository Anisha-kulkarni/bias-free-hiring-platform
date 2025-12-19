import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SkillMap } from './components/SkillMap';
import { MentorBot } from './components/MentorBot';
import { GamifiedWorld } from './components/GamifiedWorld';
import { CoursePlayer } from './components/CoursePlayer';
import { INITIAL_SKILLS, INITIAL_GOALS } from './constants';
import { UserStats, SkillNode } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'map' | 'course'>('dashboard');
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 12,
    xp: 250,
    mood: '🙂',
    focusTime: 45
  });
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [activeSkill, setActiveSkill] = useState<SkillNode | null>(null);

  const handleToggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
    setUserStats(prev => ({ ...prev, xp: prev.xp + 10 })); // Simple gamification
  };

  const handleUpdateMood = (mood: string) => {
    setUserStats(prev => ({ ...prev, mood }));
  };

  const handleSkillClick = (skill: SkillNode) => {
    setActiveSkill(skill);
    setView('course');
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-neon-purple selection:text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Navigation - Glassmorphism */}
      <aside className="w-full md:w-20 lg:w-64 bg-space-dark/60 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 z-20 sticky top-0 md:h-screen shadow-2xl">
        <div className="mb-8 text-2xl text-neon-purple font-bold">
            <i className="fas fa-rocket"></i> <span className="hidden lg:inline ml-2 text-white">AntiG</span>
        </div>
        
        <nav className="flex-1 w-full space-y-2 px-2">
            {[
                { id: 'dashboard', icon: 'fa-home', label: 'Dashboard' },
                { id: 'map', icon: 'fa-project-diagram', label: 'Skill Map' },
                { id: 'reports', icon: 'fa-chart-line', label: 'Reports' },
                { id: 'settings', icon: 'fa-cog', label: 'Settings' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => item.id !== 'reports' && item.id !== 'settings' && setView(item.id as any)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                        view === item.id 
                            ? 'bg-neon-purple/80 text-white shadow-lg shadow-neon-purple/20 backdrop-blur-sm' 
                            : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <div className="w-6 text-center"><i className={`fas ${item.icon}`}></i></div>
                    <span className="hidden lg:block ml-3 text-sm font-medium">{item.label}</span>
                    {view === item.id && <div className="ml-auto w-1 h-1 bg-white rounded-full lg:hidden"></div>}
                </button>
            ))}
        </nav>

        <div className="mt-auto p-4 w-full">
            <div className="bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 p-[1px] rounded-xl backdrop-blur-sm">
                 <div className="bg-space-dark/80 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">XP Level 5</p>
                    <div className="w-full bg-gray-700/50 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full shadow-[0_0_10px_rgba(255,255,255,0.7)]" style={{ width: '60%' }}></div>
                    </div>
                 </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative scroll-smooth scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-transparent">
            <div className="backdrop-blur-sm p-4 rounded-2xl bg-black/10 border border-white/5 inline-block">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {view === 'dashboard' && 'Dashboard'}
                    {view === 'map' && 'Knowledge Universe'}
                    {view === 'course' && activeSkill?.name}
                </h2>
                <p className="text-sm text-gray-400">
                    {view === 'dashboard' && 'Your personalized learning path.'}
                    {view === 'map' && 'Visualize your growth.'}
                    {view === 'course' && 'Mastery Mode Active'}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <i className="fas fa-stopwatch text-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]"></i>
                    <span className="text-sm font-mono">{userStats.focusTime}m Focus</span>
                </div>
                <img 
                    src="https://picsum.photos/40/40" 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-neon-purple/50 p-0.5 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                />
            </div>
        </header>

        {/* Dynamic View Content */}
        <div className="space-y-6">
            {view === 'dashboard' && (
                <>
                    <Dashboard 
                        stats={userStats} 
                        goals={goals} 
                        skills={INITIAL_SKILLS} 
                        onToggleGoal={handleToggleGoal} 
                        onUpdateMood={handleUpdateMood}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-64">
                             <h3 className="text-lg font-bold mb-4 px-2">Your Learning World</h3>
                             <GamifiedWorld xp={userStats.xp} />
                        </div>
                        <div className="h-64 bg-space-dark/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent pointer-events-none"></div>
                            <h3 className="text-xl font-bold mb-2 z-10">Continue Learning</h3>
                            <p className="text-gray-300 text-sm mb-4 max-w-xs z-10">You were in the middle of "Linear Equations". Ready to dive back in?</p>
                            <button 
                                onClick={() => { setActiveSkill(INITIAL_SKILLS[1]); setView('course'); }}
                                className="px-6 py-2 bg-white/90 text-black font-bold rounded-full hover:scale-105 hover:bg-white transition-all z-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                Resume <i className="fas fa-play ml-2"></i>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {view === 'map' && (
                <div className="h-[600px]">
                    <SkillMap skills={INITIAL_SKILLS} onSkillClick={handleSkillClick} />
                </div>
            )}

            {view === 'course' && (
                <CoursePlayer onBack={() => setView('map')} topic={activeSkill?.name} />
            )}
        </div>

        <div className="h-20"></div> {/* Spacer for bottom */}
      </main>

      {/* Floating Mentor Bot */}
      <MentorBot />
    </div>
  );
};

export default App;