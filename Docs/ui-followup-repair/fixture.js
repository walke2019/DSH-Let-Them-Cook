async () => {
 const native=window.fetch.bind(window); const room=await native('/dsh-group-chat/api/room').then(r=>r.json());
 window.fetch=async (...args)=>{
  if(String(args[0]).startsWith('/dsh-group-chat/api/room'))return new Response(JSON.stringify({...room,messages:Array.from({length:32},(_,i)=>({messageId:'ui-followup-'+i,roomId:'dev-team-alpha',sender:{kind:i%5?'agent':'user',id:i%5?'backend':'user',name:i%5?'滚动测试':'用户',avatar:i%5?'◇':'我'},content:i%5?'### 第 '+(i+1)+' 条\n\n这是一条浏览器临时消息，用来确认上拉时输入框不覆盖正文。\n\n- 列表 A\n- 列表 B':'用户消息 '+i,mentions:[],metadata:{},timestamp:Date.now()+i}))}),{headers:{'Content-Type':'application/json'}});
  return native(...args);
 };
 return 'fixture installed';
}
