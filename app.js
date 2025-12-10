// QuickQuiz app.js
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const newSettingsBtn = document.getElementById('new-settings-btn');
const nextBtn = document.getElementById('next-btn');

const categorySelect = document.getElementById('category');
const difficultySelect = document.getElementById('difficulty');

const qTitle = document.getElementById('question-title');
const optionsList = document.getElementById('options');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const currentScoreEl = document.getElementById('current-score');
const resultSummary = document.getElementById('result-summary');
const detailedFeedback = document.getElementById('detailed-feedback');

let questions = [];
let pool = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];

async function loadQuestions(){
  const res = await fetch('questions.json');
  questions = await res.json();
}

function shuffleArray(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
}

function startQuiz(){
  const cat = categorySelect.value;
  const diff = difficultySelect.value;
  pool = questions.filter(q => (cat==='all' || q.category===cat) && (diff==='all' || q.difficulty===diff));
  if(pool.length === 0){
    alert('No questions match that selection. Try another setting.');
    return;
  }
  // shuffle questions and options
  shuffleArray(pool);
  pool = pool.map(q => {
    const opts = q.options.map((o,i)=>({text:o,origIdx:i}));
    shuffleArray(opts);
    return {...q, optionsObj:opts};
  });
  currentIndex = 0; score = 0; userAnswers = [];
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuestion();
  updateProgress();
}

function renderQuestion(){
  const q = pool[currentIndex];
  qTitle.textContent = q.question;
  optionsList.innerHTML = '';
  q.optionsObj.forEach((opt, idx) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.innerHTML = opt.text;
    li.addEventListener('click', ()=> selectOption(idx));
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter') selectOption(idx); });
    optionsList.appendChild(li);
  });
  // reset next button
  nextBtn.disabled = true;
  updateProgress();
}

function selectOption(idx){
  const q = pool[currentIndex];
  const lis = Array.from(optionsList.children);
  lis.forEach(li => li.classList.remove('selected','correct','wrong'));
  lis[idx].classList.add('selected');
  const chosen = q.optionsObj[idx];
  const isCorrect = (chosen.origIdx === q.answer);
  // store answer but don't move yet
  userAnswers[currentIndex] = {chosenIdx:chosen.origIdx, correct:isCorrect, chosenText:chosen.text, correctText:q.options[q.answer]};
  // show immediate feedback visually
  lis.forEach((li,i)=>{
    const opt = q.optionsObj[i];
    if(opt.origIdx === q.answer){
      li.classList.add('correct');
    } else if(opt.origIdx === chosen.origIdx){
      li.classList.add(isCorrect ? 'correct' : 'wrong');
    }
  });
  // update score preview (score counted only once per question)
  const prev = userAnswers.slice(0,currentIndex).filter(a=>a && a.correct).length;
  currentScoreEl.textContent = prev + (isCorrect?1:0);
  nextBtn.disabled = false;
}

function updateProgress(){
  progressText.textContent = `Question ${currentIndex+1} / ${pool.length}`;
  const pct = Math.round(((currentIndex)/pool.length)*100);
  progressFill.style.width = pct + '%';
}

function goNext(){
  // count score for current if selected
  const ans = userAnswers[currentIndex];
  if(!ans){
    alert('Please select an option before moving on.');
    return;
  }
  // finalize score incrementally
  // move index
  currentIndex++;
  if(currentIndex >= pool.length){
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function finishQuiz(){
  score = userAnswers.filter(a=>a && a.correct).length;
  resultSummary.innerHTML = `You scored <strong>${score}</strong> out of <strong>${pool.length}</strong>.`;
  detailedFeedback.innerHTML = '';
  pool.forEach((q, i) => {
    const ua = userAnswers[i] || {};
    const div = document.createElement('div');
    div.className = 'feedback-item';
    div.innerHTML = `
      <strong>Q${i+1}:</strong> ${q.question}<br>
      <strong>Your answer:</strong> ${ua.chosenText || '<em>Not answered</em>'} ${ua.correct ? '✅' : '❌'}<br>
      <strong>Correct:</strong> ${q.options[q.answer]}
    `;
    detailedFeedback.appendChild(div);
  });
  // show result screen
  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadQuestions();
  startBtn.addEventListener('click', startQuiz);
  retryBtn.addEventListener('click', startQuiz);
  newSettingsBtn.addEventListener('click', ()=>{ resultScreen.classList.add('hidden'); startScreen.classList.remove('hidden'); });
  nextBtn.addEventListener('click', goNext);
});
