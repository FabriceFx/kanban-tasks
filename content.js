(()=>{var T=(e,t)=>()=>(e&&(t=e(e=0)),t);var ge=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);function Z(e){if(!e||typeof e!="object")return{...A};let t="todo";(e.columnId==="todo"||e.columnId==="inprogress"||e.columnId==="done")&&(t=e.columnId);let n=[];Array.isArray(e.tags)&&(n=e.tags.map(r=>typeof r=="string"?r.trim():"").filter(r=>r.length>0));let a=[];Array.isArray(e.subtasks)&&(a=e.subtasks.filter(r=>r&&typeof r=="object"&&typeof r.title=="string").map(r=>({id:typeof r.id=="string"?r.id.trim():Math.random().toString(36).substring(2,9),title:r.title.trim(),completed:!!r.completed})));let s=typeof e.gmailId=="string"?e.gmailId.trim():null,i=typeof e.gmailSubject=="string"?e.gmailSubject.trim():null,c=null;return typeof e.gmailUrl=="string"&&e.gmailUrl.trim().startsWith("https://")&&(c=e.gmailUrl.trim()),{columnId:t,tags:n,subtasks:a,gmailId:s,gmailSubject:i,gmailUrl:c}}function Y(e){if(!e||typeof e!="string")return{description:"",metadata:{...A}};let t=e.split(W),n=t[0].trim();if(t.length<2)return{description:n,metadata:{...A}};try{let a=JSON.parse(t[1].trim()),s=Z(a);return{description:n,metadata:s}}catch(a){return console.warn("Erreur de lecture des m\xE9tadonn\xE9es JSON. Restauration des valeurs par d\xE9faut.",a),{description:e.trim(),metadata:{...A}}}}function L(e,t){let n=e?e.trim():"",a=Z(t),s=JSON.stringify(a,null,2);return`${n}${W}${s}`}function X(e){return!!(e&&typeof e=="object"&&e.title==="__KANBAN_CONFIG__")}var W,A,Q=T(()=>{W=`

--- KANBAN_METADATA ---
`,A={columnId:"todo",tags:[],subtasks:[],gmailId:null,gmailSubject:null,gmailUrl:null}});function he(){return`
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
            <option value="" disabled selected>Chargement...</option>
          </select>
        </div>
        <div class="header-actions">
          <div id="sync-status" class="sync-badge">
            <span class="sync-dot" id="sync-dot"></span>
            <span id="sync-text">Synchro...</span>
          </div>
          <button id="btn-logout" class="btn-icon danger hidden" title="Se d\xE9connecter">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
          <button id="btn-fullscreen" class="btn-icon" title="Ouvrir dans un nouvel onglet">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tab-switcher">
        <button id="tab-kanban" class="tab-btn active">Tableau Kanban</button>
        <button id="tab-smart" class="tab-btn">Objectif Travail</button>
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
            <h2 class="wizard-title">Acc\xE8s \xE0 vos t\xE2ches Google</h2>
            <p class="wizard-desc">Pour stocker de fa\xE7on d\xE9centralis\xE9e et gratuite vos donn\xE9es, vous devez lier votre propre cl\xE9 OAuth2 s\xE9curis\xE9e.</p>
          </div>

          <div class="wizard-steps">
            <h3 class="wizard-steps-title">\u{1F6E0}\uFE0F \xC9tape de configuration rapide</h3>
            <div class="step-row">
              <span class="step-number">1</span>
              <p>Copiez l'ID d'extension g\xE9n\xE9r\xE9 :<br><code id="extension-id-display">Chargement...</code></p>
            </div>
            <div class="step-row">
              <span class="step-number">2</span>
              <p>Dans votre <a href="https://console.cloud.google.com" target="_blank">Google Console</a>, cr\xE9ez des identifiants <strong>ID de client OAuth</strong> de type <strong>Application Chrome</strong> avec cet ID.</p>
            </div>
            <div class="step-row">
              <span class="step-number">3</span>
              <p>Activer la <strong>Google Tasks API</strong> et ins\xE9rez votre cl\xE9 <strong>client_id</strong> dans le fichier <strong>manifest.json</strong>.</p>
            </div>
          </div>

          <div>
            <button id="btn-login" class="btn-google">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Se connecter avec Google
            </button>
            <p class="wizard-footer-text" style="margin-top: 12px;">Vos donn\xE9es de t\xE2ches transitent uniquement entre Chrome et les serveurs s\xE9curis\xE9s de Google.</p>
          </div>
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
            <span class="toast-label">E-mail ouvert</span>
          </div>
          <button id="btn-close-toast" class="btn-close-toast">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p id="gmail-toast-subject" class="toast-subject"></p>
        <button id="btn-add-gmail-task" class="btn-toast-add">Cr\xE9er une t\xE2che Kanban</button>
      </div>

      <!-- VUE KANBAN -->
      <div id="view-kanban" class="view-kanban">
        <!-- Colonne \xC0 FAIRE -->
        <div id="col-todo-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">\xC0 faire</span>
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
            Ajouter une t\xE2che
          </button>
        </div>

        <!-- Colonne EN COURS -->
        <div id="col-inprogress-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">En cours</span>
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
            Ajouter une t\xE2che
          </button>
        </div>

        <!-- Colonne TERMIN\xC9 -->
        <div id="col-done-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">Termin\xE9</span>
            <span id="badge-done" class="column-badge badge-done">0</span>
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
            Ajouter une t\xE2che
          </button>
        </div>
      </div>

      <!-- VUE SMART -->
      <div id="view-smart" class="view-smart hidden">
        <div>
          <h2 class="smart-section-title today">
            <span class="smart-dot today"></span> Aujourd'hui
          </h2>
          <div id="smart-today">
            <p class="smart-empty">Aucune t\xE2che planifi\xE9e pour aujourd'hui.</p>
          </div>
        </div>
        <div>
          <h2 class="smart-section-title week">
            <span class="smart-dot week"></span> Cette semaine
          </h2>
          <div id="smart-week">
            <p class="smart-empty">Aucune t\xE2che planifi\xE9e pour cette semaine.</p>
          </div>
        </div>
      </div>

      <!-- PANNEAU D'\xC9DITION -->
      <div id="editor-panel" class="editor-overlay hidden">
        <div class="editor-panel">
          <div class="editor-header">
            <h3>D\xE9tails de la t\xE2che</h3>
            <button id="btn-close-editor" class="btn-close-editor">Fermer</button>
          </div>
          <div class="editor-body">
            <input type="hidden" id="edit-id">
            <div>
              <label class="form-label">Titre</label>
              <input type="text" id="edit-title" class="form-input" placeholder="Nommez votre t\xE2che...">
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea id="edit-desc" rows="4" class="form-textarea" placeholder="R\xE9digez des d\xE9tails ou consignes..."></textarea>
            </div>
            <div class="form-row">
              <div>
                <label class="form-label">\xC9ch\xE9ance</label>
                <input type="date" id="edit-date" class="form-input">
              </div>
              <div>
                <label class="form-label">Statut</label>
                <select id="edit-status" class="form-select">
                  <option value="todo">\xC0 faire</option>
                  <option value="inprogress">En cours</option>
                  <option value="done">Termin\xE9</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label">\xC9tiquettes (s\xE9par\xE9es par virgules)</label>
              <input type="text" id="edit-tags" class="form-input" placeholder="ex: Urgent, Projet client">
            </div>
            <div id="gmail-context" class="gmail-context hidden">
              <div class="gmail-context-header">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="gmail-context-label">E-mail Gmail d'origine</span>
              </div>
              <p id="gmail-subject" class="gmail-context-subject"></p>
              <a id="gmail-link" href="#" target="_blank" class="gmail-context-link">
                Consulter l'e-mail dans Gmail
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
                </svg>
              </a>
            </div>
          </div>
          <div class="editor-footer">
            <button id="btn-delete-task" class="btn-delete" title="Supprimer la t\xE2che">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <button id="btn-save-changes" class="btn-save">Enregistrer les modifications</button>
          </div>
        </div>
      </div>

    </main>
  </div>
  `}function o(e){return v?v.getElementById(e):null}async function b(e,t="GET",n=null){if(!f)throw P(!1),new Error("Authentification requise.");return new Promise((a,s)=>{chrome.runtime.sendMessage({type:"API_PROXY",endpoint:e,method:t,body:n,token:f},i=>{if(chrome.runtime.lastError){l("error","Erreur comm."),s(new Error(chrome.runtime.lastError.message));return}if(!i||!i.success){if(i&&i.status===401){se(),s(new Error("Jeton expir\xE9. Veuillez vous reconnecter."));return}l("error","Erreur Sync"),s(new Error(i?i.error:"Pas de r\xE9ponse"));return}a(i.data)})})}function I(){g=!0;let e=document.querySelector("div[role='main']");if(!e)return;e.style.position="relative",Array.from(e.children).forEach(n=>{n.id!=="gmail-kanban-embed"&&(y.has(n)||y.set(n,n.style.display||""),n.style.display="none")});let t=document.getElementById("gmail-kanban-embed");if(t)t.parentNode!==e&&e.appendChild(t),t.style.display="block",C&&d&&D(d);else{t=document.createElement("div"),t.id="gmail-kanban-embed",Object.assign(t.style,{position:"absolute",inset:"0",zIndex:"9999",borderRadius:"16px",overflow:"hidden",display:"block"}),v=t.attachShadow({mode:"open"});let n=document.createElement("link");n.rel="stylesheet",n.href=chrome.runtime.getURL("kanban-embed.css"),v.appendChild(n);let a=document.createElement("div");a.innerHTML=he(),v.appendChild(a.firstElementChild),e.appendChild(t),n.addEventListener("load",()=>{C||(C=!0,ee())}),setTimeout(()=>{C||(C=!0,ee())},500)}K()}function M(){g=!1;let e=document.getElementById("gmail-kanban-embed");e&&(e.style.display="none"),y.forEach((t,n)=>{n&&n.parentElement&&(n.style.display=t)}),y.clear(),K()}function ae(){if(!g)return;let e=document.querySelector("div[role='main']");e&&Array.from(e.children).forEach(t=>{t.id!=="gmail-kanban-embed"&&(y.has(t)||y.set(t,t.style.display||""),t.style.display!=="none"&&(t.style.display="none"))})}function ee(){ve(),fe(),Le()}function ve(){o("tab-kanban").addEventListener("click",()=>R("kanban")),o("tab-smart").addEventListener("click",()=>R("smart")),o("board-select").addEventListener("change",t=>{d=t.target.value,chrome.storage.local.set({activeListId:d}),D(d)}),o("btn-add-todo").addEventListener("click",()=>V("todo")),o("btn-add-inprogress").addEventListener("click",()=>V("inprogress")),o("btn-add-done").addEventListener("click",()=>V("done")),o("btn-close-editor").addEventListener("click",q),o("btn-save-changes").addEventListener("click",ye),o("btn-delete-task").addEventListener("click",Ee),o("btn-login").addEventListener("click",()=>P(!0)),o("btn-logout").addEventListener("click",se),o("btn-fullscreen").addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("sidepanel.html")})}),o("btn-close-toast").addEventListener("click",ie),o("btn-add-gmail-task").addEventListener("click",we),["todo","inprogress","done"].forEach(t=>{let n=o(`col-${t}-container`);n.addEventListener("dragover",a=>{a.preventDefault(),n.classList.add("drag-over-active")}),n.addEventListener("dragleave",()=>{n.classList.remove("drag-over-active")}),n.addEventListener("drop",a=>{a.preventDefault(),n.classList.remove("drag-over-active");let s=a.dataTransfer.getData("text/plain"),i=v.getElementById(s),c=o(`col-${t}`);i&&c&&i.parentElement!==c&&(c.appendChild(i),E(),ke(s,t))})}),chrome.runtime.onMessage.addListener(t=>{t.type==="EMAIL_CAPTURED"&&oe(t.data)}),chrome.storage.onChanged.addListener((t,n)=>{if(n==="local"&&d){let a=`kanban_tasks_cache_${d}`;if(t[a]){let s=t[a].newValue;if(s&&s.items){let i=Object.keys(u),c=s.items.map(m=>m.id);(i.length!==c.length||s.items.some(m=>{let p=u[m.id];return!p||p.columnId!==m.columnId||p.title!==m.title||p.desc!==m.desc}))&&(console.log("[Kanban] Mise \xE0 jour en temps r\xE9el d\xE9tect\xE9e depuis le cache"),x(s.items),navigator.onLine?l("connected","\xC0 jour (Synchro)"):l("offline","Hors-ligne (Cache)"))}}}});let e=o("extension-id-display");e&&(e.innerText=chrome.runtime.id)}async function fe(){l("connecting","Recherche de jeton..."),d=(await chrome.storage.local.get(["activeListId"])).activeListId||null,P(!1)}function P(e=!1){l("connecting","Authentification..."),chrome.runtime.sendMessage({type:"GET_TASKS_TOKEN",interactive:e},t=>{if(chrome.runtime.lastError){l("offline","Erreur extension");return}t&&t.success&&t.token?(f=t.token,o("setup-wizard").classList.add("hidden"),o("btn-logout").classList.remove("hidden"),l("connected","Connect\xE9"),be()):(f=null,o("setup-wizard").classList.remove("hidden"),o("btn-logout").classList.add("hidden"),l("offline","Non authentifi\xE9"))})}function se(){f&&chrome.runtime.sendMessage({type:"LOGOUT_USER",token:f},()=>{f=null,o("setup-wizard").classList.remove("hidden"),o("btn-logout").classList.add("hidden"),l("offline","D\xE9connect\xE9"),o("board-select").innerHTML='<option value="" disabled selected>Veuillez vous connecter</option>',O()})}function l(e,t){let n=o("sync-dot"),a=o("sync-text");!n||!a||(a.innerText=t,n.className="sync-dot "+e)}async function be(){l("connecting","Synchro listes...");try{let t=(await chrome.storage.local.get("kanban_lists_cache")).kanban_lists_cache;if(t&&Date.now()-t.timestamp<3e4){console.log("[Kanban] Utilisation du cache pour les listes"),U(t.items);return}}catch(e){console.warn("[Kanban] \xC9chec lecture cache listes :",e)}try{let e=await b("/users/@me/lists"),t=e&&e.items||[];await chrome.storage.local.set({kanban_lists_cache:{timestamp:Date.now(),items:t}}),U(t)}catch(e){console.error("[Kanban] Erreur r\xE9seau lors de la r\xE9cup\xE9ration des listes :",e);try{let a=(await chrome.storage.local.get("kanban_lists_cache")).kanban_lists_cache;if(a&&a.items){console.log("[Kanban] Fallback hors-ligne sur cache expir\xE9 pour les listes"),U(a.items,!0);return}}catch{}l("error","Erreur r\xE9seau");let t=o("board-select");t&&(t.innerHTML='<option value="" disabled>Erreur de connexion</option>')}}function U(e,t=!1){let n=o("board-select");n&&(n.innerHTML="",e.length>0?(e.forEach(a=>{let s=document.createElement("option");s.value=a.id,s.innerText=a.title+(t?" (hors-ligne)":""),n.appendChild(s)}),d&&Array.from(n.options).some(a=>a.value===d)?n.value=d:(d=e[0].id,n.value=d,chrome.storage.local.set({activeListId:d})),D(d),t&&l("offline","Hors-ligne (Cache)")):(n.innerHTML='<option value="" disabled>Aucun tableau trouv\xE9</option>',l("connected","Vide")))}async function D(e){if(!e)return;O(),S(!0),l("connecting","Chargement t\xE2ches...");let t=`kanban_tasks_cache_${e}`;try{let a=(await chrome.storage.local.get(t))[t];if(a&&Date.now()-a.timestamp<3e4){console.log("[Kanban] Utilisation du cache pour les t\xE2ches de",e),S(!1),x(a.items),navigator.onLine?l("connected","\xC0 jour (Cache)"):l("offline","Hors-ligne (Cache)");return}}catch(n){console.warn("[Kanban] \xC9chec lecture cache t\xE2ches :",n)}try{let n=await b(`/lists/${e}/tasks?showCompleted=true&showHidden=true`);S(!1);let a=n&&n.items||[],s=[];a.forEach(i=>{if(X(i))return;let{description:c,metadata:r}=Y(i.notes),m=r.columnId||"todo";i.status==="completed"&&(m="done");let p={id:i.id,title:i.title,desc:c,date:i.due?xe(i.due):"",displayDate:i.due?re(i.due):"",tags:r.tags||[],subtasks:r.subtasks||[],gmailId:r.gmailId,gmailSubject:r.gmailSubject,gmailUrl:r.gmailUrl,columnId:m,completed:i.status==="completed"};s.push(p)}),await chrome.storage.local.set({[t]:{timestamp:Date.now(),items:s}}),x(s),l("connected","\xC0 jour")}catch(n){console.error("[Kanban] Erreur de r\xE9cup\xE9ration des t\xE2ches :",n),S(!1);try{let s=(await chrome.storage.local.get(t))[t];if(s&&s.items){console.log("[Kanban] Fallback hors-ligne sur cache expir\xE9 pour les t\xE2ches"),x(s.items),l("offline","Hors-ligne (Cache)");return}}catch{}l("error","Erreur r\xE9seau")}}function x(e){O(),u={},e.forEach(t=>{u[t.id]=t,j(t)}),E()}function j(e){let t=o(`col-${e.columnId}`);if(!t)return;let n=document.createElement("div");n.id=e.id,n.draggable=!0,n.className="task-card";let a="";e.tags&&e.tags.length>0&&(a='<div class="card-tags">',e.tags.forEach(r=>{let m=r.toLowerCase()==="urgent"?"tag tag-urgent":"tag tag-default";a+=`<span class="${m}">${k(r)}</span>`}),a+="</div>");let s=e.completed?"card-title completed":"card-title",i=e.desc?`<p class="card-desc">${k(e.desc)}</p>`:"",c="";(e.displayDate||e.gmailUrl)&&(c='<div class="card-footer">',e.displayDate?c+=`<span class="card-date">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
        </svg>
        ${e.displayDate}
      </span>`:c+="<span></span>",e.gmailUrl&&(c+=`<span class="card-gmail-badge">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Gmail
      </span>`),c+="</div>"),n.innerHTML=`${a}<h4 class="${s}">${k(e.title)}</h4>${i}${c}`,n.addEventListener("dragstart",r=>{r.dataTransfer.setData("text/plain",n.id),r.dataTransfer.effectAllowed="move",setTimeout(()=>n.classList.add("dragging"),0)}),n.addEventListener("dragend",()=>n.classList.remove("dragging")),n.addEventListener("click",()=>_(e.id)),t.appendChild(n)}async function ke(e,t){let n=u[e];if(!n)return;let a=n.columnId;if(!navigator.onLine){alert("Impossible de modifier la t\xE2che en mode hors-ligne. Veuillez r\xE9tablir votre connexion internet."),x(Object.values(u)),l("offline","Hors-ligne (Cache)");return}n.columnId=t;let s=t==="done";n.completed=s,l("connecting","Enregistrement...");try{let c={notes:L(n.desc,{columnId:t,tags:n.tags,subtasks:n.subtasks,gmailId:n.gmailId,gmailSubject:n.gmailSubject,gmailUrl:n.gmailUrl}),status:s?"completed":"needsAction"};s||(c.completed=null),await b(`/lists/${d}/tasks/${e}`,"PATCH",c);let r=v.getElementById(e);if(r){let p=r.querySelector("h4");p.className=s?"card-title completed":"card-title"}let m=`kanban_tasks_cache_${d}`;await chrome.storage.local.set({[m]:{timestamp:Date.now(),items:Object.values(u)}}),l("connected","D\xE9plac\xE9 !")}catch{n.columnId=a,n.completed=a==="done",D(d),l("error","Sync \xE9chec")}}async function V(e){if(!navigator.onLine){alert("Impossible d'ajouter une t\xE2che en mode hors-ligne."),l("offline","Hors-ligne (Cache)");return}l("connecting","Cr\xE9ation t\xE2che...");try{let n={title:"Nouvelle t\xE2che",notes:L("",{columnId:e,tags:[],subtasks:[]}),status:e==="done"?"completed":"needsAction"},a=await b(`/lists/${d}/tasks`,"POST",n),s={id:a.id,title:a.title,desc:"",date:"",displayDate:"",tags:[],subtasks:[],columnId:e,completed:e==="done"};u[s.id]=s,j(s),E();let i=`kanban_tasks_cache_${d}`;await chrome.storage.local.set({[i]:{timestamp:Date.now(),items:Object.values(u)}}),_(s.id),l("connected","Cr\xE9\xE9e !")}catch{l("error","\xC9chec cr\xE9ation")}}function _(e){let t=u[e];if(!t)return;o("edit-id").value=e,o("edit-title").value=t.title,o("edit-desc").value=t.desc,o("edit-date").value=t.date,o("edit-status").value=t.columnId,o("edit-tags").value=t.tags.join(", ");let n=o("gmail-context");t.gmailUrl?(n.classList.remove("hidden"),o("gmail-subject").innerText=t.gmailSubject,o("gmail-link").href=t.gmailUrl):n.classList.add("hidden"),o("editor-panel").classList.remove("hidden")}function q(){o("editor-panel").classList.add("hidden")}async function ye(){if(!navigator.onLine){alert("Impossible de modifier la t\xE2che en mode hors-ligne."),l("offline","Hors-ligne (Cache)");return}let e=o("edit-id").value,t=u[e];if(!t)return;let n=o("edit-title").value.trim()||"Sans titre",a=o("edit-desc").value,s=o("edit-date").value,i=o("edit-status").value,c=o("edit-tags").value,r=c?c.split(",").map(p=>p.trim()).filter(p=>p.length>0):[],m=i==="done";l("connecting","Sauvegarde...");try{let p=L(a,{columnId:i,tags:r,subtasks:t.subtasks,gmailId:t.gmailId,gmailSubject:t.gmailSubject,gmailUrl:t.gmailUrl}),F={title:n,notes:p,status:m?"completed":"needsAction",due:s?new Date(s).toISOString():null};m||(F.completed=null),await b(`/lists/${d}/tasks/${e}`,"PATCH",F),t.title=n,t.desc=a,t.date=s,t.displayDate=s?re(s):"",t.columnId=i,t.tags=r,t.completed=m;let J=v.getElementById(e);J&&J.remove(),j(t),E();let pe=`kanban_tasks_cache_${d}`;await chrome.storage.local.set({[pe]:{timestamp:Date.now(),items:Object.values(u)}}),q(),l("connected","Modifi\xE9e !")}catch{l("error","Sync \xE9chec")}}async function Ee(){if(!navigator.onLine){alert("Impossible de supprimer la t\xE2che en mode hors-ligne."),l("offline","Hors-ligne (Cache)");return}let e=o("edit-id").value;if(u[e]&&confirm("Voulez-vous vraiment supprimer d\xE9finitivement cette t\xE2che ?")){l("connecting","Suppression...");try{await b(`/lists/${d}/tasks/${e}`,"DELETE");let n=v.getElementById(e);n&&n.remove(),delete u[e],E();let a=`kanban_tasks_cache_${d}`;await chrome.storage.local.set({[a]:{timestamp:Date.now(),items:Object.values(u)}}),q(),l("connected","Supprim\xE9e")}catch{l("error","\xC9chec suppression")}}}function oe(e){h=e;let t=o("gmail-toast");t&&(o("gmail-toast-subject").innerText=e.title,t.classList.add("visible"))}function ie(){let e=o("gmail-toast");e&&(e.classList.remove("visible"),chrome.storage.local.remove("lastCapturedEmail").catch(()=>{}))}async function we(){if(!navigator.onLine){alert("Impossible de lier un e-mail en mode hors-ligne."),l("offline","Hors-ligne (Cache)");return}if(h){l("connecting","Liaison e-mail..."),ie(),chrome.storage.local.remove("lastCapturedEmail").catch(()=>{});try{let e=L("Consulter l'e-mail li\xE9 ci-dessous pour plus de d\xE9tails.",{columnId:"todo",tags:["Gmail"],subtasks:[],gmailId:h.gmailId,gmailSubject:h.title,gmailUrl:h.gmailUrl}),t={title:h.title,notes:e,status:"needsAction"},n=await b(`/lists/${d}/tasks`,"POST",t),a={id:n.id,title:n.title,desc:"Consulter l'e-mail li\xE9 ci-dessous pour plus de d\xE9tails.",date:"",displayDate:"",tags:["Gmail"],subtasks:[],gmailId:h.gmailId,gmailSubject:h.title,gmailUrl:h.gmailUrl,columnId:"todo",completed:!1};u[a.id]=a,j(a),E();let s=`kanban_tasks_cache_${d}`;await chrome.storage.local.set({[s]:{timestamp:Date.now(),items:Object.values(u)}}),_(a.id),l("connected","Li\xE9 !")}catch{l("error","\xC9chec liaison")}h=null}}async function Le(){try{let e=await chrome.storage.local.get(["lastCapturedEmail"]);e.lastCapturedEmail&&oe(e.lastCapturedEmail)}catch(e){console.error("Erreur lors du d\xE9codage de l'e-mail stock\xE9 :",e)}}function R(e){let t=o("tab-kanban"),n=o("tab-smart"),a=o("view-kanban"),s=o("view-smart");e==="kanban"?(t.classList.add("active"),n.classList.remove("active"),a.classList.remove("hidden"),s.classList.add("hidden")):(n.classList.add("active"),t.classList.remove("active"),a.classList.add("hidden"),s.classList.remove("hidden"),Ce())}function Ce(){let e=o("smart-today"),t=o("smart-week");e.innerHTML="",t.innerHTML="";let n=ne(new Date),a=new Date;a.setDate(a.getDate()+7);let s=ne(a),i=0,c=0;Object.values(u).forEach(r=>{r.completed||!r.date||(r.date===n?(te(r,e),i++):r.date>n&&r.date<=s&&(te(r,t),c++))}),i===0&&(e.innerHTML=`<p class="smart-empty">Aucune t\xE2che planifi\xE9e pour aujourd'hui.</p>`),c===0&&(t.innerHTML='<p class="smart-empty">Aucune t\xE2che planifi\xE9e pour cette semaine.</p>')}function te(e,t){let n=document.createElement("div");n.className="smart-card";let a="";e.tags&&e.tags.length>0&&(a='<div class="card-tags">',e.tags.forEach(s=>{let i=s.toLowerCase()==="urgent"?"tag tag-urgent":"tag tag-default";a+=`<span class="${i}">${k(s)}</span>`}),a+="</div>"),n.innerHTML=`
    ${a}
    <h4 class="card-title">${k(e.title)}</h4>
    ${e.desc?`<p class="card-desc" style="-webkit-line-clamp:1;">${k(e.desc)}</p>`:""}
    <div class="smart-card-footer">
      <span class="smart-date-badge">${e.displayDate}</span>
      <span class="smart-column-badge">${e.columnId==="inprogress"?"En cours":"\xC0 faire"}</span>
    </div>
  `,n.addEventListener("click",()=>{R("kanban"),setTimeout(()=>_(e.id),150)}),t.appendChild(n)}function O(){["todo","inprogress","done"].forEach(e=>{let t=o(`col-${e}`);t&&(t.innerHTML="")})}function S(e){["todo","inprogress","done"].forEach(t=>{let n=o(`skeleton-${t}`);n&&(e?n.classList.remove("hidden"):n.classList.add("hidden"))})}function E(){["todo","inprogress","done"].forEach(e=>{let t=o(`col-${e}`),n=o(`badge-${e}`);t&&n&&(n.innerText=t.children.length)})}function k(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function re(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}):""}function xe(e){return e?new Date(e).toISOString().split("T")[0]:""}function ne(e){let t=e.getTimezoneOffset();return new Date(e.getTime()-t*60*1e3).toISOString().split("T")[0]}var g,v,C,y,f,d,u,h,B=T(()=>{Q();H();g=!1,v=null,C=!1,y=new Map,f=null,d=null,u={},h=null});function G(){let e=window.location.hash,t=/#.+?\/([a-zA-Z0-9_-]{8,})/,n=e.match(t);if(n&&n[1]){let a=n[1],s=document.querySelector(Te);return{title:s?s.innerText.trim():"E-mail sans objet",gmailId:a,gmailUrl:`https://mail.google.com/mail/u/0/#inbox/${a}`}}return null}function le(){let e=document.querySelectorAll(Ae);e.length!==0&&e.forEach(t=>{if(t.querySelector(".gmail-kanban-trigger-class"))return;let n=document.createElement("div");n.className="gmail-kanban-trigger-class J-J5-Ji",n.title="Ajouter au Tableau Kanban",Object.assign(n.style,{width:"36px",height:"36px",borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background-color 0.15s, transform 0.15s",backgroundColor:"transparent",marginLeft:"6px",marginRight:"6px"}),n.innerHTML=`
      <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s, transform 0.15s;" class="kanban-trigger-svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
      </svg>
    `,n.addEventListener("mouseenter",()=>{let a=n.querySelector(".kanban-trigger-svg");n.style.backgroundColor!=="rgb(194, 231, 255)"&&(n.style.backgroundColor="rgba(0, 0, 0, 0.06)",a&&a.setAttribute("stroke","#1f1f1f"))}),n.addEventListener("mouseleave",()=>{let a=n.querySelector(".kanban-trigger-svg");n.style.backgroundColor!=="rgb(194, 231, 255)"&&(n.style.backgroundColor="transparent",a&&a.setAttribute("stroke","#444746"))}),n.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();let s=G();s&&chrome.runtime.sendMessage({type:"EMAIL_CAPTURED",data:s},i=>{if(!chrome.runtime.lastError){let c=n.querySelector(".kanban-trigger-svg");n.style.backgroundColor="#c2e7ff",n.title="Ajout\xE9 au Kanban !",c&&(c.setAttribute("stroke","#0b57d0"),c.style.transform="scale(1.15)"),setTimeout(()=>{n.style.backgroundColor="transparent",n.title="Ajouter au Tableau Kanban",c&&(c.setAttribute("stroke","#444746"),c.style.transform="scale(1)")},2e3)}})}),t.insertBefore(n,t.firstChild)})}function $(){let e=document.querySelector(".ajl")||document.querySelector(".TK");if(!e)return;let t=e.parentNode;if(!t||t.querySelector("#gmail-sidebar-kanban"))return;let n=document.getElementById("gmail-sidebar-kanban");n&&n.remove();let a=document.createElement("div");a.id="gmail-sidebar-kanban",a.className="aim",a.style.marginBottom="4px",a.innerHTML=`
    <div class="TO" style="user-select:none;">
      <div>
        <a class="J-Ke n0" id="gmail-sidebar-kanban-link" href="#" title="Ouvrir le Tableau Kanban Tasks" style="display:flex;align-items:center;gap:12px;padding-left:26px;height:32px;color:#444746;font-family:'Google Sans',Roboto,sans-serif;font-size:14px;font-weight:500;text-decoration:none;border-radius:0 16px 16px 0;margin-right:8px;transition:background-color 0.15s;">
          <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s;" id="sidebar-kanban-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
          <span style="color:#444746;font-weight:500;transition:color 0.15s;" id="sidebar-kanban-text">Tableau Kanban</span>
        </a>
      </div>
    </div>
  `,t.insertBefore(a,e);let s=a.querySelector("a");s.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),I()}),s.addEventListener("mouseenter",()=>{g||(s.style.backgroundColor="rgba(0,0,0,0.04)")}),s.addEventListener("mouseleave",()=>{g||(s.style.backgroundColor="transparent")}),K()}function K(){let e=document.getElementById("gmail-sidebar-kanban");if(!e)return;let t=e.querySelector("a"),n=e.querySelector("#sidebar-kanban-icon"),a=e.querySelector("#sidebar-kanban-text");!t||!n||!a||(g?(t.style.backgroundColor="#c2e7ff",t.style.color="#041e49",n.setAttribute("stroke","#0b57d0"),a.style.color="#041e49",a.style.fontWeight="700"):(t.style.backgroundColor="transparent",t.style.color="#444746",n.setAttribute("stroke","#444746"),a.style.color="#444746",a.style.fontWeight="500"))}var Te,Ae,H=T(()=>{B();Te="h2.hP",Ae="div[role='toolbar'], .Cq, .G-tF"});function Se(){if(z)return;let e=Date.now();e-N>=ce?(w&&(clearTimeout(w),w=null),N=e,de()):w||(w=setTimeout(()=>{N=Date.now(),w=null,de()},ce-(e-N)))}function de(){if(!z){z=!0;try{if(G()?le():document.querySelectorAll(".gmail-kanban-trigger-class").forEach(n=>n.remove()),$(),g){let t=document.querySelector("div[role='main']"),n=document.getElementById("gmail-kanban-embed");t&&(!n||n.parentNode!==t)&&(console.log("[Kanban] Conteneur Kanban manquant ou d\xE9plac\xE9 par Gmail, r\xE9-injection..."),I())}ae()}catch(e){console.error("Erreur lors de l'injection s\xE9curis\xE9e de Kanban Tasks :",e)}finally{setTimeout(()=>{z=!1},0)}}}var z,N,w,ce,ue,me=T(()=>{H();B();z=!1,N=0,w=null,ce=100;ue=new MutationObserver(()=>{Se()})});var Ie=ge(()=>{me();H();B();ue.observe(document.body,{childList:!0,subtree:!0});window.addEventListener("hashchange",()=>{g&&M()});window.addEventListener("popstate",()=>{g&&M()});document.addEventListener("click",e=>{if(!g)return;let t=document.getElementById("gmail-kanban-embed");if(t&&t.contains(e.target))return;let n=e.target.closest("a"),a=e.target.closest("button"),s=e.target.closest("[role='link']"),i=e.target.closest("[role='tab']");if(n||a||s||i){if(n&&n.id==="gmail-sidebar-kanban-link")return;M()}},!0);window.addEventListener("load",()=>{setTimeout(()=>{$()},1e3)})});Ie();})();
