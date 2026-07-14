  /* ===== Abas do painel ===== */
  .fx-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
  .fx-tab {
    flex: 1 1 31%; padding: 7px 2px; font-size: .64rem; border-radius: 8px; cursor: pointer;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); color: #ccc;
    text-align: center; white-space: nowrap;
  }
  .fx-tab:hover { border-color: var(--verde); }
  .fx-tab.active { background: var(--roxo); border-color: var(--roxo-claro); color: #fff; }
  .tab-page { display: none; }
  .tab-page.visible { display: block; }
  .axis-row { display: flex; gap: 6px; margin: 6px 0; align-items: center; }
  .axis-row .lbl { font-size: .78rem; color: #bbb; width: 74px; flex-shrink: 0; }
  .ax-btn {
    flex: 1; padding: 5px 0; border-radius: 6px; cursor: pointer; font-size: .75rem; font-weight: 700;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); color: #aaa;
  }
  .ax-btn.on { background: var(--verde); border-color: var(--verde); color: #0d0a12; }
  .sub {
    margin: 6px 0; padding: 4px 8px 6px; border-left: 2px solid rgba(150,201,61,.35);
    background: rgba(255,255,255,.03); border-radius: 6px;
  }
  .fxsec { border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 8px 10px; margin: 10px 0; }
  .fxsec h4 { font-size: .72rem; text-transform: uppercase; letter-spacing: 1.2px; color: var(--verde); margin-bottom: 4px; }

