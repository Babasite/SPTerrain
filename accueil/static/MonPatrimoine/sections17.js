(()=>{
let target=null;
globalThis.mpWithSection=(root,fn)=>{const previous=target;target=root||null;try{return fn()}finally{target=previous}};
globalThis.mpSection=()=>{if(!target)return null;const root=target;return {root,show:(title,body)=>{root.innerHTML=`<h3>${esc(title)}</h3>${body}`;}}};
})();

globalThis.mpReserve17=()=>globalThis.rente21.reserve(data)?.effective??null;
