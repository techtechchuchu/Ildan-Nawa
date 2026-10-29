import {categories,distance,type Place,type Preferences} from './planner.ts';
type Feature={geometry?:{coordinates?:number[]};properties?:{osm_id?:number;osm_type?:string;osm_key?:string;osm_value?:string;name?:string;city?:string;street?:string;housenumber?:string;countrycode?:string}};
const cache=new Map<string,{until:number;places:Place[]}>();
const running=new Map<string,Promise<Place[]>>();
const filters=['osm.amenity.restaurant','osm.amenity.cafe','osm.amenity.fast_food','osm.leisure.park','osm.tourism.museum','osm.tourism.gallery','osm.leisure.bowling_alley','osm.leisure.amusement_arcade','osm.amenity.cinema'];
export function convertFeatures(features:Feature[],center:{lat:number;lng:number}):Place[]{
 const found=new Map<string,Place>();
 for(const f of features){const t=f.properties;const coords=f.geometry?.coordinates;if(!t?.name?.trim()||!t.osm_id||!coords||coords.length<2)continue;const [lng,lat]=coords;if(!Number.isFinite(lat)||!Number.isFinite(lng)||distance(center,{lat,lng})>3000)continue;if(t.countrycode&&t.countrycode.toLowerCase()!=='kr')continue;
 const kind=t.osm_type==='N'?'node':t.osm_type==='W'?'way':t.osm_type==='R'?'relation':undefined;if(!kind)continue;
 const category=t.osm_value==='cafe'?'카페':['restaurant','fast_food'].includes(t.osm_value||'')?'식사':t.osm_value==='park'?'산책':['museum','gallery','cinema'].includes(t.osm_value||'')?'문화':['bowling_alley','amusement_arcade'].includes(t.osm_value||'')?'놀거리':undefined;if(!category)continue;
 const id=`${kind}/${t.osm_id}`;found.set(id,{id,name:t.name.trim(),lat,lng,category,...categories[category],indoor:category!=='산책',address:[t.city,t.street,t.housenumber].filter(Boolean).join(' '),url:`https://www.openstreetmap.org/${id}`});
 }
 const counts:Record<string,number>={};return [...found.values()].sort((a,b)=>distance(center,a)-distance(center,b)).filter(p=>{counts[p.category]=(counts[p.category]||0)+1;return counts[p.category]<=8;});
}
export async function searchPlaces(p:Preferences):Promise<Place[]>{
 const key=`${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;const hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.places;if(running.has(key))return running.get(key)!;
 const task=(async()=>{const dy=3000/111320,dx=dy/Math.cos(p.lat*Math.PI/180);const params=new URLSearchParams({lat:String(p.lat),lon:String(p.lng),limit:'60',location_bias_scale:'0',bbox:[p.lng-dx,p.lat-dy,p.lng+dx,p.lat+dy].join(','),include:filters.join(',')});
 let response:Response;
 try{response=await fetch((process.env.PHOTON_URL||'https://photon.komoot.io/api/')+'?'+params,{headers:{'User-Agent':'IldannawaDemo/1.0 (+https://github.com/techtechchuchu/Ildan-Nawa)'},signal:AbortSignal.timeout(12000),cache:'no-store'});}catch{throw new Error('장소 검색 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.');}
 if(!response.ok)throw new Error('장소 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
 const data=await response.json() as {features?:Feature[]};const places=convertFeatures(data.features||[],p);if(cache.size>=40)cache.clear();cache.set(key,{until:Date.now()+600000,places});return places;
 })();running.set(key,task);try{return await task;}finally{running.delete(key);}
}
