/* ==========================================================================
   BLOSSOM 現在地診断 — script.js

   ★ このファイルの構成
   1. CONFIG      … 差し替え設定（GASのURL、質問文、選択肢、結果文の素材）
                     初心者の方でも、まずこのブロックだけ編集すれば
                     質問や文言を調整できるようにしています。
   2. STATE       … 回答を保持する内部データ
   3. RENDER      … 画面描画
   4. SCORING     … 8軸のスコアリング → ステージ判定（内部処理・非表示）
   5. RESULT TEXT … 診断結果の文章を、回答に応じて組み立てる
   6. SUBMIT      … Google Apps Script（スプレッドシート）への送信
   ========================================================================== */

/* ============================================================
   1. CONFIG（ここを編集すれば内容を差し替えられます）
   ============================================================ */

const CONFIG = {

  // Google Apps ScriptをWebアプリとして公開したときのURLをここに貼り付けます。
  // 詳しい手順は README.md に記載しています。
  GAS_ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbyMSOySvasI4EykGZK3Vpn9PlzOfr86x-9v_81lBv9fdF9nnMOrnRV-nGF0pBNbJMqg/exec",

  // 会員ページへ戻るボタンのリンク先
  MEMBER_PAGE_URL: "https://www.soar-wellness.com/s-projects-basic-2",

  // 「ブレンドを注文する」ボタンのリンク先
  ORDER_PAGE_URL: "https://www.soar-wellness.com/onlineorder-blossomsteam",

  // 13ブレンドの一覧（管理・記録用。将来Wix連携をする際にも使用します）
  BLENDS: [
    { key: "berry",    name: "BERRY" },
    { key: "marie",    name: "MARIE" },
    { key: "mimosa",   name: "MIMOZA" },
    { key: "leaf",     name: "LEAF" },
    { key: "mallow",   name: "MAROU" },
    { key: "violet",   name: "SUMIRE" },
    { key: "mokara",   name: "MOKARA" },
    { key: "onaka",    name: "ONAKA" },
    { key: "kokyuu",   name: "KOKYUU" },
    { key: "pain",     name: "PAIN" },
    { key: "activity", name: "ACTIVITY" },
    { key: "woman",    name: "WOMAN" },
    { key: "skin",     name: "SKIN" },
  ],

  // STAGE3の解放条件で使う「チャクラブレンド」7種（表示・参照用）
  CHAKRA_BLEND_KEYS: ["berry", "marie", "mimosa", "leaf", "mallow", "violet", "mokara"],
};

