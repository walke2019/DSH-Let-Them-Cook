async () => {
 const native=window.fetch.bind(window);
 const room=await native('/dsh-group-chat/api/room').then(r=>r.json());
 window.fetch=async (...args)=>{
  if(String(args[0]).startsWith('/dsh-group-chat/api/room'))return new Response(JSON.stringify({...room,messages:Array.from({length:30},(_,i)=>({messageId:'ui-fixture-'+i,roomId:'dev-team-alpha',sender:{kind:'agent',id:'backend',name:'滚动测试（仅浏览器）',avatar:'◇'},content:'### 第 '+(i+1)+' 条\n\n这是仅用于浏览器布局验证的段落，不会保存到服务器。\n\n- 原生 Markdown 列表\n- 检查最后一条消息可见\n\n```js\nconst value = '+i+';\n```',mentions:[],metadata:{},timestamp:Date.now()+i}))}),{headers:{'Content-Type':'application/json'}});
  return native(...args);
 };
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='对话')?.click();
 return 'browser-only room fixture installed; server unchanged';
}
