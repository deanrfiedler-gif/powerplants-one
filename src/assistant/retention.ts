import {cleanAssistantProposals} from './service';
// Runs for both off and simulated mode. Never deletes unresolved submissions.
export function startAssistantRetention() {
  let running=false;
  const clean=async()=>{
    if(running)return;running=true;
    try{await cleanAssistantProposals();}
    catch{console.warn('Assistant retention could not run; check the local database setup.');}
    finally{running=false;}
  };
  void clean();
  const timer=setInterval(()=>void clean(),60*60*1000);timer.unref();
  return ()=>clearInterval(timer);
}