/* ---- 質問構成（全11問） ---------------------------------- */
/*
  type: "single" … 単一選択
  type: "multi"  … 複数選択
  axis: この質問がどのスコア軸に影響するか（内部判定用。本人には非表示）
*/
const QUESTIONS = [
  {
    id: "q1",
    title: "あなたは、BLOSSOMをサロンでどのように届けていきたいですか。",
    sub: "複数選択できます。今思っていることで大丈夫です。",
    type: "multi",
    axis: "destination",
    options: [
      "今ある施術の満足度を高めたい",
      "お客様の状態に合わせた提案を増やしたい",
      "ホームケア商品として届けたい",
      "季節に合わせた提案をしたい",
      "BLOSSOMをサロンの特徴として育てたい",
      "発信できるテーマを増やしたい",
      "商品購入や継続購入につなげたい",
      "まだ自分に合う活用方法を探している",
    ],
  },
  {
    id: "q2",
    title: "直近1年以内に購入したBLOSSOMブレンドを、当てはまるものすべて選んでください。",
    sub: "500g・200gのSTEAM用ブレンドが対象です（TEAは含みません）。1年以上前に購入したきりで、その後仕入れていないものは含めないでください。複数選択できます。",
    type: "multi",
    axis: "range",
    options: [
      "BERRY", "MARIE", "MIMOZA", "LEAF", "MAROU", "SUMIRE", "MOKARA",
      "ONAKA", "KOKYUU", "PAIN", "ACTIVITY", "WOMAN", "SKIN",
      "まだ把握できていない",
    ],
  },
  {
    id: "q3",
    title: "取り扱っている中で、実際に施術や提案でよく使っているブレンドは何種類ですか。",
    type: "single",
    axis: "activation",
    options: ["1種類", "2〜3種類", "4〜6種類", "7種類以上", "まだ決まった使い方がない"],
  },
  {
    id: "q4",
    title: "BLOSSOMをサロンでどのように活用していますか。",
    sub: "複数選択できます。",
    type: "multi",
    axis: "activation",
    options: [
      "スチーム",
      "ハーブボウル",
      "足湯",
      "ティー",
      "ホームケア商品の提案",
      "既存メニューへの追加",
      "季節限定メニュー",
      "まだ活用方法を整えている途中",
    ],
  },
  {
    id: "q5",
    title: "お客様へBLOSSOMを案内するとき、どのような伝え方をしていますか。",
    type: "single",
    axis: "messaging",
    options: [
      "その日の状態に合わせて提案している",
      "ブレンドごとの違いを伝えている",
      "香りや体験を中心に伝えている",
      "メニューの一部として案内している",
      "聞かれたときに説明している",
      "まだ伝え方を考えている途中",
    ],
  },
  {
    id: "q6",
    title: "最近1か月で、BLOSSOMについてどのくらい発信しましたか。",
    type: "single",
    axis: "sns",
    options: ["週に2回以上", "週に1回程度", "月に1〜2回", "まだ発信できていない", "発信内容を考えている途中"],
  },
  {
    id: "q7",
    title: "現在の発信内容に近いものを選んでください。",
    sub: "複数選択できます。",
    type: "multi",
    axis: "sns",
    options: [
      "施術風景",
      "使用している様子",
      "お客様の感想",
      "ブレンドの紹介",
      "季節に合わせた提案",
      "商品紹介",
      "自分がBLOSSOMを届けたい理由",
      "まだ投稿内容が定まっていない",
    ],
  },
  {
    id: "q8",
    title: "お客様へBLOSSOMの商品やホームケアを提案した経験について教えてください。",
    type: "single",
    axis: "proposal",
    options: [
      "自然に提案できている",
      "必要そうな方にだけ提案している",
      "質問されたときに案内している",
      "提案したいが声のかけ方に迷う",
      "まだ商品提案はしていない",
    ],
  },
  {
    id: "q9",
    title: "BLOSSOMの商品購入について、当てはまるものを選んでください。",
    type: "single",
    axis: "purchase",
    options: [
      "複数のお客様の購入につながっている",
      "購入につながった経験がある",
      "興味を持ってもらった経験がある",
      "案内はしているが購入にはつながっていない",
      "まだ商品案内をしていない",
    ],
  },
  {
    id: "q10",
    title: "購入後や施術後のお客様への関わりについて教えてください。",
    type: "single",
    axis: "retention",
    options: [
      "使用後の感想を聞いている",
      "次回来店時に変化を確認している",
      "別のブレンドも提案している",
      "継続購入の案内をしている",
      "その後の確認まではできていない",
      "これから仕組みを作りたい",
    ],
  },
  {
    id: "q11",
    title: "これからBLOSSOMで、最も広げていきたいことを選んでください。",
    type: "single",
    axis: "nextStep",
    options: [
      "施術で使う機会を増やしたい",
      "お客様に合わせた提案を増やしたい",
      "取扱ブレンドの幅を広げたい",
      "発信を増やしたい",
      "商品購入につなげたい",
      "継続購入につなげたい",
      "BLOSSOMをサロンの特徴として育てたい",
      "まずは自分に合う活用方法を見つけたい",
    ],
  },
];

/* ============================================================
   2. STATE
   ============================================================ */

const state = {
  name: "",
  email: "",
  currentIndex: -1, // -1 = イントロ画面
  answers: {},       // { q1: ["...","..."], q2: "...", ... }
  submitting: false,
  submitted: false,
  resultPayload: null, // 送信用に組み立てた最終データ
};

// 戻るボタンを押しても回答が消えないよう、簡易的にlocalStorageへ退避します。
// （このファイルはWix等の一般Webサイトに配置して使うスタンドアロンの
　//   HTMLファイルのため、ブラウザ標準のlocalStorageを利用しています。）
const STORAGE_KEY = "blossom_checkin_draft_v1";

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: state.name, email: state.email, answers: state.answers,
    }));
  } catch (e) { /* 保存できなくても診断自体は継続できるため無視 */ }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    state.name = draft.name || "";
    state.email = draft.email || "";
    state.answers = draft.answers || {};
  } catch (e) { /* 読み込めなくても最初からで問題ない */ }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

/* ============================================================
   3. RENDER
   ============================================================ */

