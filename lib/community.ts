import type {Course,Place,Preferences} from './planner';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
const storageKey='ildan-community-session';
export type RankKind='course'|'place';
export type RankEntry={id:string;kind:RankKind;item_key:string;title:string;region:string;payload:{names?:string[]};votes:number;created_at:string};
type Session={access_token:string;refresh_token:string;expires_at:number;user:{id:string}};
function headers(token?:string){return {apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'};}
function assertConfig(){if(!url||!key)throw new Error('커뮤니티 연결을 준비 중이에요.');}
async function session():Promise<Session>{ throw new Error('추천은 회원가입 후 이용할 수 있어요. 간편 로그인은 준비 중입니다.'); }
async function idFor(kind:RankKind,ids:string[]){const bytes=new TextEncoder().encode(kind+':'+ids.join('|'));const digest=await crypto.subtle.digest('SHA-256',bytes);return kind+':'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function rankings(kind:RankKind):Promise<RankEntry[]>{
 assertConfig();const q=new URLSearchParams({select:'id,kind,item_key,title,region,payload,votes,created_at',kind:'eq.'+kind,votes:'gt.0',order:'votes.desc,created_at.desc',limit:'50'});
 const r=await fetch(url+'/rest/v1/community_rankings?'+q,{headers:headers(),cache:'no-store'});if(!r.ok)throw new Error('순위를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');return r.json();
}
export async function recommend(kind:RankKind,value:Course|Place,prefs:Preferences):Promise<void>{
 assertConfig();
 const stops=kind==='course'?(value as Course).stops:[value as Place];
 if(!stops.length||stops.some(s=>!s.id||s.id.startsWith('sample')))throw new Error('예시 코스나 예시 장소는 추천할 수 없어요.');
 const ids=stops.map(s=>s.id),itemKey=await idFor(kind,ids);
 const stored=JSON.parse(localStorage.getItem('ildan-community-voted')||'[]') as string[];
 if(stored.includes(itemKey))throw new Error('이 브라우저에서 이미 추천했어요.');
 const auth=await session();
 const query=new URLSearchParams({select:'id',item_key:'eq.'+itemKey,limit:'1'});
 const find=async()=>{const r=await fetch(url+'/rest/v1/community_items?'+query,{headers:headers(auth.access_token)});if(!r.ok)throw new Error('추천 항목을 찾지 못했어요.');return (await r.json()) as {id:string}[];};
 let item=(await find())[0];
 if(!item){
  const title=(kind==='course'?stops.map(s=>s.name).join(' → '):stops[0].name).slice(0,120);
  const region=(prefs.region||'지역 미상').slice(0,120);
  const body={kind,item_key:itemKey,title,region,payload:{names:stops.map(s=>s.name.slice(0,100))},created_by:auth.user.id};
  const res=await fetch(url+'/rest/v1/community_items?select=id',{method:'POST',headers:{...headers(auth.access_token),Prefer:'return=representation'},body:JSON.stringify(body)});
  if(res.ok)item=((await res.json()) as {id:string}[])[0];else if(res.status===409)item=(await find())[0];else throw new Error('추천 항목을 등록하지 못했어요.');
 }
 if(!item)throw new Error('추천 항목을 등록하지 못했어요.');
 const r=await fetch(url+'/rest/v1/community_votes',{method:'POST',headers:headers(auth.access_token),body:JSON.stringify({item_id:item.id,user_id:auth.user.id})});
 if(!r.ok){if(r.status===409){localStorage.setItem('ildan-community-voted',JSON.stringify([...stored,itemKey].slice(-500)));throw new Error('이 브라우저에서 이미 추천했어요.');}throw new Error('추천을 반영하지 못했어요.');}
 localStorage.setItem('ildan-community-voted',JSON.stringify([...stored,itemKey].slice(-500)));
}
