const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firebase-client-Bklma2ql.js","assets/firebase-config-DxLbwtvt.js"])))=>i.map(i=>d[i]);
import"./firebase-config-DxLbwtvt.js";import{_ as I}from"./preload-helper-BmvMH90o.js";import*as f from"https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";import{deleteSuggestion as M,auth as P,getSuggestions as _,createSuggestion as F}from"./firebase-client-Bklma2ql.js";import{onAuthStateChanged as O}from"https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";function z(){const t=localStorage.getItem("adminSession"),e=localStorage.getItem("adminLoginTime"),o=Date.now(),n=24*60*60*1e3;return t!=="true"||!e||o-parseInt(e)>n?(localStorage.removeItem("adminSession"),localStorage.removeItem("adminLoginTime"),window.location.href="/admin-login.html",!1):!0}if(!z())throw new Error("Unauthorized access");let s,m={},g=!1,u=!1,b=null,p=null;function j(){delete f.Icon.Default.prototype._getIconUrl,f.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"}),s=f.map("map").setView([39.925533,32.866287],6),f.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(s),s.on("click",N),D()}async function N(t){const{lat:e,lng:o}=t.latlng;g?await U(e,o):u&&await R(e,o)}async function U(t,e){var o,n,i,a;try{b&&s.removeLayer(b),b=f.marker([t,e]).addTo(s);const c=await(await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${t}&lon=${e}`)).json(),d=((o=c.address)==null?void 0:o.city)||((n=c.address)==null?void 0:n.town)||((i=c.address)==null?void 0:i.village)||"Bilinmiyor",r=((a=c.address)==null?void 0:a.country)||"Bilinmiyor";H(t,e,d,r)}catch(l){console.error("Error adding point:",l),alert("Nokta eklenirken hata oluştu: "+l.message)}}function H(t,e,o,n){p&&p.remove(),p=document.createElement("div"),Object.assign(p.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%)",background:"white",padding:"24px",borderRadius:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:1e4,minWidth:"400px",fontFamily:"Google Sans, sans-serif"}),p.innerHTML=`
    <h3 style="margin:0 0 16px 0;color:#FF4A1C;">Add New Place</h3>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Title *</label>
      <input id="add-title" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Enter place name">
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Description</label>
      <textarea id="add-description" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;min-height:60px;" placeholder="Optional description"></textarea>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Category</label>
      <select id="add-category" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
        <option value="food">Food & Dining</option>
        <option value="event">Event & Entertainment</option>
        <option value="culture">Culture & History</option>
        <option value="nature">Nature & Outdoors</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Best Time</label>
      <select id="add-timeslot" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
        <option value="morning">Morning</option>
        <option value="noon">Noon</option>
        <option value="evening">Evening</option>
        <option value="night">Night</option>
        <option value="anytime">Anytime</option>
      </select>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Location</label>
      <input type="text" value="${o}, ${n}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;background:#f5f5f5;" readonly>
    </div>
    <div style="margin-bottom:12px;font-size:12px;color:#666;">
      <strong>Coordinates:</strong> ${t.toFixed(6)}, ${e.toFixed(6)}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button id="save-btn" style="flex:1;padding:10px;background:#FF4A1C;color:white;border:none;border-radius:8px;font-weight:500;cursor:pointer;">Save</button>
      <button id="cancel-btn" style="flex:1;padding:10px;background:#ddd;color:#333;border:none;border-radius:8px;font-weight:500;cursor:pointer;">Cancel</button>
    </div>
  `,document.body.appendChild(p),document.getElementById("save-btn").addEventListener("click",async()=>{const i=document.getElementById("add-title").value.trim();if(!i){alert("Please enter a title");return}const a={title:i,description:document.getElementById("add-description").value.trim(),category:document.getElementById("add-category").value,timeSlot:document.getElementById("add-timeslot").value,city:o,country:n,lat:t,lng:e};try{await F(a),x(`Yeni nokta eklendi: ${i}`),D(),T(),V()}catch(l){console.error("Error saving suggestion:",l),alert("Nokta kaydedilirken hata oluştu: "+l.message)}}),document.getElementById("cancel-btn").addEventListener("click",T)}function T(){p&&(p.remove(),p=null),b&&(s.removeLayer(b),b=null)}async function R(t,e){try{let o=null,n=1/0;Object.entries(m).forEach(([i,a])=>{const l=s.distance([t,e],a.getLatLng());l<100&&l<n&&(n=l,o={id:i,marker:a})}),o?confirm("Bu noktayı silmek istediğinizden emin misiniz?")&&(await M(o.id),s.removeLayer(o.marker),delete m[o.id],x(`Nokta silindi: ${o.id}`),h()):alert("Silinecek nokta bulunamadı. Lütfen bir nokta üzerine tıklayın."),G()}catch(o){console.error("Error deleting point:",o),alert("Nokta silinirken hata oluştu: "+o.message)}}async function D(){try{_({},t=>{Object.values(m).forEach(e=>s.removeLayer(e)),m={},t&&Array.isArray(t)&&t.forEach(e=>{const o=f.marker([e.lat,e.lng]).addTo(s),n=`
            <div style="font-family: 'Google Sans', sans-serif;">
              <h3 style="margin: 0 0 10px 0; color: #FF4A1C;">${y(e.title)}</h3>
              <p><strong>Location:</strong> ${y(e.city)}, ${y(e.country)}</p>
              <p><strong>Category:</strong> ${y(e.category)}</p>
              <p><strong>Time:</strong> ${y(e.timeSlot)}</p>
              <p><strong>Created by:</strong> ${y(e.createdBy)}</p>
              ${e.flags&&e.flags.length?`<p style="color: #e74c3c;"><strong>Reports:</strong> ${e.flags.length}</p>`:""}
              <hr style="margin: 10px 0;">
              <button onclick="editPoint('${e.id}')" style="background: #FF4A1C; color: white; border: none; padding: 5px 10px; border-radius: 5px; margin-right: 5px; cursor: pointer;">Edit</button>
              <button onclick="removePoint('${e.id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </div>
          `;o.bindPopup(n),m[e.id]=o}),h()})}catch(t){console.error("Error loading suggestions:",t)}}window.addPointMode=function(){g=!g,u=!1;const t=document.getElementById("add-point-btn");t.style.background=g?"#B2FFA9":"",t.style.color=g?"#565656":"",document.getElementById("delete-point-btn").style.background="",document.getElementById("delete-point-btn").style.color="",g&&alert("Add mode active. Click on the map to add a new point.")};window.deletePointMode=function(){u=!u,g=!1;const t=document.getElementById("delete-point-btn");t.style.background=u?"#e74c3c":"",t.style.color=u?"white":"",document.getElementById("add-point-btn").style.background="",document.getElementById("add-point-btn").style.color="",u&&alert("Delete mode active. Click on the point you want to delete.")};window.viewAllPoints=function(){if(Object.keys(m).length>0){const t=new f.featureGroup(Object.values(m));s.fitBounds(t.getBounds().pad(.1))}else alert("No points to display on the map.")};function V(){g=!1,document.getElementById("add-point-btn").style.background="",document.getElementById("add-point-btn").style.color=""}function G(){u=!1,document.getElementById("delete-point-btn").style.background="",document.getElementById("delete-point-btn").style.color=""}window.editPoint=async function(t){if(prompt("Enter new title:"))try{x(`Point edited: ${t}`),alert("Edit feature is under development.")}catch(o){console.error("Error editing point:",o)}};window.removePoint=async function(t){if(confirm("Are you sure you want to delete this point?"))try{await M(t),m[t]&&(s.removeLayer(m[t]),delete m[t]),x(`Point deleted: ${t}`),h()}catch(o){console.error("Error removing point:",o)}};async function h(){try{const{ref:t,get:e,child:o}=await I(async()=>{const{ref:r,get:v,child:w}=await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");return{ref:r,get:v,child:w}},[]),{db:n}=await I(async()=>{const{db:r}=await import("./firebase-client-Bklma2ql.js");return{db:r}},__vite__mapDeps([0,1])),i=await e(o(t(n),"suggestions"));let a=0,l=0;if(i.exists()){const r=i.val();a=Object.keys(r).length,Object.values(r).forEach(v=>{v.flags&&Array.isArray(v.flags)&&(l+=v.flags.length)})}const c=await e(o(t(n),"users"));let d=0;if(c.exists()){const r=c.val();d=Object.keys(r).length}document.getElementById("total-points").textContent=a,document.getElementById("active-users").textContent=d,document.getElementById("daily-visits").textContent=`${a} places`,document.getElementById("total-flags").textContent=l}catch(t){console.error("Error updating stats:",t),document.getElementById("total-points").textContent=Object.keys(m).length}}function x(t){const e=document.getElementById("recent-activity");if(!e){console.warn("Activity list element not found");return}const o=document.createElement("div");o.className="activity-item";const i=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});for(o.innerHTML=`
    <div class="time">${i}</div>
    <div class="action">${t}</div>
  `,e.insertBefore(o,e.firstChild);e.children.length>10;)e.removeChild(e.lastChild)}let A=null;function B(){const t=document.getElementById("user-list");A&&A();try{I(async()=>{const{ref:e,onValue:o}=await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");return{ref:e,onValue:o}},[]).then(({ref:e,onValue:o})=>{I(async()=>{const{db:n}=await import("./firebase-client-Bklma2ql.js");return{db:n}},__vite__mapDeps([0,1])).then(({db:n})=>{const i=e(n,"users");A=o(i,a=>{if(!a.exists()){t.innerHTML='<div style="padding:10px;color:#666;text-align:center;font-size:13px;">No user activity yet</div>';return}const l=a.val(),c=[];Object.entries(l).forEach(([d,r])=>{c.push({uid:d,email:r.email||"No email",role:r.role||"user",lastLogin:r.lastLogin||r.createdAt||new Date().toISOString()})}),c.sort((d,r)=>new Date(r.lastLogin)-new Date(d.lastLogin)),t.innerHTML=c.map(d=>{const r=new Date(d.lastLogin),w=new Date-r,k=Math.floor(w/6e4),S=Math.floor(w/36e5),C=Math.floor(w/864e5);let E="",L="";k<1?(E="Just now",L="Active now"):k<60?(E=`${k}m ago`,L=`Last seen ${k}m ago`):S<24?(E=`${S}h ago`,L=`Last seen ${S}h ago`):(E=`${C}d ago`,L=`Last seen ${C}d ago`);const $=k<30;return`
              <div class="user-item" style="border-bottom:1px solid #eee;padding:10px 0;">
                <div class="user-info">
                  <div class="user-email" style="font-weight:500;color:#333;font-size:13px;">${y(d.email)}</div>
                  <div class="user-role" style="font-size:11px;color:#666;margin-top:2px;">
                    <span style="background:#FF4A1C;color:white;padding:2px 6px;border-radius:4px;margin-right:6px;">${d.role.toUpperCase()}</span>
                    ${L}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:${$?"#4CAF50":"#999"};font-weight:${$?"600":"400"};">
                    ${E}
                  </div>
                  ${$?'<div style="width:8px;height:8px;background:#4CAF50;border-radius:50%;margin:4px auto 0;"></div>':""}
                </div>
              </div>
            `}).join("")},a=>{console.error("Error in user list listener:",a),t.innerHTML='<div style="padding:10px;color:#e74c3c;text-align:center;font-size:13px;">Error loading activities</div>'})})})}catch(e){console.error("Error setting up user list:",e),t.innerHTML='<div style="padding:10px;color:#e74c3c;text-align:center;font-size:13px;">Error loading activities</div>'}}window.refreshData=function(){D(),h(),B(),x("Data refreshed")};window.logout=function(){confirm("Are you sure you want to logout?")&&(localStorage.removeItem("adminSession"),localStorage.removeItem("adminLoginTime"),window.location.href="/admin-login.html")};function y(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,o=>e[o])}document.addEventListener("DOMContentLoaded",()=>{const t=localStorage.getItem("adminSession"),e=localStorage.getItem("adminLoginTime"),o=Date.now(),n=24*60*60*1e3;if(t!=="true"||!e||o-parseInt(e)>n){localStorage.removeItem("adminSession"),localStorage.removeItem("adminLoginTime"),window.location.href="/admin-login.html";return}O(P,i=>{i?console.log("Admin authenticated via Firebase:",i.email):console.log("No Firebase user, using localStorage admin session"),j(),h(),B(),x("Admin panel initialized")}),setInterval(()=>{h(),B()},3e4)});
