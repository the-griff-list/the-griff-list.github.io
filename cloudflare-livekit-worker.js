// Cloudflare Worker for The Grifflist LiveKit tokens.
// Required env vars/secrets: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL, BROADCASTER_PASSWORD, ALLOWED_ORIGIN
const ROOM = "the-grifflist-live";
const enc = new TextEncoder();
function b64url(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
async function sign(payload, keyText) {
 const header = b64url(enc.encode(JSON.stringify({alg:'HS256',typ:'JWT'})));
 const body = b64url(enc.encode(JSON.stringify(payload)));
 const input = header + '.' + body;
 const key = await crypto.subtle.importKey('raw', enc.encode(keyText), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
 const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(input)));
 return input + '.' + b64url(sig);
}
function cors(origin, env) { return {'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://the-griff-list.github.io','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Broadcaster-Password','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'}; }
export default { async fetch(request, env) {
 const origin = request.headers.get('Origin') || '';
 const headers = cors(origin, env);
 if (origin && origin !== (env.ALLOWED_ORIGIN || 'https://the-griff-list.github.io')) return new Response(JSON.stringify({error:'Origin not allowed'}), {status:403,headers});
 if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
 const url = new URL(request.url);
 if (url.pathname !== '/token' || request.method !== 'POST') return new Response(JSON.stringify({error:'Not found'}),{status:404,headers});
 if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET || !env.LIVEKIT_URL || !env.LIVEKIT_URL.startsWith('wss://')) return new Response(JSON.stringify({error:'LiveKit Worker is not configured correctly'}),{status:503,headers});
 let body; try { body = await request.json(); } catch { return new Response(JSON.stringify({error:'Invalid JSON'}),{status:400,headers}); }
 if (body.role !== 'publisher' && body.role !== 'viewer') return new Response(JSON.stringify({error:'Invalid token role'}),{status:400,headers});
 const role = body.role;
 if (role === 'publisher' && (!env.BROADCASTER_PASSWORD || request.headers.get('X-Broadcaster-Password') !== env.BROADCASTER_PASSWORD)) return new Response(JSON.stringify({error:'Broadcaster password rejected'}),{status:403,headers});
 const now = Math.floor(Date.now()/1000); const identity = (role === 'publisher' ? 'griff-broadcaster-' : 'viewer-') + crypto.randomUUID();
 const video = {roomJoin:true,room:ROOM,canSubscribe:true,canPublish:role==='publisher',canPublishData:role==='publisher'};
 const token = await sign({iss:env.LIVEKIT_API_KEY,sub:identity,nbf:now-5,iat:now,exp:now+(role==='publisher'?3600:600),name:role==='publisher'?'The Grifflist Broadcaster':'The Grifflist Viewer',video},env.LIVEKIT_API_SECRET);
 return new Response(JSON.stringify({token,serverUrl:env.LIVEKIT_URL,role,room:ROOM}),{status:200,headers});
 }};
