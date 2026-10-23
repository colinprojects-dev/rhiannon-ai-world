/* Offering-level agenda model adapted from the existing local planner. */
globalThis.RhiannonAIWorldAgendaCore=(()=>{
  function create(data,personalBlocks={}){
    function validateBlocks(value){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Personal meal blocks must be an object.');const result={};for(const [id,b] of Object.entries(value)){const a=data.activities?.find(a=>a.id===id&&a.type==='meal');if(!a||!b||!Number.isInteger(b.start)||!Number.isInteger(b.end)||b.start<a.start||b.end>a.end||b.end<=b.start)throw Error('Choose a meal block within its supplied service window.');result[id]={start:b.start,end:b.end};}return result;}
    personalBlocks=validateBlocks(personalBlocks);
    const activityRecords=(data.activities||[]).filter(a=>a.type==='commitment'||(a.type==='meal'&&personalBlocks[a.id])).map(a=>{const b=personalBlocks[a.id]||a,m=t=>`${Math.floor(t/60)%12||12}:${String(t%60).padStart(2,'0')} ${t>=720?'PM':'AM'}`;return{s:{id:a.id,index:-1,rank:10000,title:a.title,why:a.type==='meal'?'Personal meal commitment chosen within the supplied service window.':'Personal or networking activity supplied by Rhiannon.',activity:a,pdfEntries:[a],tier:'Personal activity'},o:{...a,start:b.start,end:b.end,time:m(b.start)+' - '+m(b.end)+' PDT',sourceId:a.id,pdfEntry:a},i:0,key:a.id+'@'+a.dateISO+'@'+b.start+'-'+b.end};});
    const offerings=data.sessions.flatMap(s=>s.offerings.flatMap((o,i)=>/^2026-10-2[5-8]$/.test(o.dateISO)&&Number.isFinite(o.start)&&Number.isFinite(o.end)&&o.end>o.start?[{s,o,i,key:s.id+'@'+o.dateISO+'@'+o.start+'-'+o.end}]:[])).concat(activityRecords);
    const byKey=new Map(offerings.map(r=>[r.key,r]));if(byKey.size!==offerings.length)throw Error('Duplicate offering identity');
    const abs=(r,end=false)=>Date.parse(r.o.dateISO+'T00:00:00Z')/60000+(end?r.o.end:r.o.start);
    const overlap=(a,b)=>abs(a)<abs(b,true)&&abs(b)<abs(a,true);
    const sorted=keys=>[...keys].map(k=>byKey.get(k)).filter(Boolean).sort((a,b)=>a.o.dateISO.localeCompare(b.o.dateISO)||a.o.start-b.o.start||a.s.rank-b.s.rank);
    const conflicts=keys=>{const rows=sorted(keys),result=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)if(overlap(rows[i],rows[j]))result.push([rows[i],rows[j]]);return result;};
    const competing=key=>{const r=byKey.get(key);return r?sorted(offerings.filter(o=>o.key!==key&&overlap(r,o)).map(o=>o.key)):[];};
    const baseline=Object.fromEntries(Object.entries(data.baselines).map(([person,ids])=>[person,ids.map(id=>{const r=offerings.find(r=>r.s.id===id);if(!r)throw Error('Missing baseline '+id);return r.key;})]));
    for(const keys of Object.values(baseline))if(conflicts(keys).length)throw Error('Starting agenda overlaps');
    function validateSelected(value){if(!Array.isArray(value)||value.length>offerings.length||value.some(k=>typeof k!=='string'||!byKey.has(k))||new Set(value).size!==value.length)throw Error('Unknown, duplicate or unscheduled offering. No saved data changed.');return [...value];}
    function validateAnswers(value){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Answers must be an object.');const result={};for(const [k,v] of Object.entries(value)){if(!/^\d+$/.test(k)||+k>=data.questions.length||typeof v!=='string'||v.length>100000)throw Error('Invalid discovery answers.');result[k]=v;}return result;}
    function readPlan(value){if(!value||!['rhiannon-ai-world-plan'].includes(value.schema)||value.version!==1||value.event!=='Oracle AI World 2026')throw Error('Choose a Rhiannon Oracle AI World Guide 2026 plan JSON. Other attendees’ plans are not accepted.');if(typeof value.notes!=='string'||value.notes.length>200000)throw Error('Invalid agenda notes.');const blocks=validateBlocks(value.personalBlocks||{});return{selected:create(data,blocks).validateSelected(value.selected),answers:validateAnswers(value.answers),notes:value.notes,personalBlocks:blocks};}
    return{offerings,byKey,overlap,abs,sorted,conflicts,competing,baseline,validateBlocks,validateSelected,validateAnswers,readPlan};
  }return{create};
})();
