import fs from 'node:fs';
let file='app/page.tsx';let s=fs.readFileSync(file,'utf8');
s=s.replace('.then(d=>setGpt(d.gpt))','.then(d=>setGpt((d as {gpt:boolean}).gpt))');
s=s.replace("const d=await r.json();if(!r.ok)throw new Error(d.error);setRegions(d.results)","const d=await r.json() as {error:string;results:{name:string;lat:number;lng:number}[]};if(!r.ok)throw new Error(d.error);setRegions(d.results)");
s=s.replace("const d=await r.json();if(!r.ok)throw new Error(d.error);setResult(d)","const d=await r.json() as Result & {error:string};if(!r.ok)throw new Error(d.error);setResult(d)");
s=s.replace('const next=[{...c,id:', 'const next=[{...c,preferences:result?.preferences||prefs,id:');
s=s.replace("t==='카페 빼줘'?{activities:course.stops.filter(s=>s.category!=='카페').map(s=>s.category)}","t==='카페 빼줘'?{excluded:[...(result.preferences.excluded||[]),'카페'],activities:course.stops.filter(s=>s.category!=='카페').map(s=>s.category)}");
s=s.replace('preferences:prefs,mode:c.stops','preferences:c.preferences||prefs,mode:c.stops');fs.writeFileSync(file,s);
file='app/api/plan/route.ts';s=fs.readFileSync(file,'utf8').replace('const body=await req.json();','const body=await req.json() as {preferences:Preferences;sample?:boolean;modification?:string;previous?:unknown};');fs.writeFileSync(file,s);