const el = {
  screens: {
    intro: document.getElementById("screen-intro"),
    question: document.getElementById("screen-question"),
    loading: document.getElementById("screen-loading"),
    result: document.getElementById("screen-result"),
  },
  progressWrap: document.getElementById("progressWrap"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),

  inputName: document.getElementById("inputName"),
  inputEmail: document.getElementById("inputEmail"),
  errName: document.getElementById("errName"),
  errEmail: document.getElementById("errEmail"),
  btnStart: document.getElementById("btnStart"),

  qTitle: document.getElementById("qTitle"),
  qSub: document.getElementById("qSub"),
  qOptions: document.getElementById("qOptions"),
  btnBack: document.getElementById("btnBack"),
  btnNext: document.getElementById("btnNext"),

  growthIndicator: document.getElementById("growthIndicator"),
  resultStageLabel: document.getElementById("resultStageLabel"),
  resultStageNote: document.getElementById("resultStageNote"),
  resultIntro: document.getElementById("resultIntro"),
  resultCan: document.getElementById("resultCan"),
  resultGrow: document.getElementById("resultGrow"),
  resultActions: document.getElementById("resultActions"),
  resultProductNote: document.getElementById("resultProductNote"),
  btnOrder: document.getElementById("btnOrder"),
  btnRestart: document.getElementById("btnRestart"),
  btnBackToMember: document.getElementById("btnBackToMember"),
};

function showScreen(name) {
  Object.entries(el.screens).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
  el.progressWrap.hidden = name !== "question";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderIntro() {
  el.inputName.value = state.name;
  el.inputEmail.value = state.email;
  showScreen("intro");
}

function renderProgress() {
  const total = QUESTIONS.length;
  const current = state.currentIndex + 1;
  el.progressText.textContent = `質問 ${current} / ${total}`;
  el.progressFill.style.width = `${(current / total) * 100}%`;
}

function renderQuestion() {
  const q = QUESTIONS[state.currentIndex];
  el.qTitle.textContent = q.title;
  el.qSub.textContent = q.sub || (q.type === "multi" ? "複数選択できます。" : "");
  el.qSub.style.display = q.sub || q.type === "multi" ? "block" : "none";

  el.qOptions.innerHTML = "";
  const current = state.answers[q.id];

  q.options.forEach((optionText) => {
    const isSelected = q.type === "multi"
      ? Array.isArray(current) && current.includes(optionText)
      : current === optionText;

    const optionEl = document.createElement("div");
    optionEl.className = `option type-${q.type}${isSelected ? " selected" : ""}`;
    optionEl.setAttribute("role", "button");
    optionEl.tabIndex = 0;

    const marker = document.createElement("span");
    marker.className = "marker";
    marker.textContent = isSelected ? "✓" : "";

    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = optionText;

    optionEl.appendChild(marker);
    optionEl.appendChild(text);

    const handleSelect = () => selectOption(q, optionText);
    optionEl.addEventListener("click", handleSelect);
    optionEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(); }
    });

    el.qOptions.appendChild(optionEl);
  });

  el.btnBack.style.visibility = state.currentIndex === 0 ? "hidden" : "visible";
  el.btnNext.textContent = state.currentIndex === QUESTIONS.length - 1 ? "診断結果を見る →" : "次へ →";

  renderProgress();
  showScreen("question");
}

function selectOption(q, optionText) {
  if (q.type === "multi") {
    const current = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
    const idx = current.indexOf(optionText);
    if (idx >= 0) current.splice(idx, 1); else current.push(optionText);
    state.answers[q.id] = current;
  } else {
    state.answers[q.id] = optionText;
  }
  saveDraft();
  renderQuestion();
}

function hasAnswer(q) {
  const v = state.answers[q.id];
  if (q.type === "multi") return Array.isArray(v) && v.length > 0;
  return typeof v === "string" && v.length > 0;
}

/* ---- ナビゲーション ---- */
el.btnStart.addEventListener("click", () => {
  const name = el.inputName.value.trim();
  const email = el.inputEmail.value.trim();
  let valid = true;

  el.errName.hidden = true;
  el.errEmail.hidden = true;

  if (!name) { el.errName.hidden = false; valid = false; }
  if (!isValidEmail(email)) { el.errEmail.hidden = false; valid = false; }
  if (!valid) return;

  state.name = name;
  state.email = email;
  saveDraft();

  state.currentIndex = 0;
  renderQuestion();
});

