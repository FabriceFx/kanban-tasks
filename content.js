(()=>{var H=(e,t)=>()=>(e&&(t=e(e=0)),t);var ye=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);function ne(e){if(!e||typeof e!="object")return{...N};let t="todo";(e.columnId==="todo"||e.columnId==="inprogress"||e.columnId==="done")&&(t=e.columnId);let a=[];Array.isArray(e.tags)&&(a=e.tags.map(d=>typeof d=="string"?d.trim():"").filter(d=>d.length>0));let n=[];Array.isArray(e.subtasks)&&(n=e.subtasks.filter(d=>d&&typeof d=="object"&&typeof d.title=="string").map(d=>({id:typeof d.id=="string"?d.id.trim():Math.random().toString(36).substring(2,9),title:d.title.trim(),completed:!!d.completed})));let i=typeof e.gmailId=="string"?e.gmailId.trim():null,s=typeof e.gmailSubject=="string"?e.gmailSubject.trim():null,r=null;typeof e.gmailUrl=="string"&&e.gmailUrl.trim().startsWith("https://")&&(r=e.gmailUrl.trim());let l=!!e.archived;return{columnId:t,tags:a,subtasks:n,gmailId:i,gmailSubject:s,gmailUrl:r,archived:l}}function se(e){if(!e||typeof e!="string")return{description:"",metadata:{...N}};let t=e.split(ae),a=t[0].trim();if(t.length<2)return{description:a,metadata:{...N}};try{let n=JSON.parse(t[1].trim()),i=ne(n);return{description:a,metadata:i}}catch(n){return console.warn("Erreur de lecture des m\xE9tadonn\xE9es JSON. Restauration des valeurs par d\xE9faut.",n),{description:e.trim(),metadata:{...N}}}}function L(e,t){let a=e?e.trim():"",n=ne(t),i=JSON.stringify(n,null,2),s=`
`.repeat(30);return`${a}${s}${ae}${i}`}function ie(e){return!!(e&&typeof e=="object"&&e.title==="__KANBAN_CONFIG__")}var ae,N,oe=H(()=>{ae=`

--- KANBAN_METADATA ---
`,N={columnId:"todo",tags:[],subtasks:[],gmailId:null,gmailSubject:null,gmailUrl:null,archived:!1}});function _(e,t=""){return typeof chrome<"u"&&chrome.i18n&&chrome.i18n.getMessage(e)||t}function _e(e=document){e.querySelectorAll("[data-i18n]").forEach(t=>{let a=t.getAttribute("data-i18n"),n=chrome.i18n.getMessage(a);n&&(a==="setup_step_2"||a==="setup_step_3"?t.innerHTML=n:t.textContent=n)}),e.querySelectorAll("[data-i18n-placeholder]").forEach(t=>{let a=t.getAttribute("data-i18n-placeholder"),n=chrome.i18n.getMessage(a);n&&(t.placeholder=n)}),e.querySelectorAll("[data-i18n-title]").forEach(t=>{let a=t.getAttribute("data-i18n-title"),n=chrome.i18n.getMessage(a);n&&(t.title=n)})}function Le(){return`
  <div class="kanban-root">
    <!-- EN-T\xCATE -->
    <header class="kanban-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="logo-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
            </svg>
          </div>
          <select id="board-select" class="board-select">
            <option value="" disabled selected data-i18n="loading">Chargement...</option>
          </select>
        </div>
        <div class="header-actions">
          <div id="sync-status" class="sync-badge">
            <span class="sync-dot" id="sync-dot"></span>
            <span id="sync-text" data-i18n="syncing">Synchro...</span>
          </div>
          <button id="btn-logout" class="btn-icon danger hidden" title="Se d\xE9connecter" data-i18n-title="logout">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
          <button id="btn-fullscreen" class="btn-icon" title="Ouvrir dans un nouvel onglet" data-i18n-title="open_new_tab">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tab-switcher">
        <button id="tab-kanban" class="tab-btn active" data-i18n="tab_kanban">Tableau Kanban</button>
        <button id="tab-smart" class="tab-btn" data-i18n="tab_smart">Objectifs du jour</button>
      </div>
    </header>

    <!-- ZONE PRINCIPALE -->
    <main class="kanban-main">

      <!-- SETUP WIZARD (masqu\xE9 par d\xE9faut) -->
      <div id="setup-wizard" class="setup-wizard hidden">
        <div class="wizard-content">
          <div>
            <div class="wizard-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
            </div>
            <h2 class="wizard-title" data-i18n="setup_title">Acc\xE8s \xE0 vos t\xE2ches Google</h2>
            <p class="wizard-desc" data-i18n="setup_desc">Visualisez et g\xE9rez vos t\xE2ches Google Tasks dans un tableau Kanban intuitif et fluide directement int\xE9gr\xE9.</p>
          </div>
 
          <div>
            <button id="btn-login" class="btn-google">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span data-i18n="login_google">Se connecter avec Google</span>
            </button>
            <p class="wizard-footer-text" style="margin-top: 12px;" data-i18n="setup_footer">Vos donn\xE9es de t\xE2ches transitent uniquement entre Chrome et les serveurs s\xE9curis\xE9s de Google.</p>
          </div>

          <div id="auth-error-display" class="auth-error-display"></div>
        </div>
      </div>

      <!-- TOAST GMAIL -->
      <div id="gmail-toast" class="gmail-toast">
        <div class="toast-header">
          <div class="toast-badge">
            <div class="toast-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span class="toast-label" data-i18n="toast_email_opened">E-mail ouvert</span>
          </div>
          <button id="btn-close-toast" class="btn-close-toast">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p id="gmail-toast-subject" class="toast-subject"></p>
        <button id="btn-add-gmail-task" class="btn-toast-add" data-i18n="gmail_toast_btn_create">Cr\xE9er une t\xE2che Kanban</button>
      </div>

      <!-- VUE KANBAN -->
      <div id="view-kanban" class="view-kanban">
        <!-- Colonne \xC0 FAIRE -->
        <div id="col-todo-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_todo">\xC0 faire</span>
            <span id="badge-todo" class="column-badge badge-todo">0</span>
          </div>
          <div id="skeleton-todo" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-25"></div>
              <div class="skeleton-line w-75"></div>
              <div class="skeleton-line w-85"></div>
            </div>
          </div>
          <div id="col-todo" class="card-list"></div>
          <button id="btn-add-todo" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une t\xE2che</span>
          </button>
        </div>

        <!-- Colonne EN COURS -->
        <div id="col-inprogress-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_in_progress">En cours</span>
            <span id="badge-inprogress" class="column-badge badge-inprogress">0</span>
          </div>
          <div id="skeleton-inprogress" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-33"></div>
              <div class="skeleton-line w-85"></div>
            </div>
          </div>
          <div id="col-inprogress" class="card-list"></div>
          <button id="btn-add-inprogress" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une t\xE2che</span>
          </button>
        </div>

        <!-- Colonne TERMIN\xC9 -->
        <div id="col-done-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_done">Termin\xE9</span>
            <div class="flex items-center gap-2">
              <button id="btn-archive-done" class="column-badge" style="color: #1a7f37; border-color: rgba(26,127,55,0.2); background-color: #e6f4ea; cursor: pointer; display: none;" data-i18n="btn_archive" title="Archiver toutes les t\xE2ches termin\xE9es">Archiver</button>
              <span id="badge-done" class="column-badge badge-done">0</span>
            </div>
          </div>
          <div id="skeleton-done" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-25"></div>
            </div>
          </div>
          <div id="col-done" class="card-list"></div>
          <button id="btn-add-done" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une t\xE2che</span>
          </button>
        </div>
      </div>

      <!-- VUE SMART -->
      <div id="view-smart" class="view-smart hidden">
        <div>
          <h2 class="smart-section-title today">
            <span class="smart-dot today"></span> <span data-i18n="smart_today">Aujourd'hui</span>
          </h2>
          <div id="smart-today">
            <p class="smart-empty" data-i18n="smart_no_tasks">Aucune t\xE2che planifi\xE9e pour aujourd'hui.</p>
          </div>
        </div>
        <div>
          <h2 class="smart-section-title week">
            <span class="smart-dot week"></span> <span data-i18n="smart_week">Cette semaine</span>
          </h2>
          <div id="smart-week">
            <p class="smart-empty" data-i18n="smart_no_tasks">Aucune t\xE2che planifi\xE9e pour cette semaine.</p>
          </div>
        </div>
      </div>

      <!-- PANNEAU D'\xC9DITION -->
      <div id="editor-panel" class="editor-overlay hidden">
        <div class="editor-panel">
          <div class="editor-header">
            <h3 data-i18n="editor_details_title">D\xE9tails de la t\xE2che</h3>
            <button id="btn-close-editor" class="btn-close-editor" data-i18n="btn_cancel">Fermer</button>
          </div>
          <div class="editor-body">
            <input type="hidden" id="edit-id">
            <div>
              <label class="form-label" data-i18n="editor_title_label">Titre</label>
              <input type="text" id="edit-title" class="form-input" placeholder="Nommez votre t\xE2che..." data-i18n-placeholder="editor_title_placeholder">
            </div>
            <div>
              <label class="form-label" data-i18n="editor_desc_label">Description</label>
              <textarea id="edit-desc" rows="4" class="form-textarea" placeholder="R\xE9digez des d\xE9tails ou consignes..." data-i18n-placeholder="editor_desc_placeholder"></textarea>
            </div>
            <div class="form-row">
              <div>
                <label class="form-label" data-i18n="editor_date_label">\xC9ch\xE9ance</label>
                <input type="date" id="edit-date" class="form-input">
              </div>
              <div>
                <label class="form-label" data-i18n="editor_status_label">Statut</label>
                <select id="edit-status" class="form-select">
                  <option value="todo" data-i18n="col_todo">\xC0 faire</option>
                  <option value="inprogress" data-i18n="col_in_progress">En cours</option>
                  <option value="done" data-i18n="col_done">Termin\xE9</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label" data-i18n="editor_tags_label">\xC9tiquettes (s\xE9par\xE9es par virgules)</label>
              <input type="text" id="edit-tags" class="form-input" placeholder="ex: Urgent, Projet client" data-i18n-placeholder="editor_tags_placeholder">
            </div>
            <div class="subtasks-section" id="subtasks-section">
              <label class="form-label" data-i18n="editor_subtasks_label">Sous-t\xE2ches</label>
              <div id="subtasks-container"></div>
              <div class="flex gap-2" style="margin-top: 12px;">
                <input type="text" id="new-subtask-title" class="form-input" placeholder="Ajouter une sous-t\xE2che..." style="flex: 1;" data-i18n-placeholder="editor_new_subtask_placeholder">
                <button id="btn-add-subtask" class="btn-save" style="width: auto; padding: 8px 16px; border-radius: 8px; flex-shrink: 0; font-size: 11px;" data-i18n="btn_add" disabled>Ajouter</button>
              </div>
            </div>
            <div id="gmail-context" class="gmail-context hidden">
              <div class="gmail-context-header">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="gmail-context-label" data-i18n="editor_gmail_context_label">E-mail Gmail d'origine</span>
              </div>
              <p id="gmail-subject" class="gmail-context-subject"></p>
              <a id="gmail-link" href="#" target="_blank" class="gmail-context-link">
                <span data-i18n="editor_view_gmail_link">Consulter l'e-mail dans Gmail</span>
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
                </svg>
              </a>
            </div>
          </div>
          <div class="editor-footer">
            <button id="btn-delete-task" class="btn-delete" title="Supprimer la t\xE2che" data-i18n-title="btn_delete_task">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <button id="btn-save-changes" class="btn-save" data-i18n="editor_btn_save">Enregistrer les modifications</button>
          </div>
        </div>
      </div>

    </main>
  </div>
  `}function o(e){return h?h.getElementById(e):null}async function w(e,t="GET",a=null){if(!E)throw J(!1),new Error("Authentification requise.");return new Promise((n,i)=>{chrome.runtime.sendMessage({type:"API_PROXY",endpoint:e,method:t,body:a,token:E},s=>{if(chrome.runtime.lastError){c("error","Erreur comm."),i(new Error(chrome.runtime.lastError.message));return}if(!s||!s.success){if(s&&s.status===401){me(),i(new Error("Jeton expir\xE9. Veuillez vous reconnecter."));return}c("error","Erreur Sync"),i(new Error(s?s.error:"Pas de r\xE9ponse"));return}n(s.data)})})}function T(){v=!0;let e=document.querySelector("div[role='main']");if(!e)return;e.style.position="relative",Array.from(e.children).forEach(a=>{a.id!=="gmail-kanban-embed"&&(x.has(a)||x.set(a,a.style.display||""),a.style.display="none")});let t=document.getElementById("gmail-kanban-embed");if(t)t.parentNode!==e&&e.appendChild(t),t.style.display="block",M&&u&&X(u);else{t=document.createElement("div"),t.id="gmail-kanban-embed",Object.assign(t.style,{position:"absolute",inset:"0",zIndex:"9999",borderRadius:"16px",overflow:"hidden",display:"block"}),h=t.attachShadow({mode:"open"});let a=document.createElement("link");a.rel="stylesheet",a.href=chrome.runtime.getURL("kanban-embed.css"),h.appendChild(a);let n=document.createElement("div");n.innerHTML=Le(),h.appendChild(n.firstElementChild),_e(h),e.appendChild(t),a.addEventListener("load",()=>{M||(M=!0,re())}),setTimeout(()=>{M||(M=!0,re())},500)}G()}function j(){v=!1;let e=document.getElementById("gmail-kanban-embed");e&&(e.style.display="none"),x.forEach((t,a)=>{a&&a.parentElement&&(a.style.display=t)}),x.clear(),G()}function ue(){if(!v)return;let e=document.querySelector("div[role='main']");e&&Array.from(e.children).forEach(t=>{t.id!=="gmail-kanban-embed"&&(x.has(t)||x.set(t,t.style.display||""),t.style.display!=="none"&&(t.style.display="none"))})}function re(){Ce(),xe(),De()}function Ce(){o("tab-kanban")?.addEventListener("click",()=>$("kanban")),o("tab-smart")?.addEventListener("click",()=>$("smart")),o("board-select")?.addEventListener("change",t=>{u=t.target.value,chrome.storage.local.set({activeListId:u}),X(u)}),o("btn-add-todo")?.addEventListener("click",()=>B("todo")),o("btn-add-inprogress")?.addEventListener("click",()=>B("inprogress")),o("btn-add-done")?.addEventListener("click",()=>B("done")),o("btn-archive-done")?.addEventListener("click",Ne),o("btn-close-editor")?.addEventListener("click",V),o("btn-save-changes")?.addEventListener("click",Se),o("btn-delete-task")?.addEventListener("click",Me),o("btn-add-subtask")?.addEventListener("click",de),o("new-subtask-title")?.addEventListener("input",()=>{let t=o("btn-add-subtask");t&&(t.disabled=!o("new-subtask-title").value.trim())}),o("new-subtask-title")?.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),de())}),o("btn-login")?.addEventListener("click",()=>J(!0)),o("btn-logout")?.addEventListener("click",me),o("btn-fullscreen")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_FULLSCREEN"})}),o("btn-close-toast")?.addEventListener("click",Y),o("btn-add-gmail-task")?.addEventListener("click",Ie),["todo","inprogress","done"].forEach(t=>{let a=o(`col-${t}-container`);a?.addEventListener("dragover",n=>{n.preventDefault(),a.classList.add("drag-over-active")}),a?.addEventListener("dragleave",()=>{a.classList.remove("drag-over-active")}),a?.addEventListener("drop",n=>{n.preventDefault(),a.classList.remove("drag-over-active");let i=n.dataTransfer.getData("text/plain"),s=h.getElementById(i),r=o(`col-${t}`);s&&r&&s.parentElement!==r&&(r.appendChild(s),f(),Ae(i,t))})}),chrome.runtime.onMessage.addListener(t=>{t.type==="EMAIL_CAPTURED"&&pe(t.data)}),chrome.storage.onChanged.addListener((t,a)=>{if(a==="local"&&u){let n=`kanban_tasks_cache_${u}`;if(t[n]){let i=t[n].newValue;if(i&&i.items){let s=Object.keys(p),r=i.items.map(d=>d.id);(s.length!==r.length||i.items.some(d=>{let m=p[d.id];return!m||m.columnId!==d.columnId||m.title!==d.title||m.desc!==d.desc}))&&(console.log("[Kanban] Mise \xE0 jour en temps r\xE9el d\xE9tect\xE9e depuis le cache"),I(i.items),navigator.onLine?c("connected","\xC0 jour (Synchro)"):c("offline","Hors-ligne (Cache)"))}}}});let e=o("extension-id-display");e&&(e.innerText=chrome.runtime.id)}async function xe(){c("connecting","Recherche de jeton..."),u=(await chrome.storage.local.get(["activeListId"])).activeListId||null,J(!1)}function J(e=!1){c("connecting","Authentification...");let t=o("auth-error-display");t&&(t.classList.remove("visible"),t.innerHTML=""),chrome.runtime.sendMessage({type:"GET_TASKS_TOKEN",interactive:e},a=>{let n=o("auth-error-display");if(chrome.runtime.lastError){console.error("[Kanban] Erreur de communication avec l'extension :",chrome.runtime.lastError),E=null;let i=o("setup-wizard");i&&i.classList.remove("hidden");let s=o("btn-logout");s&&s.classList.add("hidden"),c("offline","Erreur extension");let r=o("board-select");r&&(r.innerHTML=`<option value="" disabled selected>${_("setup_wizard_placeholder_login","Veuillez vous connecter")}</option>`),n&&(n.innerHTML=`<strong>Erreur de communication :</strong><br>Impossible de se connecter au service worker de l'extension.<br><span style="font-size: 9px; margin-top: 4px; display: block;">Essayez de recharger la page Gmail. (${chrome.runtime.lastError.message})</span>`,n.classList.add("visible"));return}if(a&&a.success&&a.token){E=a.token;let i=o("setup-wizard");i&&i.classList.add("hidden");let s=o("btn-logout");s&&s.classList.remove("hidden"),c("connected","Connect\xE9"),Te()}else{E=null;let i=o("setup-wizard");i&&i.classList.remove("hidden");let s=o("btn-logout");s&&s.classList.add("hidden"),c("offline","Non authentifi\xE9");let r=o("board-select");r&&(r.innerHTML=`<option value="" disabled selected>${_("setup_wizard_placeholder_login","Veuillez vous connecter")}</option>`);let l=a&&a.error?a.error:"\xC9chec d'authentification";e&&(console.error("[Kanban] \xC9chec de l'authentification (Shadow DOM) :",l),n&&(l.includes("OAuth2 client not found")||l.includes("OAuth2")?n.innerHTML=`<strong>Erreur de configuration Google Cloud :</strong><br>Le client_id dans manifest.json n'est pas associ\xE9 \xE0 l'ID d'extension <code>${chrome.runtime.id}</code>.<br><span style="font-size: 9px; margin-top: 4px; display: block;">D\xE9pliez la section ci-dessous pour l'associer.</span>`:n.innerText=`Erreur : ${l}`,n.classList.add("visible")))}})}function me(){E&&chrome.runtime.sendMessage({type:"LOGOUT_USER",token:E},()=>{E=null,o("setup-wizard").classList.remove("hidden"),o("btn-logout").classList.add("hidden"),c("offline","D\xE9connect\xE9"),o("board-select").innerHTML=`<option value="" disabled selected>${_("setup_wizard_placeholder_login","Veuillez vous connecter")}</option>`,Z()})}function c(e,t){let a=o("sync-dot"),n=o("sync-text");if(!a||!n)return;let s={"Hors-ligne (Cache)":"status_offline_cache","\xC0 jour (Synchro)":"status_synced","Recherche de jeton...":"status_searching_token","Authentification...":"status_authenticating",Connect\u00E9:"status_connected","Non authentifi\xE9":"status_unauthenticated",D\u00E9connect\u00E9:"status_logged_out","Erreur Sync":"status_sync_error","Synchro listes...":"status_sync_lists","Erreur r\xE9seau":"status_network_error",Vide:"status_empty","Chargement t\xE2ches...":"status_loading_tasks","\xC0 jour (Cache)":"status_cache_up_to_date","\xC0 jour":"status_up_to_date","Enregistrement...":"status_saving","D\xE9plac\xE9 !":"status_moved","Sync \xE9chec":"status_sync_failed","Cr\xE9ation t\xE2che...":"status_creating_task","Cr\xE9\xE9e !":"status_created","\xC9chec cr\xE9ation":"status_create_failed","Sauvegarde...":"status_saving_changes","Modifi\xE9e !":"status_modified","Suppression...":"status_deleting",Supprim\u00E9e:"status_deleted","\xC9chec suppression":"status_delete_failed","Liaison e-mail...":"status_linking_email","Li\xE9 !":"status_linked","\xC9chec liaison":"status_link_failed","Archivage...":"status_archiving","Archiv\xE9es !":"status_archived"}[t],r=s?_(s,t):t;n.innerText=r,a.className="sync-dot "+e}async function Te(){c("connecting","Synchro listes...");try{let t=(await chrome.storage.local.get("kanban_lists_cache")).kanban_lists_cache;if(t&&Date.now()-t.timestamp<3e4){console.log("[Kanban] Utilisation du cache pour les listes"),W(t.items);return}}catch(e){console.warn("[Kanban] \xC9chec lecture cache listes :",e)}try{let e=await w("/users/@me/lists"),t=e&&e.items||[];await chrome.storage.local.set({kanban_lists_cache:{timestamp:Date.now(),items:t}}),W(t)}catch(e){console.error("[Kanban] Erreur r\xE9seau lors de la r\xE9cup\xE9ration des listes :",e);try{let n=(await chrome.storage.local.get("kanban_lists_cache")).kanban_lists_cache;if(n&&n.items){console.log("[Kanban] Fallback hors-ligne sur cache expir\xE9 pour les listes"),W(n.items,!0);return}}catch{}c("error","Erreur r\xE9seau");let t=o("board-select");t&&(t.innerHTML='<option value="" disabled>Erreur de connexion</option>')}}function W(e,t=!1){let a=o("board-select");a&&(a.innerHTML="",e.length>0?(e.forEach(n=>{let i=document.createElement("option");i.value=n.id,i.innerText=n.title+(t?" (hors-ligne)":""),a.appendChild(i)}),u&&Array.from(a.options).some(n=>n.value===u)?a.value=u:(u=e[0].id,a.value=u,chrome.storage.local.set({activeListId:u})),X(u),t&&c("offline","Hors-ligne (Cache)")):(a.innerHTML='<option value="" disabled>Aucun tableau trouv\xE9</option>',c("connected","Vide")))}async function X(e){if(!e)return;Z(),K(!0),c("connecting","Chargement t\xE2ches...");let t=`kanban_tasks_cache_${e}`;try{let n=(await chrome.storage.local.get(t))[t];if(n&&Date.now()-n.timestamp<3e4){console.log("[Kanban] Utilisation du cache pour les t\xE2ches de",e),K(!1),I(n.items),navigator.onLine?c("connected","\xC0 jour (Cache)"):c("offline","Hors-ligne (Cache)");return}}catch(a){console.warn("[Kanban] \xC9chec lecture cache t\xE2ches :",a)}try{let a=await w(`/lists/${e}/tasks?showCompleted=true&showHidden=true`);K(!1);let n=a&&a.items||[],i=[];n.forEach(s=>{if(ie(s))return;let{description:r,metadata:l}=se(s.notes);if(l.archived===!0)return;let d=l.columnId||"todo";s.status==="completed"&&(d="done");let m={id:s.id,title:s.title,desc:r,date:s.due?je(s.due):"",displayDate:s.due?he(s.due):"",tags:l.tags||[],subtasks:l.subtasks||[],gmailId:l.gmailId,gmailSubject:l.gmailSubject,gmailUrl:l.gmailUrl,columnId:d,completed:s.status==="completed",archived:!1};i.push(m)}),await chrome.storage.local.set({[t]:{timestamp:Date.now(),items:i}}),I(i),c("connected","\xC0 jour")}catch(a){console.error("[Kanban] Erreur de r\xE9cup\xE9ration des t\xE2ches :",a),K(!1);try{let i=(await chrome.storage.local.get(t))[t];if(i&&i.items){console.log("[Kanban] Fallback hors-ligne sur cache expir\xE9 pour les t\xE2ches"),I(i.items),c("offline","Hors-ligne (Cache)");return}}catch{}c("error","Erreur r\xE9seau")}}function I(e){Z(),p={},e.forEach(t=>{t.archived!==!0&&(p[t.id]=t,D(t))}),f()}function D(e){let t=o(`col-${e.columnId}`);if(!t)return;let a=document.createElement("div");a.id=e.id,a.draggable=!0,a.className="task-card";let n="";e.tags&&e.tags.length>0&&(n='<div class="card-tags">',e.tags.forEach(d=>{let m=d.toLowerCase()==="urgent"?"tag tag-urgent":"tag tag-default";n+=`<span class="${m}">${y(d)}</span>`}),n+="</div>");let i=e.completed?"card-title completed":"card-title",s=e.desc?`<p class="card-desc">${y(e.desc)}</p>`:"",r="";(e.displayDate||e.gmailUrl)&&(r='<div class="card-footer">',e.displayDate?r+=`<span class="card-date">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
        </svg>
        ${e.displayDate}
      </span>`:r+="<span></span>",e.gmailUrl&&(r+=`<span class="card-gmail-badge">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Gmail
      </span>`),r+="</div>");let l="";if(e.subtasks&&e.subtasks.length>0){let d=e.subtasks.filter(C=>C.completed).length,m=e.subtasks.length,g=Math.round(d/m*100);l=`
      <div class="card-subtasks">
        <div class="subtasks-text">
          <svg class="subtask-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${d}/${m} ${_("subtasks_progression","sous-t\xE2ches")}</span>
        </div>
        <div class="subtasks-progress-bar">
          <div class="subtasks-progress-fill" style="width: ${g}%;"></div>
        </div>
      </div>
    `}a.innerHTML=`${n}<h4 class="${i}">${y(e.title)}</h4>${s}${l}${r}`,a.addEventListener("dragstart",d=>{d.dataTransfer.setData("text/plain",a.id),d.dataTransfer.effectAllowed="move",setTimeout(()=>a.classList.add("dragging"),0)}),a.addEventListener("dragend",()=>a.classList.remove("dragging")),a.addEventListener("click",()=>U(e.id)),t.appendChild(a)}async function Ae(e,t){let a=p[e];if(!a)return;let n=a.columnId,i=a.completed;if(!navigator.onLine){alert("Impossible de modifier la t\xE2che en mode hors-ligne. Veuillez r\xE9tablir votre connexion internet.");let m=h.getElementById(e);if(m){let g=o(`col-${n}`);g&&g.appendChild(m)}f(),c("offline","Hors-ligne (Cache)");return}a.columnId=t;let s=t==="done";a.completed=s;let r=h.getElementById(e);if(r){let m=r.querySelector("h4");m&&(m.className=s?"card-title completed":"card-title")}f();let l=`kanban_tasks_cache_${u}`,d=async()=>{try{await chrome.storage.local.set({[l]:{timestamp:Date.now(),items:Object.values(p)}})}catch(m){console.warn("\xC9chec \xE9criture cache :",m)}};await d(),c("connecting","Enregistrement...");try{let g={notes:L(a.desc,{columnId:t,tags:a.tags,subtasks:a.subtasks,gmailId:a.gmailId,gmailSubject:a.gmailSubject,gmailUrl:a.gmailUrl,archived:a.archived||!1}),status:s?"completed":"needsAction"};s||(g.completed=null),await w(`/lists/${u}/tasks/${e}`,"PATCH",g),c("connected","D\xE9plac\xE9 !")}catch(m){if(console.error("\xC9chec de d\xE9placement de colonne :",m),a.columnId=n,a.completed=i,r){let g=o(`col-${n}`);if(g){g.appendChild(r);let C=r.querySelector("h4");C&&(C.className=i?"card-title completed":"card-title")}}f(),await d(),alert("\xC9chec de la synchronisation avec Google Tasks. La t\xE2che a \xE9t\xE9 replac\xE9e \xE0 sa position d'origine."),c("error","Sync \xE9chec")}}async function B(e){if(!navigator.onLine){alert("Impossible d'ajouter une t\xE2che en mode hors-ligne."),c("offline","Hors-ligne (Cache)");return}c("connecting","Cr\xE9ation t\xE2che...");try{let a={title:"Nouvelle t\xE2che",notes:L("",{columnId:e,tags:[],subtasks:[]}),status:e==="done"?"completed":"needsAction"},n=await w(`/lists/${u}/tasks`,"POST",a),i={id:n.id,title:n.title,desc:"",date:"",displayDate:"",tags:[],subtasks:[],columnId:e,completed:e==="done"};p[i.id]=i,D(i),f();let s=`kanban_tasks_cache_${u}`;await chrome.storage.local.set({[s]:{timestamp:Date.now(),items:Object.values(p)}}),U(i.id),c("connected","Cr\xE9\xE9e !")}catch{c("error","\xC9chec cr\xE9ation")}}function U(e){let t=p[e];if(!t)return;o("edit-id").value=e,o("edit-title").value=t.title,o("edit-desc").value=t.desc,o("edit-date").value=t.date,o("edit-status").value=t.columnId,o("edit-tags").value=t.tags.join(", "),o("new-subtask-title").value="";let a=o("btn-add-subtask");a&&(a.disabled=!0),ee(t);let n=o("gmail-context");t.gmailUrl?(n.classList.remove("hidden"),o("gmail-subject").innerText=t.gmailSubject,o("gmail-link").href=t.gmailUrl):n.classList.add("hidden"),o("editor-panel").classList.remove("hidden")}function V(){o("editor-panel").classList.add("hidden")}async function Se(){let e=o("edit-id").value,t=p[e];if(!t)return;if(!navigator.onLine){alert("Impossible de modifier la t\xE2che en mode hors-ligne."),c("offline","Hors-ligne (Cache)");return}let a={title:t.title,desc:t.desc,date:t.date,displayDate:t.displayDate,columnId:t.columnId,tags:[...t.tags],completed:t.completed},n=o("edit-title").value.trim()||"Sans titre",i=o("edit-desc").value,s=o("edit-date").value,r=o("edit-status").value,l=o("edit-tags").value,d=l?l.split(",").map(k=>k.trim()).filter(k=>k.length>0):[],m=r==="done";V(),t.title=n,t.desc=i,t.date=s,t.displayDate=s?he(s):"",t.columnId=r,t.tags=d,t.completed=m;let g=h.getElementById(e);g&&g.remove(),D(t),f();let C=`kanban_tasks_cache_${u}`,te=async()=>{try{await chrome.storage.local.set({[C]:{timestamp:Date.now(),items:Object.values(p)}})}catch(k){console.warn("\xC9chec \xE9criture cache :",k)}};await te(),c("connecting","Sauvegarde...");try{let k=L(i,{columnId:r,tags:d,subtasks:t.subtasks,gmailId:t.gmailId,gmailSubject:t.gmailSubject,gmailUrl:t.gmailUrl,archived:t.archived||!1}),S={title:n,notes:k,status:m?"completed":"needsAction",due:s?new Date(s).toISOString():null};m||(S.completed=null),await w(`/lists/${u}/tasks/${e}`,"PATCH",S),c("connected","Modifi\xE9e !")}catch(k){console.error("\xC9chec de sauvegarde des modifications :",k),Object.assign(t,a);let S=h.getElementById(e);S&&S.remove(),D(t),f(),await te(),alert("\xC9chec de la sauvegarde sur Google Tasks. Les modifications ont \xE9t\xE9 annul\xE9es."),c("error","Sync \xE9chec")}}async function Me(){if(!navigator.onLine){alert("Impossible de supprimer la t\xE2che en mode hors-ligne."),c("offline","Hors-ligne (Cache)");return}let e=o("edit-id").value;if(p[e]&&confirm("Voulez-vous vraiment supprimer d\xE9finitivement cette t\xE2che ?")){c("connecting","Suppression...");try{await w(`/lists/${u}/tasks/${e}`,"DELETE");let a=h.getElementById(e);a&&a.remove(),delete p[e],f();let n=`kanban_tasks_cache_${u}`;await chrome.storage.local.set({[n]:{timestamp:Date.now(),items:Object.values(p)}}),V(),c("connected","Supprim\xE9e")}catch{c("error","\xC9chec suppression")}}}function pe(e){b=e;let t=o("gmail-toast");t&&(o("gmail-toast-subject").innerText=e.title,t.classList.add("visible"))}function Y(){let e=o("gmail-toast");e&&(e.classList.remove("visible"),chrome.storage.local.remove("lastCapturedEmail").catch(()=>{}))}async function Ie(){if(!navigator.onLine){alert("Impossible de lier un e-mail en mode hors-ligne."),c("offline","Hors-ligne (Cache)");return}if(b){c("connecting","Liaison e-mail..."),Y(),chrome.storage.local.remove("lastCapturedEmail").catch(()=>{});try{let e=L("Consulter l'e-mail li\xE9 ci-dessous pour plus de d\xE9tails.",{columnId:"todo",tags:["Gmail"],subtasks:[],gmailId:b.gmailId,gmailSubject:b.title,gmailUrl:b.gmailUrl}),t={title:b.title,notes:e,status:"needsAction"},a=await w(`/lists/${u}/tasks`,"POST",t),n={id:a.id,title:a.title,desc:"Consulter l'e-mail li\xE9 ci-dessous pour plus de d\xE9tails.",date:"",displayDate:"",tags:["Gmail"],subtasks:[],gmailId:b.gmailId,gmailSubject:b.title,gmailUrl:b.gmailUrl,columnId:"todo",completed:!1};p[n.id]=n,D(n),f();let i=`kanban_tasks_cache_${u}`;await chrome.storage.local.set({[i]:{timestamp:Date.now(),items:Object.values(p)}}),U(n.id),c("connected","Li\xE9 !")}catch{c("error","\xC9chec liaison")}b=null}}async function De(){try{let e=await chrome.storage.local.get(["lastCapturedEmail"]);e.lastCapturedEmail&&pe(e.lastCapturedEmail)}catch(e){console.error("Erreur lors du d\xE9codage de l'e-mail stock\xE9 :",e)}}function $(e){let t=o("tab-kanban"),a=o("tab-smart"),n=o("view-kanban"),i=o("view-smart");e==="kanban"?(t.classList.add("active"),a.classList.remove("active"),n.classList.remove("hidden"),i.classList.add("hidden")):(a.classList.add("active"),t.classList.remove("active"),n.classList.add("hidden"),i.classList.remove("hidden"),$e())}function $e(){let e=o("smart-today"),t=o("smart-week");e.innerHTML="",t.innerHTML="";let a=ce(new Date),n=new Date;n.setDate(n.getDate()+7);let i=ce(n),s=0,r=0;Object.values(p).forEach(l=>{l.completed||!l.date||(l.date===a?(le(l,e),s++):l.date>a&&l.date<=i&&(le(l,t),r++))}),s===0&&(e.innerHTML=`<p class="smart-empty">Aucune t\xE2che planifi\xE9e pour aujourd'hui.</p>`),r===0&&(t.innerHTML='<p class="smart-empty">Aucune t\xE2che planifi\xE9e pour cette semaine.</p>')}function le(e,t){let a=document.createElement("div");a.className="smart-card";let n="";e.tags&&e.tags.length>0&&(n='<div class="card-tags">',e.tags.forEach(i=>{let s=i.toLowerCase()==="urgent"?"tag tag-urgent":"tag tag-default";n+=`<span class="${s}">${y(i)}</span>`}),n+="</div>"),a.innerHTML=`
    ${n}
    <h4 class="card-title">${y(e.title)}</h4>
    ${e.desc?`<p class="card-desc" style="-webkit-line-clamp:1;">${y(e.desc)}</p>`:""}
    <div class="smart-card-footer">
      <span class="smart-date-badge">${e.displayDate}</span>
      <span class="smart-column-badge">${e.columnId==="inprogress"?"En cours":"\xC0 faire"}</span>
    </div>
  `,a.addEventListener("click",()=>{$("kanban"),setTimeout(()=>U(e.id),150)}),t.appendChild(a)}function Z(){["todo","inprogress","done"].forEach(e=>{let t=o(`col-${e}`);t&&(t.innerHTML="")})}function K(e){["todo","inprogress","done"].forEach(t=>{let a=o(`skeleton-${t}`);a&&(e?a.classList.remove("hidden"):a.classList.add("hidden"))})}function f(){["todo","inprogress","done"].forEach(e=>{let t=o(`col-${e}`),a=o(`badge-${e}`);if(t&&a){let n=t.children.length;if(a.innerText=n,e==="done"){let i=o("btn-archive-done");i&&(i.style.display=n>0?"block":"none")}}})}function y(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function he(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}):""}function je(e){return e?new Date(e).toISOString().split("T")[0]:""}function ce(e){let t=e.getTimezoneOffset();return new Date(e.getTime()-t*60*1e3).toISOString().split("T")[0]}function Q(){let e=document.activeElement;if(!e)return!1;if(e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.isContentEditable||e.hasAttribute("contenteditable")||e.getAttribute("role")==="textbox")return!0;if(h&&h.activeElement){let a=h.activeElement;return a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.isContentEditable||a.hasAttribute("contenteditable")}return!1}function He(e){if(!h)return;let t=h.getElementById(e.id);if(!t)return;let a="";e.tags&&e.tags.length>0&&(a='<div class="card-tags">',e.tags.forEach(l=>{let d=l.toLowerCase()==="urgent"?"tag tag-urgent":"tag tag-default";a+=`<span class="${d}">${y(l)}</span>`}),a+="</div>");let n=e.completed?"card-title completed":"card-title",i=e.desc?`<p class="card-desc">${y(e.desc)}</p>`:"",s="";if(e.subtasks&&e.subtasks.length>0){let l=e.subtasks.filter(g=>g.completed).length,d=e.subtasks.length,m=Math.round(l/d*100);s=`
      <div class="card-subtasks">
        <div class="subtasks-text">
          <svg class="subtask-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${l}/${d} ${_("subtasks_progression","sous-t\xE2ches")}</span>
        </div>
        <div class="subtasks-progress-bar">
          <div class="subtasks-progress-fill" style="width: ${m}%;"></div>
        </div>
      </div>
    `}let r="";(e.displayDate||e.gmailUrl)&&(r='<div class="card-footer">',e.displayDate?r+=`<span class="card-date">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
        </svg>
        ${e.displayDate}
      </span>`:r+="<span></span>",e.gmailUrl&&(r+=`<span class="card-gmail-badge">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Gmail
      </span>`),r+="</div>"),t.innerHTML=`${a}<h4 class="${n}">${y(e.title)}</h4>${i}${s}${r}`}async function z(e){He(e);let t=`kanban_tasks_cache_${u}`;if(await(async()=>{try{await chrome.storage.local.set({[t]:{timestamp:Date.now(),items:Object.values(p)}})}catch(n){console.warn("\xC9chec \xE9criture cache :",n)}})(),!!navigator.onLine)try{let i={notes:L(e.desc,{columnId:e.columnId,tags:e.tags,subtasks:e.subtasks,gmailId:e.gmailId,gmailSubject:e.gmailSubject,gmailUrl:e.gmailUrl,archived:e.archived||!1}),status:e.completed?"completed":"needsAction"};await w(`/lists/${u}/tasks/${e.id}`,"PATCH",i)}catch(n){console.error("\xC9chec de synchronisation silencieuse des sous-t\xE2ches :",n)}}function de(){let e=o("edit-id").value,t=p[e];if(!t)return;let a=o("new-subtask-title"),n=o("btn-add-subtask"),i=a.value.trim();if(!i)return;a.value="",n&&(n.disabled=!0),t.subtasks||(t.subtasks=[]);let s={id:Math.random().toString(36).substring(2,9),title:i,completed:!1};t.subtasks.push(s),ee(t),z(t)}function ee(e){let t=o("subtasks-container");if(t){if(t.innerHTML="",!e.subtasks||e.subtasks.length===0){t.innerHTML='<p class="smart-empty" style="text-align: center; font-size: 11px; padding: 8px 0;">Aucune sous-t\xE2che.</p>';return}e.subtasks.forEach(a=>{let n=document.createElement("div");n.className="subtask-item";let i=document.createElement("input");i.type="checkbox",i.className="subtask-checkbox",i.checked=a.completed,i.addEventListener("change",()=>{a.completed=i.checked,a.completed?s.classList.add("completed"):s.classList.remove("completed"),z(e)});let s=document.createElement("input");s.type="text",s.className=a.completed?"subtask-input completed":"subtask-input",s.value=a.title,s.addEventListener("change",()=>{a.title=s.value.trim()||"Sous-t\xE2che",z(e)}),s.addEventListener("keydown",l=>{l.key==="Enter"&&s.blur()});let r=document.createElement("button");r.className="btn-delete-subtask",r.title="Supprimer la sous-t\xE2che",r.innerHTML=`
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:12px;height:12px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
      </svg>
    `,r.addEventListener("click",()=>{e.subtasks=e.subtasks.filter(l=>l.id!==a.id),ee(e),z(e)}),n.appendChild(i),n.appendChild(s),n.appendChild(r),t.appendChild(n)})}}async function Ne(){let e=Object.values(p).filter(s=>s.columnId==="done"&&!s.archived);if(e.length===0||!confirm(`Voulez-vous archiver ces ${e.length} t\xE2ches termin\xE9es ? (Elles resteront sauvegard\xE9es chez Google mais seront masqu\xE9es ici)`))return;c("connecting","Archivage...");let t=e.map(s=>({id:s.id,previousArchived:s.archived}));e.forEach(s=>{s.archived=!0;let r=h?h.getElementById(s.id):null;r&&r.remove()}),f();let a=`kanban_tasks_cache_${u}`,n=async()=>{try{await chrome.storage.local.set({[a]:{timestamp:Date.now(),items:Object.values(p)}})}catch(s){console.warn("\xC9chec \xE9criture cache :",s)}};if(await n(),!navigator.onLine){c("offline","Hors-ligne (Cache)");return}let i=e.map(async s=>{let r=L(s.desc,{columnId:s.columnId,tags:s.tags,subtasks:s.subtasks,gmailId:s.gmailId,gmailSubject:s.gmailSubject,gmailUrl:s.gmailUrl,archived:!0});await w(`/lists/${u}/tasks/${s.id}`,"PATCH",{notes:r})});try{await Promise.all(i),c("connected","Archiv\xE9es !")}catch(s){console.error("Erreur lors de l'archivage en arri\xE8re-plan :",s),t.forEach(r=>{let l=p[r.id];l&&(l.archived=r.previousArchived)}),I(Object.values(p)),await n(),alert("Une erreur est survenue lors de l'archivage avec Google Tasks. Certaines t\xE2ches ont \xE9t\xE9 restaur\xE9es."),c("error","Sync \xE9chec")}}var we,Ee,v,h,M,x,E,u,p,b,P=H(()=>{oe();R();we=window.alert;window.alert=function(e){let a={"Impossible de modifier la t\xE2che en mode hors-ligne. Veuillez r\xE9tablir votre connexion internet.":"alert_offline_modify_task","\xC9chec de la synchronisation avec Google Tasks. La t\xE2che a \xE9t\xE9 replac\xE9e \xE0 sa position d'origine.":"alert_sync_failed_rollback","Impossible d'ajouter une t\xE2che en mode hors-ligne.":"alert_offline_add_task","Impossible de modifier la t\xE2che en mode hors-ligne.":"alert_offline_edit_task","\xC9chec de la sauvegarde sur Google Tasks. Les modifications ont \xE9t\xE9 annul\xE9es.":"alert_save_failed_rollback","Impossible de supprimer la t\xE2che en mode hors-ligne.":"alert_offline_delete_task","Impossible de lier un e-mail en mode hors-ligne.":"alert_offline_link_email","Une erreur est survenue lors de l'archivage avec Google Tasks. Certaines t\xE2ches ont \xE9t\xE9 restaur\xE9es.":"alert_archive_failed_rollback"}[e],n=a?_(a,e):e;we(n)};Ee=window.confirm;window.confirm=function(e){let t={"Voulez-vous vraiment supprimer d\xE9finitivement cette t\xE2che ?":"delete_confirm"},a=e;if(t[e])a=_(t[e],e);else if(e.startsWith("Voulez-vous archiver ces")){let n=e.match(/\d+/),i=n?n[0]:"0";a=_("archive_confirm_plural",[i])||e}return Ee(a)};v=!1,h=null,M=!1,x=new Map,E=null,u=null,p={},b=null;window.addEventListener("keydown",e=>{if(v){if(e.key==="Escape"||e.keyCode===27){let t=o("editor-panel"),a=o("gmail-toast"),n=!1;t&&!t.classList.contains("hidden")&&(V(),n=!0),a&&!a.classList.contains("hidden")&&(Y(),n=!0),n&&(e.preventDefault(),e.stopPropagation());return}if(!Q()){if((e.code==="KeyN"||e.key==="n"||e.key==="N"||e.keyCode===78)&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault(),B("todo");return}if(e.altKey&&(e.code==="KeyT"||e.key==="t"||e.key==="T"||e.keyCode===84)){e.preventDefault();let t=o("tab-kanban");t&&(t.classList.contains("active")?$("smart"):$("kanban"))}}}},!0)});function ge(e,t=""){return typeof chrome<"u"&&chrome.i18n&&chrome.i18n.getMessage(e)||t}function q(){let e=document.querySelector(".TK"),t=document.querySelector(".ajl"),a=document.getElementById("gmail-sidebar-kanban");if(!a){a=document.createElement("div"),a.id="gmail-sidebar-kanban",a.className="aim",a.style.marginBottom="4px",a.innerHTML=`
      <div class="TO" style="user-select:none; display:flex !important; align-items:center !important; height:32px !important; padding-left:16px !important; border-radius:100px !important; margin-right:8px !important; cursor:pointer !important; transition:background-color 0.15s !important;">
        <span class="qj" style="display:flex !important; align-items:center !important; justify-content:center !important; width:20px !important; height:20px !important; margin-right:18px !important;">
          <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s;" id="sidebar-kanban-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
        </span>
        <span class="nU" style="display:flex !important; align-items:center !important; flex-grow:1 !important;">
          <a class="J-Ke n0" id="gmail-sidebar-kanban-link" href="#" title="${ge("sidebar_kanban_title","Ouvrir le Tableau Kanban Tasks")}" style="color:#444746 !important;font-family:'Google Sans',Roboto,sans-serif !important;font-size:14px !important;font-weight:500 !important;text-decoration:none !important; padding:0 !important; margin:0 !important; border:none !important; background:transparent !important; outline:none !important; width:100% !important; transition:color 0.15s !important;">
            <span id="sidebar-kanban-text" data-i18n="sidebar_kanban_text">${ge("sidebar_kanban_text","Tableau Kanban")}</span>
          </a>
        </span>
      </div>
    `;let r=a.querySelector(".TO");r.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),T()}),r.addEventListener("mouseenter",()=>{v||r.style.setProperty("background-color","rgba(0,0,0,0.04)","important")}),r.addEventListener("mouseleave",()=>{v||r.style.setProperty("background-color","transparent","important")})}let i=document.querySelector('a[href*="#inbox"]')||document.querySelector('a[title*="Inbox"]')||document.querySelector('a[title*="Bo\xEEte de r\xE9ception"]'),s=i?i.closest(".aim"):null;if(s&&s.parentNode)a.previousSibling!==s&&s.parentNode.insertBefore(a,s.nextSibling);else if(e)a.parentNode!==e&&e.appendChild(a);else if(t&&t.parentNode)a.parentNode!==t.parentNode&&t.parentNode.insertBefore(a,t);else{let r=document.querySelector(".ajl")||document.querySelector(".TK");if(r&&r.parentNode)a.parentNode!==r.parentNode&&r.parentNode.insertBefore(a,r);else return}G()}function G(){let e=document.getElementById("gmail-sidebar-kanban");if(!e)return;let t=e.querySelector(".TO"),a=e.querySelector("a"),n=e.querySelector("#sidebar-kanban-icon"),i=e.querySelector("#sidebar-kanban-text");!t||!a||!n||!i||(v?(t.style.setProperty("background-color","#c2e7ff","important"),a.style.setProperty("color","#041e49","important"),n.setAttribute("stroke","#0b57d0"),i.style.setProperty("color","#041e49","important"),i.style.setProperty("font-weight","700","important")):(t.style.setProperty("background-color","transparent","important"),a.style.setProperty("color","#444746","important"),n.setAttribute("stroke","#444746"),i.style.setProperty("color","#444746","important"),i.style.setProperty("font-weight","500","important")))}var R=H(()=>{P()});function Ke(){if(F)return;let e=Date.now();e-O>=ve?(A&&(clearTimeout(A),A=null),O=e,fe()):A||(A=setTimeout(()=>{O=Date.now(),A=null,fe()},ve-(e-O)))}function fe(){if(!F){F=!0;try{if(q(),v){let e=document.querySelector("div[role='main']"),t=document.getElementById("gmail-kanban-embed");e&&(!t||t.parentNode!==e)&&(console.log("[Kanban] Conteneur Kanban manquant ou d\xE9plac\xE9 par Gmail, r\xE9-injection..."),T())}ue()}catch(e){console.error("Erreur lors de l'injection s\xE9curis\xE9e de Kanban Tasks :",e)}finally{setTimeout(()=>{F=!1},0)}}}var F,O,A,ve,be,ke=H(()=>{R();P();F=!1,O=0,A=null,ve=100;be=new MutationObserver(()=>{Ke()})});var Be=ye(()=>{ke();R();P();be.observe(document.body,{childList:!0,subtree:!0});window.addEventListener("hashchange",()=>{v&&j()});window.addEventListener("popstate",()=>{v&&j()});window.addEventListener("keydown",e=>{Q()||e.altKey&&(e.code==="KeyK"||e.key==="k"||e.key==="K"||e.keyCode===75)&&(e.preventDefault(),v?j():T())});document.addEventListener("click",e=>{if(!v)return;let t=document.getElementById("gmail-kanban-embed");if(t&&t.contains(e.target))return;let a=e.target.closest("a"),n=e.target.closest("button"),i=e.target.closest("[role='link']"),s=e.target.closest("[role='tab']");if(a||n||i||s){if(a&&a.id==="gmail-sidebar-kanban-link")return;j()}},!0);window.addEventListener("load",()=>{setTimeout(()=>{q()},1e3)})});Be();})();
