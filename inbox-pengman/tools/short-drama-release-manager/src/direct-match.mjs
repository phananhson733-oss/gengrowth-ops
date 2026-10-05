import { ShortDramaError } from './errors.mjs';
import { withMutationLeaseRetry } from './mutation-busy-retry.mjs';

/** Apply one explicit release/Post ID choice inside one guarded Runner call. */
export async function matchReleaseDirect({actorId,chatId,key,postId,queryReleaseCandidates,humanOps}) {
 if(typeof key!=='string'||!key||typeof postId!=='string'||!postId)
  throw new ShortDramaError('mutation_shape_invalid','Direct match requires a release ID and Post ID');
 return withMutationLeaseRetry(humanOps,async()=>{
  const report=await queryReleaseCandidates({key});
  const release=report.rows.find(row=>row.release_id===key);
  const candidate=release?.candidates.find(row=>row.post_id===postId);
  if(!candidate)throw new ShortDramaError('candidate_not_available','Candidate changed, is occupied, or is outside the review window; refresh candidates');
  const preview=await humanOps.previewCaptureMatch({actorId,chatId,key,postId,
   expectedReleaseVersion:release.release_version,expectedCaptureVersion:candidate.capture_version});
  const result=await humanOps.applyPreview({actorId,chatId,receiptId:preview.receipt_id});
  return {...result,candidate};
 });
}