el.btnNext.addEventListener("click", () => {
  const q = QUESTIONS[state.currentIndex];
  if (!hasAnswer(q)) {
    // 未回答の場合はやさしく促す（専門用語や強い表現は使わない）
    el.qTitle.style.color = "var(--color-error)";
    setTimeout(() => { el.qTitle.style.color = ""; }, 700);
    return;
  }
  if (state.currentIndex < QUESTIONS.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
  } else {
    submitDiagnosis();
  }
});

el.btnBack.addEventListener("click", () => {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    renderQuestion();
  } else {
    state.currentIndex = -1;
    renderIntro();
  }
});

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ============================================================
   4. SCORING（内部処理・本人には点数を表示しません）
   ============================================================ */

/*
  各軸を 0〜3 の内部レベルに変換します。
  この数値そのものは画面に一切表示せず、
  「ステージ」と「文章の分岐」だけに使用します。
*/
function computeAxisLevels(answers) {
  const levels = {};

  // 目的地の明確さ：選択数が多いほど、方向性を具体的に考えられている
  const destination = answers.q1 || [];
  levels.destination = destination.includes("まだ自分に合う活用方法を探している") && destination.length === 1
    ? 0 : Math.min(3, Math.ceil(destination.length / 2));

  // 取扱ブレンドの広がり
  const purchasedBlends = (answers.q2 || []).filter(v => v !== "まだ把握できていない");
  const purchasedCount = purchasedBlends.length;
  levels.range = purchasedCount === 0 ? 0 : purchasedCount <= 3 ? 1 : purchasedCount <= 6 ? 2 : 3;

  // STAGE3の解放条件と同じ「チャクラブレンド7種」をすべて保有しているか（内部の目安表示にのみ使用）
  const ownsChakraBlends = CONFIG.CHAKRA_BLEND_KEYS.every((key) => {
    const blend = CONFIG.BLENDS.find((b) => b.key === key);
    return blend && purchasedBlends.includes(blend.name);
  });
  levels.ownsChakraBlends = ownsChakraBlends;

  // 実際の活用状況（実活用ブレンド数 ＋ 活用シーンの多さ）
  const activationCountMap = { "1種類": 1, "2〜3種類": 2, "4〜6種類": 3, "7種類以上": 3, "まだ決まった使い方がない": 0 };
  const activationScenes = (answers.q4 || []).filter(v => v !== "まだ活用方法を整えている途中").length;
  levels.activation = Math.round(((activationCountMap[answers.q3] ?? 0) + Math.min(3, activationScenes)) / 2);

  // 伝え方
  const messagingMap = {
    "その日の状態に合わせて提案している": 3,
    "ブレンドごとの違いを伝えている": 2,
    "香りや体験を中心に伝えている": 2,
    "メニューの一部として案内している": 1,
    "聞かれたときに説明している": 1,
    "まだ伝え方を考えている途中": 0,
  };
  levels.messaging = messagingMap[answers.q5] ?? 0;

  // 発信（頻度 ＋ 内容の幅）
  const snsFreqMap = { "週に2回以上": 3, "週に1回程度": 2, "月に1〜2回": 1, "まだ発信できていない": 0, "発信内容を考えている途中": 0 };
  const snsContentCount = (answers.q7 || []).filter(v => v !== "まだ投稿内容が定まっていない").length;
  levels.sns = Math.round(((snsFreqMap[answers.q6] ?? 0) + Math.min(3, snsContentCount)) / 2);

  // 個別提案
  const proposalMap = {
    "自然に提案できている": 3,
    "必要そうな方にだけ提案している": 2,
    "質問されたときに案内している": 1,
    "提案したいが声のかけ方に迷う": 1,
    "まだ商品提案はしていない": 0,
  };
  levels.proposal = proposalMap[answers.q8] ?? 0;

  // 商品購入
  const purchaseMap = {
    "複数のお客様の購入につながっている": 3,
    "購入につながった経験がある": 2,
    "興味を持ってもらった経験がある": 1,
    "案内はしているが購入にはつながっていない": 1,
    "まだ商品案内をしていない": 0,
  };
  levels.purchase = purchaseMap[answers.q9] ?? 0;

  // 継続購入・再提案
  const retentionMap = {
    "使用後の感想を聞いている": 1,
    "次回来店時に変化を確認している": 2,
    "別のブレンドも提案している": 3,
    "継続購入の案内をしている": 3,
    "その後の確認まではできていない": 0,
    "これから仕組みを作りたい": 0,
  };
  levels.retention = retentionMap[answers.q10] ?? 0;

  return levels;
}

