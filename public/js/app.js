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
document.querySelectorAll('input[data-table-search]').forEach(input=>{const table=document.getElementById(input.dataset.tableSearch);if(!table)return;const rows=[...table.querySelectorAll('tbody tr.data-row')];const noResults=table.parentElement.querySelector('.no-results');const count=document.querySelector('[data-count-visible]');input.addEventListener('input',()=>{const q=input.value.trim().toLocaleLowerCase('es');let visible=0;rows.forEach(row=>{const match=row.textContent.toLocaleLowerCase('es').includes(q);row.hidden=!match;if(match)visible++;});if(count)count.textContent=`${visible} de ${rows.length} registros`;if(noResults)noResults.hidden=visible!==0 || !rows.length;});});

document.querySelectorAll('[data-dismiss-alert]').forEach(button=>button.addEventListener('click',()=>button.closest('.flash')?.remove()));
