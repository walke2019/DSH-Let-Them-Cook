/** One plugin SSE connection per client, shared by the dock and conversation. */
let source:EventSource|null=null
const listeners=new Set<(event:MessageEvent)=>void>()
export function subscribeGroupChat(listener:(event:MessageEvent)=>void):()=>void {
  listeners.add(listener)
  if(!source){
    source=new EventSource('/dsh-group-chat/api/events')
    source.onmessage=event=>{for(const callback of listeners)callback(event)}
  }
  return ()=>{listeners.delete(listener);if(!listeners.size){source?.close();source=null}}
}
export function disposeGroupChatEvents(){source?.close();source=null;listeners.clear()}