/*
  ステージ判定：
  ブレンド数だけで決めず、活用・発信・提案・購入・継続を総合して判定します。
  （※ Wix購入履歴との照合による正式な判定
     ・STAGE2：有効ブレンド数7種類以上 ＋ 活動条件達成
     ・STAGE3：チャクラブレンド7種（BERRY/MARIE/MIMOZA/LEAF/MAROU/SUMIRE/MOKARA）保有 ＋ 活動条件達成
     は、運営者が管理シート上で確定させる運用としています。README参照）
*/
function determineStage(levels) {
  const coreAvg = (levels.activation + levels.messaging + levels.sns + levels.proposal + levels.purchase + levels.retention) / 6;
  const total = coreAvg + (levels.destination >= 2 ? 0.5 : 0) + (levels.range >= 2 ? 0.3 : 0);

  // 内部的な「次のステージまでの近さ」も同時に計算（本人には数値非表示、成長アイコンにのみ反映）
  let stage = 1;
  let proximity = 0; // 0〜1：次のステージまでの距離感（成長アイコンの段階に使用）

  if (total >= 2.3 && levels.sns >= 2 && levels.purchase >= 2 && levels.retention >= 2 && levels.ownsChakraBlends) {
    stage = 3;
    proximity = 1;
  } else if (total >= 1.4) {
    stage = 2;
    proximity = Math.min(1, (total - 1.4) / 0.9);
  } else {
    stage = 1;
    proximity = Math.min(1, total / 1.4);
  }

  return { stage, proximity, coreAvg, total };
}

/*
  成長アイコンの段階（種・芽・葉・つぼみ・開花）
  0=種 1=芽 2=葉 3=つぼみ 4=開花
*/
function determineGrowthStep(stageResult) {
  const { stage, proximity } = stageResult;
  if (stage === 3) return 4; // 開花
  if (stage === 2) return proximity >= 0.7 ? 3 : 2; // つぼみ or 葉
  // stage === 1
  return proximity >= 0.6 ? 2 : (proximity >= 0.25 ? 1 : 0); // 葉 / 芽 / 種
}

/* ============================================================
   5. RESULT TEXT（回答に応じて文章を組み立てる）
   ============================================================ */

const STAGE_META = {
  1: {
    label: "STAGE 1｜基礎を整える",
    note: "BLOSSOMを届けるサロンが、まず最初に通る土台づくりの段階です。ここでの積み重ねが、次の提案の幅につながっていきます。",
  },
  2: {
    label: "STAGE 2｜提案の幅を広げる",
    note: "基礎の段階で育ててきたものを、実際の提案や発信の中でさらに広げていく段階です。",
  },
  3: {
    label: "STAGE 3｜選ばれるサロンへ",
    note: "これまで積み重ねてきた活動が実を結び、発信・提案・購入・継続が循環し始めている段階です。",
  },
};

function buildResult(answers) {
  const levels = computeAxisLevels(answers);
  const stageResult = determineStage(levels);
  const growthStep = determineGrowthStep(stageResult);

  const intro = buildIntroText(answers, levels, stageResult);
  const canList = buildCanDoList(answers, levels);
  const growText = buildGrowText(answers, levels, stageResult);
  const actions = buildActions(answers, levels, stageResult);
  const productNote = buildProductNote(answers, levels);

  return {
    stage: stageResult.stage,
    stageLabel: STAGE_META[stageResult.stage].label,
    stageNote: STAGE_META[stageResult.stage].note,
    growthStep,
    introHtml: intro,
    canList,
    growHtml: growText,
    actions,
    productNote,
    levels,
    stageResultRaw: stageResult,
  };
}

// ---- 肯定から始まる導入文 ----
function buildIntroText(answers, levels, stageResult) {
  const paragraphs = [];

  if (levels.activation >= 2) {
    paragraphs.push("すでにBLOSSOMを施術に取り入れ、お客様へ届ける土台ができています。");
  } else if (levels.activation >= 1) {
    paragraphs.push("今あるブレンドを大切に使いながら、BLOSSOMの届け方を育てている段階です。");
  } else {
    paragraphs.push("BLOSSOMをどう届けていきたいか、その方向性を今まさに見つけようとしている段階です。");
  }

  if (levels.destination >= 2) {
    paragraphs.push("お客様に合わせてBLOSSOMを選びたいという、あなたの方向性が見えてきています。");
  }

  // ステージの近さに応じた前向きな一言（STAGE2解放の詳細な数値は出さない）
  const { stage, proximity } = stageResult;
  if (stage === 1 && proximity >= 0.55) {
    paragraphs.push("ここまで少しずつ育ててきた活動が、次の段階につながろうとしています。");
  } else if (stage === 2 && proximity >= 0.7) {
    paragraphs.push("提案の土台が整い、次のステージが見えてきています。今ある経験を活かしながら、あと一歩届け方を広げていきましょう。");
  } else if (stage === 3) {
    paragraphs.push("発信・提案・購入・継続が少しずつ循環し始めている、うれしい段階です。");
  }

  return paragraphs.map(p => `<p>${p}</p>`).join("");
}

