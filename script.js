// script.js — کنترلگر آزمون (ماژولی، ساده و پایدار)
const DEFAULT_CONFIG = 'config.json';

// state
let config = null;
let questions = [];
let currentIndex = 0;
let results = [];

/* helpers DOM */
const $ = id => document.getElementById(id);
const startBtn = $('start-btn');
const previewBtn = $('preview-btn');
const qText = $('q-text');
const qHint = $('q-hint');
const inputArea = $('input-area');
const submitBtn = $('submit-btn');
const skipBtn = $('skip-btn');
const nextBtn = $('next-btn');
const feedbackEl = $('feedback');
const statusEl = $('status');
const currentSpan = $('current');
const totalSpan = $('total');
const progressFill = $('progress-fill');
const intro = $('intro');
const questionArea = $('question-area');
const resultArea = $('result-area');
const scoreText = $('score-text');
const scoreDetails = $('score-details');
const reviewList = $('review-list');

const btnLoadConfig = $('btn-load-config');
const configFileInput = $('config-file-input');
const btnReset = $('btn-reset');

const downloadJson = $('download-json');
const downloadCsv = $('download-csv');
const restartBtn = $('restart-btn');

/* event wiring (safely only if elements exist) */
startBtn?.addEventListener('click', startQuiz);
previewBtn?.addEventListener('click', previewQuestions);
submitBtn?.addEventListener('click', handleSubmit);
skipBtn?.addEventListener('click', handleSkip);
nextBtn?.addEventListener('click', handleNext);
btnLoadConfig?.addEventListener('click', ()=> configFileInput.click());
configFileInput?.addEventListener('change', handleConfigFile);
btnReset?.addEventListener('click', ()=> loadConfig(DEFAULT_CONFIG).then(initFromConfig));
downloadJson?.addEventListener('click', downloadResultsJSON);
downloadCsv?.addEventListener('click', downloadResultsCSV);
restartBtn?.addEventListener('click', ()=> location.reload());

/* load config from file (fetch), fallback to built-in */
async function loadConfig(path = DEFAULT_CONFIG){
  try {
    const res = await fetch(path, {cache: 'no-store'});
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    return json;
  } catch (e) {
    console.warn('loadConfig failed — using fallback', e);
    return getFallbackConfig();
  }
}

/* fallback config */
function getFallbackConfig(){
  return {
    title: "آزمون پیش‌فرض",
    shuffleQuestions: false,
    questions: [
      {"position":1,"type":"multiple","text":"پایتخت ایران کدام است؟","options":["تهران","اصفهان","شیراز","تبریز"],"answerIndex":0},
      {"position":2,"type":"contains","text":"نام سیارهٔ سوم از خورشید چیست؟","correctKeywords":["زمین","earth"]},
      {"position":3,"type":"exact","text":"بزرگ‌ترین قارهٔ زمین کدام است؟","answer":["آسیا"]},
      {"position":4,"type":"number","text":"تعداد قاره‌های زمین چند است؟","answer":7,"tolerance":0},
      {"position":5,"type":"boolean","text":"آب در صفر درجهٔ سانتیگراد یخ می‌زند؟","answer":true},
      {"position":6,"type":"regex","text":"سال آغاز انقلاب فرانسه را وارد کنید (4 رقم)","pattern":"^1789$"},
      {"position":7,"type":"exact","text":"نماد شیمیایی اکسیژن چیست؟","answer":["O","o","اکسیژن"]},
      {"position":8,"type":"contains","text":"سریع‌ترین حیوان خشکی‌زی چیست؟","correctKeywords":["چیتا","یوز","یوزپلنگ"]},
      {"position":9,"type":"multiple","text":"کدام یک عنصر نیست؟","options":["هیدروژن","طلا","هوا","کربن"],"answerIndex":2},
      {"position":10,"type":"exact","text":"نام خانوادگی مخترع تلفن چیست؟","answer":["بل","Bell","بِل"]}
    ]
  };
}

/* bootstrap */
(async function bootstrap(){
  const loaded = await loadConfig(DEFAULT_CONFIG);
  initFromConfig(loaded);
})();

