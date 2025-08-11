
// --- Simple local DB using localStorage ---
const DB_KEY = 'notary_cases_v1';

function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function loadDB(){
  try{ return JSON.parse(localStorage.getItem(DB_KEY)) || { cases:[], docs:{}, events:{} }; }
  catch{ return { cases:[], docs:{}, events:{} }; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

// Files are kept as data URLs for demo; in real app you might move to OPFS/IndexedDB
async function fileToDataURL(file){
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}

// --- UI elements ---
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const searchInput = document.getElementById('search');
const casesDiv = document.getElementById('cases');
const btnNew = document.getElementById('btn-new');

const form = document.getElementById('case-form');
const fileInput = document.getElementById('file-input');
const btnAddDoc = document.getElementById('btn-add-doc');
const docsDiv = document.getElementById('docs');
const eventsUl = document.getElementById('events');
const titleEl = document.getElementById('case-title');
const btnBack = document.getElementById('btn-back');
const btnDeleteCase = document.getElementById('btn-delete-case');

let currentId = null;

function renderList(){
  const db = loadDB();
  const q = (searchInput.value||'').toLowerCase();
  const filtered = db.cases.filter(c =>
    [c.personName,c.caseType,c.email,c.phone].join(' ').toLowerCase().includes(q)
  ).sort((a,b)=> (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0));

  casesDiv.innerHTML = filtered.map(c => `
    <div class="item">
      <div>
        <div><strong>${c.personName || '(Sin nombre)'}</strong> — ${c.caseType || '—'}</div>
        <div class="meta">${c.email||''} ${c.phone? '· '+c.phone: ''}</div>
      </div>
      <div class="row gap">
        <button class="btn secondary" data-open="${c.id}">Abrir</button>
        <button class="btn danger" data-del="${c.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  // events
  casesDiv.querySelectorAll('[data-open]').forEach(b=> b.onclick = ()=> openCase(b.dataset.open));
  casesDiv.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=> deleteCase(b.dataset.del));
}

function openCase(id){
  const db = loadDB();
  const c = db.cases.find(x=>x.id===id);
  if(!c) return;
  currentId = id;
  titleEl.textContent = `Caso: ${c.personName || id}`;
  // fill form
  [...form.elements].forEach(el=>{
    if(el.name) el.value = c[el.name] || '';
  });
  // docs
  const docs = (db.docs[id]||[]);
  docsDiv.innerHTML = docs.map(d => `
    <div class="doc">
      <div class="name">${d.title}</div>
      <div class="actions">
        <a class="btn secondary" href="${d.url}" download="${d.title || 'documento'}">Descargar</a>
        <button class="btn danger" data-deldoc="${d.id}">Eliminar</button>
      </div>
    </div>
  `).join('');
  docsDiv.querySelectorAll('[data-deldoc]').forEach(b=> b.onclick = ()=> deleteDoc(b.dataset.deldoc));

  // events
  const evs = (db.events[id]||[]).slice().reverse();
  eventsUl.innerHTML = evs.map(e=> `<li>${new Date(e.at).toLocaleString()} — ${e.msg}</li>`).join('');

  listView.classList.add('hidden');
  detailView.classList.remove('hidden');
}

function backToList(){
  currentId = null;
  detailView.classList.add('hidden');
  listView.classList.remove('hidden');
  renderList();
}

function newCase(){
  const db = loadDB();
  const id = uid();
  const obj = {
    id,
    personName:'',
    caseType:'',
    dob:'',
    address:'',
    email:'',
    phone:'',
    summary:'',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  db.cases.push(obj);
  db.events[id] = [{ at: Date.now(), msg:'Caso creado' }];
  saveDB(db);
  openCase(id);
}

function deleteCase(id){
  const db = loadDB();
  if(!confirm('¿Eliminar este caso y sus documentos?')) return;
  db.cases = db.cases.filter(x=>x.id!==id);
  delete db.docs[id];
  delete db.events[id];
  saveDB(db);
  if(currentId===id) backToList(); else renderList();
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  if(!currentId) return;
  const db = loadDB();
  const i = db.cases.findIndex(x=>x.id===currentId);
  if(i<0) return;
  const updates = {};
  [...form.elements].forEach(el=>{
    if(el.name) updates[el.name] = el.value;
  });
  db.cases[i] = { ...db.cases[i], ...updates, updatedAt: Date.now() };
  db.events[currentId] = db.events[currentId] || [];
  db.events[currentId].push({ at: Date.now(), msg:'Datos del caso actualizados' });
  saveDB(db);
  openCase(currentId);
});

btnAddDoc.addEventListener('click', async ()=>{
  if(!currentId) return;
  const file = fileInput.files?.[0];
  if(!file) { alert('Selecciona un archivo'); return; }
  const title = prompt('Nombre del documento', file.name) || file.name;
  const url = await fileToDataURL(file);
  const db = loadDB();
  db.docs[currentId] = db.docs[currentId] || [];
  db.docs[currentId].push({ id: uid(), title, url, type: file.type, size: file.size });
  db.events[currentId] = db.events[currentId] || [];
  db.events[currentId].push({ at: Date.now(), msg:`Documento agregado: ${title}` });
  saveDB(db);
  fileInput.value = '';
  openCase(currentId);
});

function deleteDoc(docId){
  const db = loadDB();
  const arr = db.docs[currentId] || [];
  const idx = arr.findIndex(d=> d.id===docId);
  if(idx>=0){
    const [rm] = arr.splice(idx,1);
    db.events[currentId] = db.events[currentId] || [];
    db.events[currentId].push({ at: Date.now(), msg:`Documento eliminado: ${rm.title}` });
    saveDB(db);
    openCase(currentId);
  }
}

btnBack.onclick = backToList;
btnNew.onclick = newCase;
searchInput.oninput = renderList;

renderList();