// ---- すでにできていることリスト ----
function buildCanDoList(answers, levels) {
  const items = [];

  if (levels.activation >= 1) items.push("BLOSSOMを実際の施術や提案の中で動かせています。");
  if (levels.messaging >= 2) items.push("お客様の状態や体験に寄り添った伝え方ができています。");
  if (levels.sns >= 2) items.push("BLOSSOMについての発信を、継続的に続けられています。");
  if (levels.sns === 1) items.push("BLOSSOMについての発信を、少しずつ始められています。");
  if (levels.proposal >= 2) items.push("お客様への商品提案を、自然な流れの中で行えています。");
  if (levels.purchase >= 1) items.push("BLOSSOMの商品購入につながった経験があります。");
  if (levels.retention >= 2) items.push("購入後や施術後も、お客様との関わりを続けられています。");
  if ((answers.q1 || []).length >= 2) items.push("BLOSSOMをどう届けたいか、複数の視点から考えられています。");

  if (items.length === 0) {
    items.push("BLOSSOMをサロンへ取り入れ、この診断を通してご自身の現在地と向き合われていること自体が、次への大切な一歩です。");
  }

  return items;
}

// ---- 「どう育てていけそうか」段落 ----
function buildGrowText(answers, levels, stageResult) {
  const parts = [];

  // 取扱ブレンド数についてのコメント（禁止表現を避け、多さ＝上位ステージにしない）
  if (levels.range <= 1) {
    parts.push("<p>まずは今あるブレンドを、自信を持って届けるところから始められます。BLOSSOMの真価は、お客様お一人お一人の状態や気分に合わせて選べる幅にあります。取り扱う選択肢を少しずつ広げていくことは、価格だけに頼らない、BLOSSOMならではの提案ができるサロンへ育っていくための土台になります。よく相談されるお悩みや、これから届けたい体験から、次に加えるブレンドを考えてみましょう。</p>");
  } else {
    parts.push("<p>すでに複数の選択肢を持っています。これからは、一つひとつのブレンドがどんなお客様に届いたのかを発信や再提案につなげることで、取扱いがさらに活きてきます。</p>");
  }

  // STAGE1で「幅」も「活用」もこれから、という段階には、
  // 「選択肢を広げる」ことと「実際に動かす」ことの両方が揃って初めて
  // BLOSSOMの強みが活きる、という考え方をやさしく伝える
  if (stageResult.stage === 1 && levels.range <= 1 && levels.activation <= 1) {
    parts.push("<p>選択肢を広げることと、実際の施術や提案で動かしていくこと。この両方が揃うことで、BLOSSOMがサロンの個性として伝わり、他にはない価値としてお客様に選ばれていきます。どちらか一つではなく、無理のない範囲で少しずつ両方を育てていきましょう。</p>");
  }

  // 発信について
  if (levels.sns <= 1) {
    parts.push("<p>サロンの中ではBLOSSOMが動き始めています。次は、その体験を写真や短い言葉で外へ届けることで、BLOSSOMを知ってもらうきっかけを増やせそうです。</p>");
  }

  // 商品提案・購入について
  if (levels.proposal <= 1 || levels.purchase <= 1) {
    parts.push("<p>施術で感じてもらった心地よさを、ご自宅での過ごし方につなげて伝えることで、商品提案もより自然になりそうです。</p>");
  }

  // 継続について
  if (levels.retention <= 1) {
    parts.push("<p>使用後の感想をたずねる一言を添えることで、次のご提案や継続購入への案内が自然につながっていきそうです。</p>");
  }

  return parts.join("");
}

