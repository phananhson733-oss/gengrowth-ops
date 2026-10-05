import test from 'node:test';
import assert from 'node:assert/strict';
import { withMutationLeaseRetry } from '../src/mutation-busy-retry.mjs';

test('busy lease acquisition gets bounded retries before any operation starts',async()=>{
 let attempts=0,operations=0;const waits=[];
 const humanOps={withMutationLock:async operation=>{attempts++;if(attempts<3)throw Object.assign(new Error('busy'),{code:'mutation_busy'});return operation();}};
 const result=await withMutationLeaseRetry(humanOps,()=>{operations++;return 'verified';},{delays:[5,10],wait:async ms=>waits.push(ms)});
 assert.equal(result,'verified');assert.equal(operations,1);assert.deepEqual(waits,[5,10]);
});
test('an error after entering the lease is never replayed',async()=>{
 let operations=0,waits=0;
 const humanOps={withMutationLock:operation=>operation()};
 await assert.rejects(withMutationLeaseRetry(humanOps,()=>{operations++;throw Object.assign(new Error('busy downstream'),{code:'mutation_busy'});},{delays:[1],wait:async()=>{waits++;}}),e=>e.code==='mutation_busy');
 assert.equal(operations,1);assert.equal(waits,0);
});
test('a persistently busy lease stops after the retry budget without entering the operation',async()=>{
 let attempts=0,operations=0;
 const humanOps={withMutationLock:async()=>{attempts++;throw Object.assign(new Error('busy'),{code:'mutation_busy'});}};
 await assert.rejects(withMutationLeaseRetry(humanOps,()=>{operations++;},{delays:[1,1],wait:async()=>{}}),e=>e.code==='mutation_busy');
 assert.equal(attempts,3);assert.equal(operations,0);
});
