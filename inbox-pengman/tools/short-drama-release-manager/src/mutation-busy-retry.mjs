import { setTimeout as sleep } from 'node:timers/promises';

const RETRY_DELAYS_MS = [250, 750, 1500, 3000];

/** Retry only a lease acquisition that failed before the operation began. */
export async function withMutationLeaseRetry(humanOps, operation, {delays=RETRY_DELAYS_MS, wait=sleep}={}) {
 for (let attempt=0; ; attempt++) {
  let entered=false;
  try {
   return await humanOps.withMutationLock((...args)=>{
    entered=true;
    return operation(...args);
   });
  } catch(error) {
   if (entered || error?.code!=='mutation_busy' || attempt>=delays.length) throw error;
   await wait(delays[attempt]);
  }
 }
}