// ---- 今月のおすすめアクション3つ ----
function buildActions(answers, levels, stageResult) {
  const candidates = [];

  if (levels.destination === 0) candidates.push("BLOSSOMでどんなお客様に、どんな体験を届けたいか、一度ノートに書き出してみましょう。");
  if (levels.activation <= 1) candidates.push("よく使うブレンドを1つ決めて、次回の施術で意識的に取り入れてみましょう。");
  if (levels.messaging <= 1) candidates.push("次にご来店されるお客様に、その日の状態に合わせた一言を添えて案内してみましょう。");
  if (levels.sns <= 1) candidates.push("今週使ったブレンドの写真を1枚、感想と一緒に発信してみましょう。");
  if (levels.sns >= 2 && levels.range >= 2) candidates.push("まだ発信していないブレンドを1つ選び、その魅力を紹介する投稿を作ってみましょう。");
  if (levels.proposal <= 1) candidates.push("「ご自宅でも楽しめますよ」の一言を、施術後の会話に加えてみましょう。");
  if (levels.purchase <= 1 && levels.proposal >= 2) candidates.push("提案した方の反応をメモしておき、次回の会話につなげてみましょう。");
  if (levels.retention <= 1) candidates.push("次回ご来店時に、購入後の使用感をたずねる一言を用意しておきましょう。");
  if (levels.retention >= 2) candidates.push("継続してご利用いただいているお客様に、別のブレンドもご紹介してみましょう。");
  if (levels.range >= 2 && levels.sns <= 1) candidates.push("お気に入りのブレンド1つに絞って、その活用シーンを発信してみましょう。");

  // 重複除去し、上位3つを採用
  const unique = [...new Set(candidates)];
  while (unique.length < 3) {
    unique.push("今無理のない範囲で、ひとつだけ次の一歩を選んで動かしてみましょう。");
  }
  return unique.slice(0, 3);
}

// ---- 200gサイズの案内（条件を満たした場合のみ） ----
function buildProductNote(answers, levels) {
  const wantsMoreProposal = (answers.q1 || []).includes("お客様の状態に合わせた提案を増やしたい");
  const wantsWiderRange = (answers.q1 || []).includes("BLOSSOMをサロンの特徴として育てたい") ||
                           (answers.q11 === "取扱ブレンドの幅を広げたい");
  const strugglesToPropose = answers.q8 === "提案したいが声のかけ方に迷う";
  // 取扱ブレンドがまだ少ない人にも、選択肢を広げる入り口として案内する
  const rangeIsNarrow = levels.range <= 1;

  if (rangeIsNarrow) {
    // 取扱ブレンドが少ないこと自体が主な理由の場合は、
    // 「なぜ選択肢を広げることが大切か」という背景まで伝える、少し踏み込んだ案内にする
    return "取り扱うブレンドの幅が少ないと、発信や口コミでせっかくご来店いただいても、その日のお客様の状態にぴったり合うブレンドが見つからず、体験の満足度が十分に伝わりきらないことがあります。これは気づきにくいことですが、次のご来店やご紹介にも関わってくる大切なポイントです。200gサイズなら、少量から新しいブレンドを取り入れて、施術・発信・提案の中で実際に試しながら、ご自身のサロンに合う取扱いを無理なく育てていくことができます。";
  }

  if (wantsMoreProposal || wantsWiderRange || strugglesToPropose) {
    return "新しいブレンドを取り入れてみたい場合は、200gから少量で試すこともできます。まずは一つ選び、施術・発信・提案の中で動かしながら、ご自身のサロンに合う取扱いを育てていきましょう。";
  }
  return null;
}

/* ---- 成長アイコン（種・芽・葉・つぼみ・開花）の描画 ---- */
const GROWTH_ICONS = [
  // 0: 種
  '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="6" ry="9"/></svg>',
  // 1: 芽
  '<svg viewBox="0 0 24 24"><path d="M12 22V10 M12 10 C8 10 6 7 6 4 C10 4 12 7 12 10 Z"/></svg>',
  // 2: 葉
  '<svg viewBox="0 0 24 24"><path d="M12 22V6 M12 6 C6 6 4 2 4 2 C4 2 4 9 12 10 Z M12 10 C18 10 20 5 20 5 C20 5 19 12 12 13 Z"/></svg>',
  // 3: つぼみ
  '<svg viewBox="0 0 24 24"><path d="M12 22V12 M12 12 C7 12 6 6 8 3 C12 5 13 9 12 12 C13 9 16 5 16 5 C18 8 17 12 12 12 Z"/></svg>',
  // 4: 開花
  '<svg viewBox="0 0 24 24"><path d="M12 22V13 M12 4 C13.5 4 14.5 5.5 12 7 C9.5 5.5 10.5 4 12 4 Z M8 6 C9.5 7 9.5 9 7 9.5 C5.5 8 6 6.3 8 6 Z M16 6 C14.5 7 14.5 9 17 9.5 C18.5 8 18 6.3 16 6 Z M12 8 C13.5 8 15 9.5 12 11.5 C9 9.5 10.5 8 12 8 Z"/></svg>',
];
const GROWTH_LABELS = ["種", "芽", "葉", "つぼみ", "開花"];

