'use strict';
// Controles accesibles y filtrado en el navegador sin llamadas innecesarias al servidor.
const sidebar=document.getElementById('sidebar');
const overlay=document.getElementById('overlay');
function toggleMenu(open){if(!sidebar)return;sidebar.classList.toggle('show',open);overlay?.classList.toggle('show',open);document.body.classList.toggle('menu-open',open);}
document.getElementById('toggleSidebar')?.addEventListener('click',()=>toggleMenu(!sidebar.classList.contains('show')));
overlay?.addEventListener('click',()=>toggleMenu(false));
window.addEventListener('keydown',e=>{if(e.key==='Escape')toggleMenu(false);});
document.querySelectorAll('form.confirm-action').forEach(form=>form.addEventListener('submit',event=>{if(!window.confirm(form.dataset.confirm||'¿Confirmar esta operación?'))event.preventDefault();}));
document.querySelectorAll('[data-toggle-password]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById('password');if(!input)return;input.type=input.type==='password'?'text':'password';btn.setAttribute('aria-label',input.type==='password'?'Mostrar contraseña':'Ocultar contraseña');}));
// Búsqueda y filtrado combinado para los listados administrativos.
function filterRecords(table){
 const rows=[...table.querySelectorAll('tbody tr.data-row')];
 const search=document.querySelector('input[data-table-search="'+table.id+'"]');
 const status=document.querySelector('select[data-status-filter="'+table.id+'"]');
 let visible=0;
 rows.forEach(row=>{
   const matchText=!search?.value.trim()||row.textContent.toLocaleLowerCase('es').includes(search.value.trim().toLocaleLowerCase('es'));
   const matchStatus=!status?.value||row.dataset.rowStatus===status.value;
   row.hidden=!(matchText&&matchStatus);if(!row.hidden)visible++;
 });
 const count=document.querySelector('[data-count-visible]');if(count)count.textContent=`${visible} de ${rows.length} registros`;
 const empty=table.parentElement.querySelector('.no-results');if(empty)empty.hidden=visible!==0||!rows.length;
}
document.querySelectorAll('input[data-table-search],select[data-status-filter]').forEach(el=>{
 const table=document.getElementById(el.dataset.tableSearch||el.dataset.statusFilter);
 if(table)el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>filterRecords(table));
});

document.querySelectorAll('[data-dismiss-alert]').forEach(button=>button.addEventListener('click',()=>button.closest('.flash')?.remove()));
