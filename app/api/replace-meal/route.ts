import {categories,schedule,samplePlaces,type Preferences,type Course} from '../../../lib/planner';
import {searchKakaoPlaces} from '../../../lib/kakao-place-search';
import {searchPlaces} from '../../../lib/place-search';
import {chainCafe,wantsChain,suitablePlace} from '../../../lib/place-suitability';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const {preferences:p,course,index,excluded=[]}=await req.json() as {preferences:Preferences;course:Course;index:number;excluded:string[]};
  if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||!Number.isFinite(p.budget)||!Array.isArray(p.activities)||!course||!Array.isArray(course.stops)||course.stops.length>5||!Number.isInteger(index)||!(course.stops[index]?.category in categories)||!Array.isArray(excluded)||excluded.length>100)return Response.json({error:'코스 정보를 확인해 주세요.'},{status:400});
  const demo=course.stops[index].id.startsWith('sample-');
  const category=course.stops[index].category;const searchPrefs={...p,activities:[category]};
  const key=process.env.KAKAO_REST_API_KEY||process.env.kakao_rest_api_key;
  const candidates=demo?samplePlaces():key?await searchKakaoPlaces(searchPrefs,key):await searchPlaces(searchPrefs);
  const used=new Set([...course.stops.map(s=>s.id),...excluded]);
  const nonChains=candidates.filter(x=>x.category==='카페'&&!used.has(x.id)&&suitablePlace(x,p)&&!chainCafe.test(x.name+' '+(x.sourceCategory||'')));
  for(const place of candidates){
   if(place.category!==category||used.has(place.id))continue;
   const label=place.name+' '+(place.sourceCategory||'');
   if(!suitablePlace(place,p))continue;
   if(category==='카페'&&nonChains.length>=3&&!wantsChain(p.request)&&chainCafe.test(label))continue;
   if(category==='식사'&&p.budget<=20000&&/횟집|생선회|회센터|참치전문|오마카세|대게|킹크랩|장어구이|한우|스테이크/.test(label))continue;
   const cost=category!=='식사'?place.cost:/횟집|생선회|회센터|참치|오마카세|대게|한우|스테이크/.test(label)?35000:/고기|삼겹살|갈비|초밥|스시|장어/.test(label)?22000:/국밥|분식|김밥|국수|라면|패스트푸드|햄버거/.test(label)?10000:15000;
   const list=course.stops.map((s,i)=>i===index?{...place,cost}:s);
   const updated=schedule(list,p,course.title,course.subtitle,course.id);
   if(updated.stops.length===list.length&&updated.stops.every((s,i)=>s.id===list[i].id))return Response.json({course:updated});
  }
  return Response.json({error:'시간과 예산에 맞는 다른 장소을 찾지 못했어요. 조건을 바꿔 다시 시도해 주세요.'},{status:404});
 }catch{return Response.json({error:'다른 식당을 찾지 못했어요. 잠시 후 다시 시도해 주세요.'},{status:503});}
}
