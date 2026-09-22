import { readRoute } from '../../../../../../../shared/http';
import { object,uuid } from '../../../../../../../shared/validation';
import { readReceivedFertigation } from '../../../../../../../estimating/fertigation/receiving-reads';
export const GET=readRoute((p,id,q)=>{const r=object(q,['revision_id']);return readReceivedFertigation(p,id,uuid(r.revision_id,'revision_id'));});
export const dynamic='force-dynamic';
