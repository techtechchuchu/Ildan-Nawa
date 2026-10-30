import {categories,distance,type Place,type Preferences} from './planner.ts';
export type KakaoDocument={id:string;place_name:string;category_name:string;category_group_code:string;address_name:string;road_address_name:string;phone:string;x:string;y:string;place_url:string};
const cache=new Map<string,{until:number;places:Place[]}>();
const inflight=new Map<string,Promise<Place[]>>();
type Search={category:string;group?:string;query?:string;page?:number;offsetLat?:number;offsetLng?:number};
export function convertKakaoDocument(d:KakaoDocument,category:string,center:{lat:number;lng:number}):Place|null{
 const lat=Number(d.y),lng=Number(d.x);if(!/^\d+$/.test(d.id)||!d.place_name?.trim()||!Number.isFinite(lat)||!Number.isFinite(lng)||distance(center,{lat,lng})>3000||!categories[category])return null;
 if(d.place_name?.replace(/\s/g,'')==='에이엠2'&&((d.road_address_name||'')+' '+(d.address_name||'')).includes('왕생로66번길'))return null;
 if(category==='식사'&&(d.category_group_code!=='FD6'||/아이스크림|식품판매|식료품|편의점|떡,한과|떡집|떡판매|술집|유흥주점|단란주점|호프,요리주점|바,칵테일|포장마차/.test(d.category_name)))return null;
 if(category==='카페'&&d.category_group_code!=='CE7')return null;
 if(category==='산책'&&!/공원|산책|둘레길|수목원/.test(d.category_name))return null;
 if(category==='놀거리'&&!/볼링|방탈출|보드게임|오락|체험|백화점|복합쇼핑몰|쇼핑몰|쇼핑센터/.test(d.category_name))return null;
 return {id:`kakao/${d.id}`,name:d.place_name.trim(),lat,lng,category,...categories[category],indoor:category!=='산책',url:`https://place.map.kakao.com/${d.id}`,address:d.road_address_name||d.address_name,phone:d.phone||undefined,source:'kakao',sourceCategory:d.category_name,priceBasis:'category_estimate'};
}
async function request(search:Search,p:Preferences,key:string):Promise<Place[]>{
 const params=new URLSearchParams({x:String(p.lng+(search.offsetLng||0)),y:String(p.lat+(search.offsetLat||0)),radius:'3000',size:'15',sort:'distance',page:String(search.page||1)});
 if(search.group)params.set('category_group_code',search.group);if(search.query)params.set('query',search.query);
 const endpoint=search.query?'keyword':'category';
 let response:Response;try{response=await fetch(`https://dapi.kakao.com/v2/local/search/${endpoint}.json?${params}`,{headers:{Authorization:`KakaoAK ${key}`},signal:AbortSignal.timeout(10000),cache:'no-store'});}catch{throw new Error('카카오 장소 검색 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.');}
 if(!response.ok){if(response.status===401)throw new Error('카카오 REST API 키를 확인해 주세요.');if(response.status===403)throw new Error('카카오디벨로퍼스에서 카카오맵 사용 설정과 키 권한을 확인해 주세요.');if(response.status===429)throw new Error('카카오 장소 검색 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요.');throw new Error('카카오 장소 검색에 연결하지 못했어요.');}
 const body=await response.json() as {documents?:KakaoDocument[]};return (body.documents||[]).flatMap(d=>{const place=convertKakaoDocument(d,search.category,p);return place?[place]:[];});
}
export async function searchKakaoPlaces(p:Preferences,key:string):Promise<Place[]>{
 const selected=p.activities.length?p.activities:Object.keys(categories);const searches:Search[]=[];
 if(selected.includes('식사'))for(const page of [1,2,3])searches.push({category:'식사',group:'FD6',page,...(p.food&&p.food!=='상관없어요'?{query:p.food}:{})});
 if(selected.includes('카페')){for(const page of [1,2,3])searches.push({category:'카페',group:'CE7',page});if(/예쁜|감성|분위기|인테리어/.test(p.request))for(const query of ['감성카페','예쁜 카페'])searches.push({category:'카페',group:'CE7',query});}
 for(const [offsetLat,offsetLng] of [[0.006,0],[-0.006,0],[0,0.007],[0,-0.007]]){if(selected.includes('식사'))searches.push({category:'식사',group:'FD6',offsetLat,offsetLng,...(p.food&&p.food!=='상관없어요'?{query:p.food}:{})});if(selected.includes('카페'))searches.push({category:'카페',group:'CE7',offsetLat,offsetLng});}
 if(selected.includes('산책'))searches.push({category:'산책',query:'공원'});
 if(selected.includes('문화')){searches.push({category:'문화',group:'CT1'});if(/영화|극장/.test(p.request))searches.push({category:'문화',query:'영화관'});}
 if(selected.includes('놀거리'))for(const query of ['볼링장','방탈출','보드게임','백화점','복합쇼핑몰','쇼핑몰','업스퀘어'])searches.push({category:'놀거리',query});
 const cacheKey=JSON.stringify([p.lat.toFixed(3),p.lng.toFixed(3),selected,p.food,/예쁜|감성|분위기|인테리어/.test(p.request),/영화|극장/.test(p.request)]);const hit=cache.get(cacheKey);if(hit&&hit.until>Date.now())return hit.places;if(inflight.has(cacheKey))return inflight.get(cacheKey)!;
 const task=(async()=>{const results=await Promise.allSettled(searches.map(s=>request(s,p,key)));const found=new Map<string,Place>();for(const r of results)if(r.status==='fulfilled')for(const place of r.value)found.set(place.id,place);
 if(!found.size){const failure=results.find(r=>r.status==='rejected');if(failure?.status==='rejected')throw failure.reason;}
 const counts:Record<string,number>={};const places=[...found.values()].sort((a,b)=>distance(p,a)-distance(p,b)).filter(place=>{counts[place.category]=(counts[place.category]||0)+1;return counts[place.category]<=100;});if(cache.size>=40)cache.clear();cache.set(cacheKey,{until:Date.now()+600000,places});return places;})();inflight.set(cacheKey,task);try{return await task;}finally{inflight.delete(cacheKey);}
}

