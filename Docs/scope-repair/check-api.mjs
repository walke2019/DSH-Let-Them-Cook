import {writeFile} from 'node:fs/promises';
const sessionId='session-c53be637-3ccf-4e58-8c42-3138c6eaf89d';
const body={type:'client-request',rpcId:'scope-repair-check',method:'session.models',payload:{sessionId}};
const response=await fetch('http://127.0.0.1:3080/api/session.models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const result=await response.json();
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify({input:body,httpStatus:response.status,response:result},null,2));
console.log(JSON.stringify(result.result.ok ? {ok:true,keys:Object.keys(result.result)}:result.result));
process.exitCode=result.result.ok?0:1;
