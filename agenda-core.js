/* Offering-level agenda model adapted from the existing local planner. */
globalThis.RhiannonAIWorldAgendaCore=(()=>{
  function create(data){
    const offerings=data.sessions.flatMap(s=>s.offerings.flatMap((o,i)=>/^2026-10-2[5-8]$/.test(o.dateISO)&&Number.isFinite(o.start)&&Number.isFinite(o.end)&&o.end>o.start?[{s,o,i,key:s.id+'@'+o.dateISO+'@'+o.start+'-'+o.end}]:[]));
    const byKey=new Map(offerings.map(r=>[r.key,r]));if(byKey.size!==offerings.length)throw Error('Duplicate offering identity');
    const overlap=(a,b)=>a.o.dateISO===b.o.dateISO&&a.o.start<b.o.end&&b.o.start<a.o.end;
    const sorted=keys=>[...keys].map(k=>byKey.get(k)).filter(Boolean).sort((a,b)=>a.o.dateISO.localeCompare(b.o.dateISO)||a.o.start-b.o.start||a.s.rank-b.s.rank);
    const conflicts=keys=>{const rows=sorted(keys),result=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)if(overlap(rows[i],rows[j]))result.push([rows[i],rows[j]]);return result;};
    const competing=key=>{const r=byKey.get(key);return r?sorted(offerings.filter(o=>o.key!==key&&overlap(r,o)).map(o=>o.key)):[];};
    const baseline=Object.fromEntries(Object.entries(data.baselines).map(([person,ids])=>[person,ids.map(id=>{const r=offerings.find(r=>r.s.id===id);if(!r)throw Error('Missing baseline '+id);return r.key;})]));
    for(const keys of Object.values(baseline))if(conflicts(keys).length)throw Error('Starting agenda overlaps');
    function validateSelected(value){if(!Array.isArray(value)||value.length>offerings.length||value.some(k=>typeof k!=='string'||!byKey.has(k))||new Set(value).size!==value.length)throw Error('Unknown, duplicate or unscheduled offering. No saved data changed.');return [...value];}
    function validateAnswers(value){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Answers must be an object.');const result={};for(const [k,v] of Object.entries(value)){if(!/^\d+$/.test(k)||+k>=data.questions.length||typeof v!=='string'||v.length>100000)throw Error('Invalid discovery answers.');result[k]=v;}return result;}
    function readPlan(value){if(!value||!['rhiannon-ai-world-plan'].includes(value.schema)||value.version!==1||value.event!=='Oracle AI World 2026')throw Error('Choose a Rhiannon Oracle AI World Guide 2026 plan JSON. Other attendees’ plans are not accepted.');if(typeof value.notes!=='string'||value.notes.length>200000)throw Error('Invalid agenda notes.');return{selected:validateSelected(value.selected),answers:validateAnswers(value.answers),notes:value.notes};}
    return{offerings,byKey,overlap,sorted,conflicts,competing,baseline,validateSelected,validateAnswers,readPlan};
  }return{create};
})();
