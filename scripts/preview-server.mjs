import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {propose,samplePlaces} from '../lib/planner.ts';
const root=path.resolve('.sites-runtime/browser-dist');
http.createServer(async(req,res)=>{
 if(req.url==='/api/plan'){
  res.setHeader('Content-Type','application/json');if(req.method==='GET')return res.end(JSON.stringify({gpt:false}));
  let raw='';for await(const chunk of req)raw+=chunk;
  try{const data=JSON.parse(raw);if(!data.sample){res.statusCode=503;return res.end(JSON.stringify({error:'로컬 화면 미리보기입니다. 예시 코스 체험을 이용해 주세요.'}));}const prefs={...data.preferences,region:'울산 삼산동 · 예시',lat:35.539,lng:129.334};const courses=propose(samplePlaces(),prefs);return res.end(JSON.stringify({courses,preferences:prefs,mode:'sample',notice:'체험용 가상 장소입니다. 실제 방문용 코스가 아니에요.',availableCategories:[]}));}catch{res.statusCode=400;return res.end('{}');}
 }
 const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.statusCode=403;return res.end();}if(url.pathname==='/')file=path.join(root,'index.html');if(!fs.existsSync(file)){res.statusCode=404;return res.end();}res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(fs.readFileSync(file));
}).listen(4173,'127.0.0.1',()=>console.log('Local visual preview: http://127.0.0.1:4173'));
