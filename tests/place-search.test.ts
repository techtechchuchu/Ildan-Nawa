import {test} from 'node:test';
import assert from 'node:assert/strict';
import {convertFeatures} from '../lib/place-search.ts';
const center={lat:37.5445,lng:127.0557};
const cafe={geometry:{coordinates:[127.0558,37.5446]},properties:{osm_id:123,osm_type:'N',osm_value:'cafe',name:'실제 데이터 형식 테스트',countrycode:'KR'}};
test('converts OSM identifiers to real detail links and deduplicates',()=>{const result=convertFeatures([cafe,cafe],center);assert.equal(result.length,1);assert.equal(result[0].category,'카페');assert.equal(result[0].url,'https://www.openstreetmap.org/node/123');});
test('rejects distant, unnamed and unsupported places',()=>{assert.equal(convertFeatures([{...cafe,geometry:{coordinates:[129.334,35.539]}},{...cafe,properties:{...cafe.properties,name:''}},{...cafe,properties:{...cafe.properties,osm_type:'unknown'}}],center).length,0);});
