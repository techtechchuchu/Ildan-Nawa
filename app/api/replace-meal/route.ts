import {schedule,samplePlaces,type Preferences,type Course} from '../../../lib/planner';
import {searchKakaoPlaces} from '../../../lib/kakao-place-search';
import {searchPlaces} from '../../../lib/place-search';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const {preferences:p,course,index,excluded=[]}=await req.json() as {preferences:Preferences;course:Course;index:number;excluded:string[]};
  if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||!Number.isFinite(p.budget)||!Array.isArray(p.activities)||!course||!Array.isArray(course.stops)||course.stops.length>5||!Number.isInteger(index)||course.stops[index]?.category!=='식사'||!Array.isArray(excluded)||excluded.length>100)return Response.json({error:'코스 정보를 확인해 주세요.'},{status:400});
  const demo=course.stops[index].id.startsWith('sample-');
  const searchPrefs={...p,activities:['식사']};
  const key=process.env.KAKAO_REST_API_KEY||process.env.kakao_rest_api_key;
  const candidates=demo?samplePlaces():key?await searchKakaoPlaces(searchPrefs,key):await searchPlaces(searchPrefs);
  const used=new Set([...course.stops.map(s=>s.id),...excluded]);
  for(const place of candidates){
   if(place.category!=='식사'||used.has(place.id))continue;
   const label=place.name+' '+(place.sourceCategory||'');
   if(/배달전문|배달 전문|포장전문|포장 전문|배달·포장|배달포장|배달및포장/.test(label))continue;
   if(p.budget<=20000&&/횟집|생선회|회센터|참치전문|오마카세|대게|킹크랩|장어구이|한우|스테이크/.test(label))continue;
   const cost=/횟집|생선회|회센터|참치|오마카세|대게|한우|스테이크/.test(label)?35000:/고기|삼겹살|갈비|초밥|스시|장어/.test(label)?22000:/국밥|분식|김밥|국수|라면|패스트푸드|햄버거/.test(label)?10000:15000;
   const list=course.stops.map((s,i)=>i===index?{...place,cost}:s);
   const updated=schedule(list,p,course.title,course.subtitle,course.id);
   if(updated.stops.length===list.length&&updated.stops.every((s,i)=>s.id===list[i].id))return Response.json({course:updated});
  }
  return Response.json({error:'시간과 예산에 맞는 다른 식당을 찾지 못했어요. 조건을 바꿔 다시 시도해 주세요.'},{status:404});
 }catch{return Response.json({error:'다른 식당을 찾지 못했어요. 잠시 후 다시 시도해 주세요.'},{status:503});}
}
