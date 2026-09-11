import {expect,it} from 'vitest';
import {mapWithConcurrency} from './map-with-concurrency';

it('limits concurrent writes while processing every value once',async()=>{
 let active=0,peak=0;
 const seen:number[]=[];
 await mapWithConcurrency([0,1,2,3,4],2,async value=>{
  active++;peak=Math.max(peak,active);
  await Promise.resolve();seen.push(value);active--;
 });
 expect(peak).toBe(2);expect(active).toBe(0);expect(seen.sort()).toEqual([0,1,2,3,4]);
});

it('does not reject until already-started writes settle, and starts no more writes',async()=>{
 let release!:()=>void;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 const error=new Error('database write failed');
 const seen:number[]=[];
 let settled=false,finished=false;
 const task=mapWithConcurrency([0,1,2,3],2,async value=>{
  seen.push(value);
  if(value===0)throw error;
  await pending;finished=true;
 });
 const outcome=task.then(()=>{settled=true;return null;},failure=>{settled=true;return failure;});
 await Promise.resolve();await Promise.resolve();
 expect(seen).toEqual([0,1]);expect(settled).toBe(false);
 release();expect(await outcome).toBe(error);expect(finished).toBe(true);expect(seen).toEqual([0,1]);
});

it.each([0,-1,NaN,Infinity,1.5])('rejects invalid concurrency %s before any work',async concurrency=>{
 let invoked=false;
 await expect(mapWithConcurrency([1],concurrency,async()=>{invoked=true;})).rejects.toThrow('positive integer');
 expect(invoked).toBe(false);
});

it('preserves even an undefined rejection',async()=>{
 await expect(mapWithConcurrency([1],1,async()=>{throw undefined;})).rejects.toBeUndefined();
});
