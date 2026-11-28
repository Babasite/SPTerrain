/* Validation et chiffrement communs, format MP18 conservé. */
(()=>{
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validPayload(s){return s.length%4===0 && s.length/4*3-(s.endsWith('==')?2:s.endsWith('=')?1:0)<=500000;}
function validate(x){
 if(!record(x)||!['assets','history','income','tasks'].every(k=>Array.isArray(x[k])))throw Error('Structure de sauvegarde invalide.');
 if(!x.assets.every(a=>record(a)&&typeof a.name==='string'&&typeof a.type==='string'&&['value','cost'].every(k=>a[k]==null||(typeof a[k]==='number'&&Number.isFinite(a[k])))))throw Error('Placement invalide.');
 for(const k of ['income','tasks'])if(!x[k].every(record))throw Error('Liste invalide : '+k);
 if(x.rent!==undefined&&!record(x.rent))throw Error('Paramètres de rente invalides.');
 if(x.v14!==undefined&&(!record(x.v14)||!record(x.v14.months)||!Array.isArray(x.v14.institutions)))throw Error('Historique ou établissements invalides.');
 if(x.v18!==undefined&&!record(x.v18))throw Error('Documents invalides.');
 if(x.v18?.documents!==undefined&&(!Array.isArray(x.v18.documents)||!x.v18.documents.every(d=>record(d)&&typeof d.name==='string'&&typeof d.content==='string'&&/^data:[^,]*;base64,[A-Za-z0-9+/]*={0,2}$/i.test(d.content)&&validPayload(d.content.split(',')[1]))))throw Error('Document joint invalide ou trop volumineux.');
 return x;
}
const enc=new TextEncoder(),dec=new TextDecoder();
async function derive(p,salt){const k=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encrypt(x,p){validate(x);if(p.length<12)throw Error('Utiliser au moins 12 caractères.');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await derive(p,salt),enc.encode(JSON.stringify(x)));return {format:'MP18',salt:Array.from(salt),iv:Array.from(iv),cipher:Array.from(new Uint8Array(cipher))};}
const bytes=(x,n)=>Array.isArray(x)&&(n===undefined||x.length===n)&&x.every(v=>Number.isInteger(v)&&v>=0&&v<=255);
async function decrypt(x,p){if(!record(x)||x.format!=='MP18'||!bytes(x.salt,16)||!bytes(x.iv,12)||!bytes(x.cipher)||x.cipher.length<16)throw Error('Format chiffré invalide.');let raw;try{raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:Uint8Array.from(x.iv)},await derive(p,Uint8Array.from(x.salt)),Uint8Array.from(x.cipher));}catch{throw Error('Mot de passe incorrect ou fichier altéré.');}return validate(JSON.parse(dec.decode(raw)));}
function restore(storage,key,x){validate(x);const raw=JSON.stringify(x);storage.setItem(key,raw);return raw;}
globalThis.mpBackup23={validate,encrypt,decrypt,restore};
})();