function renderGrowthIndicator(step) {
  el.growthIndicator.innerHTML = "";
  GROWTH_ICONS.forEach((svg, i) => {
    const wrap = document.createElement("div");
    wrap.className = "g-icon" + (i <= step ? " active" : "");
    wrap.title = GROWTH_LABELS[i];
    wrap.innerHTML = svg;
    el.growthIndicator.appendChild(wrap);
  });
}

/* ============================================================
   6. 結果画面の描画
   ============================================================ */

function renderResult(result) {
  renderGrowthIndicator(result.growthStep);
  el.resultStageLabel.textContent = result.stageLabel;
  el.resultStageNote.textContent = result.stageNote;
  el.resultIntro.innerHTML = result.introHtml;

  el.resultCan.innerHTML = "";
  result.canList.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    el.resultCan.appendChild(li);
  });

  el.resultGrow.innerHTML = result.growHtml;

  el.resultActions.innerHTML = "";
  result.actions.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    el.resultActions.appendChild(li);
  });

  if (result.productNote) {
    el.resultProductNote.hidden = false;
    el.resultProductNote.innerHTML = `<p>${result.productNote}</p>`;
  } else {
    el.resultProductNote.hidden = true;
  }

  el.btnOrder.href = CONFIG.ORDER_PAGE_URL;
  el.btnBackToMember.href = CONFIG.MEMBER_PAGE_URL;

  showScreen("result");
}

/* ============================================================
   7. SUBMIT（Google Apps Scriptへの送信）
   ============================================================ */

function buildFullResultText(result) {
  // スプレッドシートへ保存する「本人へ表示した診断結果全文」を組み立てる
  const stripHtml = (html) => html.replace(/<[^>]+>/g, "\n").trim();
  return [
    result.stageLabel,
    result.stageNote,
    stripHtml(result.introHtml),
    "【すでにできていること】",
    result.canList.map(t => "・" + t).join("\n"),
    "【育てていけそうなこと】",
    stripHtml(result.growHtml),
    "【今月のおすすめアクション】",
    result.actions.map((t, i) => `${i + 1}. ${t}`).join("\n"),
    result.productNote ? "【200gのご案内】\n" + result.productNote : "",
  ].filter(Boolean).join("\n\n");
}

async function submitDiagnosis() {
  if (state.submitting) return; // 二重送信防止
  state.submitting = true;

  showScreen("loading");

  const result = buildResult(state.answers);
  state.resultPayload = result;

  const payload = {
    timestamp: new Date().toISOString(),
    name: state.name,
    email: state.email,
    answers: state.answers,
    rangeAnswer: Array.isArray(state.answers.q2) ? state.answers.q2.join(" / ") : (state.answers.q2 || ""),
    activationAnswer: state.answers.q3 || "",
    destinationAnswers: state.answers.q1 || [],
    stage: result.stageLabel,
    canList: result.canList,
    actions: result.actions,
    fullResultText: buildFullResultText(result),
  };

  try {
    await postToSheet(payload);
    state.submitted = true;
  } catch (err) {
    // 送信に失敗しても、本人には何も表示しない（診断結果自体は必ず見せる）
    // デバッグ用にコンソールへだけ記録しておく
    console.error("BLOSSOM診断：送信に失敗しました", err);
  }

  state.submitting = false;
  renderResult(result);
  clearDraft();
}

function postToSheet(payload) {
  // GASのWebアプリはCORSの都合上 text/plain で送るのが最も安定します。
  // 個人情報はPOSTボディに含め、URLのクエリパラメータには一切含めません。
  return fetch(CONFIG.GAS_ENDPOINT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) throw new Error("network error");
    return res.json().catch(() => ({}));
  });
}

el.btnRestart.addEventListener("click", () => {
  state.currentIndex = -1;
  state.answers = {};
  state.name = "";
  state.email = "";
  state.submitted = false;
  state.resultPayload = null;
  clearDraft();
  renderIntro();
});

/* ============================================================
   初期化
   ============================================================ */
loadDraft();
renderIntro();
