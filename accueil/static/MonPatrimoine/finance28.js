(function(root){
const ok=x=>typeof x==='number'&&Number.isFinite(x);
function xirr(flows){if(flows.length<2||flows.some(f=>!ok(f.amount)||!Number.isFinite(Date.parse(f.date))))return null;let a=[...flows].sort((a,b)=>a.date.localeCompare(b.date)),t=Date.parse(a[0].date), signs=a.filter(f=>f.amount).map(f=>Math.sign(f.amount));if(signs.filter((s,i)=>i&&s!==signs[i-1]).length!==1||a[0].date===a.at(-1).date)return null;let npv=r=>a.reduce((s,f)=>s+f.amount/Math.pow(1+r,(Date.parse(f.date)-t)/31557600000),0),lo=-.9999,hi=100;if(npv(lo)*npv(hi)>=0)return null;for(let i=0;i<100;i++){let m=(lo+hi)/2;if(npv(m)*npv(lo)>0)lo=m;else hi=m}return (lo+hi)/2*100}
function costs(rows){let qty=0,cost=0,real=0;for(let r of rows){if(!ok(r.qty)||r.qty<=0||!ok(r.amount)||r.amount<0)return null;if(r.type==='buy'){qty+=r.qty;cost+=r.amount}else if(r.type==='sell'){if(r.qty>qty)return null;let c=cost*r.qty/qty;cost-=c;qty-=r.qty;real+=r.amount-c}else return null}return {qty,cost,real}}
function realReturn(rate,months,indices){if(!ok(rate)||!months.every(m=>ok(indices[m])&&indices[m]>-100))return null;return ((1+rate/100)/months.reduce((p,m)=>p*(1+indices[m]/100),1)-1)*100}
const api={xirr,costs,realReturn};if(typeof module!=='undefined')module.exports=api;else root.finance28=api;
})(globalThis);
