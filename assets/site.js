/* Flopexa — shared page behaviour (loaded on every page after field.js, before the page's own script).
   0. motion flags  1. field mount + freeze/thaw  2. .rise reveal  3. pinned-stage morph
   4. subnav scroll-spy  5. nav menu sheet  6. data-contact wiring */
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

  /* 4. subnav spy (ignores the breadcrumb, skips hidden targets) */
  var sn=document.querySelector(".subnav");
  if(sn){
    var links=[].slice.call(sn.querySelectorAll('nav a[href^="#"]'));
    var secs=links.map(function(a){return document.querySelector(a.getAttribute("href"));});
    var spy=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting||e.target.hidden)return;var i=secs.indexOf(e.target);if(i<0)return;
      links.forEach(function(a,j){a.classList.toggle("on",j===i);});
    });},{rootMargin:"-42% 0px -52% 0px"});
    secs.forEach(function(s){if(s)spy.observe(s);});
  }

  /* 5. nav menu */
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
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("open")){set(false);btn.focus();}});
    document.addEventListener("click",function(e){if(nav.classList.contains("open")&&!nav.contains(e.target))set(false);});
    menu.addEventListener("click",function(e){if(e.target.tagName==="A")set(false);});
    (mq.addEventListener?mq.addEventListener("change",function(){set(false);}):mq.addListener(function(){set(false);}));
  }

  /* 6. contact (authored hidden; shown only with an address) */
  var CONTACT=document.documentElement.getAttribute("data-contact")||"";
  if(CONTACT){
    document.querySelectorAll("a[data-contact]").forEach(function(a){
      a.href="mailto:"+CONTACT+(a.dataset.subject?"?subject="+encodeURIComponent(a.dataset.subject):"");
      a.hidden=false;
    });
    document.querySelectorAll("[data-contact-col]").forEach(function(c){c.hidden=false;});
  }
})();
