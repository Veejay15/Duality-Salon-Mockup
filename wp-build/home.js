(function(){
    var nav=document.querySelector('.nav');
    document.querySelector('.burger').addEventListener('click',function(){nav.classList.toggle('open');});
    nav.querySelectorAll('.links a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');});});

    // price menu tabs
    var tabs=document.querySelectorAll('.tab');
    tabs.forEach(function(t){t.addEventListener('click',function(){
      tabs.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-selected','false');});
      t.setAttribute('aria-selected','true');
      document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on');});
      t.classList.add('on');document.getElementById(t.dataset.p).classList.add('on');
    });});

    // scroll reveal, staggered within each group
    var groups=['.about .frame','.about .grid > div:last-child','.team .head-row','.team .member','.team .mother','.edu .txt','.steps .eyebrow','.steps h2','.step','.reviews .head-row','.rev','.area .grid > div','.strip .head-row','.strip .row a','.faq .grid > div','.cta-band .wrap','.contact .grid > *'];
    groups.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el,i){
      el.classList.add('reveal');if(i%4)el.classList.add('d'+(i%4));
    });});
    var els=document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){
      if(e.isIntersecting){
        var t=e.target;t.classList.add('in');io.unobserve(t);
        // hand control back to each element's own hover transitions once revealed
        setTimeout(function(){t.classList.remove('reveal','d1','d2','d3');},1500);
      }
    });},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(e){io.observe(e);});
  })();
