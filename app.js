(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("cardCanvas");
  const ctx = canvas.getContext("2d");
  const stage = $("stage");
  const selectionBox = $("selectionBox");

  const state = {
    orientation: "portrait",
    zoom: 0.60,
    primary: "#0f5fa8",
    accent: "#d62828",
    selected: null,
    drag: null,
    logo: null,
    photo: null,
    signature: null,
    elements: []
  };

  const fields = ["institution","address","website","phone","studentName","studentId","className","roll","group","session","blood","guardian","emergency"];

  const baseElements = () => [
    {id:"bg", type:"rect", x:0,y:0,w:900,h:1200,fill:"#ffffff",locked:true},
    {id:"header",type:"rect",x:0,y:0,w:900,h:215,fill:state.primary,locked:true},
    {id:"accent",type:"rect",x:0,y:1120,w:900,h:80,fill:state.accent,locked:true},
    {id:"logo",type:"image",source:"logo",x:60,y:38,w:100,h:100,fit:"contain",locked:false},
    {id:"inst",type:"text",x:180,y:53,w:650,h:42,text:"BAF Shaheen College Dhaka",fontSize:31,font:"Arial",weight:"700",align:"left",fill:"#ffffff"},
    {id:"addr",type:"text",x:180,y:103,w:650,h:28,text:"Dhaka Cantonment, Dhaka - 1206",fontSize:18,font:"Arial",weight:"400",align:"left",fill:"#eaf4ff"},
    {id:"photo",type:"image",source:"photo",x:315,y:255,w:270,h:330,fit:"cover"},
    {id:"photoBorder",type:"rect",x:309,y:249,w:282,h:342,fill:"transparent",stroke:state.primary,strokeWidth:4},
    {id:"name",type:"text",x:80,y:625,w:740,h:45,text:"MD EMON AHMED APON",fontSize:29,font:"Arial",weight:"800",align:"center",fill:state.primary},
    {id:"idbar",type:"rect",x:170,y:695,w:560,h:60,fill:state.accent,radius:12},
    {id:"id",type:"text",x:195,y:711,w:510,h:30,text:"Student ID: 241151",fontSize:22,font:"Arial",weight:"800",align:"center",fill:"#ffffff"},
    {id:"details",type:"text",x:90,y:805,w:720,h:250,text:"Class: XI - XII\nGroup: Science\nRoll: 241151\nSession: 2026\nBlood Group: B(+)\nGuardian: MD ASHADUL ISLAM",fontSize:21,font:"Arial",weight:"500",align:"left",fill:"#172033",lineHeight:1.48},
    {id:"emergency",type:"text",x:80,y:1140,w:740,h:36,text:"Emergency Contact: 01736354709",fontSize:21,font:"Arial",weight:"800",align:"center",fill:"#ffffff"}
  ];

  function resizeCanvas() {
    if(state.orientation === "portrait"){ canvas.width=900; canvas.height=1200; }
    else { canvas.width=1200; canvas.height=900; }
    stage.style.width = canvas.width + "px";
    stage.style.height = canvas.height + "px";
    render();
  }

  function value(id){ return $(id).value.trim(); }

  function applyDataToElements(){
    const map = {
      inst: value("institution"),
      addr: value("address"),
      name: value("studentName"),
      id: "Student ID: " + value("studentId"),
      details:
        "Class: " + value("className") +
        "\nGroup: " + value("group") +
        "\nRoll: " + value("roll") +
        "\nSession: " + value("session") +
        "\nBlood Group: " + value("blood") +
        "\nGuardian: " + value("guardian"),
      emergency: "Emergency Contact: " + value("emergency")
    };
    state.elements.forEach(el => { if(map[el.id] !== undefined) el.text = map[el.id]; });
  }

  function loadInputs(){
    $("institution").value = state.elements.find(x=>x.id==="inst")?.text || "Institution";
    $("address").value = state.elements.find(x=>x.id==="addr")?.text || "";
    $("studentName").value = state.elements.find(x=>x.id==="name")?.text || "";
    const idText = state.elements.find(x=>x.id==="id")?.text || "";
    $("studentId").value = idText.replace(/^Student ID:\s*/i,"");
    const d = state.elements.find(x=>x.id==="details")?.text || "";
    const get = key => (d.match(new RegExp("^"+key+"\\s*:\\s*(.*)$","mi"))||[])[1] || "";
    $("className").value=get("Class"); $("group").value=get("Group"); $("roll").value=get("Roll");
    $("session").value=get("Session"); $("blood").value=get("Blood Group"); $("guardian").value=get("Guardian");
    $("emergency").value=(state.elements.find(x=>x.id==="emergency")?.text||"").replace(/^Emergency Contact:\s*/i,"");
  }

  function roundRect(c,x,y,w,h,r){
    r=Math.min(r||0,w/2,h/2); c.beginPath();
    c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
  }

  function drawText(el){
    ctx.save();
    ctx.fillStyle=el.fill||"#111827";
    ctx.font=`${el.weight||"400"} ${el.fontSize||24}px ${el.font||"Arial"}`;
    ctx.textAlign=el.align||"left"; ctx.textBaseline="top";
    const lines=String(el.text||"").split("\n");
    const lh=(el.fontSize||24)*(el.lineHeight||1.2);
    let y=el.y;
    for(const line of lines){
      let x=el.x;
      if(el.align==="center") x=el.x+el.w/2;
      if(el.align==="right") x=el.x+el.w;
      ctx.fillText(line,x,y);
      y+=lh;
    }
    ctx.restore();
  }

  function drawImage(el){
    const img = el.source==="logo" ? state.logo : el.source==="photo" ? state.photo : state.signature;
    if(!img){
      ctx.save();ctx.fillStyle="#e8edf3";ctx.fillRect(el.x,el.y,el.w,el.h);
      ctx.fillStyle="#7b8798";ctx.font="700 18px Arial";ctx.textAlign="center";ctx.fillText(el.source==="logo"?"LOGO":"STUDENT PHOTO",el.x+el.w/2,el.y+el.h/2-9);ctx.restore();return;
    }
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
    let dw=el.w,dh=el.h,dx=el.x,dy=el.y;
    if(el.fit==="contain"){const s=Math.min(el.w/iw,el.h/ih);dw=iw*s;dh=ih*s;dx=el.x+(el.w-dw)/2;dy=el.y+(el.h-dh)/2;}
    else {const s=Math.max(el.w/iw,el.h/ih);dw=iw*s;dh=ih*s;dx=el.x+(el.w-dw)/2;dy=el.y+(el.h-dh)/2;}
    ctx.save(); if(el.clipRadius){roundRect(ctx,el.x,el.y,el.w,el.h,el.clipRadius);ctx.clip();}
    ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
  }

  function drawCode(el){
    // Deterministic visual code pattern for card identification.
    const n=21, cell=Math.min(el.w,el.h)/n;
    let seed=0; for(const ch of (el.text||"ID")) seed=(seed*31+ch.charCodeAt(0))>>>0;
    ctx.save();ctx.fillStyle="#fff";ctx.fillRect(el.x,el.y,cell*n,cell*n);ctx.fillStyle="#111";
    const finder=(ox,oy)=>{ctx.fillRect(el.x+ox*cell,el.y+oy*cell,7*cell,7*cell);ctx.fillStyle="#fff";ctx.fillRect(el.x+(ox+1)*cell,el.y+(oy+1)*cell,5*cell,5*cell);ctx.fillStyle="#111";ctx.fillRect(el.x+(ox+2)*cell,el.y+(oy+2)*cell,3*cell,3*cell)};
    finder(0,0);finder(14,0);finder(0,14);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const inFinder=(x<7&&y<7)||(x>=14&&y<7)||(x<7&&y>=14); if(inFinder)continue;
      seed=(seed*1664525+1013904223)>>>0;
      if(seed%3===0)ctx.fillRect(el.x+x*cell,el.y+y*cell,cell+.2,cell+.2);
    } ctx.restore();
  }

  function drawElement(el){
    if(el.type==="rect"){
      ctx.save(); if(el.fill && el.fill!=="transparent"){ctx.fillStyle=el.fill;roundRect(ctx,el.x,el.y,el.w,el.h,el.radius||0);ctx.fill();}
      if(el.stroke){ctx.strokeStyle=el.stroke;ctx.lineWidth=el.strokeWidth||2;roundRect(ctx,el.x,el.y,el.w,el.h,el.radius||0);ctx.stroke();} ctx.restore();
    } else if(el.type==="line"){
      ctx.save();ctx.strokeStyle=el.stroke||"#333";ctx.lineWidth=el.strokeWidth||3;ctx.beginPath();ctx.moveTo(el.x,el.y);ctx.lineTo(el.x+el.w,el.y+el.h);ctx.stroke();ctx.restore();
    } else if(el.type==="text") drawText(el);
    else if(el.type==="image") drawImage(el);
    else if(el.type==="code") drawCode(el);
  }

  function render(){
    applyDataToElements();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    state.elements.forEach(drawElement);
    updateSelection();
    $("canvasTitle").textContent=(state.orientation==="portrait"?"Portrait":"Landscape")+" ID Card";
    $("canvasSize").textContent=`${canvas.width} × ${canvas.height} px`;
    $("zoomLabel").textContent=Math.round(state.zoom*100)+"%";
    stage.style.transform=`scale(${state.zoom})`;
  }

  function elementAt(x,y){
    for(let i=state.elements.length-1;i>=0;i--){
      const el=state.elements[i]; if(el.locked)continue;
      const w=el.w||40,h=el.h||40;
      if(x>=el.x&&x<=el.x+w&&y>=el.y&&y<=el.y+h)return el;
    } return null;
  }

  function canvasPoint(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
  }

  canvas.addEventListener("pointerdown",e=>{
    const p=canvasPoint(e), el=elementAt(p.x,p.y);
    state.selected=el?.id||null; updateSelection();
    if(el){canvas.setPointerCapture(e.pointerId);state.drag={id:el.id,dx:p.x-el.x,dy:p.y};}
    render();
  });
  canvas.addEventListener("pointermove",e=>{
    if(!state.drag)return;const p=canvasPoint(e),el=state.elements.find(x=>x.id===state.drag.id);if(!el)return;
    el.x=Math.max(0,Math.min(canvas.width-(el.w||0),p.x-state.drag.dx));
    el.y=Math.max(0,Math.min(canvas.height-(el.h||0),p.y-state.drag.dy));render();
  });
  canvas.addEventListener("pointerup",()=>state.drag=null);
  canvas.addEventListener("pointercancel",()=>state.drag=null);

  function updateSelection(){
    const el=state.elements.find(x=>x.id===state.selected);
    if(!el){selectionBox.classList.add("hidden");$("selectedType").textContent="None";$("elementEditor").innerHTML='<p>Select an element on the card to edit it.</p>';return;}
    selectionBox.classList.remove("hidden");
    selectionBox.style.left=el.x+"px";selectionBox.style.top=el.y+"px";selectionBox.style.width=(el.w||20)+"px";selectionBox.style.height=(el.h||20)+"px";
    $("selectedType").textContent=el.type.toUpperCase();
    buildEditor(el);
  }

  function buildEditor(el){
    let html="";
    const row=(label,field,type="text",val="")=>`<div class="editor-row"><label>${label}</label><input data-field="${field}" type="${type}" value="${esc(val)}"></div>`;
    html+=row("X","x","number",Math.round(el.x));html+=row("Y","y","number",Math.round(el.y));
    if(el.type!=="line"){html+=row("Width","w","number",Math.round(el.w||0));html+=row("Height","h","number",Math.round(el.h||0));}
    if(el.type==="text"){html+=`<div class="editor-row"><label>Text</label><textarea data-field="text" rows="4" style="width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--surface2);color:var(--text)">${esc(el.text||"")}</textarea></div>`;html+=row("Font size","fontSize","number",el.fontSize||24);html+=row("Weight","weight","text",el.weight||"400");html+=`<div class="editor-row"><label>Align</label><select data-field="align" style="width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--surface2);color:var(--text)"><option ${el.align==="left"?"selected":""}>left</option><option ${el.align==="center"?"selected":""}>center</option><option ${el.align==="right"?"selected":""}>right</option></select></div>`;html+=row("Text color","fill","color",el.fill||"#111827");}
    if(el.type==="rect"){html+=row("Fill","fill","color",el.fill==="transparent"?"#ffffff":el.fill||"#ffffff");html+=row("Radius","radius","number",el.radius||0);}
    if(el.type==="line"){html+=row("Line width","strokeWidth","number",el.strokeWidth||3);html+=row("Line color","stroke","color",el.stroke||"#333333");}
    if(el.type==="image"){html+=`<div class="editor-row"><label>Fit</label><select data-field="fit" style="width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--surface2);color:var(--text)"><option ${el.fit==="contain"?"selected":""}>contain</option><option ${el.fit==="cover"?"selected":""}>cover</option></select></div>`;}
    html+=`<button class="delete-btn" id="deleteSelected">Delete element</button>`;
    $("elementEditor").innerHTML=html;
    $("elementEditor").querySelectorAll("[data-field]").forEach(inp=>{
      inp.addEventListener("input",()=>{let v=inp.value;if(inp.type==="number")v=Number(v);el[inp.dataset.field]=v;render();});
      inp.addEventListener("change",()=>{let v=inp.value;if(inp.type==="number")v=Number(v);el[inp.dataset.field]=v;render();});
    });
    $("deleteSelected").onclick=()=>{state.elements=state.elements.filter(x=>x.id!==el.id);state.selected=null;render();};
  }

  function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}

  function newId(prefix="el"){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);}

  function addElement(type){
    const id=newId(type), common={id,x:120,y:120,w:300,h:70};
    if(type==="text")Object.assign(common,{type,text:"New Text",fontSize:28,font:"Arial",weight:"700",align:"left",fill:state.primary});
    if(type==="rect")Object.assign(common,{type,fill:"#e9eef5",radius:10});
    if(type==="line")Object.assign(common,{type,w:300,h:0,stroke:state.primary,strokeWidth:4});
    if(type==="code")Object.assign(common,{type,w:150,h:150,text:value("studentId")||"ID"});
    state.elements.push(common);state.selected=id;render();
  }

  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addElement(b.dataset.add));
  $("addTextBtn").onclick=()=>addElement("text");

  document.querySelectorAll("[data-orientation]").forEach(b=>b.onclick=()=>{
    state.orientation=b.dataset.orientation;document.querySelectorAll(".seg").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    if(state.orientation==="landscape") transformLandscape(); else state.elements=baseElements();
    resizeCanvas();
  });

  function transformLandscape(){
    const old=state.elements; state.elements=baseElements();
    // A clean landscape preset.
    state.elements.forEach(el=>{
      if(el.id==="header"){el.w=1200;el.h=180}
      if(el.id==="accent"){el.y=820;el.w=1200;el.h=80}
      if(el.id==="logo"){el.x=45;el.y=40;el.w=95;el.h=95}
      if(el.id==="inst"){el.x=165;el.y=45;el.w=950}
      if(el.id==="addr"){el.x=165;el.y=95;el.w=950}
      if(el.id==="photo"){el.x=60;el.y=245;el.w=300;el.h=400}
      if(el.id==="photoBorder"){el.x=54;el.y=239;el.w=312;el.h=412}
      if(el.id==="name"){el.x=420;el.y=280;el.w=690;el.h=50}
      if(el.id==="idbar"){el.x=500;el.y=355;el.w=510;el.h=60}
      if(el.id==="id"){el.x=515;el.y=370;el.w=480}
      if(el.id==="details"){el.x=440;el.y=450;el.w=600;el.h=300}
      if(el.id==="emergency"){el.x=400;el.y=835;el.w=760}
    });
  }

  fields.forEach(id=>$(id).addEventListener("input",render));
  $("primaryColor").addEventListener("input",()=>{state.primary=$("primaryColor").value;state.elements.forEach(e=>{if(e.id==="header"||e.id==="photoBorder")e.fill=state.primary;if(e.id==="photoBorder")e.stroke=state.primary;if(e.id==="name")e.fill=state.primary});render();});
  $("accentColor").addEventListener("input",()=>{state.accent=$("accentColor").value;state.elements.forEach(e=>{if(e.id==="accent")e.fill=state.accent;if(e.id==="idbar")e.fill=state.accent});render();});

  function readImage(file, target){
    if(!file)return;const reader=new FileReader();reader.onload=()=>{
      const img=new Image();img.onload=()=>{state[target]=img;render();};img.src=reader.result;
      state[target+"Data"]=reader.result;
    };reader.readAsDataURL(file);
  }
  $("logoInput").onchange=e=>readImage(e.target.files[0],"logo");
  $("photoInput").onchange=e=>readImage(e.target.files[0],"photo");
  $("signatureInput").onchange=e=>readImage(e.target.files[0],"signature");

  function serialize(){
    return JSON.stringify({version:1,orientation:state.orientation,primary:state.primary,accent:state.accent,elements:state.elements,logoData:state.logoData||null,photoData:state.photoData||null,signatureData:state.signatureData||null},null,2);
  }
  $("saveBtn").onclick=()=>{
    localStorage.setItem("campusIdDesign",serialize());alert("Design saved on this device.");
  };
  $("loadBtn").onclick=()=>{
    const raw=localStorage.getItem("campusIdDesign");
    if(!raw){alert("No saved design found.");return;} loadDesign(JSON.parse(raw));
  };
  function loadDesign(d){
    state.orientation=d.orientation||"portrait";state.primary=d.primary||"#0f5fa8";state.accent=d.accent||"#d62828";state.elements=d.elements||baseElements();
    $("primaryColor").value=state.primary;$("accentColor").value=state.accent;
    if(d.logoData)loadDataImage(d.logoData,"logo");if(d.photoData)loadDataImage(d.photoData,"photo");if(d.signatureData)loadDataImage(d.signatureData,"signature");
    document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x.dataset.orientation===state.orientation));resizeCanvas();loadInputs();render();
  }
  function loadDataImage(data,target){const img=new Image();img.onload=()=>{state[target]=img;render()};img.src=data;state[target+"Data"]=data}

  $("resetBtn").onclick=()=>{if(confirm("Reset the current design?")){state.orientation="portrait";state.primary="#0f5fa8";state.accent="#d62828";state.elements=baseElements();state.logo=state.photo=state.signature=null;state.logoData=state.photoData=state.signatureData=null;$("primaryColor").value=state.primary;$("accentColor").value=state.accent;document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x.dataset.orientation==="portrait"));resizeCanvas();loadInputs();render();}};
  $("zoomIn").onclick=()=>{state.zoom=Math.min(1.2,state.zoom+.05);render()};$("zoomOut").onclick=()=>{state.zoom=Math.max(.25,state.zoom-.05);render()};

  $("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("campusTheme",document.body.classList.contains("dark")?"dark":"light")};
  if(localStorage.getItem("campusTheme")==="dark")document.body.classList.add("dark");

  function downloadPNG(){
    applyDataToElements();render();
    canvas.toBlob(blob=>{
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
      const safe=(value("studentName")||"student-id-card").replace(/[^a-z0-9_-]+/gi,"-").replace(/^-|-$/g,"");
      a.download=(safe||"student-id-card")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    },"image/png");
  }
  $("downloadBtn").onclick=downloadPNG;$("downloadBtn2").onclick=downloadPNG;
  $("printBtn").onclick=()=>{const url=canvas.toDataURL("image/png");const w=window.open("","_blank");if(!w)return;w.document.write(`<html><head><title>ID Card</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:90vw;max-height:90vh}</style></head><body><img src="${url}"></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),400)};

  document.querySelectorAll("[data-template]").forEach(btn=>btn.onclick=()=>{
    const t=btn.dataset.template;state.elements=baseElements();
    if(t==="modern"){state.elements.find(e=>e.id==="header").h=170;state.elements.find(e=>e.id==="header").fill=state.primary;state.elements.find(e=>e.id==="photo").clipRadius=24;state.elements.find(e=>e.id==="photo").x=70;state.elements.find(e=>e.id==="photo").y=285;state.elements.find(e=>e.id==="photo").w=250;state.elements.find(e=>e.id==="photo").h=310;state.elements.find(e=>e.id==="photoBorder").x=64;state.elements.find(e=>e.id==="photoBorder").y=279;state.elements.find(e=>e.id==="photoBorder").w=262;state.elements.find(e=>e.id==="photoBorder").h=322;state.elements.find(e=>e.id==="name").x=370;state.elements.find(e=>e.id==="name").y=310;state.elements.find(e=>e.id==="name").w=450;state.elements.find(e=>e.id==="name").align="left";state.elements.find(e=>e.id==="idbar").x=370;state.elements.find(e=>e.id==="idbar").y=390;state.elements.find(e=>e.id==="idbar").w=430;state.elements.find(e=>e.id==="id").x=390;state.elements.find(e=>e.id==="id").y=405;state.elements.find(e=>e.id==="details").x=370;state.elements.find(e=>e.id==="details").y=480;state.elements.find(e=>e.id==="details").w=460;}
    if(t==="minimal"){state.elements.find(e=>e.id==="header").h=150;state.elements.find(e=>e.id==="header").fill="#ffffff";state.elements.find(e=>e.id==="inst").fill=state.primary;state.elements.find(e=>e.id==="addr").fill="#64748b";state.elements.find(e=>e.id==="photo").y=210;state.elements.find(e=>e.id==="photoBorder").y=204;state.elements.find(e=>e.id==="name").y=580;state.elements.find(e=>e.id==="idbar").fill=state.primary;state.elements.find(e=>e.id==="accent").fill="#ffffff";state.elements.find(e=>e.id==="emergency").fill=state.primary;}
    state.selected=null;render();
  });

  // CSV parser: handles quoted fields and commas.
  let csvRows=[];
  $("csvInput").onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    const text=await file.text();csvRows=parseCSV(text);
    $("csvStatus").textContent=csvRows.length?`${csvRows.length} student row(s) loaded.`:"CSV is empty.";
    $("useCsvBtn").disabled=!csvRows.length;
  };
  function parseCSV(text){
    const rows=[];let row=[],cell="",quote=false;
    for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
      if(c==='"'&&quote&&n==='"'){cell+='"';i++;continue}
      if(c==='"'){quote=!quote;continue}
      if(c===','&&!quote){row.push(cell.trim());cell="";continue}
      if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&n==='\n')i++;row.push(cell.trim());cell="";if(row.some(Boolean))rows.push(row);row=[];continue}
      cell+=c;
    }
    row.push(cell.trim());if(row.some(Boolean))rows.push(row);
    if(!rows.length)return [];
    const headers=rows[0].map(h=>h.toLowerCase().replace(/[^a-z0-9]+/g," ").trim());
    return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
  }
  $("useCsvBtn").onclick=()=>{
    const r=csvRows[0];if(!r)return;
    const find=(...names)=>{for(const n of names){const k=Object.keys(r).find(x=>x===n||x.includes(n));if(k)return r[k]}return""};
    const vals={studentName:find("name","student name"),studentId:find("student id","id"),className:find("class"),roll:find("roll"),group:find("group"),session:find("session"),blood:find("blood group","blood"),guardian:find("guardian"),emergency:find("emergency")};
    Object.entries(vals).forEach(([k,v])=>{if(v)$(k).value=v});render();alert("First CSV row applied to the card.");
  };

  // JSON export/import by keyboard shortcut for advanced users.
  window.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();$("saveBtn").click();}
  });

  state.elements=baseElements();
  resizeCanvas();
  loadInputs();
  render();
})();