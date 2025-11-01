(function(){
  const START_BTN = document.getElementById('startBtn');
  const QUIZ_EL = document.getElementById('quiz');
  const CONTROLS = document.getElementById('controls');
  const TIMER_EL = document.getElementById('timer');
  const SUBMIT_BTN = document.getElementById('submitBtn');
  const RESET_BTN = document.getElementById('resetBtn');
  const RESULTS_WRAP = document.getElementById('resultsWrap');
  const RESULTS_EL = document.getElementById('results');
  const SCORE_BOX = document.getElementById('scoreBox');
  const RESTART_BTN = document.getElementById('restartBtn');
  const FILE_INPUT = document.getElementById('fileInput');
  const LOADER = document.getElementById('loader');
  const QCOUNT_DISPLAY = document.getElementById('qcount');

  const TOTAL = 30; // number of questions to pick
  const TIME_SEC = 15 * 60; // 15 minutes

  let allQuestions = null; // full JSON
  let quizQuestions = [];
  let timer = null;
  let timeLeft = TIME_SEC;

  function loadDefaultJSON(){
    // try fetch from same folder
    return fetch('stroud_advanced_mcqs.json').then(r=>{
      if(!r.ok) throw new Error('no default file');
      return r.json();
    });
  }

  function pickRandom(arr, n){
    const copy = arr.slice();
    for(let i=copy.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy.slice(0,n);
  }

  function renderQuiz(){
    QUIZ_EL.innerHTML = '';
    quizQuestions.forEach((q, idx)=>{
      const div = document.createElement('div'); div.className='question';
      const qnum = idx+1;
      const qtext = document.createElement('div'); qtext.className='qtext';
      qtext.innerHTML = `<span style="color:#0066ff;font-weight:700">Q${qnum}.</span> ${q.question}`;
      div.appendChild(qtext);
      const optionsDiv = document.createElement('div'); optionsDiv.className='options';
      q.options.forEach((opt, oi)=>{
        const id = `q${qnum}_opt${oi}`;
        const label = document.createElement('label'); label.className='option'; label.htmlFor=id;
        const radio = document.createElement('input'); radio.type='radio'; radio.name=`q${qnum}`; radio.id=id; radio.value=opt;
        label.appendChild(radio);
        const span = document.createElement('span'); span.innerHTML = opt; label.appendChild(span);
        optionsDiv.appendChild(label);
      });
      div.appendChild(optionsDiv);
      QUIZ_EL.appendChild(div);
    });
    // typeset math
    MathJax.typesetPromise();
  }

  function startTimer(){
    timeLeft = TIME_SEC;
    TIMER_EL.textContent = formatTime(timeLeft);
    timer = setInterval(()=>{
      timeLeft--; TIMER_EL.textContent = formatTime(timeLeft);
      if(timeLeft<=0){ clearInterval(timer); onSubmit(); }
    },1000);
  }
  function stopTimer(){ if(timer) clearInterval(timer); }
  function formatTime(s){ const mm = String(Math.floor(s/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0'); return mm+':'+ss }

  function onSubmit(){
    stopTimer();
    CONTROLS.style.display='none';
    QUIZ_EL.style.display='none';
    RESULTS_WRAP.style.display='block';
    // compute score
    let correctCount=0;
    RESULTS_EL.innerHTML='';
    quizQuestions.forEach((q, idx)=>{
      const qnum = idx+1;
      const selected = document.querySelector(`input[name=q${qnum}]:checked`);
      const user = selected ? selected.value : null;
      const isCorrect = (user === q.answer);
      if(isCorrect) correctCount++;
      const item = document.createElement('div'); item.className='result-item';
      const header = document.createElement('div'); header.innerHTML = `<strong>Q${qnum}.</strong> ${q.question}`;
      const your = document.createElement('div'); your.innerHTML = `<div class="muted">Your answer: </div> ${ user ? user : '<em>No answer</em>'}`;
      const corr = document.createElement('div'); corr.innerHTML = `<div class="muted">Correct answer: </div> ${q.answer}`;
      const expl = document.createElement('div'); expl.innerHTML = `<div class="muted">Explanation: </div> ${q.explanation}`;
      if(isCorrect){ header.innerHTML += ' <span class="correct">(Correct)</span>'; }
      else{ header.innerHTML += ' <span class="wrong">(Incorrect)</span>'; }
      item.appendChild(header); item.appendChild(your); item.appendChild(corr); item.appendChild(expl);
      RESULTS_EL.appendChild(item);
    });
    const scorePercent = Math.round((correctCount/quizQuestions.length)*100);
    SCORE_BOX.innerHTML = `<div style="font-size:18px"><strong>Score: ${correctCount}/${quizQuestions.length} (${scorePercent}%)</strong></div><div class="muted">Time taken: ${formatTime(TIME_SEC - timeLeft)}</div>`;
    MathJax.typesetPromise();
  }

  function resetQuiz(){ stopTimer(); RESULTS_WRAP.style.display='none'; CONTROLS.style.display='none'; QUIZ_EL.style.display='none'; LOADER.style.display='none'; TIMER_EL.textContent = formatTime(TIME_SEC); }

  START_BTN.addEventListener('click', ()=>{
    // try to load file from input first, then fetch default
    LOADER.style.display='block'; START_BTN.disabled = true;
    const file = FILE_INPUT.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = (e)=>{
        try{ allQuestions = JSON.parse(e.target.result); beginQuiz(); }
        catch(err){ alert('Invalid JSON file.'); START_BTN.disabled=false; LOADER.style.display='none'; }
      };
      reader.readAsText(file);
    } else {
      loadDefaultJSON().then(data=>{ allQuestions = data; beginQuiz(); }).catch(err=>{
        LOADER.style.display='none'; START_BTN.disabled=false; alert('Could not load default JSON (place stroud_advanced_mcqs.json in same folder)');
      });
    }
  });

  function beginQuiz(){
    LOADER.style.display='none'; START_BTN.style.display='none';
    // pick 30 random without replacement
    if(!Array.isArray(allQuestions) || allQuestions.length<30){ alert('JSON must be an array with at least 30 questions'); START_BTN.disabled=false; return; }
    quizQuestions = pickRandom(allQuestions, TOTAL);
    QCOUNT_DISPLAY.textContent = String(TOTAL);
    renderQuiz();
    CONTROLS.style.display='flex'; QUIZ_EL.style.display='block'; RESULTS_WRAP.style.display='none';
    startTimer();
  }

  SUBMIT_BTN.addEventListener('click', ()=>{
    if(!confirm('Submit quiz and view answers?')) return; onSubmit();
  });
  RESET_BTN.addEventListener('click', ()=>{
    if(!confirm('Reset answers for this quiz?')) return;
    // clear radios
    quizQuestions.forEach((q, idx)=>{ const nodes = document.getElementsByName('q'+(idx+1)); nodes.forEach(n=>n.checked=false); });
  });
  RESTART_BTN.addEventListener('click', ()=>{ location.reload(); });

  FILE_INPUT.addEventListener('change', ()=>{ /* user selected a file, start button will use it */ });

  // expose loadDefaultJSON for inline use
  function loadDefaultJSON(){ return fetch('stroud_advanced_mcqs.json').then(r=>{ if(!r.ok) throw new Error('no default'); return r.json(); }); }

})();