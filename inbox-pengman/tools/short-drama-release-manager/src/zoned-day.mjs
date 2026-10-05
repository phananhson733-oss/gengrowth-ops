// A plan date is a wall-calendar day. Keep its boundary separate from the
// Beijing day used by collection and analytics, including at US DST changes.
export function isValidTimeZone(timeZone) {
 if(typeof timeZone!=='string'||!timeZone||timeZone.trim()!==timeZone)return false;
 try { new Intl.DateTimeFormat('en-US',{timeZone}); return true; }
 catch { return false; }
}

const formatter = timeZone => new Intl.DateTimeFormat('en-US',{
 timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',
});
const parts = (format,instant) => Object.fromEntries(format.formatToParts(new Date(instant)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
const isoDay = value => `${value.year}-${String(value.month).padStart(2,'0')}-${String(value.day).padStart(2,'0')}`;

export function zonedDay(instant,timeZone) {
 const ms=typeof instant==='number'?instant:Date.parse(instant);
 if(!Number.isFinite(ms)||!isValidTimeZone(timeZone))return null;
 return isoDay(parts(formatter(timeZone),ms));
}

export function zonedDayStart(day,timeZone) {
 const date=Date.parse(`${day}T00:00:00Z`);
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==day||!isValidTimeZone(timeZone))return null;
 const format=formatter(timeZone);
 let instant=date;
 for(let i=0;i<4;i++){
  const wall=parts(format,instant);
  const shown=Date.UTC(wall.year,wall.month-1,wall.day,wall.hour,wall.minute,wall.second);
  const delta=shown-date;
  if(delta===0)return instant;
  instant-=delta;
 }
 const wall=parts(format,instant);
 return isoDay(wall)===day&&wall.hour===0&&wall.minute===0&&wall.second===0?instant:null;
}

export function nextDay(day) {
 const ms=Date.parse(`${day}T00:00:00Z`);
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===day?new Date(ms+86_400_000).toISOString().slice(0,10):null;
}
