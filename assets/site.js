/* Flopexa — shared page behaviour (loaded on every page after field.js, before the page's own script).
   0. motion flags  1. field mount + freeze/thaw  2. .rise reveal  3. pinned-stage morph
   4. nav menu sheet  5. site search (/ or Ctrl/⌘K) */
(function(){
  /* 0. flags */
  var still=false;
  try{still=matchMedia("(prefers-reduced-motion: reduce)").matches||localStorage.getItem("flopexaStill")==="1";}catch(e){}
  window.flopexaStill=still;

  /* 1. fields, freeze / thaw */
  if(window.FlopexaField)FlopexaField.mountAll();
  /* freeze draws one settled frame (dt 2 s: field.js uses dt only to ease particles to their targets and to complete
     the 1.3 s fade-in and any running morph), so a canvas that was off-screen, mid-fade or mid-morph at 1.6 s still
     holds a finished frame when it scrolls into view; the same settled frame is redrawn after a resize. */
  function frame(it){try{it._tk(2);}catch(e){}}
  function freeze(it){if(it._tk)return;it._tk=it.tick;it._sz=it.size;it.tick=function(){};it.size=function(){it._sz();frame(it);};frame(it);}
  function thaw(it){if(!it._tk)return;it.tick=it._tk;it.size=it._sz;it._tk=it._sz=null;}
  function setStill(v){
    still=v;window.flopexaStill=v;
    if(window.FlopexaField)FlopexaField.all().forEach(v?freeze:thaw);
    document.querySelectorAll(".motion").forEach(function(b){b.setAttribute("aria-pressed",v);b.textContent=v?"Play motion":"Pause motion";});
    try{localStorage.setItem("flopexaStill",v?"1":"0");}catch(e){}
  }
  if(still)setTimeout(function(){setStill(true);},1600);
  document.querySelectorAll(".motion").forEach(function(b){b.addEventListener("click",function(){setStill(!still);});});

  /* 2. reveal */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{rootMargin:"0px 0px -12% 0px"});
  document.querySelectorAll(".rise").forEach(function(n){io.observe(n);});

  /* 3. stage morph */
  var sc=document.querySelector(".stage-sticky canvas");
  if(sc&&window.FlopexaField){
    var f=FlopexaField.get(sc),narrow=matchMedia("(max-width:860px)").matches;
    var po=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting||!f)return;var d=e.target.dataset;
      f.set(d.shape,d.color);f.view(parseFloat(d.zoom)||1,parseFloat(d.cx));
      if(still&&f._tk)f._tk(2);
    });},{rootMargin:narrow?"-40% 0px -30% 0px":"-45% 0px -45% 0px"});
    document.querySelectorAll(".panel[data-shape]").forEach(function(n){po.observe(n);});
  }

  /* 4. nav menu */
  var nav=document.querySelector(".nav"),btn=document.querySelector(".nav-menu"),menu=document.getElementById("site-nav");
  if(nav&&btn&&menu){
    var mq=matchMedia("(max-width:1023px)");
    function set(open){
      nav.classList.toggle("open",open);btn.setAttribute("aria-expanded",open);
      document.body.classList.toggle("nav-open",open);
      if(!open&&document.activeElement&&menu.contains(document.activeElement))btn.focus();
      /* the sheet precedes the button in DOM order, so on open move focus to its first row; Tab then walks the sheet */
      if(open&&mq.matches){var a=menu.querySelector("a:not([hidden])");if(a)a.focus();}
    }
    /* Tab out of the header (after the Menu button) or Shift+Tab before the brand: close the sheet so the element that
       receives focus is not under it; focus stays where it went (activeElement is outside #site-nav during focusout) */
    nav.addEventListener("focusout",function(e){
      if(nav.classList.contains("open")&&mq.matches&&e.relatedTarget&&!nav.contains(e.relatedTarget))set(false);
    });
    btn.addEventListener("click",function(){set(!nav.classList.contains("open"));});
    nav.querySelectorAll(".nav-close,.nav-scrim").forEach(function(x){x.addEventListener("click",function(){set(false);btn.focus();});});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("open")){set(false);btn.focus();}});
    document.addEventListener("click",function(e){if(nav.classList.contains("open")&&!nav.contains(e.target))set(false);});
    menu.addEventListener("click",function(e){if(e.target.tagName==="A")set(false);});
    (mq.addEventListener?mq.addEventListener("change",function(){set(false);}):mq.addListener(function(){set(false);}));
  }

  /* 5. site search: the header button, "/" or Ctrl/⌘K opens a dialog over every page */
  var PAGES=[
    ["index.html","Home","Connect intelligence. Transform operations.",""],
    ["platform.html","Platform","Five capabilities on one AI platform.","capabilities overview"],
    ["platform.html#connect","Connect","One governed data layer for data, apps and teams.","unified data sso roles sync workspaces"],
    ["platform.html#integrate","Integrate","Connect your LIMS and your own apps.","lims connector api webhooks rest"],
    ["platform.html#analyze","Analyze","AI for genomic and operational data.","analytics dashboards kpi explainable genomics reproducible"],
    ["platform.html#automate","Automate","Workflows that run themselves, with people in control.","workflow builder triggers approvals human in the loop"],
    ["platform.html#operate","Operate","Secure, compliant and ready to scale.","security encryption audit compliance monitoring deployment on-premise residency"],
    ["solutions.html","Solutions","Four ways we put the platform to work.","industries sectors"],
    ["genomics.html","Genomics & Life Sciences","Sequencing reads to reviewed results.","dna sequencing bioinformatics lims labs ai modules"],
    ["solutions.html#ai-data-analytics","AI & Data Analytics","Data into decisions: pipelines, dashboards, ML.","machine learning reporting kpi automation"],
    ["solutions.html#web-design-development","Web Design & Development","Fast, responsive websites built around your business.","website seo cms"],
    ["solutions.html#app-design-development","App Design & Development","Web and mobile apps your users will adopt.","ios android mobile product"],
    ["human-wgs.html","Run Human WGS","Upload FASTQ; stop at BAM, VCF, annotated VCF or interpretation.","pipeline whole genome fastq bam vcf run online"],
    ["human-wgs.html#interpret","Interpret a VCF","Start at interpretation with a VCF you already have.","annotated vcf gvcf report acmg"],
    ["genomics.html?sp=human#tests","Human tests","WGS, WES, NIPT and PGT-A.","whole exome prenatal preimplantation"],
    ["genomics.html?sp=horse#tests","Horse tests","Whole genome, parentage, hereditary panel, performance markers.","equine stud"],
    ["genomics.html?sp=camel#tests","Camel tests","Whole genome, parentage, hereditary panel, racing markers.","camel racing"],
    ["research.html","Research AI","Multi-omics data in; testable hypotheses out.","module research labs omics"],
    ["therapeutics.html","Therapeutics AI","Ranked targets, biomarkers and responder groups.","module drug discovery"],
    ["stem-cell.html","Stem Cell AI","Single-cell data in; cell types and lineages out.","module ipsc regenerative"],
    ["veterinary.html","Veterinary AI","Whole-genome tests for horses and camels.","module vet animal breeders"],
    ["clinical.html","Clinical AI","A reviewable variant report with sources.","module clinical genetics therapy"],
    ["integrations.html","Integrations","Connect your LIMS and your own apps.","lims custom applications api webhooks"],
    ["resources.html","Resources","Customer stories and guides.","case studies stories guides"],
    ["about.html","About","We connect intelligence to real operations.","company values"],
    ["contact.html","Contact / Get started","Talk to our team.","email get started demo contact us"]];
  var sb=document.querySelectorAll("[data-search]");
  if(sb.length&&window.HTMLDialogElement){
    var I='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    var dlg=document.createElement("dialog");dlg.className="search";dlg.setAttribute("aria-label","Search the site");
    dlg.innerHTML='<div class="search-bar">'+I+'<input type="search" placeholder="Search Flopexa" aria-label="Search" aria-controls="search-results" autocomplete="off" spellcheck="false"><button type="button" class="search-close">Close</button></div><ul id="search-results" aria-live="polite"></ul>';
    document.body.appendChild(dlg);
    var q=dlg.querySelector("input"),ul=dlg.querySelector("ul"),sel=0,hits=[];
    function esc(t){return t.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
    function render(){
      var w=q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      hits=w.length?PAGES.filter(function(p){var t=(p[1]+" "+p[2]+" "+p[3]).toLowerCase();return w.every(function(x){return t.indexOf(x)>=0;});})
                    :PAGES.filter(function(p){return /^(platform|solutions|genomics|human-wgs|contact)\.html$/.test(p[0]);});
      hits=hits.slice(0,8);sel=0;
      ul.innerHTML=hits.length?hits.map(function(p,i){return '<li><a href="'+p[0]+'"'+(i?'':' class="on"')+'><b>'+esc(p[1])+'</b><small>'+esc(p[2])+'</small></a></li>';}).join("")
                              :'<li class="search-none">No pages match. Try “VCF”, “LIMS” or “horse”.</li>';
    }
    function mark(){[].forEach.call(ul.querySelectorAll("a"),function(a,i){a.classList.toggle("on",i===sel);if(i===sel)a.scrollIntoView({block:"nearest"});});}
    function open(){if(dlg.open)return;q.value="";render();dlg.showModal();q.focus();}
    [].forEach.call(sb,function(b){b.addEventListener("click",open);});
    dlg.querySelector(".search-close").addEventListener("click",function(){dlg.close();});
    dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close();if(e.target.closest&&e.target.closest("a"))dlg.close();});
    q.addEventListener("input",render);
    q.addEventListener("keydown",function(e){
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!hits.length)return;sel=(sel+(e.key==="ArrowDown"?1:hits.length-1))%hits.length;mark();}
      else if(e.key==="Enter"&&hits[sel]){e.preventDefault();dlg.close();location.href=hits[sel][0];}
      else if(e.key==="Escape"){e.preventDefault();dlg.close();}   /* a search field would only clear itself on the first Esc */
    });
    document.addEventListener("keydown",function(e){
      var t=e.target,typing=t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if((e.key==="k"||e.key==="K")&&(e.metaKey||e.ctrlKey)){e.preventDefault();open();}
      else if(e.key==="/"&&!typing&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();open();}
    });
  }
})();
