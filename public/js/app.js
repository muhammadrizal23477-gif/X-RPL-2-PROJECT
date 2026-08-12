let sb,user,profile;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
async function boot(){
 try{
  const cfg=await fetch("/api/config").then(r=>r.json());
  if(!cfg.supabaseUrl||!cfg.supabaseAnonKey){ demoMode(); return; }
  sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  const {data:{session}}=await sb.auth.getSession();
  if(session) await enter(session.user); else {showAuth();setTimeout(()=>showAuth(),800)}
  sb.auth.onAuthStateChange(async(_e,s)=>{if(s) await enter(s.user);else showAuth()});
 }catch(e){$("authMsg").textContent=e.message;showAuth()}
 setTimeout(()=>$("splash").classList.add("hide"),900);
}
function showAuth(){$("auth").hidden=false;$("app").hidden=true}
async function enter(u){
 user=u;const {data:p}=await sb.from("profiles").select("*").eq("id",u.id).single();profile=p;
 $("auth").hidden=true;$("app").hidden=false;
 $("greet").textContent=`Halo, ${(p?.full_name||p?.username||"Rizal")}! 👋`;
 await loadAll();
}
async function loadAll(){await Promise.all([tasks(),schedule(),finance(),notes(),books(),announcements(),scholarships()])}
function page(n){
 document.querySelectorAll(".page").forEach(x=>x.hidden=true);$(n).hidden=false;
 document.querySelectorAll(".bottom button").forEach(b=>b.classList.toggle("active",b.dataset.page===n));
 $("moreSheet").hidden=true;window.scrollTo(0,0);
}
document.addEventListener("click",e=>{let b=e.target.closest("[data-page]");if(b)page(b.dataset.page)});
$("more").onclick=()=>$("moreSheet").hidden=!$("moreSheet").hidden;
$("logout").onclick=()=>sb.auth.signOut();
$("avatar").onclick=()=>page("developer");
$("showReg").onclick=()=>{$("regForm").hidden=!$("regForm").hidden};
$("loginForm").onsubmit=async e=>{e.preventDefault();let {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("authMsg").textContent=error?.message||""};
$("regForm").onsubmit=async e=>{e.preventDefault();let {error}=await sb.auth.signUp({email:$("regEmail").value,password:$("regPassword").value,options:{data:{username:$("username").value,full_name:$("fullname").value}}});$("authMsg").textContent=error?.message||"Akun dibuat. Cek email jika diminta."};
async function tasks(){
 let {data}=await sb.from("tasks").select("*").eq("owner_id",user.id).order("due_date");
 $("taskList").innerHTML=(data||[]).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${esc(x.subject||"")} • ${x.due_date||"Tanpa deadline"}</small></div><button onclick="doneTask('${x.id}',${x.status==="done"})">${x.status==="done"?"✓":"○"}</button></div>`).join("")||empty("Belum ada tugas.");
}
window.doneTask=async(id,d)=>{await sb.from("tasks").update({status:d?"todo":"done"}).eq("id",id);tasks()};
$("addTask").onclick=async()=>{let t=prompt("Nama tugas");if(!t)return;let s=prompt("Mata pelajaran")||"";await sb.from("tasks").insert({title:t,subject:s,owner_id:user.id});tasks()};
async function schedule(){
 let {data}=await sb.from("schedules").select("*").order("start_time");
 const html=(data||[]).map(x=>`<div class="list-row"><div class="list-left"><i class="mini-icon">▦</i><div><b>${esc(x.subject)}</b><small>${x.start_time.slice(0,5)} - ${x.end_time.slice(0,5)} • ${esc(x.room||"")}</small></div></div><span class="status blue">${esc(x.day_name)}</span></div>`).join("")||empty("Jadwal belum diisi admin.");
 $("scheduleList").innerHTML=html;$("todaySchedule").innerHTML=(data||[]).slice(0,3).map(x=>`<div class="list-row"><div class="list-left"><i class="mini-icon">▦</i><div><b>${esc(x.subject)}</b><small>${x.start_time.slice(0,5)} - ${x.end_time.slice(0,5)} • ${esc(x.room||"")}</small></div></div><span class="status blue">Mendatang</span></div>`).join("")||empty("Belum ada jadwal.");
}
async function finance(){
 let {data}=await sb.from("finance").select("*").eq("owner_id",user.id).order("transaction_date",{ascending:false});
 let inc=(data||[]).filter(x=>x.type==="income").reduce((a,x)=>a+x.amount,0),exp=(data||[]).filter(x=>x.type==="expense").reduce((a,x)=>a+x.amount,0);
 $("income").textContent=rp(inc||450000);$("expense").textContent=rp(exp||200000);$("balance").textContent=rp(inc-exp||250000);
 $("expenseList").innerHTML=(data||[]).filter(x=>x.type==="expense").slice(0,5).map(x=>`<div class="list-row"><div class="list-left"><i class="mini-icon" style="background:#5c2b2e">▣</i><b>${esc(x.title)}</b></div><span class="redtext">${rp(x.amount)}</span></div>`).join("")||["Makanan","Transportasi","Alat Tulis","Hiburan","Lainnya"].map((x,i)=>`<div class="list-row"><div class="list-left"><i class="mini-icon">●</i><b>${x}</b></div><span class="redtext">Rp ${(80000-i*15000).toLocaleString("id-ID")}</span></div>`).join("");
 $("transactions").innerHTML=(data||[]).slice(0,5).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${x.transaction_date}</small></div><span class="${x.type==="income"?"greentext":"redtext"}">${x.type==="income"?"+":"-"}${rp(x.amount)}</span></div>`).join("")||`<div class="list-row"><div><b>Top Up dari Orang Tua</b><small>12 Mei 2024</small></div><span class="greentext">+Rp 200.000</span></div><div class="list-row"><div><b>Makan Siang</b><small>12 Mei 2024</small></div><span class="redtext">-Rp 25.000</span></div>`;
}
$("topup").onclick=async()=>{let n=Number(prompt("Nominal top up")||0);if(n)await sb.from("finance").insert({owner_id:user.id,type:"income",title:"Top Up",amount:n});finance()};
async function notes(){let {data}=await sb.from("notes").select("*").eq("owner_id",user.id).order("created_at",{ascending:false});$("noteList").innerHTML=(data||[]).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${esc(x.body)}</small></div></div>`).join("")||empty("Belum ada catatan.")};
$("addNote").onclick=async()=>{let t=prompt("Judul");if(!t)return;let b=prompt("Isi")||"";await sb.from("notes").insert({owner_id:user.id,title:t,body:b});notes()};
async function books(){let {data}=await sb.from("books").select("*");$("bookList").innerHTML=(data||[]).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${esc(x.author||"")} • ${esc(x.category||"")}</small></div>${x.url?`<a href="${esc(x.url)}" target="_blank">Buka</a>`:""}</div>`).join("")||empty("Belum ada buku.")};
async function announcements(){let {data}=await sb.from("announcements").select("*").order("created_at",{ascending:false});$("announcementList").innerHTML=(data||[]).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${esc(x.body)}</small></div></div>`).join("")||empty("Belum ada pengumuman.")};
async function scholarships(){let {data}=await sb.from("scholarships").select("*");$("scholarshipList").innerHTML=(data||[]).map(x=>`<div class="list-row"><div><b>${esc(x.title)}</b><small>${esc(x.description||"")} • Deadline ${x.deadline||"-"}</small></div></div>`).join("")||empty("Belum ada informasi beasiswa.")};
function empty(x){return `<div class="list-row"><span style="color:#75849a">${x}</span></div>`}

function demoMode(){
  $("auth").hidden=true;$("app").hidden=false;
  $("greet").textContent="Halo, Rizal! 👋";
  $("todaySchedule").innerHTML=[
    ["Matematika","08:00 - 09:30","Ruang 201","Berlangsung"],
    ["Fisika","10:00 - 11:30","Ruang 305","Mendatang"],
    ["Bahasa Inggris","12:30 - 14:30","Ruang 102","Mendatang"]
  ].map(x=>`<div class="list-row"><div class="list-left"><i class="mini-icon">▦</i><div><b>${x[0]}</b><small>${x[1]} • ${x[2]}</small></div></div><span class="status ${x[3]==="Berlangsung"?"":"blue"}">${x[3]}</span></div>`).join("");
  $("scheduleList").innerHTML=$("todaySchedule").innerHTML;
  $("expenseList").innerHTML=["Makanan|Rp 80.000","Transportasi|Rp 50.000","Alat Tulis|Rp 30.000","Hiburan|Rp 20.000","Lainnya|Rp 20.000"].map(x=>{let [a,b]=x.split("|");return `<div class="list-row"><div class="list-left"><i class="mini-icon">●</i><b>${a}</b></div><span class="redtext">${b}</span></div>`}).join("");
  $("transactions").innerHTML=`<div class="list-row"><div class="list-left"><i class="mini-icon">●</i><div><b>Top Up dari Orang Tua</b><small>12 Mei 2024</small></div></div><span class="greentext">+Rp 200.000</span></div><div class="list-row"><div class="list-left"><i class="mini-icon" style="background:#673238">●</i><div><b>Makan Siang</b><small>12 Mei 2024</small></div></div><span class="redtext">-Rp 25.000</span></div>`;
  $("taskList").innerHTML=["Buat desain UI","Latihan JavaScript","Laporan Basis Data"].map((x,i)=>`<div class="list-row"><div><b>${x}</b><small>${["RPL","Pemrograman Web","Basis Data"][i]} • ${i+1}8 Mei 2024</small></div><span class="status blue">${i?"Belum":"Selesai"}</span></div>`).join("");
  $("announcementList").innerHTML=["Libur Semester Ganjil","Workshop Public Speaking","Ujian Praktikum Fisika"].map((x,i)=>`<div class="list-row"><div><b>${x}</b><small>${20-i*2} Des 2024</small></div><span class="status blue">Info</span></div>`).join("");
  $("noteList").innerHTML=`<div class="list-row"><div><b>Catatan Belajar</b><small>Review materi JavaScript sebelum ulangan.</small></div></div>`;
  $("bookList").innerHTML=`<div class="list-row"><div><b>Dasar Pemrograman Web</b><small>Perpustakaan RPL • Digital</small></div><span class="status blue">Buka</span></div>`;
  $("scholarshipList").innerHTML=`<div class="list-row"><div><b>Beasiswa Pendidikan</b><small>Informasi beasiswa untuk siswa berprestasi.</small></div><span class="status">Info</span></div>`;
}
boot();