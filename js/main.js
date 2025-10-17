const resources = {
  en: { pdf: 'data/CV_Sebastian.pdf', templateId: 'template-en' },
  es: { pdf: 'data/HV_Sebastian.pdf', templateId: 'template-es' }
};

const uiTexts = {
  en: { open: 'Open PDF', download: 'Download', loading: 'Loading…', openTitle: 'Open PDF in new tab', downloadTitle: 'Download PDF' },
  es: { open: 'Abrir PDF', download: 'Descargar', loading: 'Cargando…', openTitle: 'Abrir PDF en nueva pestaña', downloadTitle: 'Descargar PDF' }
};

const btnEn = document.getElementById('btn-en');
const btnEs = document.getElementById('btn-es');
const openBtn = document.getElementById('openBtn');
const downloadBtn = document.getElementById('downloadBtn');
const contentEl = document.getElementById('content');

function detectLanguage(){
  const nav = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language || 'en';
  return /^es(-|$)/i.test(nav) ? 'es' : 'en';
}

function applyUiTexts(lang){
  const texts = uiTexts[lang] || uiTexts.en;
  openBtn.textContent = texts.open;
  openBtn.title = texts.openTitle;
  openBtn.setAttribute('aria-label', texts.open);

  downloadBtn.textContent = texts.download;
  downloadBtn.title = texts.downloadTitle;
  downloadBtn.setAttribute('aria-label', texts.download);

  document.title = 'Sebastian.cv';
}

function waitForTemplate(id, attempts = 8, delayMs = 60){
  return new Promise(resolve => {
    let tries = 0;
    const check = () => {
      tries++;
      const tpl = document.getElementById(id);
      if (tpl && 'content' in tpl) return resolve(tpl);
      if (tries >= attempts) return resolve(null);
      setTimeout(check, delayMs);
    };
    check();
  });
}

async function setLangFromTemplates(lang, save = true){
  const res = resources[lang] || resources.en;
  const texts = uiTexts[lang] || uiTexts.en;

  openBtn.href = res.pdf;
  downloadBtn.href = res.pdf;
  const filename = res.pdf.split('/').pop();
  if (filename) downloadBtn.setAttribute('download', filename);

  applyUiTexts(lang);
  btnEn.setAttribute('aria-pressed', lang === 'en');
  btnEs.setAttribute('aria-pressed', lang === 'es');

  contentEl.innerHTML = `<p style="color:var(--muted)">${texts.loading}</p>`;

  const tpl = await waitForTemplate(res.templateId);
  if (tpl) {
    contentEl.innerHTML = '';
    contentEl.appendChild(tpl.content.cloneNode(true));
    console.debug(`[cv] template "${res.templateId}" cargada y renderizada.`);
    try { wireExperienceAccordions(contentEl); } catch(e){ console.error('[cv] error en wireExperienceAccordions:', e); }
  } else {
    const fallbackId = lang === 'en' ? 'template-es' : 'template-en';
    const fallbackTpl = document.getElementById(fallbackId);
    if (fallbackTpl && 'content' in fallbackTpl) {
      contentEl.innerHTML = '';
      contentEl.appendChild(fallbackTpl.content.cloneNode(true));
      console.warn(`[cv] template "${res.templateId}" no encontrada; se usó "${fallbackId}" como fallback.`);
    } else {
      const msg = `Plantilla "${res.templateId}" no encontrada. Comprueba que index.html contiene <template id="${res.templateId}">.`;
      contentEl.innerHTML = `<p style="color:var(--muted)">${msg}</p>`;
      console.error('[cv] ' + msg);
    }
  }

  if (save) localStorage.setItem('cv_lang', lang);
}

function wireExperienceAccordions(rootEl){
  if (!rootEl) return;
  const headings = Array.from(rootEl.querySelectorAll('h2'));
  const candidates = headings.filter(h => {
    const t = (h.textContent || '').trim().toLowerCase();
    return t.includes('professional experience') || t.includes('experiencia profesional') || t.includes('experiencia profesional');
  });
  if (candidates.length === 0) return;
  const section = candidates[0].parentElement || candidates[0].closest('section');
  if (!section) return;

  const h3s = Array.from(section.querySelectorAll('h3'));
  h3s.forEach(h3 => {
    h3.classList.add('xp-toggle');
    h3.setAttribute('role','button');
    h3.setAttribute('tabindex','0');
    h3.setAttribute('aria-expanded','false');

    const panel = document.createElement('div');
    panel.className = 'xp-panel collapsed';
    let node = h3.nextElementSibling;
    while(node && node.tagName.toLowerCase() !== 'h3'){
      const next = node.nextElementSibling;
      panel.appendChild(node);
      node = next;
    }
    h3.parentNode.insertBefore(panel, h3.nextSibling);

    const toggle = () => {
      const expanded = h3.classList.toggle('expanded');
      h3.setAttribute('aria-expanded', String(expanded));
      if (expanded){
        panel.classList.remove('collapsed');
        const full = panel.scrollHeight;
        panel.style.maxHeight = full + 'px';
      } else {
        panel.style.maxHeight = '0.7em';
        panel.classList.add('collapsed');
      }
    };

    h3.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('a')) {
        return;
      }
      e.preventDefault();
      toggle();
    });
    h3.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target && e.target.closest && e.target.closest('a')) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    });

    panel.style.maxHeight = '0.7em';
  });
}

function init(){
  btnEn.addEventListener('click', ()=> setLangFromTemplates('en'));
  btnEs.addEventListener('click', ()=> setLangFromTemplates('es'));

  const saved = localStorage.getItem('cv_lang');
  const initial = saved || detectLanguage();

  setLangFromTemplates(initial, false).catch(e => {
    console.error('[cv] error en setLangFromTemplates:', e);
  });
}

document.addEventListener('DOMContentLoaded', init);