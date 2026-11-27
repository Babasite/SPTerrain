(()=>{
 const aside=document.querySelector('body>aside');
 const button=document.createElement('button');button.className='mobile-menu';button.type='button';button.textContent='☰ Menu';button.setAttribute('aria-expanded','false');aside.prepend(button);
 function close(){aside.classList.remove('mobile-open');button.setAttribute('aria-expanded','false');}
 button.addEventListener('click',()=>{const open=aside.classList.toggle('mobile-open');button.setAttribute('aria-expanded',String(open));});
 aside.addEventListener('click',e=>{if(e.target.closest('nav a,.settings button'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 const wrap=()=>{document.querySelectorAll('dialog table').forEach(t=>{if(t.parentElement.classList.contains('mobile-table-scroll'))return;const d=document.createElement('div');d.className='mobile-table-scroll';t.before(d);d.append(t);});};
 const mq=matchMedia('(max-width:1050px)');const observer=new MutationObserver(()=>{if(mq.matches)wrap();});observer.observe(document.body,{childList:true,subtree:true});mq.addEventListener('change',()=>{if(mq.matches)wrap();else{close();document.querySelectorAll('.mobile-table-scroll').forEach(d=>d.replaceWith(...d.childNodes));}});if(mq.matches)wrap();
})();
