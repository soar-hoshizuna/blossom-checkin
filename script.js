/* ==========================================================
   BLOSSOM 現在地診断 — スタイルシート
   色は変更しやすいよう、すべてCSS変数（:root）で管理しています。
   ========================================================== */

:root {
  /* ---- ブランドカラー（ここを変えるだけで全体の色が変わります） ---- */
  --color-bg: #FBF7F1;             /* ページ背景：温かみのあるオフホワイト */
  --color-card: #FFFFFF;           /* カード背景 */
  --color-primary: #B78A6B;        /* メインカラー：テラコッタ系ブラウン */
  --color-primary-dark: #96694C;   /* ホバー時など */
  --color-primary-soft: #F1E4D8;   /* 淡いプライマリ（背景用） */
  --color-accent: #7C8B6F;         /* アクセント：セージグリーン */
  --color-accent-soft: #E7ECE1;    /* 淡いアクセント */
  --color-text: #4A3F35;           /* 本文文字色 */
  --color-text-light: #8A7C6E;     /* サブテキスト */
  --color-border: #E8DDD0;         /* ボーダー */
  --color-error: #B25B4A;

  /* ---- タイポグラフィ ---- */
  --font-serif: 'Noto Serif JP', serif;
  --font-sans: 'Noto Sans JP', sans-serif;

  /* ---- その他 ---- */
  --radius-lg: 22px;
  --radius-md: 14px;
  --radius-sm: 8px;
  --shadow-card: 0 8px 30px rgba(150, 105, 76, 0.08);
  --max-width: 640px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ---------------- 背景の植物モチーフ ---------------- */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.bg-decoration .leaf {
  position: absolute;
  fill: var(--color-accent);
  opacity: 0.06;
}
.leaf-1 { width: 320px; height: 320px; top: -60px; right: -80px; transform: rotate(25deg); }
.leaf-2 { width: 260px; height: 260px; bottom: -60px; left: -80px; transform: rotate(-15deg); }

/* ---------------- レイアウト ---------------- */
.app-shell {
  position: relative;
  z-index: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 32px 20px 60px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
}
.brand-mark {
  display: block;
  font-family: var(--font-serif);
  font-size: 26px;
  letter-spacing: 0.18em;
  color: var(--color-primary-dark);
}
.brand-sub {
  display: block;
  font-size: 12px;
  color: var(--color-text-light);
  letter-spacing: 0.08em;
  margin-top: 4px;
}

/* ---------------- 進行状況バー ---------------- */
.progress-wrap {
  margin-bottom: 22px;
}
.progress-label {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--color-primary-soft);
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
  border-radius: 10px;
  transition: width 0.4s ease;
}

/* ---------------- メイン／カード ---------------- */
.app-main { flex: 1; }

.card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 36px 28px;
  border: 1px solid var(--color-border);
}

@media (max-width: 480px) {
  .card { padding: 26px 18px; border-radius: var(--radius-md); }
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  font-weight: 500;
  margin: 0 0 10px;
}

/* ---------------- イントロ画面 ---------------- */
.intro-title {
  font-family: var(--font-serif);
  font-size: 24px;
  line-height: 1.6;
  color: var(--color-text);
  margin: 0 0 18px;
}
.intro-lead {
  font-size: 14.5px;
  color: var(--color-text-light);
  margin-bottom: 28px;
}

.field-group { margin-bottom: 18px; }
.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--color-text);
}
.field-group input[type="text"],
.field-group input[type="email"] {
  width: 100%;
  padding: 13px 14px;
  font-size: 15px;
  font-family: var(--font-sans);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #FDFBF8;
  color: var(--color-text);
  transition: border-color 0.2s;
}
.field-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: #fff;
}
.field-error {
  color: var(--color-error);
  font-size: 12.5px;
  margin: 6px 0 0;
}

.privacy-note {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 14px;
}

/* ---------------- ボタン ---------------- */
.btn {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 500;
  padding: 14px 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
}
.btn-block { display: block; width: 100%; }
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-primary:disabled {
  background: var(--color-border);
  color: var(--color-text-light);
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
}
.btn-ghost:hover { background: var(--color-primary-soft); }
.btn-outline {
  background: transparent;
  color: var(--color-primary-dark);
  border: 1.5px solid var(--color-primary);
  margin-top: 10px;
}
.btn-outline:hover { background: var(--color-primary-soft); }

/* ---------------- 質問画面 ---------------- */
.question-title {
  font-family: var(--font-serif);
  font-size: 19px;
  line-height: 1.7;
  margin: 0 0 6px;
}
.question-sub {
  font-size: 13px;
  color: var(--color-text-light);
  margin: 0 0 22px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.18s ease;
  background: #FDFBF8;
}
.option:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
.option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
.option .marker {
  flex-shrink: 0;
  width: 20px; height: 20px;
  border: 1.5px solid var(--color-text-light);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 12px;
  transition: all 0.18s ease;
}
.option.type-single .marker { border-radius: 50%; }
.option.type-multi .marker { border-radius: 5px; }
.option.selected .marker {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.option .option-text { font-size: 14.5px; color: var(--color-text); }

.nav-row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}
.nav-row .btn { flex: 1; }

/* ---------------- ローディング ---------------- */
.loading-card {
  text-align: center;
  padding: 60px 28px;
}
.loader { margin: 0 auto 20px; width: 60px; height: 60px; }
.loader svg { width: 100%; height: 100%; animation: spin 1.6s linear infinite; }
.loader circle {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 120 200;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-card p { color: var(--color-text-light); font-size: 14px; }

/* ---------------- 結果画面 ---------------- */
.growth-indicator {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 22px;
}
.growth-indicator .g-icon {
  width: 34px; height: 34px;
  opacity: 0.25;
  transition: opacity 0.3s;
}
.growth-indicator .g-icon.active { opacity: 1; }
.growth-indicator .g-icon svg { width: 100%; height: 100%; fill: var(--color-accent); }

.result-heading {
  font-family: var(--font-serif);
  font-size: 22px;
  margin: 0 0 18px;
}

.stage-note {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.7;
  margin: 0 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--color-border);
}

.result-block { margin-bottom: 26px; font-size: 14.5px; }
.result-block p { margin: 0 0 10px; }
.result-sub-heading {
  font-family: var(--font-serif);
  font-size: 15.5px;
  color: var(--color-primary-dark);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.result-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-list li {
  padding-left: 22px;
  position: relative;
  font-size: 14px;
}
.result-list li::before {
  content: "🌿";
  position: absolute;
  left: 0;
  font-size: 12px;
}

.result-actions {
  margin: 0;
  padding-left: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.result-actions li { font-size: 14px; padding-left: 4px; }

.product-note {
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  padding: 18px;
  font-size: 13.5px;
  color: var(--color-text);
}

.save-status {
  font-size: 12.5px;
  text-align: center;
  color: var(--color-text-light);
  margin-bottom: 16px;
  min-height: 18px;
}
.save-status.error { color: var(--color-error); }

.result-buttons { display: flex; flex-direction: column; gap: 10px; }

/* ---------------- フッター ---------------- */
.app-footer {
  text-align: center;
  font-size: 11.5px;
  color: var(--color-text-light);
  margin-top: 30px;
  opacity: 0.7;
}

/* ---------------- 画面切り替え共通 ---------------- */
.screen[hidden] { display: none; }
.screen {
  animation: fadeIn 0.35s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
