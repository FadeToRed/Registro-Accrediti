var REG_FB_CONFIG = {
 apiKey: "AIzaSyCfJv-qTCeKD8v4Ma8S9aPjcjdd7zKHMkQ",
 authDomain: "compleanni-4035c.firebaseapp.com",
 databaseURL: "https://compleanni-4035c-default-rtdb.europe-west1.firebasedatabase.app",
 projectId: "compleanni-4035c",
 storageBucket: "compleanni-4035c.firebasestorage.app",
 messagingSenderId: "429393050992",
 appId: "1:429393050992:web:6b1d632e7e1a1dc0dd23b5"
};
var REG_SDK = [
 "https://cdn.jsdelivr.net/npm/firebase@10.12.2/firebase-app-compat.js",
 "https://cdn.jsdelivr.net/npm/firebase@10.12.2/firebase-database-compat.js"
];
var REG_SDK_FB = [
 "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
 "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"
];
var _regDb = null, _regData = {};

function regCarica(url){ return new Promise(function(ok,ko){ var s=document.createElement('script'); s.src=url; s.async=false; s.onload=function(){ok(url);}; s.onerror=function(){ko();}; document.head.appendChild(s); }); }
function regCaricaSDK(){
 if(window.firebase&&window.firebase.database) return Promise.resolve(true);
 function lista(a){ var p=Promise.resolve(); for(var i=0;i<a.length;i++){(function(u){p=p.then(function(){return regCarica(u);});})(a[i]);} return p; }
 var caricamento = lista(REG_SDK).then(function(){return !!(window.firebase&&window.firebase.database);})
  .catch(function(){ return lista(REG_SDK_FB).then(function(){return !!(window.firebase&&window.firebase.database);}); });
 var timeout = new Promise(function(ok){ setTimeout(function(){ ok(!!(window.firebase&&window.firebase.database)); }, 12000); });
 return Promise.race([caricamento, timeout]);
}

function regInit(){
 regCaricaSDK().then(function(pronto){
  if(!pronto){ document.getElementById('reg-stato').innerHTML='<span style="color:#F9C6C6;">Impossibile caricare Firebase.</span>'; return; }
  var fb=window.firebase;
  if(!fb.apps.length) fb.initializeApp(REG_FB_CONFIG);
  _regDb=fb.database();
  regRicarica();
 });
}

function regRicarica(){
 if(!_regDb) return;
 document.getElementById('reg-stato').innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Caricamento…';
 _regDb.ref('accrediti').once('value').then(function(snap){
  _regData = snap.val() || {};
  regPopolaSelect();
  regMostraPg();
  document.getElementById('reg-stato').innerHTML='';
 }).catch(function(e){
  document.getElementById('reg-stato').innerHTML='<span style="color:#F9C6C6;">Errore: '+e.message+'</span>';
 });
}

function regNomePg(pgId){ var p=_regData[pgId]; return (p&&p.nomeCorrente)?p.nomeCorrente:pgId; }

function regPopolaSelect(){
 var sel=document.getElementById('reg-pg-select');
 var selStaffer=document.getElementById('reg-staffer-select');
 var valPrec=sel.value;
 var valStafPrec=selStaffer?selStaffer.value:'';
 sel.innerHTML='<option value="__tutti__">— Tutti i PG —</option>';
 var ids=[]; for(var k in _regData){ if(_regData.hasOwnProperty(k)) ids.push(k); }
 ids.sort(function(a,b){ return regNomePg(a).localeCompare(regNomePg(b)); });
 for(var i=0;i<ids.length;i++){
  sel.innerHTML+='<option value="'+ids[i]+'">'+regNomePg(ids[i])+'</option>';
 }
 if(valPrec){ for(var o=0;o<sel.options.length;o++){ if(sel.options[o].value===valPrec){ sel.selectedIndex=o; break; } } }
 // Menù staffer: raccoglie tutti gli staffer distinti dai record
 if(selStaffer){
  var staffers={};
  for(var k2 in _regData){ if(_regData.hasOwnProperty(k2)){ var recs=_regData[k2].records||{}; for(var rk in recs){ if(recs.hasOwnProperty(rk)){ var s=recs[rk].staffer; if(s) staffers[s]=true; } } } }
  var lista=[]; for(var st in staffers){ if(staffers.hasOwnProperty(st)) lista.push(st); }
  lista.sort(function(a,b){ return a.localeCompare(b); });
  selStaffer.innerHTML='<option value="__tutti__">— Tutti gli staffer —</option>';
  for(var l=0;l<lista.length;l++){ selStaffer.innerHTML+='<option value="'+lista[l]+'">'+lista[l]+'</option>'; }
  if(valStafPrec){ for(var os=0;os<selStaffer.options.length;os++){ if(selStaffer.options[os].value===valStafPrec){ selStaffer.selectedIndex=os; break; } } }
 }
}

