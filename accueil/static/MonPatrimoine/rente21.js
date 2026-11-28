(function(root){
const ok=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
function reserve(d){const cfg=d.reserveGoals16||{},security=cfg.security??20000,projects=cfg.pleasure??15000;const cash=(d.assets||[]).filter(a=>a.type==='Liquidités');if(![security,projects,...cash.map(a=>a.value)].every(ok))return null;const term=a=>/compte\s+a\s+terme/i.test(`${a.account||''} ${a.name||''}`.normalize('NFD').replace(/[\u0300-\u036f]/g,''));const total=cash.reduce((s,a)=>s+a.value,0),locked=cash.filter(term).reduce((s,a)=>s+a.value,0),available=Math.max(0,total-locked-security-projects);const assigned=d.rente21?.assigned;return {total,locked,security,projects,available,assigned:ok(assigned)?assigned:null,effective:ok(assigned)?Math.min(assigned,available):0};}
function smooth(r,w,f){if(![r,w,f].every(ok))return null;const gap=Math.max(0,w-f/12);return {budget:(r+f)/12,balance:r+f-12*w,months:gap?r/gap:null};}
root.rente21={reserve,smooth};if(typeof module!=='undefined')module.exports=root.rente21;
})(globalThis);