function initFromConfig(loaded){
  config = loaded || getFallbackConfig();
  questions = Array.isArray(config.questions) ? config.questions.slice().sort((a,b)=> (a.position||0)-(b.position||0)) : [];
  if (config.shuffleQuestions){
    for (let i = questions.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }
  currentIndex = 0;
  results = [];
  totalSpan && (totalSpan.innerText = questions.length);
  currentSpan && (currentSpan.innerText = 0);
  updateProgress();
  setStatus('آماده');
}

/* UI helpers */
function setStatus(txt){ statusEl && (statusEl.innerText = txt); }
function show(el){ el && el.classList.remove('hidden'); }
function hide(el){ el && el.classList.add('hidden'); }
function updateProgress(){
  if (!progressFill) return;
  const pct = questions.length ? Math.round((currentIndex / questions.length) * 100) : 0;
  progressFill.style.width = pct + '%';
  currentSpan && (currentSpan.innerText = Math.min(currentIndex+1, questions.length));
}

/* start quiz */
function startQuiz(){
  if (!questions || !questions.length) { alert('سوالی تعریف نشده — لطفاً فایل config.json را اضافه کنید یا از پیش‌فرض استفاده کنید.'); return; }
  hide(intro);
  show(questionArea);
  currentIndex = 0;
  results = [];
  renderQuestion();
  setStatus('در حال آزمون');
}

/* render question */
function renderQuestion(){
  updateProgress();
  const q = questions[currentIndex];
  if (!q) return;
  qText && (qText.innerText = q.text || '(بدون متن)');
  qHint && (qHint.innerText = q.hint || '');
  qHint && (qHint.style.display = q.hint ? 'block' : 'none');
  feedbackEl && (feedbackEl.innerText = '');
  if (!inputArea) return;
  inputArea.innerHTML = '';

  if (q.type === 'multiple' && Array.isArray(q.options)){
    const list = document.createElement('div'); list.className = 'choice-list';
    q.options.forEach((opt, idx)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.innerText = opt;
      btn.addEventListener('click', ()=> {
        list.querySelectorAll('.choice').forEach(c=> c.classList.remove('selected'));
        btn.classList.add('selected');
      });
      list.appendChild(btn);
    });
    inputArea.appendChild(list);
  } else if (q.type === 'number'){
    const inp = document.createElement('input'); inp.type = 'number'; inp.id = 'answer-input'; inp.placeholder = 'یک عدد وارد کنید';
    inputArea.appendChild(inp); setTimeout(()=> inp.focus(), 120);
  } else if (q.type === 'boolean'){
    const wrapper = document.createElement('div'); wrapper.className = 'choice-list';
    ['درست','نادرست'].forEach(label=>{
      const b = document.createElement('button'); b.type='button'; b.className='choice'; b.innerText = label;
      b.addEventListener('click', ()=> { wrapper.querySelectorAll('.choice').forEach(c=> c.classList.remove('selected')); b.classList.add('selected'); });
      wrapper.appendChild(b);
    });
    inputArea.appendChild(wrapper);
  } else {
    const inp = document.createElement('input'); inp.type='text'; inp.id='answer-input'; inp.placeholder='پاسخ را بنویسید...';
    inputArea.appendChild(inp); setTimeout(()=> inp.focus(), 120);
  }

  show(submitBtn); hide(nextBtn);
}

/* read answer */
function readAnswer(q){
  if (!q) return {given:null, ok:false};
  if (q.type === 'multiple'){
    const sel = inputArea.querySelector('.choice.selected');
    if (!sel) return {given:null, ok:false};
    const idx = Array.from(inputArea.querySelectorAll('.choice')).indexOf(sel);
    return {given: idx, ok: idx === q.answerIndex};
  }
  if (q.type === 'boolean'){
    const sel = inputArea.querySelector('.choice.selected');
    if (!sel) return {given:null, ok:false};
    const val = sel.innerText.trim() === 'درست';
    return {given: val, ok: val === Boolean(q.answer)};
  }
  const raw = (inputArea.querySelector('#answer-input') || {}).value || '';
  if (!raw || raw.trim().length === 0) return {given:null, ok:false};
  const normalize = s => String(s||'').replace(/\u200c/g,'').replace(/\s+/g,' ').trim().toLowerCase();

  if (q.type === 'number'){
    const num = Number(raw);
    if (isNaN(num)) return {given: raw, ok:false};
    const target = Number(q.answer);
    const tol = Number(q.tolerance || 0);
    return {given: num, ok: Math.abs(num - target) <= tol};
  }
  if (q.type === 'contains'){
    if (!Array.isArray(q.correctKeywords)) return {given: raw, ok:false};
    const u = normalize(raw).replace(/\s+/g,'');
    for (let kw of q.correctKeywords){
      const n = normalize(kw).replace(/\s+/g,'');
      if (n && u.includes(n)) return {given: raw, ok:true};
    }
    return {given: raw, ok:false};
  }
  if (q.type === 'regex'){
    try { const re = new RegExp(q.pattern); return {given: raw, ok: re.test(raw)}; } catch(e){ return {given: raw, ok:false}; }
  }
  if (q.type === 'exact'){
    if (Array.isArray(q.answer)){
      for (let a of q.answer) if (normalize(a) === normalize(raw)) return {given: raw, ok:true};
      return {given: raw, ok:false};
    } else {
      return {given: raw, ok: normalize(q.answer) === normalize(raw)};
    }
  }
  return {given: raw, ok: normalize(q.answer) === normalize(raw)};
}

