(function(root){
const ok=Number.isFinite;
function alerts(d,m){const b=finance15.bilan(d,m),v=d.v14?.months?.[m],t=b.target,c=v?finance15.calc(!v.closed&&t!==null?{...v,target:t}:v):null,r=[];const add=(name,message)=>r.push([name,message]);if(b.deficit===null)add('Capital','Données de préservation incomplètes');else if(b.deficit>0)add('Préservation','Déficit patrimonial');if(b.delta<0)add('Capital initial','Capital entamé');if(ok(v?.wanted)&&c&&v.wanted>c.salary)add('Rente','Salaire autorisé inférieur au souhait');for(const a of d.assets||[])if(!ok(a.value)||a.updated?.slice(0,7)!==m)add(a.name,'Valorisation à vérifier');if(!v?.closed)add(m,'Clôture à effectuer');for(const e of d.v16?.events||[])if(e.date?.slice(0,7)===m&&ok(e.expected)&&e.expected>0&&(!ok(e.received)||e.received<e.expected))add(e.name,'Échéance à vérifier');return r;}
function scenarios(args,margin,spread){if(!ok(spread)||spread<0)return null;return [-spread,0,spread].map(delta=>finance15.projection(args[0],args[1]+delta,...args.slice(2),margin));}
root.pilotage22={alerts,scenarios};if(typeof module!=='undefined')module.exports=root.pilotage22;
})(globalThis);
