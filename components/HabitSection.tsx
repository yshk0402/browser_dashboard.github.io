import React, { useEffect } from 'react';
import ActivityCalendar from 'react-activity-calendar';
import { Card } from './ui/Card';
import { Check } from 'lucide-react';
import { HabitStatus, HabitData, HeatmapDataPoint, DailyHabitStatus } from '../types';
import { INITIAL_STATUS_CARDS } from '../constants';
import { format } from 'date-fns';

const StatusCard: React.FC<{
  item: HabitStatus;
  onToggle: (id: string) => void;
}> = ({ item, onToggle }) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer select-none
        ${item.completed 
          ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-sm'}
      `}
      onClick={() => onToggle(item.id)}
    >
      <div className="flex flex-col h-full justify-between gap-4">
        <div>
          <h4 className={`font-semibold text-sm ${item.completed ? 'text-slate-200' : 'text-slate-600'}`}>
            {item.title}
          </h4>
          <p className={`text-xs mt-1 ${item.completed ? 'text-slate-400' : 'text-slate-400'}`}>
            {item.target}
          </p>
        </div>
        
        <div
          className={`
            flex items-center justify-center w-8 h-8 rounded-full ml-auto transition-all
            ${item.completed 
              ? 'bg-slate-600 text-white hover:bg-slate-500' 
              : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'}
          `}
        >
          <Check className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

interface HabitSectionProps {
  history: HabitData[];
  dailyStatus: DailyHabitStatus;
  onUpdate: (newHistory: HabitData[], newDailyStatus: DailyHabitStatus) => void;
}

export const HabitSection: React.FC<HabitSectionProps> = ({ history, dailyStatus, onUpdate }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Cards Configuration (titles, targets) - kept static for now
  const cards = INITIAL_STATUS_CARDS;

  // Reset daily status if it's a new day (Logic handled in App/Parent usually, but safety check here or handle via parent update)
  useEffect(() => {
    if (dailyStatus.date !== todayStr) {
       // We can trigger an update to reset, but ideally the parent provided correct state.
       // For this implementation, we assume parent/hooks handles the date rollover or we do it lazily on toggle.
    }
  }, [todayStr, dailyStatus.date]);

  const toggleHabit = (id: string) => {
    // If dates mismatch, we are starting a fresh day
    const isNewDay = dailyStatus.date !== todayStr;
    const currentStatus = isNewDay ? {} : dailyStatus.status;
    
    const isCompleted = !currentStatus[id];
    
    // 1. New Daily Status
    const newDailyStatus: DailyHabitStatus = {
      date: todayStr,
      status: {
        ...currentStatus,
        [id]: isCompleted
      }
    };

    // 2. New Heatmap History
    const newHistory = history.map(habit => {
        // Find the habit category
        if (habit.key === id || habit.key === id.split('-')[0]) {
          
          const existingDayIndex = habit.data.findIndex(d => d.date === todayStr);
          const newLevel = isCompleted ? 4 : 0; // 4 is darkest green
          const newDataPoint: HeatmapDataPoint = {
            date: todayStr,
            count: newLevel,
            level: newLevel
          };

          let newData = [...habit.data];
          if (existingDayIndex >= 0) {
            newData[existingDayIndex] = newDataPoint;
          } else {
            newData.push(newDataPoint);
          }
          
          return { ...habit, data: newData };
        }
        return habit;
    });

    onUpdate(newHistory, newDailyStatus);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Today's Focus</h2>
      
      {/* Top Row: Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(item => (
          <StatusCard 
            key={item.id} 
            item={{...item, completed: (dailyStatus.date === todayStr && dailyStatus.status[item.id]) || false}} 
            onToggle={toggleHabit} 
          />
        ))}
      </div>

      <h2 className="text-xl font-semibold text-slate-800 tracking-tight pt-4">Quarterly Review</h2>

      {/* Bottom Row: Heatmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {history.map((habitData: HabitData) => (
          <Card key={habitData.key} className="border-0 shadow-none bg-transparent">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">{habitData.label}</span>
            </div>
            <div className="opacity-80 hover:opacity-100 transition-opacity">
               <ActivityCalendar
                data={habitData.data}
                blockSize={10}
                blockRadius={3}
                blockMargin={4}
                fontSize={0}
                theme={{
                   light: ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#334155'],
                   dark: ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#334155'],
                }}
                showWeekdayLabels={false}
                hideColorLegend={true}
                hideTotalCount={true}
                maxLevel={4}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