/* submit/skip/next/finish */
function handleSubmit(){
  const q = questions[currentIndex];
  const res = readAnswer(q);
  if (res.given === null){ feedbackEl.innerText = 'پاسخ وارد نشده — لطفاً پاسخ دهید یا از «رد کن» استفاده کنید.'; return; }
  results.push({position: q.position || (currentIndex+1), question: q.text, given: res.given, correct: !!res.ok});
  feedbackEl.innerText = res.ok ? 'درست است' : 'پاسخ صحیح نیست';
  show(nextBtn); hide(submitBtn);
  setTimeout(()=> handleNext(), 650);
}
function handleSkip(){
  const q = questions[currentIndex];
  results.push({position: q.position || (currentIndex+1), question: q.text, given: null, correct: false, skipped:true});
  handleNext();
}
function handleNext(){
  currentIndex++;
  if (currentIndex < questions.length){
    renderQuestion();
    updateProgress();
  } else finishQuiz();
}
function finishQuiz(){
  hide(questionArea);
  show(resultArea);
  const total = questions.length;
  const correct = results.filter(r=>r.correct).length;
  scoreText && (scoreText.innerText = `${correct} / ${total}`);
  scoreDetails && (scoreDetails.innerText = `درصد: ${Math.round((correct/total)*100)}% — سوال‌های درست: ${correct}`);
  buildReview();
  setStatus('پایان آزمون');
}

/* review & download */
function buildReview(){
  if (!reviewList) return;
  reviewList.innerHTML = '';
  results.forEach((r,i)=>{
    const div = document.createElement('div'); div.className = 'panel';
    div.innerHTML = `<strong>سوال ${i+1}:</strong> ${escapeHtml(r.question)}<div class="muted">پاسخ شما: <strong>${escapeHtml(r.given === null ? '(رد شده)' : String(r.given))}</strong> — ${r.correct ? '<span style="color:var(--success)">درست</span>' : '<span style="color:var(--danger)">نادرست</span>'}</div>`;
    reviewList.appendChild(div);
  });
}
function downloadResultsJSON(){
  const payload = {meta:{generatedAt:new Date().toISOString()}, results};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quiz-results.json'; a.click(); URL.revokeObjectURL(a.href);
}
function downloadResultsCSV(){
  const rows = results.map(r => `"${r.position}","${(r.question||'').replace(/"/g,'""')}","${String(r.given||'').replace(/"/g,'""')}","${r.correct?1:0}"`);
  const csv = ['position,question,given,correct', ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quiz-results.csv'; a.click(); URL.revokeObjectURL(a.href);
}

/* preview (simple alert) */
function previewQuestions(){
  const list = questions.map(q => `${q.position||'?'} — ${q.text}`).join('\n\n');
  alert(list || 'سوالی موجود نیست.');
}

/* upload config */
function handleConfigFile(ev){
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      initFromConfig(parsed);
      alert('کانفیگ بارگذاری شد.');
    } catch (err) {
      alert('فایل JSON نامعتبر است.');
    }
  };
  reader.readAsText(f);
}

/* util */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

/* expose for debugging */
window.quiz = { reload: () => loadConfig(DEFAULT_CONFIG).then(initFromConfig), getResults: () => results };
