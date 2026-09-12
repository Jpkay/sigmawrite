import {expect,it,vi} from 'vitest';
import {chatComplete} from './openai-compatible';
it('sends the strict schema and explicit provider support requirement without enabling response repair',async()=>{
 const fetchImpl=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]})));
 const responseFormat={type:'json_schema',json_schema:{name:'test',strict:true,schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false}}};
 await chatComplete([{role:'user',content:'Test'}],{baseUrl:'https://provider.invalid/v1',apiKey:'fixture',model:'fixture',responseFormat,requireParameters:true,fetchImpl,minIntervalMs:0});
 const body=JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
 expect(body.response_format).toEqual(responseFormat);expect(body.provider).toEqual({require_parameters:true});expect(body.plugins).toBeUndefined();
});
it('preserves the existing request shape for callers without provider preferences',async()=>{
 const fetchImpl=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>new Response(JSON.stringify({choices:[{message:{content:'{}'}}]})));
 await chatComplete([],{baseUrl:'https://provider.invalid/v1',apiKey:'fixture',model:'fixture',jsonMode:true,fetchImpl,minIntervalMs:0});
 const body=JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));expect(body.provider).toBeUndefined();expect(body.response_format).toEqual({type:'json_object'});
});
