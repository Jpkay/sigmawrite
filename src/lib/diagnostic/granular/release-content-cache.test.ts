import {expect,it} from 'vitest';
import {ReleaseContentCache,type ValidatedReleaseContent} from './release-content-cache';
const content=(label:string)=>({bundle:{label,nested:{value:1}},preflight:null}) as unknown as ValidatedReleaseContent;
it('isolates namespace and version identities, freezes nested content and slides the TTL on each hit',()=>{
 let at=0;const cache=new ReleaseContentCache(()=>at,2,1000,100);
 const key=['project-a','release','checksum','taxonomy','bank'];cache.set(key,content('a'));
 expect(cache.get(['project-b',...key.slice(1)])).toBeUndefined();expect(cache.get([...key.slice(0,2),'changed',...key.slice(3)])).toBeUndefined();
 expect(Object.isFrozen(cache.get(key)!.bundle)).toBe(true);
 expect(()=>Object.assign(cache.get(key)!.bundle,{changed:true})).toThrow();
 at=99;expect(cache.get(key)).toBeDefined();
 at=198;expect(cache.get(key)).toBeDefined();
 at=298;expect(cache.get(key)).toBeUndefined();
});
it('defaults to an hour so a paced diagnostic keeps its validated content',()=>{
 let at=0;const cache=new ReleaseContentCache(()=>at);
 cache.set(['release'],content('a'));
 at=75_000;expect(cache.get(['release'])).toBeDefined();
 at+=59*60*1000;expect(cache.get(['release'])).toBeDefined();
 at+=60*60*1000;expect(cache.get(['release'])).toBeUndefined();
});
it('evicts by entry and byte bounds and declines oversized content',()=>{
 const cache=new ReleaseContentCache(()=>0,2,200);
 cache.set(['a'],content('a'));cache.set(['b'],content('b'));cache.get(['a']);cache.set(['c'],content('c'));expect(cache.get(['b'])).toBeUndefined();expect(cache.get(['a'])).toBeDefined();
 cache.set(['large'],content('x'.repeat(300)));expect(cache.get(['large'])).toBeUndefined();
 const bytes=new ReleaseContentCache(()=>0,10,100);bytes.set(['a'],content('a'));bytes.set(['b'],content('b'));expect(bytes.get(['a'])).toBeUndefined();expect(bytes.get(['b'])).toBeDefined();
});
