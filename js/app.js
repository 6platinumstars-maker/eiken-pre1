// js/app.js  (localStorage対応：eikenJun1Mobile.v1 + 正誤履歴：eikenJun1Mobile.v1.stats)
// - 4択（タグ優先の誤答選び）対応
// - 学習状態の保存/復元（続きから再開）対応
// - vocab 正誤履歴の保存/復元（sec:vid）対応
(function () {
  const $ = (id) => document.getElementById(id);

  // ---- top controls ----
  const sectionSelect = $("sectionSelect");
  const tabSentences = $("tabSentences");
  const tabVocab = $("tabVocab");
  const viewSentences = $("viewSentences");
  const viewVocab = $("viewVocab");

  // ---- sentences UI ----
  const sidEl = $("sid");
  const progressEl = $("progress");
  const englishEl = $("english");
  const japaneseEl = $("japanese");
  const vocabChipsEl = $("vocabChips");
  const sentenceCard = $("sentenceCard");
  const sentenceVocabCard = $("sentenceVocabCard");
  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");

  // ---- audio UI ----
  const audioSidEl = $("audioSid");
  const audioProgressEl = $("audioProgress");
  const audioModeTitleEl = $("audioModeTitle");
  const audioHintEl = $("audioHint");
  const audioRevealAreaEl = $("audioRevealArea");
  const audioPrevBtn = $("audioPrevBtn");
  const audioReplayBtn = $("audioReplayBtn");
  const audioNextBtn = $("audioNextBtn");
  const audioStatusEl = $("audioStatus");
  const audioBatchToggleBtn = $("audioBatchToggleBtn");
  const audioBatchPickerEl = $("audioBatchPicker");
  const audioBatchOptionEls = Array.from(document.querySelectorAll("[data-batch-index]"));

  // ---- vocab UI ----
  const vocabIdEl = $("vocabId");
  const vocabProgressEl = $("vocabProgress");
  const vocabMeaningEl = $("vocabMeaning");
  const vocabInputEl = $("vocabInput");
  const vocabFeedbackEl = $("vocabFeedback");
  const vocabCheckAllBtn = $("vocabCheckAllBtn");
  const vocabUncheckAllBtn = $("vocabUncheckAllBtn");
  const vocabPrevBtn = $("vocabPrevBtn");
  const vocabNextBtn = $("vocabNextBtn");
  const vocabRevealBtn = $("vocabRevealBtn");
  const vocabAnswerBox = $("vocabAnswerBox");
  const vocabPromptTitleEl = $("vocabPromptTitle");
  const vocabAnswerTitleEl = $("vocabAnswerTitle");
  const vocabAnswerEl = $("vocabAnswer");
  const vocabIpaEl = $("vocabIpa");
  const vocabExtraEl = $("vocabExtra");

  // ---- MCQ (4 choices) UI ----
  const mcqBox = $("mcqBox");
  const mcqToggleBtn = $("mcqToggleBtn");
  const mcqSkipBtn = $("mcqSkipBtn");
  const mcqChoicesEl = $("mcqChoices");
  const mcqHintEl = $("mcqHint");

  // =========================
  // localStorage keys
  // =========================
  const STORAGE_KEY = "eikenJun1Mobile.v1";
  const STATS_KEY = "eikenJun1Mobile.v1.stats";
  const CHIP_STATE_KEY = "eikenJun1Mobile.v1.chips";
  const AUDIO_ASSET_VERSION = "20260620-1";

  // --- stats state (永続) ---
  // stats["sec01:v0001"] = { seen, correct, wrong, lastAt }
  let stats = Object.create(null);
  let statsDirty = false;
  let statsSaveTimer = null;
  let chipState = Object.create(null);
  let chipStateDirty = false;
  let chipStateSaveTimer = null;
  let checkedVocabReviewIndex = 0;
  let checkedVocabRevealStage = 0;

  // --- state save timer ---
  let saveTimer = null;

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveState();
    }, 120);
  }

  function scheduleSaveStats() {
    statsDirty = true;
    if (statsSaveTimer) clearTimeout(statsSaveTimer);
    statsSaveTimer = setTimeout(() => {
      statsSaveTimer = null;
      saveStats();
    }, 200);
  }

  function scheduleSaveChipState() {
    chipStateDirty = true;
    if (chipStateSaveTimer) clearTimeout(chipStateSaveTimer);
    chipStateSaveTimer = setTimeout(() => {
      chipStateSaveTimer = null;
      saveChipState();
    }, 200);
  }

  function safeParseJSON(s) {
    try {
      return JSON.parse(s);
    } catch (_) {
      return null;
    }
  }

  function isFiniteNumber(x) {
    return typeof x === "number" && Number.isFinite(x);
  }

  function clampInt(n, min, max, fallback = min) {
    if (!isFiniteNumber(n)) return fallback;
    n = Math.trunc(n);
    return Math.max(min, Math.min(max, n));
  }

  function normalizeAnswer(s) {
    return (s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderVocabChip(v) {
    if (!v) return `<div class="chip"><div class="chip-word">(not found)</div></div>`;

    const ipa = v.ipa ? `<div class="chip-ipa">${escapeHtml(v.ipa)}</div>` : "";
    const meaning = v.meaning ? `<div class="chip-meaning">${escapeHtml(v.meaning)}</div>` : "";
    return `<div class="chip"><div class="chip-word">${escapeHtml(v.word)}</div>${ipa}${meaning}</div>`;
  }

  function getChipState(vid) {
    return chipState[vid] || { checked: false };
  }

  function setChipChecked(vid, checked) {
    if (!vid) return;
    chipState[vid] = { checked: !!checked };
    scheduleSaveChipState();
  }

  function getChipExtraInfo(v) {
    return v?.extraInfo || "追加情報は未登録です。";
  }

  function getVocabIdNumber(vid) {
    const match = /^v(\d+)$/.exec(vid || "");
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function renderChipExtraInfo(info) {
    const text = String(info ?? "").trim();
    if (!text) return `<div class="chip-extra-block"><div class="chip-extra-line">追加情報は未登録です。</div></div>`;

    function formatExtraInfoLine(line) {
      const escaped = escapeHtml(line);
      return escaped.replace(/\/[^/\n]+\/+/g, (match) => `<span class="inline-ipa">${match}</span>`);
    }

    return text
      .split(/\n{2,}/)
      .map((block) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const className = /^【.+】$/.test(line) ? "chip-extra-line chip-extra-heading" : "chip-extra-line";
            return `<div class="${className}">${formatExtraInfoLine(line)}</div>`;
          })
          .join("");
        return `<div class="chip-extra-block">${lines}</div>`;
      })
      .join("");
  }

  function renderSentenceVocabChip(v, isExpanded = false) {
    if (!v) {
      return `<div class="chip"><div class="chip-word">(not found)</div></div>`;
    }

    const state = getChipState(v.vid);
    const checkedClass = state.checked ? " is-checked" : "";
    const ipa = v.ipa ? `<div class="chip-ipa">${escapeHtml(v.ipa)}</div>` : "";
    const meaning = v.meaning ? `<div class="chip-meaning">${escapeHtml(v.meaning)}</div>` : "";

    if (!isExpanded) {
      return `<button type="button" class="chip sentence-chip${checkedClass}" data-vid="${escapeHtml(v.vid)}"><div class="chip-word">${escapeHtml(v.word)}</div>${ipa}${meaning}</button>`;
    }

    return `
      <button type="button" class="chip sentence-chip sentence-chip-expanded${checkedClass}" data-vid="${escapeHtml(v.vid)}">
        <div class="chip-main">
          <div class="chip-word">${escapeHtml(v.word)}</div>
          ${ipa}
          ${meaning}
        </div>
        <div class="chip-extra">${renderChipExtraInfo(getChipExtraInfo(v))}</div>
        <div class="chip-check-cell">
          <label class="chip-check-row">
            <input type="checkbox" class="chip-check" data-vid="${escapeHtml(v.vid)}" ${state.checked ? "checked" : ""} />
            <span>チェック</span>
          </label>
        </div>
      </button>
    `;
  }

  function findSentenceBySid(sid, preferredSectionId = null) {
    const searchOrder = preferredSectionId
      ? [preferredSectionId, ...getSectionIds().filter((id) => id !== preferredSectionId)]
      : getSectionIds();

    for (const sectionId of searchOrder) {
      const sec = window.SECTIONS?.[sectionId];
      const sentence = (sec?.sentences || []).find((item) => item.sid === sid);
      if (sentence) {
        return { sectionId, sentence };
      }
    }
    return null;
  }

  function getCheckedVocabItems() {
    const items = [];

    getSectionIds().forEach((sectionId) => {
      const sec = window.SECTIONS?.[sectionId];
      if (!sec?.vocab?.length) return;

      sec.vocab.forEach((vocab) => {
        if (!getChipState(vocab.vid).checked) return;

        const sentenceRef = Array.isArray(vocab.usedIn) ? vocab.usedIn[0] : null;
        const sentenceMatch = sentenceRef ? findSentenceBySid(sentenceRef, sectionId) : null;

        items.push({
          sectionId,
          vocab,
          sentence: sentenceMatch?.sentence || null,
        });
      });
    });

    items.sort((a, b) => {
      const byVid = getVocabIdNumber(a.vocab?.vid) - getVocabIdNumber(b.vocab?.vid);
      if (byVid !== 0) return byVid;
      return getSectionNumber(a.sectionId) - getSectionNumber(b.sectionId);
    });

    return items;
  }

  function getAllVocabItems() {
    const items = [];

    getSectionIds().forEach((sectionId) => {
      const sec = window.SECTIONS?.[sectionId];
      if (!sec?.vocab?.length) return;

      sec.vocab.forEach((vocab) => {
        items.push({ sectionId, vocab });
      });
    });

    items.sort((a, b) => {
      const byVid = getVocabIdNumber(a.vocab?.vid) - getVocabIdNumber(b.vocab?.vid);
      if (byVid !== 0) return byVid;
      return getSectionNumber(a.sectionId) - getSectionNumber(b.sectionId);
    });

    return items;
  }

  function setAllChipChecked(checked) {
    getAllVocabItems().forEach(({ vocab }) => {
      if (!vocab?.vid) return;
      chipState[vocab.vid] = { checked: !!checked };
    });

    checkedVocabReviewIndex = 0;
    checkedVocabRevealStage = 0;
    scheduleSaveChipState();
  }

  function getCurrentCheckedVocabItem() {
    const items = getCheckedVocabItems();
    if (!items.length) {
      checkedVocabReviewIndex = 0;
      checkedVocabRevealStage = 0;
      return { items, item: null };
    }

    checkedVocabReviewIndex = clampInt(
      checkedVocabReviewIndex,
      0,
      Math.max(0, items.length - 1),
      0
    );

    return {
      items,
      item: items[checkedVocabReviewIndex],
    };
  }

  function renderVocabAnswerMeta(v) {
    vocabAnswerEl.textContent = v.word || "";
    vocabIpaEl.textContent = v.ipa || "";
    vocabExtraEl.textContent = `usedIn: ${(v.usedIn || []).join(", ")}`;
  }

  // =========================
  // stats (正誤履歴)
  // =========================
  function getStatKey(secId, vid) {
    return `${secId}:${vid}`;
  }

  function loadStats() {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      stats = Object.create(null);
      return;
    }
    const obj = safeParseJSON(raw);
    if (!obj || typeof obj !== "object") {
      stats = Object.create(null);
      return;
    }

    // 軽いバリデーション：値がobjectのものだけ
    const out = Object.create(null);
    for (const [k, v] of Object.entries(obj)) {
      if (!v || typeof v !== "object") continue;
      const seen = clampInt(v.seen, 0, 1e9, 0);
      const correct = clampInt(v.correct, 0, 1e9, 0);
      const wrong = clampInt(v.wrong, 0, 1e9, 0);
      const lastAt = isFiniteNumber(v.lastAt) ? v.lastAt : 0;
      out[k] = { seen, correct, wrong, lastAt };
    }
    stats = out;
  }

  function loadChipState() {
    const raw = localStorage.getItem(CHIP_STATE_KEY);
    if (!raw) {
      chipState = Object.create(null);
      return;
    }

    const obj = safeParseJSON(raw);
    if (!obj || typeof obj !== "object") {
      chipState = Object.create(null);
      return;
    }

    const out = Object.create(null);
    for (const [k, v] of Object.entries(obj)) {
      if (!v || typeof v !== "object") continue;
      out[k] = { checked: !!v.checked };
    }
    chipState = out;
  }

  function saveStats() {
    if (!statsDirty) return;
    statsDirty = false;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn("localStorage stats save failed:", e);
    }
  }

  function saveChipState() {
    if (!chipStateDirty) return;
    chipStateDirty = false;
    try {
      localStorage.setItem(CHIP_STATE_KEY, JSON.stringify(chipState));
    } catch (e) {
      console.warn("localStorage chip state save failed:", e);
    }
  }

  // outcome: "correct" | "wrong"
  function recordVocabResult(secId, vocab, outcome) {
    if (!secId || !vocab?.vid) return;

    const key = getStatKey(secId, vocab.vid);
    const cur = stats[key] || { seen: 0, correct: 0, wrong: 0, lastAt: 0 };

    cur.seen += 1;
    if (outcome === "correct") cur.correct += 1;
    else cur.wrong += 1;

    cur.lastAt = Date.now();
    stats[key] = cur;

    scheduleSaveStats();
  }

  // =========================
  // 学習状態 (続きから再開)
  // =========================
  function saveState() {
    const sec = getCurrentSection();
    const vocabLen = sec?.vocab?.length || 0;

    const state = {
      v: 1,
      lastSection: currentSectionId,
      currentView,
      sentenceIndex,
      sentenceRevealStage,
      audioSentenceIndex,
      showJP,
      mcqMode,
      checkedVocabReviewIndex,
      checkedVocabRevealStage,
      vocab: {
        sectionId: currentSectionId,
        queue: Array.isArray(queue) ? queue.slice() : [],
        queuePos,
        wrongSet: Array.from(wrongSet || []),
        roundNo
      }
    };

    if (vocabLen > 0) {
      state.vocab.queue = (state.vocab.queue || [])
        .map((i) => (Number.isFinite(i) ? Math.trunc(i) : -1))
        .filter((i) => i >= 0 && i < vocabLen);
      state.vocab.queuePos = clampInt(
        state.vocab.queuePos,
        0,
        Math.max(0, state.vocab.queue.length - 1),
        0
      );
      state.vocab.wrongSet = (state.vocab.wrongSet || [])
        .map((i) => (Number.isFinite(i) ? Math.trunc(i) : -1))
        .filter((i) => i >= 0 && i < vocabLen);
      state.vocab.roundNo = clampInt(state.vocab.roundNo, 1, 9999, 1);
    } else {
      state.vocab.queue = [];
      state.vocab.queuePos = 0;
      state.vocab.wrongSet = [];
      state.vocab.roundNo = 1;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const state = safeParseJSON(raw);
    if (!state || typeof state !== "object") return;

    const ids = Object.keys(window.SECTIONS || {});
    if (!ids.length) return;

    const last = typeof state.lastSection === "string" ? state.lastSection : null;
    if (last && window.SECTIONS[last]) {
      currentSectionId = last;
    } else {
      currentSectionId = ids.sort()[0] || currentSectionId;
    }

    showJP = typeof state.showJP === "boolean" ? state.showJP : showJP;
    mcqMode = typeof state.mcqMode === "boolean" ? state.mcqMode : mcqMode;
    currentView = state.currentView === "vocab" ? "vocab" : "sentences";
    sentenceIndex = isFiniteNumber(state.sentenceIndex) ? Math.trunc(state.sentenceIndex) : sentenceIndex;
    sentenceRevealStage = clampInt(state.sentenceRevealStage, 0, 1, sentenceRevealStage);
    audioSentenceIndex = isFiniteNumber(state.audioSentenceIndex)
      ? Math.trunc(state.audioSentenceIndex)
      : audioSentenceIndex;
    checkedVocabReviewIndex = clampInt(state.checkedVocabReviewIndex, 0, 10000, 0);
    checkedVocabRevealStage = clampInt(state.checkedVocabRevealStage, 0, 1, 0);

    const sec = window.SECTIONS[currentSectionId];
    const list = sec?.vocab || [];
    const vocabLen = list.length;

    const vocabState = state.vocab && typeof state.vocab === "object" ? state.vocab : null;
    if (vocabState && vocabState.sectionId === currentSectionId && vocabLen > 0) {
      const q = Array.isArray(vocabState.queue) ? vocabState.queue : [];
      const qSafe = q
        .map((i) => (Number.isFinite(i) ? Math.trunc(i) : -1))
        .filter((i) => i >= 0 && i < vocabLen);

      queue = qSafe.length ? qSafe : list.map((_, i) => i);
      queuePos = clampInt(vocabState.queuePos, 0, Math.max(0, queue.length - 1), 0);

      const ws = Array.isArray(vocabState.wrongSet) ? vocabState.wrongSet : [];
      wrongSet = new Set(
        ws
          .map((i) => (Number.isFinite(i) ? Math.trunc(i) : -1))
          .filter((i) => i >= 0 && i < vocabLen)
      );

      roundNo = clampInt(vocabState.roundNo, 1, 9999, 1);
    } else {
      queue = [];
      queuePos = 0;
      wrongSet = new Set();
      roundNo = 1;
    }
  }

  // =========================
  // ---- state ----
  // =========================
  let currentSectionId = "sec01";
  let currentView = "sentences";
  let sentenceIndex = 0;
  let sentenceRevealStage = 0;
  let expandedSentenceChipIds = new Set();
  let audioSentenceIndex = 0;
  let showJP = true;
  let audioRevealStage = 0;
  let audioElement = null;
  let audioPlaybackToken = 0;
  let audioAdvanceTimer = null;
  let shouldAutoStartAudio = false;
  let isAudioBatchMenuOpen = false;
  let isAudioBatchPlaying = false;
  let activeAudioBatchIndex = null;
  let audioBatchSectionIds = [];
  let audioBatchSectionPos = 0;

  // vocab state
  let vocabIndex = 0;
  let revealed = false;

  // auto-next
  let autoNextTimer = null;
  const AUTO_NEXT_DELAY_MS = 950;

  // loop learning (queue)
  let queue = [];
  let queuePos = 0;
  let wrongSet = new Set();
  let roundNo = 1;

  // input lock
  let vocabLocked = false;

  // MCQ mode
  let mcqMode = true;
  let mcqAnswered = false;

  // ---- tag constants (Level0-1) ----
  const POS_TAGS = ["noun", "verb", "adj", "adv", "prep", "conj", "pron", "interj", "aux"];
  const isPatternTag = (t) => typeof t === "string" && t.startsWith("pattern_");
  const isVerbHeadTag = (t) => typeof t === "string" && t.startsWith("verb_");

  // --- helpers ---
  function getSectionIds() {
    // Keep the UI in numeric section order even if lexical sort would misplace sec10, sec29, etc.
    return Object.keys(window.SECTIONS || {}).sort((a, b) => getSectionNumber(a) - getSectionNumber(b));
  }

  function getSectionNumber(sectionId) {
    const match = /^sec(\d+)$/.exec(sectionId || "");
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function getCurrentSection() {
    return window.SECTIONS?.[currentSectionId];
  }

  function getAudioBatchGroups() {
    const ids = getSectionIds().filter((id) => /^sec\d+$/.test(id));
    const maxGroupIndex = ids.reduce((max, id) => {
      const sectionNumber = getSectionNumber(id);
      return Number.isFinite(sectionNumber) ? Math.max(max, Math.floor((sectionNumber - 1) / 5)) : max;
    }, -1);
    const groups = Array.from({ length: Math.max(0, maxGroupIndex + 1) }, () => []);

    ids.forEach((id) => {
      const sectionNumber = getSectionNumber(id);
      if (!Number.isFinite(sectionNumber) || sectionNumber <= 0) return;
      // Batch ranges stay fixed as 01-05, 06-10, ... even if one section fails to load.
      groups[Math.floor((sectionNumber - 1) / 5)].push(id);
    });

    return groups;
  }

  function getAudioBatchSections(batchIndex) {
    return getAudioBatchGroups()[batchIndex - 1] || [];
  }

  function buildAudioBatchPlaylist(batchIndex) {
    const sectionIds = getAudioBatchSections(batchIndex);
    const playlist = [];

    sectionIds.forEach((sectionId, sectionPos) => {
      const sec = window.SECTIONS?.[sectionId];
      if (!sec?.sentences?.length) return;
      sec.sentences.forEach((sentence, sentencePos) => {
        playlist.push({
          sectionId,
          sectionPos,
          sentence,
          sentencePos,
        });
      });
    });

    return { sectionIds, playlist };
  }

  function getAudioBatchRangeLabel(sectionIds) {
    if (!sectionIds.length) return "";
    const first = sectionIds[0].replace(/^sec/, "");
    const last = sectionIds[sectionIds.length - 1].replace(/^sec/, "");
    return `${first}-${last}`;
  }

  function clearAutoTimer() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function resetAudioBatchState() {
    isAudioBatchPlaying = false;
    activeAudioBatchIndex = null;
    audioBatchSectionIds = [];
    audioBatchSectionPos = 0;
  }

  function isAudioPaused() {
    return !!audioElement && audioElement.paused && !audioElement.ended;
  }

  function isAudioPlaying() {
    return !!audioElement && !audioElement.paused && !audioElement.ended;
  }

  function renderAudioPauseButton() {
    if (!audioReplayBtn) return;
    audioReplayBtn.disabled = currentView !== "enAudio" && currentView !== "jpAudio";
    audioReplayBtn.classList.toggle("primary", isAudioPaused());
  }

  function stopAudioPlayback() {
    audioPlaybackToken += 1;
    if (audioAdvanceTimer) {
      clearTimeout(audioAdvanceTimer);
      audioAdvanceTimer = null;
    }
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      audioElement = null;
    }
    resetAudioBatchState();
    renderAudioPauseButton();
  }

  function focusVocabInput() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        vocabInputEl.focus({ preventScroll: true });
        try {
          const len = vocabInputEl.value.length;
          vocabInputEl.setSelectionRange(len, len);
        } catch (_) {}
      });
    });
  }

  function lockVocabInput() {
    vocabLocked = true;
    vocabInputEl.readOnly = true;
  }

  function unlockVocabInput() {
    vocabLocked = false;
    vocabInputEl.readOnly = false;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getAudioSectionFolder(sectionId = currentSectionId) {
    return sectionId.replace(/^sec/, "section");
  }

  function getAudioSentenceId(sentence) {
    return sentence.sid.replace(/^s/, "");
  }

  function getAudioPath(sentence, kind, sectionId = currentSectionId) {
    const sectionFolder = getAudioSectionFolder(sectionId);
    const sentenceId = getAudioSentenceId(sentence);
    if (kind === "en-5x") return `mp3/5en/${sectionFolder}/${sentenceId}_female_5x.mp3?v=${AUDIO_ASSET_VERSION}`;
    if (kind === "en-female-slow") {
      return `mp3/en/${sectionFolder}/${sentenceId}_female_slow.mp3?v=${AUDIO_ASSET_VERSION}`;
    }
    return `mp3/jp/${sectionFolder}/${sentenceId}_female.mp3?v=${AUDIO_ASSET_VERSION}`;
  }

  function getDefaultAudioRevealStage(view = currentView) {
    return view === "enAudio" ? 3 : 2;
  }

  function applyCurrentSection(sectionId, { resetSentenceIndices = false } = {}) {
    currentSectionId = sectionId;
    sectionSelect.value = sectionId;
    if (resetSentenceIndices) {
      sentenceIndex = 0;
      sentenceRevealStage = 0;
      expandedSentenceChipIds = new Set();
      audioSentenceIndex = 0;
    }
    renderSectionOptions();
    renderSentence();
    renderCheckedVocabReview();
  }

  function applyAudioBatchSection(sectionId, sentencePos = 0) {
    currentSectionId = sectionId;
    sectionSelect.value = sectionId;
    sentenceIndex = sentencePos;
    audioSentenceIndex = sentencePos;
  }

  function renderAudioBatchControls() {
    if (!audioBatchToggleBtn || !audioBatchPickerEl) return;
    audioBatchToggleBtn.parentElement.style.display = currentView === "enAudio" ? "grid" : "none";

    const rangeLabel = activeAudioBatchIndex
      ? getAudioBatchRangeLabel(getAudioBatchSections(activeAudioBatchIndex))
      : "";

    audioBatchToggleBtn.classList.toggle("primary", isAudioBatchPlaying);
    audioBatchToggleBtn.textContent = isAudioBatchPlaying
      ? `5連続: ${activeAudioBatchIndex}${rangeLabel ? ` (${rangeLabel})` : ""}`
      : "5連続";

    audioBatchPickerEl.classList.toggle("is-hidden", !isAudioBatchMenuOpen);
    audioBatchOptionEls.forEach((btn) => {
      const idx = Number(btn.dataset.batchIndex);
      const sectionIds = getAudioBatchSections(idx);
      const rangeStart = String((idx - 1) * 5 + 1).padStart(2, "0");
      const rangeEnd = String(idx * 5).padStart(2, "0");
      btn.textContent = `${idx}`;
      btn.title = `Section ${rangeStart}-${rangeEnd}`;
      btn.disabled = sectionIds.length === 0;
      btn.classList.toggle("primary", idx === activeAudioBatchIndex);
    });
  }

  function playAudioFile(src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audioElement = audio;

      const cleanup = () => {
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("pause", onPauseOrPlay);
        audio.removeEventListener("play", onPauseOrPlay);
        if (audioElement === audio) audioElement = null;
        renderAudioPauseButton();
      };

      const onEnded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error(`Audio playback failed: ${src}`));
      };

      const onPauseOrPlay = () => {
        if (currentView === "enAudio" || currentView === "jpAudio") {
          renderAudioView();
          return;
        }
        renderAudioPauseButton();
      };

      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("pause", onPauseOrPlay);
      audio.addEventListener("play", onPauseOrPlay);
      renderAudioPauseButton();
      audio.play().catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  function renderSectionOptions() {
    const ids = getSectionIds();
    if (ids.length === 0) {
      sectionSelect.innerHTML = `<option value="">(no sections loaded)</option>`;
      return;
    }
    sectionSelect.innerHTML = ids
      .map((id) => {
        const title = window.SECTIONS[id]?.title || id;
        const selected = id === currentSectionId ? "selected" : "";
        return `<option value="${id}" ${selected}>${title}</option>`;
      })
      .join("");
  }

  // ---- Sentences ----
  function renderSentence() {
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) {
      sidEl.textContent = "—";
      progressEl.textContent = "0 / 0";
      englishEl.textContent = "No sentences.";
      japaneseEl.textContent = "";
      sentenceVocabCard.classList.add("is-hidden");
      vocabChipsEl.innerHTML = "";
      expandedSentenceChipIds = new Set();
      return;
    }

    sentenceIndex = clampInt(sentenceIndex, 0, sec.sentences.length - 1, 0);
    const s = sec.sentences[sentenceIndex];

    sidEl.textContent = s.sid;
    progressEl.textContent = `${sentenceIndex + 1} / ${sec.sentences.length}`;
    englishEl.textContent = s.english;
    japaneseEl.textContent = s.japanese;
    japaneseEl.classList.toggle("is-hidden", sentenceRevealStage === 0);
    sentenceVocabCard.classList.toggle("is-hidden", sentenceRevealStage === 0);

    const vocabMap = new Map((sec.vocab || []).map((v) => [v.vid, v]));
    const refs = s.vocabRefs || [];
    const orderedRefs = refs.slice().sort((a, b) => {
      const aExpanded = expandedSentenceChipIds.has(a) ? 1 : 0;
      const bExpanded = expandedSentenceChipIds.has(b) ? 1 : 0;
      return bExpanded - aExpanded;
    });
    vocabChipsEl.innerHTML = orderedRefs
      .map((vid) => {
        const v = vocabMap.get(vid);
        if (!v) return `<div class="chip"><div class="chip-word">${escapeHtml(vid)}</div><div class="chip-meaning">(not found)</div></div>`;
        return renderSentenceVocabChip(v, expandedSentenceChipIds.has(v.vid));
      })
      .join("");

    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function getNextSectionId(sectionId = currentSectionId) {
    const ids = getSectionIds();
    const index = ids.indexOf(sectionId);
    if (index === -1 || ids.length === 0) return sectionId;
    return ids[(index + 1) % ids.length];
  }

  function moveSentence(delta) {
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) return;

    if (delta > 0 && sentenceIndex >= sec.sentences.length - 1) {
      const nextSectionId = getNextSectionId();
      currentSectionId = nextSectionId;
      sectionSelect.value = nextSectionId;
      sentenceIndex = 0;
      audioSentenceIndex = 0;
      sentenceRevealStage = 0;
      expandedSentenceChipIds = new Set();
      renderSectionOptions();
      renderSentence();
      checkedVocabReviewIndex = 0;
      checkedVocabRevealStage = 0;
      renderCheckedVocabReview();
      scheduleSave();
      return;
    }

    if (delta < 0 && sentenceIndex <= 0) {
      sentenceIndex = 0;
      audioSentenceIndex = 0;
      sentenceRevealStage = 0;
      expandedSentenceChipIds = new Set();
      renderSentence();
      scheduleSave();
      return;
    }

    sentenceIndex = Math.max(0, sentenceIndex + delta);
    audioSentenceIndex = sentenceIndex;
    sentenceRevealStage = 0;
    expandedSentenceChipIds = new Set();
    renderSentence();
    scheduleSave();
  }

  function advanceSentenceReveal() {
    if (sentenceRevealStage === 0) {
      sentenceRevealStage = 1;
      renderSentence();
      scheduleSave();
      return;
    }
    moveSentence(1);
  }

  function playSentenceEnglishSlow() {
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) return;
    const sentence = sec.sentences[sentenceIndex];
    stopAudioPlayback();
    playAudioFile(getAudioPath(sentence, "en-female-slow")).catch((error) => {
      console.error(error);
    });
  }

  function getSentenceVocab(sentence, sec) {
    const vocabMap = new Map((sec.vocab || []).map((v) => [v.vid, v]));
    return (sentence.vocabRefs || [])
      .map((vid) => vocabMap.get(vid))
      .filter(Boolean);
  }

  function renderAudioReveal(sentence, sec) {
    audioRevealAreaEl.innerHTML = "";
    audioRevealAreaEl.classList.remove("is-empty");

    const vocabItems = getSentenceVocab(sentence, sec);
    const appendVocabChips = () => {
      const chips = document.createElement("div");
      chips.className = "chips";
      chips.innerHTML = vocabItems.length
        ? vocabItems.map((v) => renderVocabChip(v)).join("")
        : `<div class="chip"><div class="chip-word">(未登録)</div><div class="chip-meaning">この文の重要語リストは未登録です。</div></div>`;
      audioRevealAreaEl.appendChild(chips);
    };

    if (currentView === "enAudio") {
      if (audioRevealStage === 0) {
        audioRevealAreaEl.classList.add("is-empty");
        audioRevealAreaEl.textContent = "タップで 単語のみ → 英文 + 単語 → 英文 + 日本語訳 + 単語 を切り替えます。";
        return;
      }
      if (audioRevealStage === 1) {
        appendVocabChips();
        return;
      }
      if (audioRevealStage === 2) {
        const en = document.createElement("div");
        en.className = "english";
        en.textContent = sentence.english;
        audioRevealAreaEl.appendChild(en);
        appendVocabChips();
        return;
      }

      const en = document.createElement("div");
      en.className = "english";
      en.textContent = sentence.english;
      audioRevealAreaEl.appendChild(en);

      const jp = document.createElement("div");
      jp.className = "japanese";
      jp.textContent = sentence.japanese;
      audioRevealAreaEl.appendChild(jp);
      appendVocabChips();
      return;
    }

    if (audioRevealStage === 0) {
      audioRevealAreaEl.classList.add("is-empty");
      audioRevealAreaEl.textContent = "タップで 単語のみ → 例文 + 日本語 + 単語 を切り替えます。";
      return;
    }
    if (audioRevealStage === 1) {
      appendVocabChips();
      return;
    }

    if (audioRevealStage === 2) {
      const en = document.createElement("div");
      en.className = "english";
      en.textContent = sentence.english;
      audioRevealAreaEl.appendChild(en);

      const jp = document.createElement("div");
      jp.className = "japanese";
      jp.textContent = sentence.japanese;
      audioRevealAreaEl.appendChild(jp);

      appendVocabChips();
    }
  }

  function renderAudioView() {
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) {
      audioSidEl.textContent = "—";
      audioProgressEl.textContent = "0 / 0";
      audioModeTitleEl.textContent = currentView === "enAudio" ? "英語音声" : "日本語音声";
      audioHintEl.textContent = "";
      audioRevealAreaEl.textContent = "No audio sentences.";
      audioStatusEl.textContent = "";
      renderAudioPauseButton();
      return;
    }

    audioSentenceIndex = ((audioSentenceIndex % sec.sentences.length) + sec.sentences.length) % sec.sentences.length;
    const sentence = sec.sentences[audioSentenceIndex];

    audioSidEl.textContent = sentence.sid;
    audioProgressEl.textContent = `${audioSentenceIndex + 1} / ${sec.sentences.length}`;
    audioModeTitleEl.textContent = currentView === "enAudio" ? "英語音声" : "日本語音声";
    audioHintEl.textContent = currentView === "enAudio"
      ? "最初から 例文 + 日本語訳 + 単語 を表示します。例文欄タップで表示内容を切り替えられます。5連続で Section をまとめて再生できます。"
      : "最初から 例文 + 日本語 + 単語 を表示します。例文欄タップで表示内容を切り替えられます。";
    if (currentView === "enAudio" && isAudioBatchPlaying) {
      const rangeLabel = getAudioBatchRangeLabel(audioBatchSectionIds);
      audioStatusEl.textContent = `5連続 ${activeAudioBatchIndex} (${rangeLabel}) を再生中: ${audioBatchSectionPos + 1} / ${audioBatchSectionIds.length} セクション`;
    } else {
      audioStatusEl.textContent = currentView === "enAudio"
        ? "連続音声: Female Slow → Female Slow → Male Slow → Male Slow → Female Slow"
        : "次の文へは「次 →」を押して進みます。";
    }
    if (isAudioPaused()) {
      audioStatusEl.textContent += " / 一時停止中";
    }

    renderAudioBatchControls();
    renderAudioPauseButton();
    renderAudioReveal(sentence, sec);
  }

  async function autoplayAudioSentence(startIndex = audioSentenceIndex) {
    if (isAudioBatchPlaying) return;
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) return;

    audioSentenceIndex = ((startIndex % sec.sentences.length) + sec.sentences.length) % sec.sentences.length;
    const sectionId = currentSectionId;
    const playbackToken = ++audioPlaybackToken;
    const sentence = sec.sentences[audioSentenceIndex];
    renderAudioView();
    scheduleSave();

    try {
      if (currentView === "enAudio") {
        await playAudioFile(getAudioPath(sentence, "en-5x", sectionId));
      } else {
        await playAudioFile(getAudioPath(sentence, "jp", sectionId));
      }
      if (playbackToken !== audioPlaybackToken) return;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  function toggleAudioPlayback() {
    if (isAudioPlaying()) {
      audioElement.pause();
      renderAudioView();
      return;
    }

    if (isAudioPaused()) {
      audioElement.play().catch((error) => {
        console.error(error);
      });
      renderAudioView();
      return;
    }

    stopAudioPlayback();
    isAudioBatchMenuOpen = false;
    shouldAutoStartAudio = false;
    renderAudioBatchControls();
    autoplayAudioSentence(audioSentenceIndex);
  }

  function moveAudioSentence(delta) {
    const sec = getCurrentSection();
    if (!sec?.sentences?.length) return;
    audioSentenceIndex = (audioSentenceIndex + delta + sec.sentences.length) % sec.sentences.length;
    audioRevealStage = getDefaultAudioRevealStage();
    stopAudioPlayback();
    isAudioBatchMenuOpen = false;
    shouldAutoStartAudio = false;
    renderAudioView();
    autoplayAudioSentence(audioSentenceIndex);
  }

  async function autoplayAudioBatch(batchIndex) {
    const { sectionIds, playlist } = buildAudioBatchPlaylist(batchIndex);
    if (!sectionIds.length || !playlist.length) return;

    const playbackToken = ++audioPlaybackToken;
    isAudioBatchPlaying = true;
    activeAudioBatchIndex = batchIndex;
    audioBatchSectionIds = sectionIds.slice();
    audioBatchSectionPos = 0;
    isAudioBatchMenuOpen = false;

    for (let i = 0; i < playlist.length; i += 1) {
      if (playbackToken !== audioPlaybackToken) return;

      const item = playlist[i];
      const { sectionId, sectionPos, sentence, sentencePos } = item;

      if (currentSectionId !== sectionId || audioBatchSectionPos !== sectionPos) {
        audioBatchSectionPos = sectionPos;
        applyAudioBatchSection(sectionId, 0);
      }

      sentenceIndex = sentencePos;
      audioSentenceIndex = sentencePos;
      audioRevealStage = getDefaultAudioRevealStage();
      renderAudioView();
      scheduleSave();

      try {
        await playAudioFile(getAudioPath(sentence, "en-5x", sectionId));
      } catch (error) {
        console.error(error);
        resetAudioBatchState();
        renderAudioView();
        return;
      }
    }

    if (playbackToken !== audioPlaybackToken) return;
    resetAudioBatchState();
    renderAudioView();
    scheduleSave();
  }

  // ---- Vocab UI helpers ----
  function hideAnswerBox() {
    vocabAnswerBox.style.display = "none";
  }

  function showAnswerBox() {
    vocabAnswerBox.style.display = "block";
  }

  function renderCheckedVocabCard(item, isExpanded = false) {
    const vocab = item?.vocab;
    if (!vocab) return "";

    const state = getChipState(vocab.vid);
    const ipa = vocab.ipa ? `<div class="chip-ipa">${escapeHtml(vocab.ipa)}</div>` : "";
    const meaning = vocab.meaning ? `<div class="chip-meaning">${escapeHtml(vocab.meaning)}</div>` : "";

    if (!isExpanded) {
      return `
        <div class="chip sentence-chip vocab-review-card${state.checked ? " is-checked" : ""}" data-vid="${escapeHtml(vocab.vid)}">
          <div class="chip-main">
            <div class="chip-word">${escapeHtml(vocab.word)}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="chip sentence-chip sentence-chip-expanded vocab-review-card${state.checked ? " is-checked" : ""}" data-vid="${escapeHtml(vocab.vid)}">
        <div class="chip-main">
          <div class="chip-word">${escapeHtml(vocab.word)}</div>
          ${ipa}
          ${meaning}
        </div>
        <div class="chip-extra">${renderChipExtraInfo(getChipExtraInfo(vocab))}</div>
        <div class="chip-check-cell">
          <label class="chip-check-row">
            <input type="checkbox" class="chip-check vocab-review-check" data-vid="${escapeHtml(vocab.vid)}" ${state.checked ? "checked" : ""} />
            <span>チェック</span>
          </label>
        </div>
      </div>
    `;
  }

  function renderCheckedVocabReview() {
    const { items, item } = getCurrentCheckedVocabItem();

    if (vocabCheckAllBtn) vocabCheckAllBtn.disabled = false;
    if (vocabUncheckAllBtn) vocabUncheckAllBtn.disabled = items.length === 0;

    if (vocabPromptTitleEl) vocabPromptTitleEl.textContent = "チェック済み単語";
    if (vocabAnswerTitleEl) {
      vocabAnswerTitleEl.textContent = "例文と訳";
    }

    if (vocabPrevBtn?.parentElement) vocabPrevBtn.parentElement.style.display = "none";
    if (vocabInputEl?.parentElement) vocabInputEl.parentElement.style.display = "none";
    if (mcqBox) mcqBox.style.display = "none";

    if (!item) {
      vocabIdEl.textContent = "—";
      vocabProgressEl.textContent = "0 / 0";
      vocabMeaningEl.innerHTML = `<div class="vocab-empty">チェックされた単語はありません</div>`;
      vocabFeedbackEl.textContent = "";
      vocabAnswerEl.textContent = "";
      vocabIpaEl.textContent = "";
      vocabExtraEl.textContent = "";
      vocabIpaEl.classList.add("vocab-translation");
      hideAnswerBox();
      scheduleSave();
      return;
    }

    vocabIdEl.textContent = item.vocab.vid;
    vocabProgressEl.textContent = `${checkedVocabReviewIndex + 1} / ${items.length}`;
    vocabMeaningEl.innerHTML = renderCheckedVocabCard(item, checkedVocabRevealStage === 1);
    vocabFeedbackEl.textContent = checkedVocabRevealStage === 0
      ? "タップで訳・情報・例文と訳を表示します。"
      : "もう一度タップするとチェックを外して次の単語を表示します。";

    if (checkedVocabRevealStage === 0) {
      vocabAnswerEl.textContent = "";
      vocabIpaEl.textContent = "";
      vocabExtraEl.textContent = "";
      vocabIpaEl.classList.add("vocab-translation");
      hideAnswerBox();
      scheduleSave();
      return;
    }

    const sentence = item.sentence;
    showAnswerBox();
    vocabAnswerEl.textContent = sentence?.english || "この単語の例文は未登録です。";
    vocabIpaEl.classList.add("vocab-translation");
    vocabIpaEl.textContent = sentence?.japanese || "";
    vocabExtraEl.textContent = sentence ? `${item.sectionId} / ${sentence.sid}` : item.sectionId;
    scheduleSave();
  }

  function advanceCheckedVocabReview() {
    const { item } = getCurrentCheckedVocabItem();
    if (!item) {
      renderCheckedVocabReview();
      return;
    }

    if (checkedVocabRevealStage === 0) {
      checkedVocabRevealStage = 1;
      renderCheckedVocabReview();
      return;
    }

    setChipChecked(item.vocab.vid, false);
    checkedVocabRevealStage = 0;
    renderCheckedVocabReview();
  }

  // ---- Vocab loop controls ----
  function initVocabCycle(list) {
    queue = list.map((_, i) => i);
    queuePos = 0;
    wrongSet = new Set();
    roundNo = 1;
  }

  function startNextRound(list) {
    if (wrongSet.size > 0) {
      queue = Array.from(wrongSet);
      wrongSet = new Set();
      queuePos = 0;
      roundNo += 1;
      mcqHintEl && (mcqHintEl.textContent = `復習ラウンド ${roundNo}：${queue.length}問`);
      vocabFeedbackEl.textContent = `復習ラウンド ${roundNo}：${queue.length}問`;
    } else {
      initVocabCycle(list);
      mcqHintEl && (mcqHintEl.textContent = "全問正解！最初からもう一周");
      vocabFeedbackEl.textContent = "全問正解！最初からもう一周";
    }
    scheduleSave();
  }

  function scheduleAdvance(list) {
    clearAutoTimer();
    autoNextTimer = setTimeout(() => {
      queuePos += 1;
      if (queuePos >= queue.length) {
        startNextRound(list);
      }
      renderVocabQuestion();
      if (!mcqMode) focusVocabInput();
      scheduleSave();
    }, AUTO_NEXT_DELAY_MS);
  }

  // ---- MCQ: tag-aware distractor selection ----
  function findVocabByWord(list, word) {
    const target = normalizeAnswer(word);
    return list.find((v) => normalizeAnswer(v.word) === target) || null;
  }

  function uniquePoolByWord(vocabs) {
    const seen = new Set();
    const out = [];
    for (const v of vocabs) {
      const key = normalizeAnswer(v.word);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    return out;
  }

  function pickDistractorWords(list, correctVocab, need = 3) {
    const correctN = normalizeAnswer(correctVocab.word);
    const allOthers = list.filter((v) => normalizeAnswer(v.word) !== correctN);

    const tags = Array.isArray(correctVocab.tags) ? correctVocab.tags : [];
    if (tags.length === 0) {
      shuffle(allOthers);
      return allOthers.slice(0, need).map((v) => v.word);
    }

    const patternTags = tags.filter(isPatternTag);
    const headTags = tags.filter(isVerbHeadTag);
    const posTag = tags.find((t) => POS_TAGS.includes(t)) || null;

    // ① 同pattern
    let pool = [];
    if (patternTags.length > 0) {
      pool = pool.concat(allOthers.filter((v) => (v.tags || []).some((t) => patternTags.includes(t))));
    }

    // ② 同verb_head
    if (pool.length < need && headTags.length > 0) {
      pool = pool.concat(allOthers.filter((v) => (v.tags || []).some((t) => headTags.includes(t))));
    }

    // ③ 同POS
    if (pool.length < need && posTag) {
      pool = pool.concat(allOthers.filter((v) => (v.tags || []).includes(posTag)));
    }

    // ④ 補完
    if (pool.length < need) pool = pool.concat(allOthers);

    pool = uniquePoolByWord(pool);
    shuffle(pool);

    const words = [];
    const used = new Set([correctN]);
    for (const v of pool) {
      const wN = normalizeAnswer(v.word);
      if (!wN || used.has(wN)) continue;
      used.add(wN);
      words.push(v.word);
      if (words.length >= need) break;
    }

    if (words.length < need) {
      const more = uniquePoolByWord(allOthers);
      shuffle(more);
      for (const v of more) {
        const wN = normalizeAnswer(v.word);
        if (!wN || used.has(wN)) continue;
        used.add(wN);
        words.push(v.word);
        if (words.length >= need) break;
      }
    }

    return words;
  }

  // ---- MCQ (4 choices) ----
  function renderMcq(list, correctWord) {
    if (!mcqBox) return;

    mcqAnswered = false;

    const correctN = normalizeAnswer(correctWord);
    const correctVocab = findVocabByWord(list, correctWord);

    let wrongWords = [];
    if (correctVocab) {
      wrongWords = pickDistractorWords(list, correctVocab, 3);
    } else {
      const pool = list.map((v) => v.word).filter((w) => normalizeAnswer(w) !== correctN);
      shuffle(pool);
      wrongWords = pool.slice(0, 3);
    }

    const choices = shuffle([correctWord, ...wrongWords]);
    mcqChoicesEl.innerHTML = "";

    choices.forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = w;

      btn.addEventListener("click", () => {
        if (mcqAnswered) return;
        mcqAnswered = true;

        const ok = normalizeAnswer(w) === correctN;

        // 現在の問題（vid）を確実に特定して履歴更新
        const secId = currentSectionId;
        const sec = getCurrentSection();
        const curVocab = sec?.vocab?.[vocabIndex];
        if (curVocab) recordVocabResult(secId, curVocab, ok ? "correct" : "wrong");

        // 答え表示
        showAnswerBox();
        if (curVocab) {
          renderVocabAnswerMeta(curVocab);
        } else {
          vocabAnswerEl.textContent = correctWord;
          vocabIpaEl.textContent = "";
          vocabExtraEl.textContent = "";
        }

        if (ok) {
          mcqHintEl.textContent = "✅ 正解！";
          vocabFeedbackEl.textContent = "✅ 正解！";
        } else {
          mcqHintEl.textContent = `❌ 不正解（正解: ${correctWord}）`;
          vocabFeedbackEl.textContent = `❌ 不正解（正解: ${correctWord}）`;
          wrongSet.add(vocabIndex);
        }

        lockVocabInput();
        scheduleAdvance(list);
        scheduleSave();
      });

      mcqChoicesEl.appendChild(btn);
    });
  }

  // ---- Vocab rendering ----
  function renderVocabQuestion() {
    const sec = getCurrentSection();
    const list = sec?.vocab || [];

    clearAutoTimer();

    if (!list.length) {
      vocabIpaEl.classList.remove("vocab-translation");
      vocabIdEl.textContent = "—";
      vocabProgressEl.textContent = "0 / 0";
      vocabMeaningEl.textContent = "No vocab.";
      vocabInputEl.value = "";
      vocabFeedbackEl.textContent = "";
      vocabAnswerEl.textContent = "";
      vocabIpaEl.textContent = "";
      vocabExtraEl.textContent = "";
      vocabPrevBtn.disabled = true;
      vocabNextBtn.disabled = true;
      vocabRevealBtn.disabled = true;
      showAnswerBox();

      if (mcqBox) {
        mcqChoicesEl.innerHTML = "";
        mcqHintEl.textContent = "";
      }
      return;
    }

    if (queue.length === 0) initVocabCycle(list);

    queuePos = clampInt(queuePos, 0, Math.max(0, queue.length - 1), 0);
    vocabIndex = queue[queuePos];
    if (!Number.isFinite(vocabIndex) || vocabIndex < 0 || vocabIndex >= list.length) {
      initVocabCycle(list);
      vocabIndex = queue[0];
      queuePos = 0;
    }
    const v = list[vocabIndex];

    revealed = false;
    vocabIpaEl.classList.remove("vocab-translation");
    hideAnswerBox();

    vocabIdEl.textContent = v.vid;
    vocabProgressEl.textContent = `${queuePos + 1} / ${queue.length}`;
    vocabMeaningEl.textContent = v.meaning;

    unlockVocabInput();
    vocabInputEl.value = "";

    const roundText = roundNo > 1 ? `復習ラウンド ${roundNo}：${queue.length}問` : "";
    vocabFeedbackEl.textContent = mcqMode
      ? (roundText || "4択で回答してください")
      : (roundText || "英語を入力して Enter（または答えボタン）");

    vocabAnswerEl.textContent = v.word;
    vocabIpaEl.textContent = "";
    vocabExtraEl.textContent = "";

    vocabPrevBtn.disabled = queuePos === 0;
    vocabNextBtn.disabled = queuePos === queue.length - 1;
    vocabRevealBtn.disabled = false;

    if (mcqBox) {
      mcqBox.style.display = "block";
      if (mcqToggleBtn) mcqToggleBtn.textContent = `4択: ${mcqMode ? "ON" : "OFF"}`;
      mcqHintEl.textContent = mcqMode ? "選んでください" : "";

      if (mcqMode) {
        lockVocabInput();
        renderMcq(list, v.word);
      } else {
        mcqChoicesEl.innerHTML = "";
        mcqHintEl.textContent = "";
        unlockVocabInput();
        focusVocabInput();
      }
    } else {
      unlockVocabInput();
      focusVocabInput();
    }
  }

  // ---- Input mode answer check (meaning -> English) ----
  function checkVocabAnswer() {
    const sec = getCurrentSection();
    const list = sec?.vocab || [];
    if (!list.length) return;

    const v = list[vocabIndex];

    const userRaw = vocabInputEl.value;
    const user = normalizeAnswer(userRaw);
    const correct = normalizeAnswer(v.word);

    function showAnswerWith(msg) {
      revealed = true;
      showAnswerBox();
      renderVocabAnswerMeta(v);
      vocabFeedbackEl.textContent = msg;

      lockVocabInput();
      scheduleAdvance(list);
      scheduleSave();
    }

    // ① 未入力：スキップ（復習へ）→ wrong として履歴記録
    if (!user) {
      wrongSet.add(vocabIndex);
      recordVocabResult(currentSectionId, v, "wrong");
      showAnswerWith("⏭ スキップ（答えを表示）");
      return;
    }

    // 正解
    if (user === correct) {
      recordVocabResult(currentSectionId, v, "correct");
      showAnswerWith("✅ 正解！ 次へ…");
      return;
    }

    // ② 不正解
    wrongSet.add(vocabIndex);
    recordVocabResult(currentSectionId, v, "wrong");
    showAnswerWith(`❌ 不正解（入力: "${userRaw}"）`);
  }

  function revealVocabAnswer() {
    const sec = getCurrentSection();
    const list = sec?.vocab || [];
    if (!list.length) return;

    const v = list[vocabIndex];
    revealed = true;
    showAnswerBox();
    renderVocabAnswerMeta(v);
    vocabFeedbackEl.textContent = "答えを表示しました。";
    if (!mcqMode) focusVocabInput();
    scheduleSave();
    // ※ reveal は履歴カウントしない（「見ただけ」を誤答にしない）
  }

  // ---- View switching ----
  function setView(mode) {
    currentView = mode === "vocab" ? "vocab" : "sentences";
    const isSent = mode === "sentences";
    const isVocab = mode === "vocab";

    tabSentences.classList.toggle("is-active", isSent);
    tabVocab.classList.toggle("is-active", isVocab);

    viewSentences.classList.toggle("is-hidden", !isSent);
    viewVocab.classList.toggle("is-hidden", !isVocab);

    if (isVocab) {
      renderCheckedVocabReview();
    }
    scheduleSave();
  }

  // ---- events ----
  sectionSelect.addEventListener("change", (e) => {
    const id = e.target.value;
    if (!id) return;

    currentSectionId = id;

    sentenceIndex = 0;
    sentenceRevealStage = 0;
    expandedSentenceChipIds = new Set();
    vocabIndex = 0;
    queue = [];
    queuePos = 0;
    wrongSet = new Set();
    roundNo = 1;
    checkedVocabReviewIndex = 0;
    checkedVocabRevealStage = 0;

    unlockVocabInput();
    clearAutoTimer();

    renderSentence();
    renderCheckedVocabReview();

    scheduleSave();
  });

  // sentence controls
  prevBtn.addEventListener("click", () => {
    moveSentence(-1);
  });

  nextBtn.addEventListener("click", () => {
    moveSentence(1);
  });

  [sentenceCard, sentenceVocabCard].forEach((el) => {
    el?.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      advanceSentenceReveal();
    });
  });

  vocabChipsEl.addEventListener("click", (event) => {
    const checkbox = event.target.closest(".chip-check");
    if (checkbox) {
      event.stopPropagation();
      const vid = checkbox.dataset.vid;
      if (!vid) return;
      const wasChecked = !!getChipState(vid).checked;
      if (wasChecked && !checkbox.checked) {
        checkbox.checked = true;
        renderSentence();
        return;
      }
      setChipChecked(vid, checkbox.checked);
      renderSentence();
      if (currentView === "vocab") renderCheckedVocabReview();
      return;
    }

    const chip = event.target.closest(".sentence-chip");
    if (!chip) return;
    event.stopPropagation();
    const vid = chip.dataset.vid;
    if (!vid) return;
    if (getChipState(vid).checked) {
      setChipChecked(vid, false);
      expandedSentenceChipIds.delete(vid);
      renderSentence();
      if (currentView === "vocab") renderCheckedVocabReview();
      return;
    }
    if (expandedSentenceChipIds.has(vid)) expandedSentenceChipIds.delete(vid);
    else expandedSentenceChipIds.add(vid);
    renderSentence();
  });

  // tabs
  tabSentences.addEventListener("click", () => setView("sentences"));
  tabVocab.addEventListener("click", () => setView("vocab"));

  vocabCheckAllBtn?.addEventListener("click", () => {
    setAllChipChecked(true);
    renderSentence();
    renderCheckedVocabReview();
  });

  vocabUncheckAllBtn?.addEventListener("click", () => {
    setAllChipChecked(false);
    renderSentence();
    renderCheckedVocabReview();
  });

  viewVocab.addEventListener("click", (event) => {
    if (currentView !== "vocab") return;
    if (event.target.closest(".chip-check-row")) return;
    if (event.target.closest(".chip-check")) return;
    if (!event.target.closest(".chip") && !event.target.closest("#vocabAnswerBox")) return;
    advanceCheckedVocabReview();
  });

  viewVocab.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".vocab-review-check");
    if (!checkbox) return;

    const vid = checkbox.dataset.vid;
    if (!vid) return;
    const wasChecked = !!getChipState(vid).checked;
    if (wasChecked && !checkbox.checked) {
      checkbox.checked = true;
      renderCheckedVocabReview();
      return;
    }

    const currentVid = getCurrentCheckedVocabItem().item?.vocab?.vid || null;
    setChipChecked(vid, checkbox.checked);

    if (currentVid === vid && !checkbox.checked) {
      checkedVocabRevealStage = 0;
    }
    renderCheckedVocabReview();
  });

  // vocab controls (queuePosで移動)
  vocabPrevBtn.addEventListener("click", () => {
    if (currentView === "vocab") {
      advanceCheckedVocabReview();
      return;
    }
    queuePos -= 1;
    renderVocabQuestion();
    scheduleSave();
  });

  vocabNextBtn.addEventListener("click", () => {
    if (currentView === "vocab") {
      advanceCheckedVocabReview();
      return;
    }
    queuePos += 1;
    renderVocabQuestion();
    scheduleSave();
  });

  vocabRevealBtn.addEventListener("click", () => {
    if (currentView === "vocab") {
      advanceCheckedVocabReview();
      return;
    }
    revealVocabAnswer();
  });

  // MCQ controls (存在する場合のみ)
  if (mcqToggleBtn) {
    mcqToggleBtn.addEventListener("click", () => {
      mcqMode = !mcqMode;
      renderVocabQuestion();
      scheduleSave();
    });
  }

  if (mcqSkipBtn) {
    mcqSkipBtn.addEventListener("click", () => {
      const sec = getCurrentSection();
      const list = sec?.vocab || [];
      if (!list.length) return;

      const v = list[vocabIndex];
      wrongSet.add(vocabIndex);
      recordVocabResult(currentSectionId, v, "wrong");

      mcqHintEl && (mcqHintEl.textContent = "⏭ スキップ（復習へ）");
      lockVocabInput();
      scheduleAdvance(list);
      scheduleSave();
    });
  }

  // input enter (only when MCQ OFF)
  vocabInputEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    if (mcqMode) return;

    if (vocabLocked) {
      e.preventDefault();
      return;
    }

    checkVocabAnswer();
  });

  // --- init ---
  if (!window.SECTIONS || Object.keys(window.SECTIONS).length === 0) {
    console.error("No sections loaded. Include data scripts before js/app.js");
  }

  // 0) stats を読む（先に）
  loadStats();
  loadChipState();

  // 1) state を読む
  loadState();

  // 2) UI描画
  renderSectionOptions();
  renderSentence();
  renderCheckedVocabReview();
  setView(currentView);

  // 3) 初回も保存（互換/壊れ対策）
  scheduleSave();
  scheduleSaveStats();
  scheduleSaveChipState();
})();
