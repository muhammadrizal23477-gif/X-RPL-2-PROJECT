/*
 DEMO ADMIN CODE
 Ganti nilai ADMIN_CODE sebelum distribusi.
 Penting: karena ini frontend-only, kode dapat dibaca dari source.
 Untuk produksi gunakan backend + database + hashing.
*/
const ADMIN_CODE="RPL2-ADMIN-2026";
const login=document.getElementById("login"),panel=document.getElementById("panel");
document.getElementById("loginBtn").onclick=()=>{
 const code=document.getElementById("code").value.trim();
 if(code===ADMIN_CODE){sessionStorage.setItem("xiRplAdmin","1");showPanel()}
 else alert("Kode admin salah. Silakan minta kode kepada developer.");
};
function showPanel(){login.classList.add("hidden");panel.classList.remove("hidden");renderTasks()}
if(sessionStorage.getItem("xiRplAdmin")==="1")showPanel();
document.getElementById("logout").onclick=()=>{sessionStorage.removeItem("xiRplAdmin");location.reload()};
const names={dashboard:"Dashboard",students:"Data Siswa",tasks:"Tugas",finance:"Keuangan",announcement:"Pengumuman",admincodes:"Create Admin",settings:"Pengaturan"};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 document.querySelectorAll(".tab-screen").forEach(x=>x.classList.remove("active"));
 document.getElementById(b.dataset.tab).classList.add("active");
 document.getElementById("tabTitle").textContent=names[b.dataset.tab];
});
function tasks(){return JSON.parse(localStorage.getItem("xiRplTasks")||"[]")}
function renderTasks(){const box=document.getElementById("adminTasks");if(!box)return;box.innerHTML=tasks().map((x,i)=>`<div class="task-row"><span>📝 ${x}</span><button onclick="removeTask(${i})">Hapus</button></div>`).join("")}
document.getElementById("addTask").onclick=()=>{const input=document.getElementById("newTask"),v=input.value.trim();if(!v)return;const a=tasks();a.push(v);localStorage.setItem("xiRplTasks",JSON.stringify(a));input.value="";renderTasks()};
window.removeTask=i=>{const a=tasks();a.splice(i,1);localStorage.setItem("xiRplTasks",JSON.stringify(a));renderTasks()};
document.getElementById("publish").onclick=()=>{
 const t=document.getElementById("annTitle").value.trim(),d=document.getElementById("annDesc").value.trim();
 if(!t||!d)return alert("Lengkapi judul dan isi.");
 document.getElementById("published").innerHTML=`<div class="notice" style="margin-top:12px">📢 <b>${t}</b><br>${d}</div>`;
 document.getElementById("annTitle").value="";document.getElementById("annDesc").value="";
};
// Create Admin Khusus — dibuat oleh Admin Utama
function adminCodes(){return JSON.parse(localStorage.getItem("xiRplAdminCodes")||"[]")}
function saveAdminCodes(a){localStorage.setItem("xiRplAdminCodes",JSON.stringify(a))}
function makeCode(){
 const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let out="RPL2-";
 for(let i=0;i<8;i++) out+=chars[Math.floor(Math.random()*chars.length)];
 return out;
}
function renderAdminCodes(){
 const box=document.getElementById("adminCodeList"); if(!box)return;
 const list=adminCodes();
 box.innerHTML=list.length?list.map((x,i)=>`<div class="code-row"><span>👤 <b>${x.label}</b><br><small>${x.created}</small></span><span class="code-value">${x.code}</span><button onclick="deleteAdminCode(${i})">Hapus</button></div>`).join(""):'<div class="notice">Belum ada kode admin khusus.</div>';
}
window.deleteAdminCode=function(i){
 if(!confirm("Hapus/revoke kode ini?"))return;
 const a=adminCodes();a.splice(i,1);saveAdminCodes(a);renderAdminCodes();
};
document.getElementById("generateAdminCode").onclick=()=>{
 const label=document.getElementById("adminLabel").value.trim()||"Admin Khusus";
 const code=makeCode(),a=adminCodes();
 a.push({label,code,created:new Date().toLocaleString("id-ID")});saveAdminCodes(a);
 document.getElementById("adminLabel").value="";
 const out=document.getElementById("newAdminCode");out.style.display="block";
 out.innerHTML=`Kode untuk <b>${label}</b><strong>${code}</strong><span>Berikan kode ini hanya kepada orang yang dipercaya.</span>`;
 renderAdminCodes();
};
renderAdminCodes();
