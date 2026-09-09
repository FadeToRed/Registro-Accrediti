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

function regStaffDaBody(){ var c=document.body.className||''; return /\badmin\b/.test(c) || /\b(g1|g2|g3|g4)\b/.test(c); }
function regIsStaff(){
 try{ var o=localStorage.getItem('af_staff_override'); if(o==='1')return true; if(o==='0')return false; }catch(e){}
 if(window.HxHFramework&&window.HxHFramework.groups&&window.HxHFramework.groups.isStaff){ try{return window.HxHFramework.groups.isStaff();}catch(e){} }
 return regStaffDaBody();
}

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
  if(regIsStaff()) document.getElementById('reg-staff-tools').style.display='';
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
 var merge=document.getElementById('reg-merge-target');
 var valPrec=sel.value;
 sel.innerHTML='<option value="__tutti__">— Tutti i PG (vista globale) —</option>';
 if(merge) merge.innerHTML='<option value="">— target —</option>';
 var ids=[]; for(var k in _regData){ if(_regData.hasOwnProperty(k)) ids.push(k); }
 ids.sort(function(a,b){ return regNomePg(a).localeCompare(regNomePg(b)); });
 for(var i=0;i<ids.length;i++){
  var nome=regNomePg(ids[i]);
  sel.innerHTML+='<option value="'+ids[i]+'">'+nome+'</option>';
  if(merge) merge.innerHTML+='<option value="'+ids[i]+'">'+nome+'</option>';
 }
 if(valPrec){ for(var o=0;o<sel.options.length;o++){ if(sel.options[o].value===valPrec){ sel.selectedIndex=o; break; } } }
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
  if(m.da===null||m.da===undefined) h+='aggiunto <b>'+m.a+'</b>';
  else { h+=m.da+' → <b>'+m.a+'</b>'; if(m.delta) h+=' <span style="color:#A8DBA8;">('+m.delta+')</span>'; }
  h+='</div>';
 }
 h+='</div>';
 return h;
}

function regMostraPg(){
 var sel=document.getElementById('reg-pg-select');
 var pgId=sel.value;
 var cont=document.getElementById('reg-contenuto');
 if(pgId==='__tutti__'){
  // Vista globale: tutti i record di tutti i PG, per data
  var tutti=[];
  for(var k in _regData){ if(_regData.hasOwnProperty(k)){ var rs=regRecordsDiPg(k); for(var i=0;i<rs.length;i++) tutti.push(rs[i]); } }
  tutti.sort(function(a,b){ return (b.timestamp||0)-(a.timestamp||0); });
  if(tutti.length===0){ cont.innerHTML='<div class="reg-card" style="text-align:center; color:#8FBEBA;">Nessun accredito registrato.</div>'; return; }
  var h='<div class="reg-card"><h3 style="color:#CFF09E; margin:0 0 14px;">Tutti gli accrediti ('+tutti.length+')</h3>';
  for(var t=0;t<tutti.length;t++) h+=regRenderRecord(tutti[t], true);
  h+='</div>';
  cont.innerHTML=h;
 } else {
  var records=regRecordsDiPg(pgId);
  var nome=regNomePg(pgId);
  var p=_regData[pgId];
  var alias=(p&&p.aliasStorici)?p.aliasStorici:[];
  var h='<div class="reg-card"><h3 style="color:#CFF09E; margin:0 0 6px;">'+nome+'</h3>';
  if(alias.length>0) h+='<div style="color:#8FBEBA; font-size:0.82em; font-style:italic; margin-bottom:12px;">Ex: '+alias.join(', ')+'</div>';
  if(records.length===0) h+='<p style="color:#8FBEBA;">Nessun accredito per questo PG.</p>';
  else for(var r=0;r<records.length;r++) h+=regRenderRecord(records[r], false);
  h+='</div>';
  cont.innerHTML=h;
 }
}

function regRinomina(){
 if(!regIsStaff()){ alert('Solo lo staff può rinominare.'); return; }
 var sel=document.getElementById('reg-pg-select'); var pgId=sel.value;
 if(pgId==='__tutti__'){ alert('Seleziona prima un PG specifico.'); return; }
 var nuovo=(document.getElementById('reg-rinomina-nome').value||'').trim();
 if(!nuovo){ alert('Inserisci il nuovo nome.'); return; }
 var p=_regData[pgId]||{};
 var vecchio=p.nomeCorrente||null;
 var alias=p.aliasStorici||[];
 if(vecchio && alias.indexOf(vecchio)===-1) alias.push(vecchio);
 if(!confirm('Rinominare "'+(vecchio||pgId)+'" in "'+nuovo+'"? Lo storico resta intatto.')) return;
 _regDb.ref('accrediti/'+pgId).update({ nomeCorrente:nuovo, aliasStorici:alias }).then(function(){
  document.getElementById('reg-rinomina-nome').value='';
  regRicarica();
 }).catch(function(e){ alert('Errore: '+e.message); });
}

function regMerge(){
 if(!regIsStaff()){ alert('Solo lo staff può unire.'); return; }
 var sel=document.getElementById('reg-pg-select'); var da=sel.value;
 var target=document.getElementById('reg-merge-target').value;
 if(da==='__tutti__'||!target){ alert('Seleziona il PG da unire (in alto) e il target.'); return; }
 if(da===target){ alert('PG e target coincidono.'); return; }
 if(!confirm('Unire "'+regNomePg(da)+'" dentro "'+regNomePg(target)+'"? I record verranno spostati e il PG di origine rimosso. Operazione irreversibile.')) return;
 var origine=_regData[da]||{}; var recordsOrig=origine.records||{};
 var tgtRef=_regDb.ref('accrediti/'+target+'/records');
 // Sposta ogni record sotto il target
 var promises=[];
 for(var rk in recordsOrig){ if(recordsOrig.hasOwnProperty(rk)){ promises.push(tgtRef.push(recordsOrig[rk])); } }
 // Alias: il nome del PG di origine diventa alias del target
 var pTgt=_regData[target]||{}; var aliasT=pTgt.aliasStorici||[];
 var nomeOrig=origine.nomeCorrente; if(nomeOrig && aliasT.indexOf(nomeOrig)===-1) aliasT.push(nomeOrig);
 Promise.all(promises).then(function(){
  return _regDb.ref('accrediti/'+target).update({ aliasStorici:aliasT });
 }).then(function(){
  return _regDb.ref('accrediti/'+da).remove();
 }).then(function(){
  // Log dell'operazione di merge nel target
  return _regDb.ref('accrediti/'+target+'/records').push({ timestamp:Date.now(), staffer:'(sistema)', nomeAlMomento:regNomePg(target), modifiche:[{campo:'Merge', da:regNomePg(da), a:regNomePg(target), delta:null}] });
 }).then(function(){ regRicarica(); }).catch(function(e){ alert('Errore nel merge: '+e.message); });
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
