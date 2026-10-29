import {test} from 'node:test';
import assert from 'node:assert/strict';
import {propose,samplePlaces,schedule,minutes} from '../lib/planner.ts';
const prefs={region:'울산',lat:35.539,lng:129.334,companion:'친구와',people:2,start:'14:00',end:'19:00',budget:40000,transport:'도보',activities:[],food:'상관없어요',indoor:false,request:''};
test('three distinct sample courses remain within time and budget',()=>{const courses=propose(samplePlaces(),prefs);assert.equal(courses.length,3);assert.equal(new Set(courses.map(c=>c.stops.map(p=>p.id).join(','))).size,3);for(const c of courses){assert.ok(c.total<=prefs.budget);assert.ok(c.minutes<=300);assert.ok(minutes(c.stops.at(-1)!.departure)<=minutes(prefs.end));}});
test('cannot schedule a visit beyond deadline',()=>{const course=schedule(samplePlaces(),{...prefs,end:'14:10'},'test','','1');assert.equal(course.stops.length,0);});
test('cannot exceed a small budget or duplicate places',()=>{const places=samplePlaces();const course=schedule([...places,...places],{...prefs,budget:7000},'test','','1');assert.ok(course.total<=7000);assert.equal(new Set(course.stops.map(s=>s.id)).size,course.stops.length);});
test('indoor and excluded categories are hard constraints',()=>{const course=schedule(samplePlaces(),{...prefs,indoor:true,excluded:['카페']},'test','','1');assert.ok(course.stops.length);assert.ok(course.stops.every(s=>s.indoor&&s.category!=='카페'));});
test('overnight courses schedule correctly',()=>{const course=schedule(samplePlaces(),{...prefs,start:'23:00',end:'02:00'},'test','','1');assert.ok(course.stops.length);assert.ok(course.minutes<=180);});
