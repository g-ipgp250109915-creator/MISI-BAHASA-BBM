(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const state = {
    sound: true,
    music: true,
    started: false,
    completed: { learn: false, mission1: false, mission2: false, mission3: false, final: false },
    scores: { mission1: 0, mission2: 0, mission3: 0, final: 0 },
    answers: { mission1: {}, final: {} },
    classification: { selected: null, answers: {} },
    sentences: []
  };

  const lessonData = {
    am: { icon: '🏠', title: 'Kata Nama Am', def: 'Kata nama am ialah perkataan yang digunakan untuk menyebut nama orang, haiwan, benda atau tempat secara umum.', examples: ['jiran', 'rumah', 'basikal', 'ikan'] },
    khas: { icon: '📍', title: 'Kata Nama Khas', def: 'Kata nama khas ialah nama khusus bagi orang, tempat, haiwan atau benda dan biasanya ditulis dengan huruf besar pada awal perkataan.', examples: ['Aina', 'Sabah', 'Tawau', 'Pak Cik Ismail'] },
    ganti: { icon: '🙋', title: 'Kata Ganti Nama', def: 'Kata ganti nama digunakan untuk menggantikan nama orang dalam sesuatu ujaran atau ayat.', examples: ['saya', 'kami', 'mereka', 'kamu'] },
    penjodoh: { icon: '🔢', title: 'Penjodoh Bilangan', def: 'Penjodoh bilangan digunakan bersama-sama kata bilangan untuk menunjukkan jumlah atau bilangan sesuatu benda, haiwan atau manusia.', examples: ['seorang jiran', 'sebuah rumah', 'seekor kucing', 'sebatang pokok'] }
  };

  // Semua konteks menggunakan Tema 1: Kemasyarakatan, Unit 1: Jiran Tetangga.
  const mission1Questions = [
    { q: 'Hadif membantu ___ membawa bungkusan ke rumah.', o: ['jiran', 'Sabah', 'mereka', 'sebatang'], a: 0 },
    { q: 'Aina tinggal di ___ bersama keluarganya. Pilih kata nama khas.', o: ['rumah', 'Tawau', 'jiran', 'mereka'], a: 1 },
    { q: 'Perkataan manakah merupakan kata ganti nama?', o: ['saya', 'basikal', 'Sabah', 'seekor'], a: 0 },
    { q: '“___ ayam” ialah penggunaan penjodoh bilangan yang betul.', o: ['seekor', 'seorang', 'sebuah', 'sebatang'], a: 0 },
    { q: 'Yang manakah kata nama am?', o: ['jiran', 'Aina', 'Tawau', 'mereka'], a: 0 },
    { q: '“Pak Cik Ismail” ialah contoh...', o: ['kata nama khas', 'kata nama am', 'kata ganti nama', 'penjodoh bilangan'], a: 0 },
    { q: 'Pilih kata ganti nama yang sesuai: “___ membantu warga emas.”', o: ['Mereka', 'Rumah', 'Tawau', 'Seekor'], a: 0 },
    { q: 'Pilih penjodoh bilangan yang tepat: “___ pokok ditanam di kebun komuniti.”', o: ['sebatang', 'seekor', 'seorang', 'sebuah'], a: 0 }
  ];

  const classificationWords = [
    ['jiran', 'am'], ['Sabah', 'khas'], ['mereka', 'ganti'], ['seekor', 'penjodoh'],
    ['Tawau', 'khas'], ['bungkusan', 'am'], ['kami', 'ganti'], ['sebatang', 'penjodoh']
  ];

  // Ayat lebih pelbagai tetapi masih dalam konteks kemasyarakatan/jiran tetangga.
  const sentenceData = [
    ['Aina', 'membantu', 'jiran', 'membawa', 'bungkusan'],
    ['Pak', 'Cik', 'Ismail', 'menyapa', 'kami', 'di', 'halaman'],
    ['Mereka', 'menanam', 'sebatang', 'pokok', 'di', 'kebun', 'komuniti'],
    ['Hadif', 'menghantar', 'makanan', 'kepada', 'jiran', 'pada', 'petang']
  ];

  const finalQuestions = [
    { q: '“rumah” ialah...', o: ['kata nama am', 'kata nama khas', 'kata ganti nama', 'penjodoh bilangan'], a: 0 },
    { q: 'Yang manakah kata nama khas?', o: ['jiran', 'Aina', 'rumah', 'mereka'], a: 1 },
    { q: 'Pilih kata ganti nama.', o: ['kami', 'Sabah', 'kucing', 'sebatang'], a: 0 },
    { q: 'Pilih penjodoh bilangan yang betul untuk “pokok”.', o: ['sebatang', 'seekor', 'seorang', 'sebuah'], a: 0 },
    { q: 'Huruf pertama kata nama khas biasanya ditulis...', o: ['huruf besar', 'huruf kecil', 'angka', 'simbol'], a: 0 },
    { q: '“mereka” digunakan untuk menggantikan...', o: ['orang', 'tempat', 'benda sahaja', 'bilangan'], a: 0 },
    { q: '“sebuah rumah” menunjukkan penggunaan...', o: ['penjodoh bilangan', 'kata nama khas', 'kata ganti nama', 'kata kerja'], a: 0 },
    { q: 'Dalam ayat “Aina membantu jiran”, kata nama am ialah...', o: ['Aina', 'membantu', 'jiran', 'ialah'], a: 2 },
    { q: '“Tawau” ialah nama khusus bagi...', o: ['tempat', 'orang', 'haiwan', 'bilangan'], a: 0 },
    { q: 'Ayat manakah menggunakan kata nama dengan tepat?', o: ['Mereka membantu jiran.', 'Seekor Aina membantu.', 'Sabah membaca rumah.', 'Seorang buku baharu.'], a: 0 }
  ];

  // ---------------- AUDIO: SFX + muzik latar ----------------
  let audioCtx = null;
  let musicTimer = null;
  let musicGain = null;
  let musicStep = 0;

  function getAudio() {
    if (!state.sound && !state.music) return null;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (_) { return null; }
  }

  function tone(freq, duration, type = 'sine', delay = 0, volume = 0.04) {
    if (!state.sound) return;
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.03);
  }

  function soundCorrect() {
    tone(659, 0.10, 'sine', 0, 0.035);
    tone(784, 0.14, 'sine', 0.09, 0.04);
  }
  function soundWrong() { tone(220, 0.16, 'triangle', 0, 0.035); }
  function soundWin() {
    tone(523, 0.10, 'sine', 0, 0.035);
    tone(659, 0.10, 'sine', 0.10, 0.035);
    tone(784, 0.16, 'sine', 0.20, 0.04);
    tone(1047, 0.22, 'sine', 0.34, 0.045);
  }

  // Muzik latar dijana sendiri menggunakan Web Audio — tiada fail lagu luar/copyright.
  function startMusic() {
    if (!state.music || musicTimer) return;
    const ctx = getAudio();
    if (!ctx) return;
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.018;
    musicGain.connect(ctx.destination);
    const notes = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
    musicStep = 0;
    const playBar = () => {
      if (!state.music || !musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[musicStep % notes.length];
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(g).connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.48);
      musicStep++;
    };
    playBar();
    musicTimer = setInterval(playBar, 520);
  }

  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (musicGain) {
      try { musicGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05); } catch (_) {}
      musicGain = null;
    }
  }

  // Voice-over sengaja dikeluarkan supaya murid tidak menerima sebutan bahasa Inggeris
  // daripada voice lalai komputer/browser. BBM ini menggunakan arahan bertulis yang jelas.

  // ---------------- UTILITI ----------------
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function confetti() {
    const box = $('#confetti');
    if (!box) return;
    const icons = ['⭐', '✨', '🎉', '🔎', '📚', '🌟'];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement('span');
      s.className = 'conf';
      s.textContent = icons[i % icons.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.35 + 's';
      s.style.fontSize = (14 + Math.random() * 15) + 'px';
      box.appendChild(s);
      setTimeout(() => s.remove(), 2300);
    }
  }

  const pageName = page => ({ learn: 'Misi 1', mission1: 'Misi 2', mission2: 'Misi 3', mission3: 'Misi 4', final: 'Cabaran Akhir', result: 'Keputusan' }[page] || page);

  function unlocked(page) {
    if (page === 'home' || page === 'teacher') return true;
    if (page === 'learn') return state.started;
    if (page === 'mission1') return state.completed.learn;
    if (page === 'mission2') return state.completed.mission1;
    if (page === 'mission3') return state.completed.mission2;
    if (page === 'final') return state.completed.mission3;
    if (page === 'result') return state.completed.final;
    return false;
  }

  function navigate(page) {
    if (!unlocked(page)) {
      toast(`🔒 ${pageName(page)} masih terkunci. Selesaikan misi sebelumnya dahulu.`);
      soundWrong();
      return;
    }
    $$('.page').forEach(p => p.classList.toggle('active', p.id === page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
  }

  function updateProgress() {
    const doneMap = state.completed;
    $$('.track-step').forEach(btn => {
      const p = btn.dataset.page;
      btn.classList.toggle('locked', !unlocked(p));
      btn.classList.toggle('done', !!doneMap[p]);
      const icon = btn.querySelector('i');
      if (icon) icon.textContent = doneMap[p] ? '✅' : (unlocked(p) ? '🔓' : '🔒');
    });
    $$('.map-card').forEach(btn => {
      const p = btn.dataset.page;
      btn.classList.toggle('locked', !unlocked(p));
      const em = btn.querySelector('em');
      if (em) em.textContent = doneMap[p] ? '✅ Selesai' : (unlocked(p) ? '▶ Buka' : '🔒 Terkunci');
    });
  }

  // ---------------- PEMBELAJARAN ----------------
  function renderLesson() {
    const tabs = $('#lessonTabs');
    tabs.innerHTML = '';
    Object.entries(lessonData).forEach(([key, d], i) => {
      const b = document.createElement('button');
      b.className = 'tab' + (i === 0 ? ' active' : '');
      b.textContent = d.title;
      b.onclick = () => {
        $$('.tab', tabs).forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderLessonCard(key);
      };
      tabs.appendChild(b);
    });
    renderLessonCard('am');
  }

  function renderLessonCard(key) {
    const d = lessonData[key];
    $('#lessonContent').innerHTML = `
      <article class="lesson-card">
        <div class="lesson-icon">${d.icon}</div>
        <div>
          <span class="eyebrow">FAIL ${key.toUpperCase()}</span>
          <h2>${d.title}</h2>
          <p class="definition">${d.def}</p>
          <div class="example"><b>Contoh:</b> ${d.examples.join(' • ')}</div>
        </div>
      </article>`;
  }

  // ---------------- MISI 2: KUIZ ----------------
  function renderMission1() {
    const c = $('#mission1Content');
    c.innerHTML = '';
    mission1Questions.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'question-card';
      card.dataset.index = i;

      // Susunan pilihan jawapan diacak untuk SETIAP soalan.
      // data-a menyimpan indeks asal supaya jawapan betul masih dapat dinilai dengan tepat.
      const shuffledOptions = shuffle(item.o.map((text, originalIndex) => ({ text, originalIndex })));
      const optionsHTML = shuffledOptions.map(opt =>
        `<button class="option-btn" data-q="${i}" data-a="${opt.originalIndex}">${opt.text}</button>`
      ).join('');

      card.innerHTML = `<div class="question-title">${i + 1}. ${item.q}</div>
        <div class="option-grid">${optionsHTML}</div>
        <div class="feedback" id="fb-m1-${i}"></div>`;
      c.appendChild(card);
    });
    updateM1();
  }

  function updateM1() {
    const answered = Object.keys(state.answers.mission1).length;
    $('#m1Count').textContent = `${answered}/8`;
    $('#m1Score').textContent = `${state.scores.mission1}/8`;
    $('#checkMission1').disabled = answered !== 8 || state.completed.mission1;
  }

  function gradeMission1() {
    let score = 0;
    mission1Questions.forEach((item, i) => {
      const val = state.answers.mission1[i];
      const card = $(`.question-card[data-index="${i}"]`);
      const opts = $$('.option-btn', card);
      opts.forEach(b => b.disabled = true);
      if (val === item.a) {
        score++;
        card.classList.add('correct');
        $(`#fb-m1-${i}`).textContent = '✓ Tepat!';
        $(`#fb-m1-${i}`).className = 'feedback good';
      } else {
        card.classList.add('wrong');
        $(`#fb-m1-${i}`).textContent = `✗ Jawapan tepat: ${item.o[item.a]}`;
        $(`#fb-m1-${i}`).className = 'feedback bad';
      }
    });
    state.scores.mission1 = score;
    state.completed.mission1 = true;
    $('#checkMission1').textContent = 'Misi 2 Selesai ✓ — Misi 3 →';
    $('#checkMission1').disabled = false;
    score >= 6 ? soundWin() : soundCorrect();
    confetti();
    updateProgress();
    toast(`🎉 Siasatan selesai! Skor ${score}/8.`);
  }

  // ---------------- MISI 3: KLASIFIKASI ----------------
  function renderClassification() {
    const bank = $('#wordBank');
    const board = $('#categoryBoard');
    bank.innerHTML = '<h3>🔍 Petunjuk Perkataan</h3><p class="sentence-hint">Pilih satu perkataan dahulu.</p>';
    board.innerHTML = '';

    shuffle(classificationWords).forEach(([word, type]) => {
      const b = document.createElement('button');
      b.className = 'word-chip';
      b.dataset.word = word;
      b.dataset.type = type;
      b.textContent = word;
      b.onclick = () => selectWord(word, b);
      bank.appendChild(b);
    });

    const cats = [
      ['am', 'Kata Nama Am', '🧺'], ['khas', 'Kata Nama Khas', '📍'],
      ['ganti', 'Kata Ganti Nama', '🙋'], ['penjodoh', 'Penjodoh Bilangan', '🔢']
    ];
    cats.forEach(([key, title, icon]) => {
      const box = document.createElement('div');
      box.className = 'category-box';
      box.dataset.type = key;
      box.innerHTML = `<h3>${icon} ${title}</h3><small>Klik fail ini untuk masukkan petunjuk.</small><div class="classified"></div>`;
      box.onclick = () => classify(key);
      board.appendChild(box);
    });
    restoreClassification();
    updateM2();
  }

  function selectWord(word, btn) {
    if (btn.classList.contains('done')) return;
    state.classification.selected = word;
    $$('.word-chip').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    toast(`🔎 “${word}” dipilih. Sekarang pilih fail kategori.`);
  }

  function classify(type) {
    const word = state.classification.selected;
    if (!word) { toast('☝️ Pilih perkataan dahulu.'); return; }
    const pair = classificationWords.find(x => x[0] === word);
    if (!pair) return;
    if (pair[1] === type) {
      state.classification.answers[word] = type;
      state.scores.mission2 = Object.keys(state.classification.answers).length;
      const b = $(`.word-chip[data-word="${CSS.escape(word)}"]`);
      if (b) { b.classList.remove('selected'); b.classList.add('done'); b.disabled = true; }
      const box = $(`.category-box[data-type="${type}"] .classified`);
      const chip = document.createElement('span');
      chip.className = 'mini-chip';
      chip.textContent = word;
      box.appendChild(chip);
      state.classification.selected = null;
      soundCorrect();
      toast('✅ Tepat! Petunjuk berjaya difailkan.');
      updateM2();
      if (state.scores.mission2 === 8) {
        state.completed.mission2 = true;
        $('#toMission3').disabled = false;
        confetti(); soundWin(); updateProgress();
        toast('🎉 Semua petunjuk berjaya diklasifikasikan!');
      }
    } else {
      soundWrong();
      toast('❌ Belum tepat. Cuba fail kategori lain.');
    }
  }

  function restoreClassification() {
    Object.entries(state.classification.answers).forEach(([word, type]) => {
      const b = $(`.word-chip[data-word="${CSS.escape(word)}"]`);
      if (b) { b.classList.add('done'); b.disabled = true; }
      const box = $(`.category-box[data-type="${type}"] .classified`);
      if (!box) return;
      const chip = document.createElement('span');
      chip.className = 'mini-chip';
      chip.textContent = word;
      box.appendChild(chip);
    });
  }

  function updateM2() {
    const count = Object.keys(state.classification.answers).length;
    $('#m2Count').textContent = `${count}/8`;
    $('#m2Score').textContent = `${state.scores.mission2}/8`;
    $('#toMission3').disabled = !state.completed.mission2;
  }

  // ---------------- MISI 4: SUSUN AYAT ----------------
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shuffleChallenge(words) {
    let mixed = shuffle(words);
    let tries = 0;
    while (mixed.join('|') === words.join('|') && tries < 8) {
      mixed = shuffle(words);
      tries++;
    }
    return mixed;
  }

  function normalizeSentence(words) {
    return words.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function renderSentences() {
    if (state.sentences.length === 0) {
      state.sentences = sentenceData.map(words => ({
        words: [...words],
        options: shuffleChallenge(words),
        picked: [],
        correct: false,
        checked: false
      }));
    }

    const c = $('#sentenceContent');
    c.innerHTML = '';
    state.sentences.forEach((s, i) => {
      const card = document.createElement('article');
      const placement = i % 3 === 0 ? 'bank-bottom' : (i % 3 === 1 ? 'bank-top' : 'bank-side');
      card.className = 'sentence-card ' + placement + (s.correct ? ' correct' : '');
      card.dataset.index = i;
      card.innerHTML = `<h3>Kes Ayat ${i + 1}</h3>
        <div class="sentence-hint">🔀 Cari dan klik perkataan mengikut susunan ayat yang betul.</div>
        <div class="sentence-workspace">
          <div class="word-bank-area"><div class="answer-label">PETUNJUK RAWAK — CARI PERKATAAN</div><div class="word-options"></div></div>
          <div class="answer-area"><div class="answer-label">AYAT ANDA</div><div class="answer-line"></div></div>
        </div>
        <div class="sentence-feedback"></div>
        <button class="reset-sentence" type="button">↩️ Cuba Susun Semula</button>`;
      c.appendChild(card);
      renderSentenceCard(card, s);
    });
    updateM3();
  }

  function renderSentenceCard(card, s) {
    const line = $('.answer-line', card);
    const opts = $('.word-options', card);
    const feedback = $('.sentence-feedback', card);
    const reset = $('.reset-sentence', card);

    line.innerHTML = '';
    opts.innerHTML = '';

    s.picked.forEach((w, idx) => {
      const b = document.createElement('button');
      b.className = 'sentence-word picked';
      b.textContent = `${idx + 1}. ${w}`;
      b.disabled = s.correct;
      b.onclick = () => {
        if (s.correct) return;
        s.picked.splice(idx, 1);
        s.checked = false;
        renderSentenceCard(card, s);
        soundCorrect();
      };
      line.appendChild(b);
    });

    s.options.forEach(w => {
      const used = s.picked.includes(w);
      const b = document.createElement('button');
      b.className = 'sentence-word option' + (used ? ' used' : '');
      b.textContent = w;
      b.disabled = used || s.correct;
      b.onclick = () => pickSentenceWord(s, w, card);
      opts.appendChild(b);
    });

    if (s.correct) {
      feedback.textContent = '✓ Tepat! Susunan ayat betul.';
      feedback.className = 'sentence-feedback feedback good';
      reset.style.display = 'none';
    } else if (s.checked) {
      feedback.textContent = '✗ Susunan belum tepat. Cuba susun semula.';
      feedback.className = 'sentence-feedback feedback bad';
      reset.style.display = 'inline-flex';
    } else {
      feedback.textContent = `${s.picked.length}/${s.words.length} perkataan dipilih.`;
      feedback.className = 'sentence-feedback';
      reset.style.display = s.picked.length ? 'inline-flex' : 'none';
    }

    reset.onclick = () => {
      s.picked = [];
      s.checked = false;
      s.options = shuffleChallenge(s.words);
      renderSentenceCard(card, s);
      soundCorrect();
      toast('🔀 Perkataan diacak semula. Cuba lagi!');
    };
  }

  function pickSentenceWord(s, word, card) {
    if (s.correct || s.picked.includes(word)) return;
    s.picked.push(word);
    soundCorrect();

    if (s.picked.length === s.words.length) {
      // PEMBETULAN UTAMA: semak ayat selepas semua perkataan dipilih.
      // Perbandingan menggunakan teks normal supaya tidak tersalah kerana huruf besar/ruang.
      const correct = normalizeSentence(s.picked) === normalizeSentence(s.words);
      s.checked = true;
      if (correct) {
        s.correct = true;
        state.scores.mission3 = state.sentences.filter(x => x.correct).length;
        card.classList.remove('wrong');
        card.classList.add('correct');
        soundWin();
        confetti();
        toast('🌟 Betul! Ayat berjaya dibina.');
      } else {
        s.correct = false;
        card.classList.remove('correct');
        card.classList.add('wrong');
        soundWrong();
        setTimeout(() => card.classList.remove('wrong'), 500);
        toast('❌ Susunan belum tepat. Gunakan “Cuba Susun Semula”.');
      }
    }

    renderSentenceCard(card, s);
    updateM3();
  }

  function updateM3() {
    const correct = state.sentences.filter(s => s.correct).length;
    state.scores.mission3 = correct;
    $('#toFinal').disabled = correct !== sentenceData.length;
    if (correct === sentenceData.length && !state.completed.mission3) {
      state.completed.mission3 = true;
      confetti(); soundWin(); updateProgress();
      toast('🏆 Semua ayat tepat! Cabaran akhir dibuka.');
    }
  }

  // ---------------- CABARAN AKHIR ----------------
  function renderFinal() {
    const c = $('#finalContent');
    c.innerHTML = '';
    finalQuestions.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'question-card';
      card.dataset.index = i;
      card.innerHTML = `<div class="question-title">${i + 1}. ${item.q}</div>
        <div class="option-grid">${item.o.map((o, j) => `<button class="option-btn" data-q="${i}" data-a="${j}">${o}</button>`).join('')}</div>
        <div class="feedback" id="fb-final-${i}"></div>`;
      c.appendChild(card);
    });
    updateFinal();
  }

  function updateFinal() {
    const count = Object.keys(state.answers.final).length;
    $('#finalCount').textContent = `${count}/10`;
    $('#finalScore').textContent = `${state.scores.final}/10`;
    $('#finishFinal').disabled = count !== 10 || state.completed.final;
  }

  function gradeFinal() {
    let score = 0;
    finalQuestions.forEach((item, i) => {
      const val = state.answers.final[i];
      const card = $(`.question-card[data-index="${i}"]`, $('#finalContent'));
      $$('.option-btn', card).forEach(b => b.disabled = true);
      if (val === item.a) {
        score++;
        card.classList.add('correct');
        $(`#fb-final-${i}`).textContent = '✓ Tepat!';
        $(`#fb-final-${i}`).className = 'feedback good';
      } else {
        card.classList.add('wrong');
        $(`#fb-final-${i}`).textContent = `✗ Jawapan tepat: ${item.o[item.a]}`;
        $(`#fb-final-${i}`).className = 'feedback bad';
      }
    });
    state.scores.final = score;
    state.completed.final = true;
    soundWin(); confetti(); updateProgress(); showResult();
  }

  function showResult() {
    const total = state.scores.mission1 + state.scores.mission2 + state.scores.mission3 + state.scores.final;
    const maxScore = mission1Questions.length + classificationWords.length + sentenceData.length + finalQuestions.length;
    const pct = Math.round(total / maxScore * 100);
    let title = 'Detektif Baharu', emoji = '🔎', text = 'Teruskan latihan dan cuba semula misi yang mencabar kamu.';
    if (pct >= 80) { title = 'Detektif Bahasa Cemerlang'; emoji = '🏆'; text = 'Hebat! Kamu berjaya menggunakan petunjuk kata nama dengan yakin.'; }
    else if (pct >= 60) { title = 'Detektif Bahasa Muda'; emoji = '🌟'; text = 'Bagus! Kamu sudah menguasai banyak petunjuk. Teruskan latihan.'; }
    $('#resultEmoji').textContent = emoji;
    $('#resultTitle').textContent = title;
    $('#resultText').textContent = text;
    $('#totalScore').textContent = total;
    $('#masteryText').textContent = pct + '%';
    $('#masteryBar').style.width = pct + '%';
    navigate('result');
  }

  function resetAll() {
    state.started = false;
    state.completed = { learn: false, mission1: false, mission2: false, mission3: false, final: false };
    state.scores = { mission1: 0, mission2: 0, mission3: 0, final: 0 };
    state.answers = { mission1: {}, final: {} };
    state.classification = { selected: null, answers: {} };
    state.sentences = [];
    renderLesson(); renderMission1(); renderClassification(); renderSentences(); renderFinal();
    navigate('home'); updateProgress(); startMusic();
    toast('🔄 Semua misi telah direset.');
  }

  // ---------------- EVENT ----------------
  function bind() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-page]');
      if (btn) { e.preventDefault(); navigate(btn.dataset.page); }
    });

    $('#startBtn').onclick = () => {
      getAudio();
      startMusic();
      state.started = true;
      renderLesson();
      navigate('learn');
      toast('🚀 Misi bermula! Dengar arahan dan buka fail pertama.');
    };

    $('#toMission1').onclick = () => {
      state.completed.learn = true;
      soundWin();
      confetti();
      updateProgress();
      navigate('mission1');
      toast('📖 Fail pertama selesai! Misi siasatan dibuka.');
    };

    $('#checkMission1').onclick = () => {
      if (!state.completed.mission1) gradeMission1();
      else navigate('mission2');
    };

    $('#toMission3').onclick = () => navigate('mission3');
    $('#toFinal').onclick = () => navigate('final');
    $('#finishFinal').onclick = () => gradeFinal();
    $('#againBtn').onclick = resetAll;

    $('#soundBtn').onclick = () => {
      state.sound = !state.sound;
      $('#soundBtn').textContent = state.sound ? '🔊 Bunyi' : '🔇 Bunyi';
      if (state.sound) { getAudio(); soundCorrect(); }
      toast(state.sound ? '🔊 Bunyi dihidupkan.' : '🔇 Bunyi dimatikan.');
    };

    $('#musicBtn').onclick = () => {
      state.music = !state.music;
      $('#musicBtn').textContent = state.music ? '🎵 Muzik' : '🔕 Muzik';
      if (state.music) { getAudio(); startMusic(); }
      else stopMusic();
      toast(state.music ? '🎵 Muzik latar dihidupkan.' : '🔕 Muzik latar dimatikan.');
    };

    document.addEventListener('click', e => {
      const b = e.target.closest('.option-btn');
      if (!b) return;
      const q = b.dataset.q;
      const a = Number(b.dataset.a);
      const card = b.closest('.question-card');
      $$('.option-btn', card).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      if (b.closest('#mission1Content')) state.answers.mission1[q] = a;
      else if (b.closest('#finalContent')) state.answers.final[q] = a;
      soundCorrect();
      updateM1(); updateFinal();
    });
  }

  function init() {
    renderLesson();
    renderMission1();
    renderClassification();
    renderSentences();
    renderFinal();
    bind();
    updateProgress();
  }

  init();
})();