function regRecordsDiPg(pgId){
 var p=_regData[pgId]; if(!p||!p.records) return [];
 var out=[]; for(var rk in p.records){ if(p.records.hasOwnProperty(rk)){ var r=p.records[rk]; r._key=rk; r._pgId=pgId; out.push(r); } }
 out.sort(function(a,b){ return (b.timestamp||0)-(a.timestamp||0); });
 return out;
}

function regFmtData(ts){ if(!ts) return '—'; var d=new Date(ts); return d.toLocaleDateString('it-IT')+' '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); }

function regRenderRecord(r, conNomePg){
 var h='<div class="reg-record">';
 h+='<div style="display:flex; justify-content:space-between; flex-wrap:wrap; margin-bottom:8px; color:#8FBEBA; font-size:0.85em;">';
 h+='<span><i class="fa-solid fa-user-shield"></i> <b style="color:#CFF09E;">'+(r.staffer||'?')+'</b>';
 if(conNomePg) h+=' &nbsp;·&nbsp; PG: <b style="color:#CFF09E;">'+(r.nomeAlMomento||r._pgId)+'</b>';
 h+='</span><span>'+regFmtData(r.timestamp)+'</span></div>';
 var mods=r.modifiche||[];
 for(var i=0;i<mods.length;i++){
  var m=mods[i];
  h+='<div class="reg-mod"><b style="color:#CFF09E;">'+m.campo+':</b> ';
  if(m.delta==='info') h+='<b>'+m.a+'</b>';
  else if(m.da===null||m.da===undefined) h+='aggiunto <b>'+m.a+'</b>';
  else { h+=m.da+' → <b>'+m.a+'</b>'; if(m.delta) h+=' <span style="color:#A8DBA8;">('+m.delta+')</span>'; }
  h+='</div>';
 }
 h+='</div>';
 return h;
}

function regMostraPg(){
 var sel=document.getElementById('reg-pg-select');
 var selStaffer=document.getElementById('reg-staffer-select');
 var pgId=sel.value;
 var staffFiltro=selStaffer?selStaffer.value:'__tutti__';
 var cont=document.getElementById('reg-contenuto');

 // Filtro staffer applicabile a una lista di record
 function filtraStaffer(records){
  if(!staffFiltro || staffFiltro==='__tutti__') return records;
  var out=[]; for(var i=0;i<records.length;i++){ if(records[i].staffer===staffFiltro) out.push(records[i]); }
  return out;
 }
 var etichettaStaffer = (staffFiltro && staffFiltro!=='__tutti__') ? ' — staffer: '+staffFiltro : '';

 if(pgId==='__tutti__'){
  var tutti=[];
  for(var k in _regData){ if(_regData.hasOwnProperty(k)){ var rs=regRecordsDiPg(k); for(var i=0;i<rs.length;i++) tutti.push(rs[i]); } }
  tutti=filtraStaffer(tutti);
  tutti.sort(function(a,b){ return (b.timestamp||0)-(a.timestamp||0); });
  if(tutti.length===0){ cont.innerHTML='<div class="reg-card" style="text-align:center; color:#8FBEBA;">Nessun accredito'+(etichettaStaffer?' per questo staffer':' registrato')+'.</div>'; return; }
  var h='<div class="reg-card"><h3 style="color:#CFF09E; margin:0 0 14px;">Tutti gli accrediti ('+tutti.length+')'+etichettaStaffer+'</h3>';
  h+='<div class="reg-scroll">';
  for(var t=0;t<tutti.length;t++) h+=regRenderRecord(tutti[t], true);
  h+='</div></div>';
  cont.innerHTML=h;
 } else {
  var records=filtraStaffer(regRecordsDiPg(pgId));
  var nome=regNomePg(pgId);
  var p=_regData[pgId];
  var alias=(p&&p.aliasStorici)?p.aliasStorici:[];
  var h='<div class="reg-card"><h3 style="color:#CFF09E; margin:0 0 6px;">'+nome+etichettaStaffer+'</h3>';
  if(alias.length>0) h+='<div style="color:#8FBEBA; font-size:0.82em; font-style:italic; margin-bottom:12px;">Ex: '+alias.join(', ')+'</div>';
  if(records.length===0) h+='<p style="color:#8FBEBA;">Nessun accredito'+(etichettaStaffer?' di questo staffer':'')+' per questo PG.</p>';
  else { h+='<div class="reg-scroll">'; for(var r=0;r<records.length;r++) h+=regRenderRecord(records[r], false); h+='</div>'; }
  h+='</div>';
  cont.innerHTML=h;
 }
}


// Avvio automatico quando il DOM e il markup della pagina sono pronti
(function(){
 function avvia(){
  if(!document.getElementById('reg-accrediti')){ setTimeout(avvia, 100); return; }
  regInit();
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', avvia);
 else avvia();
})();
