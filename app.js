
import {loadAI, askAI, setProgressListener} from "./ai.js";
const page=document.body.dataset.page || "home";
const $=(s,root=document)=>root.querySelector(s);
const app=$("#app");
const navItems=[["index.html","⌂","Home","home"],["chat.html","✳","AI Chat","chat"],["tools.html","✿","Study tools","tools"],["notes.html","▤","My notes","notes"],["quiz.html","◇","Quiz lab","quiz"],["flashcards.html","▣","Flashcards","flashcards"],["planner.html","☼","Study planner","planner"]];
const pageName={home:"Home",chat:"AI Chat",tools:"Study tools",notes:"My notes",quiz:"Quiz lab",flashcards:"Flashcards",planner:"Study planner",settings:"Settings"};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2300)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function shell(content){
 app.innerHTML=`<div class="shell"><aside class="sidebar" id="sidebar">
  <a class="brand" href="index.html"><div class="brand-mark">✳</div><div><div class="brand-name">stdy<span>vyx</span></div><div class="tagline">YOUR STUDY SIDEKICK</div></div></a>
  <a class="new-chat" href="chat.html">＋ &nbsp; New chat <span style="float:right;color:#aaa">⌘ K</span></a>
  <div class="nav-label">WORKSPACE</div><nav class="nav">${navItems.map(([href,ico,label,id])=>`<a class="${page===id?'active':''}" href="${href}"><span class="ico">${ico}</span>${label}</a>`).join("")}</nav>
  <div class="nav-label">YOU</div><nav class="nav"><a class="${page==='settings'?'active':''}" href="settings.html"><span class="ico">⚙</span>Settings</a></nav>
  <div class="sidebar-bottom"><div class="local-badge">☁ <b>Local-first AI</b><br>Runs on your device. No API key or usage bill.</div><div class="profile"><div class="avatar">S</div><div><b>Study buddy</b><small>Learning mode: ON</small></div></div></div>
 </aside><main class="main"><header class="topbar"><div class="row"><button class="btn mobile-menu" id="menuBtn">☰</button><span class="crumb">STDYVYX / ${pageName[page]||"Home"}</span></div><div class="top-actions"><span class="pill"><i class="dot"></i> Local AI</span><a class="pill hide-mobile" href="settings.html">⚙ Settings</a></div></header>${content}</main></div>`;
 $("#menuBtn")?.addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
}
function composer(id="promptBox",sendId="sendBtn",placeholder="Ask anything…"){
 return `<div class="composer"><textarea id="${id}" placeholder="${placeholder}" rows="2"></textarea><div class="composer-row"><div class="composer-tools"><label class="icon-btn" title="Attach a PDF or text file">＋ <input id="fileAttach" type="file" accept=".pdf,.txt,.md" hidden></label><span class="muted" id="attachName" style="font-size:11px"></span></div><button class="send-btn" id="${sendId}">Send ↗</button></div></div>`;
}
function home(){
 shell(`<section class="hero"><span class="doodle d1">✿</span><span class="doodle d2">☻</span><span class="doodle d3">✧</span><span class="doodle d4">♡</span>
 <div class="eyebrow">✳ YOUR PERSONAL STUDY SIDEKICK</div><h1>Hey learner,<br>what are we <em>figuring out</em> today?</h1><p>A curious little corner for big questions, tiny wins, and those “ohhh, now I get it” moments.</p>
 <div class="prompt-grid"><div class="prompt-card" data-prompt="Explain photosynthesis like I am 12, with a simple example."><b>🌱 Explain a tricky topic</b><small>Make it simple, step by step</small></div><div class="prompt-card" data-prompt="Create 10 multiple choice questions on the topic of my choice. Ask me the topic first."><b>🧠 Quiz me</b><small>Practice and check what I know</small></div><div class="prompt-card" data-prompt="Help me make concise revision notes. Ask me for the subject and chapter."><b>📝 Make revision notes</b><small>Turn a big chapter into bite-size notes</small></div><div class="prompt-card" data-prompt="Help me create a realistic weekly study plan. Ask me about my subjects and available time."><b>🗓️ Plan my study week</b><small>A plan that fits real life</small></div></div>
 ${composer("homePrompt","homeSend","Ask Stdyvyx anything about your studies…")}<div class="hint">Press Enter to send · Shift + Enter for a new line · First AI use downloads a model to your device</div></section>`);
 document.querySelectorAll("[data-prompt]").forEach(el=>el.onclick=()=>{location.href="chat.html?prompt="+encodeURIComponent(el.dataset.prompt)});
 $("#homeSend").onclick=()=>sendHome();
 $("#homePrompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendHome()}});
}
function chat(){
 shell(`<div class="chat-layout"><div class="status-line" id="aiStatus">✦ <strong>Local AI</strong> · Not loaded yet. Send a message to prepare it.</div><div class="chat-stream" id="stream"></div><div class="chat-composer">${composer("chatPrompt","chatSend","Message Stdyvyx…")}<div class="hint">AI runs on your device using WebGPU. First model download can be large.</div></div></div>`);
 let history=get("stdyvyx_current_chat",[]);
 let attachmentContext="";
 const stream=$("#stream");
 function render(){stream.innerHTML=history.map(m=>`<div class="message ${m.role==='user'?'user':'assistant'}"><div class="mini-avatar">${m.role==='user'?'☺':'✳'}</div><div class="bubble">${esc(m.content).replace(/\n/g,"<br>")}</div></div>`).join("");stream.scrollTop=stream.scrollHeight}
 render();
 const params=new URLSearchParams(location.search);if(params.get("prompt")){$("#chatPrompt").value=params.get("prompt");history=[];put("stdyvyx_current_chat",history)}
 $("#chatSend").onclick=send;
 $("#fileAttach")?.addEventListener("change", async (e)=>{
  const file=e.target.files?.[0]; if(!file) return;
  $("#attachName").textContent="Reading "+file.name+"…";
  try{
   if(file.type==="text/plain" || /\\.(txt|md)$/i.test(file.name)){
    attachmentContext=(await file.text()).slice(0,24000);
   }else if(file.type==="application/pdf" || /\\.pdf$/i.test(file.name)){
    const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
    const data=new Uint8Array(await file.arrayBuffer()), doc=await pdfjs.getDocument({data}).promise;
    let pages=[];
    for(let n=1;n<=Math.min(doc.numPages,35);n++){
      const pg=await doc.getPage(n), tc=await pg.getTextContent();
      pages.push(tc.items.map(x=>x.str).join(" "));
    }
    attachmentContext=pages.join("\\n").slice(0,24000);
   }else{throw new Error("Please choose a PDF, TXT or Markdown file.");}
   $("#attachName").textContent="✓ "+file.name;
   toast("File ready — ask a question about it.");
  }catch(err){attachmentContext="";$("#attachName").textContent="";toast(err.message||"Could not read that file.");}
 });
 $("#chatPrompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
 setProgressListener(s=>$("#aiStatus").textContent="✦ "+s);
 async function send(){
  const input=$("#chatPrompt"),text=input.value.trim();if(!text)return;
  input.value="";history.push({role:"user",content:text});put("stdyvyx_current_chat",history);render();
  const answer={role:"assistant",content:""};history.push(answer);render();
  $("#chatSend").disabled=true;
  try{
   const status=$("#aiStatus");status.textContent="✦ Preparing local AI…";
   const messages=history.slice(-12,-1).map(m=>({role:m.role,content:m.role==="user" && m===history[history.length-2] && attachmentContext ? m.content+"\\n\\nUse this attached document as context:\\n"+attachmentContext : m.content}));
   attachmentContext="";
   if($("#attachName"))$("#attachName").textContent="";
   if($("#fileAttach"))$("#fileAttach").value="";
   await askAI(messages,(token,full)=>{answer.content=full;const bubble=stream.lastElementChild?.querySelector(".bubble");if(bubble)bubble.textContent=full;stream.scrollTop=stream.scrollHeight});
   put("stdyvyx_current_chat",history);status.textContent="✦ Local AI ready · This conversation stays in this browser.";
  }catch(err){answer.content="I couldn't start the local AI: "+err.message+"\n\nTry the latest Chrome or Edge on a device with WebGPU support, then reload.";$("#aiStatus").textContent="✦ AI engine unavailable";render()}
  finally{$("#chatSend").disabled=false;put("stdyvyx_current_chat",history)}
 }
}
async function sendHome(){
 const text=$("#homePrompt").value.trim();if(!text)return;
 location.href="chat.html?prompt="+encodeURIComponent(text);
}
function tools(){
 shell(`<div class="page-head"><div class="eyebrow">✿ LITTLE HELPERS, BIG STUDY ENERGY</div><h1>Your study toolbox</h1><p>Pick a tool and turn “I should study” into “I actually did it”.</p></div><div class="content-wrap card-grid">
 ${card("✎","Notes maker","Draft and save your own chapter notes.","notes.html","Open notebook")}
 ${card("🧠","Quiz lab","Generate a practice quiz with your local AI.","quiz.html","Make a quiz")}
 ${card("▣","Flashcards","Create quick cards for active recall.","flashcards.html","Study cards")}
 ${card("☼","Study planner","Build a realistic daily plan.","planner.html","Plan my week")}
 ${card("✳","AI tutor","Ask for explanations, examples and step-by-step help.","chat.html","Start learning")}
 ${card("📎","PDF study chat","Attach a PDF in AI Chat and ask questions about it.","chat.html","Open PDF chat")}
 </div>`);
}
function card(icon,title,desc,href,cta){return `<a class="feature-card" href="${href}"><div class="sticker">${icon}</div><h3>${title}</h3><p>${desc}</p><span class="text-link">${cta} →</span></a>`}
function notes(){
 const notes=get("stdyvyx_notes",[]);
 shell(`<div class="page-head"><div class="eyebrow">▤ YOUR PERSONAL NOTEBOOK</div><h1>Little notes, big brain.</h1><p>Write, save and revisit your study notes. Everything stays in this browser.</p></div><div class="content-wrap stack"><section class="panel"><div class="field"><label>NOTE TITLE</label><input class="form-control" id="noteTitle" placeholder="e.g. Photosynthesis — quick revision"></div><div class="field"><label>YOUR NOTES</label><textarea class="form-control" id="noteBody" rows="7" placeholder="Write your key points here…"></textarea></div><button class="btn primary" id="saveNote">Save note ✨</button></section><section><h3>Saved notes <span class="muted" style="font-size:12px">(${notes.length})</span></h3><div class="note-list" id="noteList">${notes.length?notes.map((n,i)=>`<article class="note-item"><div class="row" style="justify-content:space-between"><b>${esc(n.title)}</b><button class="btn" data-del="${i}">Delete</button></div><p>${esc(n.body).slice(0,260)}</p><small>${new Date(n.date).toLocaleString()}</small></article>`).join(""):'<div class="empty">Your notebook is waiting for its first idea ✿</div>'}</div></section></div>`);
 $("#saveNote").onclick=()=>{let title=$("#noteTitle").value.trim(),body=$("#noteBody").value.trim();if(!title||!body)return toast("Add a title and some notes first.");let arr=get("stdyvyx_notes",[]);arr.unshift({title,body,date:Date.now()});put("stdyvyx_notes",arr);notes()};
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{let arr=get("stdyvyx_notes",[]);arr.splice(+b.dataset.del,1);put("stdyvyx_notes",arr);notes()});
}
function quiz(){
 shell(`<div class="page-head"><div class="eyebrow">◇ PRACTICE MAKES PROGRESS</div><h1>Quiz lab</h1><p>Tell your local AI what you're studying and ask it to create a quiz.</p></div><div class="content-wrap stack"><section class="panel"><div class="field"><label>SUBJECT / TOPIC</label><input id="quizTopic" class="form-control" placeholder="e.g. Class 10 — Chemical reactions"></div><div class="row"><div class="field" style="flex:1"><label>QUESTIONS</label><select id="quizCount" class="form-control"><option>5</option><option selected>10</option><option>15</option></select></div><div class="field" style="flex:1"><label>LEVEL</label><select id="quizLevel" class="form-control"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div></div><button class="btn primary" id="makeQuiz">Generate quiz with AI ✨</button></section><section class="panel hidden" id="quizResult"><h3>Your practice set</h3><div id="quizText"></div></section></div>`);
 $("#makeQuiz").onclick=async()=>{const topic=$("#quizTopic").value.trim();if(!topic)return toast("Enter a topic first.");const out=$("#quizResult"),txt=$("#quizText"),btn=$("#makeQuiz");out.classList.remove("hidden");txt.textContent="Preparing your quiz with local AI…";btn.disabled=true;try{let result="";await askAI([{role:"user",content:`Create ${$("#quizCount").value} ${$("#quizLevel").value} level multiple-choice questions on ${topic}. Give four options per question and put a separate answer key with short explanations at the end.`}],(_,full)=>{result=full;txt.textContent=full});}catch(e){txt.textContent=e.message}finally{btn.disabled=false}};
}
function flashcards(){
 let cards=get("stdyvyx_cards",[{q:"What is active recall?",a:"A learning technique where you retrieve information from memory instead of just rereading it."}]),idx=0,show=false;
 shell(`<div class="page-head"><div class="eyebrow">▣ FLIP, RECALL, REPEAT</div><h1>Flashcard corner</h1><p>Create your own cards and test what sticks.</p></div><div class="content-wrap"><section class="panel"><div class="field"><label>QUESTION / FRONT</label><input id="front" class="form-control" placeholder="What do you want to remember?"></div><div class="field"><label>ANSWER / BACK</label><textarea id="back" class="form-control" rows="2" placeholder="Write the answer…"></textarea></div><button class="btn primary" id="addCard">Add flashcard +</button></section><div class="flashcard" id="flip"><div><div class="big" id="cardText"></div><small id="cardHint">Tap to flip</small></div></div><div class="row" style="justify-content:center"><button class="btn" id="prev">← Previous</button><span class="muted" id="cardCount"></span><button class="btn" id="next">Next →</button></div></div>`);
 function draw(){$("#cardText").textContent=cards[idx]?.[show?"a":"q"]||"No cards yet — add one above!";$("#cardHint").textContent=show?"ANSWER · tap to see question":"QUESTION · tap to reveal answer";$("#cardCount").textContent=cards.length?`${idx+1} / ${cards.length}`:"0 cards"}
 $("#flip").onclick=()=>{show=!show;draw()};$("#prev").onclick=()=>{idx=(idx-1+cards.length)%cards.length;show=false;draw()};$("#next").onclick=()=>{idx=(idx+1)%cards.length;show=false;draw()};
 $("#addCard").onclick=()=>{let q=$("#front").value.trim(),a=$("#back").value.trim();if(!q||!a)return toast("Add both sides first.");cards.push({q,a});put("stdyvyx_cards",cards);idx=cards.length-1;show=false;$("#front").value="";$("#back").value="";draw();toast("Flashcard added ✨")};draw();
}
function planner(){
 const tasks=get("stdyvyx_tasks",[]);
 shell(`<div class="page-head"><div class="eyebrow">☼ SMALL STEPS COUNT</div><h1>Study planner</h1><p>Make a simple plan you can actually follow. No guilt, just progress.</p></div><div class="content-wrap stack"><section class="panel"><div class="row"><div class="field" style="flex:2"><label>WHAT WILL YOU STUDY?</label><input id="taskName" class="form-control" placeholder="e.g. Revise algebra"></div><div class="field" style="flex:1"><label>TIME</label><input id="taskTime" type="time" class="form-control" value="17:00"></div></div><button class="btn primary" id="addTask">Add to my day +</button></section><section class="panel"><h3>Today's little wins</h3><div class="progress"><span id="progressBar"></span></div><p class="muted" id="progressText" style="font-size:12px"></p><div class="note-list" id="taskList"></div></section></div>`);
 function draw(){let arr=get("stdyvyx_tasks",[]),done=arr.filter(x=>x.done).length;$("#taskList").innerHTML=arr.length?arr.map((t,i)=>`<div class="note-item row"><input type="checkbox" data-check="${i}" ${t.done?"checked":""}><span style="flex:1;${t.done?"text-decoration:line-through;opacity:.55":""}">${esc(t.time)} · ${esc(t.name)}</span><button class="btn" data-remove="${i}">×</button></div>`).join(""):'<div class="empty">Nothing planned yet. Add one tiny task ✿</div>';$("#progressBar").style.width=arr.length?done/arr.length*100+"%":"0";$("#progressText").textContent=`${done} of ${arr.length} tasks complete`;}
 $("#addTask").onclick=()=>{let name=$("#taskName").value.trim();if(!name)return toast("Add a task name.");let arr=get("stdyvyx_tasks",[]);arr.push({name,time:$("#taskTime").value,done:false});put("stdyvyx_tasks",arr);$("#taskName").value="";draw()};
 $("#taskList").onclick=e=>{let arr=get("stdyvyx_tasks",[]);if(e.target.dataset.check!==undefined)arr[+e.target.dataset.check].done=e.target.checked;if(e.target.dataset.remove!==undefined)arr.splice(+e.target.dataset.remove,1);put("stdyvyx_tasks",arr);draw()};draw();
}
function settings(){
 shell(`<div class="page-head"><div class="eyebrow">⚙ YOUR SPACE, YOUR RULES</div><h1>Settings</h1><p>Stdyvyx is local-first. Your saved chats and study data live in this browser.</p></div><div class="content-wrap stack"><section class="panel"><h3>AI engine</h3><p class="muted">WebLLM downloads an open model to your device and runs it with WebGPU. It does not use a paid API. First download can be large and speed depends on your hardware.</p><button class="btn primary" id="testAI">Load local AI engine</button><p id="settingStatus" class="muted"></p></section><section class="panel"><h3>Your local data</h3><p class="muted">Clear saved Stdyvyx chats, notes, flashcards and planner tasks from this browser.</p><button class="btn" id="clearData">Clear local study data</button></section><section class="panel"><h3>About Stdyvyx</h3><p>Built for curious minds. Cute doodles, serious learning. ✿</p><p class="muted" style="font-size:12px">No account, no database, no cloud AI API in this starter build.</p></section></div>`);
 $("#testAI").onclick=async()=>{let s=$("#settingStatus");s.textContent="Loading…";try{await loadAI();s.textContent="Local AI is ready ✨"}catch(e){s.textContent=e.message}};
 $("#clearData").onclick=()=>{if(confirm("Clear all Stdyvyx data saved in this browser?")){Object.keys(localStorage).filter(k=>k.startsWith("stdyvyx_")).forEach(k=>localStorage.removeItem(k));toast("Local data cleared")}};
}
({home,chat,tools,notes,quiz,flashcards,planner,settings}[page]||home)();
