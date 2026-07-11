const DAY=86_400_000;
const dateKey=(ms:number)=>new Date(ms).toISOString().slice(0,10);
export function calculateStreak(activityDates:string[],nowMs:number){const dates=new Set(activityDates);let cursor=Date.parse(`${dateKey(nowMs)}T00:00:00.000Z`);if(!dates.has(dateKey(cursor)))cursor-=DAY;let streak=0;while(dates.has(dateKey(cursor))){streak++;cursor-=DAY;}return streak;}
