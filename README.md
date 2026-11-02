# 新生兒黃疸光療與換血決策工具 (Neonatal Hyperbilirubinemia Decision Tool)

這是一個專為新生兒科 (NICU)、嬰兒室及兒科醫護人員開發的單頁式 Web 應用程式 (SPA)。本工具能將病童的「出生時數」與「總膽紅素 (TSB)」數值，即時標繪於標準化治療曲線上，幫助臨床醫師快速判斷是否需要介入**光療 (Phototherapy)** 或 **換血 (Exchange Transfusion)**。

## ✨ 核心功能 (Features)

*   **≥ 35 週：AAP 2022 指引**（Kemper et al., *Pediatrics* 2022;150:e2022058859）。依出生週數（35、36、37、38、39、≥ 40 週）與「有／無神經毒性風險因子」選取曲線，涵蓋出生 0–336 小時（14 天）。同時算出光療、照護升級（換血門檻 −2）與換血三條門檻。
*   **< 35 週：Maisels 2012 早產兒共識**（*J Perinatol* 2012;32:660）。光療門檻依矯正週數 (PMA)，隨日齡增加自動跳到下一級；原文註腳只對光療指定 PMA，因此換血門檻固定在出生週數。有高風險因子時採範圍下限。
*   **臨床判斷輔助**：
    *   TcB 與 TSB 分開判讀：TcB 在光療門檻 3 mg/dL 內或 ≥ 15 mg/dL 時提示抽 TSB 確認。
    *   兩次數值計算上升速率，24 小時內 ≥ 0.3 mg/dL/h、之後 ≥ 0.2 mg/dL/h 時提示可能溶血。
    *   計算 TSB／白蛋白比，並列出換血考量值。
    *   提供未照光嬰兒的出院追蹤建議（AAP 2022 Fig 7），以及停止照光的參考值。
    *   有中晚期急性膽紅素腦病變徵象（KAS 22）時，不論數值都建議換血。
    *   TSB 在照光中仍上升時，換血與升級門檻改用有風險因子曲線（KAS 17，Fig 6），光療門檻不變。
*   **單位與時數**：可切換 mg/dL 或 µmol/L，也可由出生與採檢時間自動算出時數。
*   **動態圖表 (Chart.js)**：畫出門檻曲線、照護升級線、目前落點與前次數值。
*   **列印處置建議單**：A4 排版，附上圖表。
*   **離線支援 (PWA)**：可加入主畫面，離線時仍能使用。
*   **教學分頁**：示範病例 6 例（`#cases`，可帶入工具）、考題 20 題（`#quiz`，基礎 10＋高階 10）、心智圖（`#map`）。內容在 `index.html` 的 `/*TEACH-START*/ … /*TEACH-END*/`。

## 📚 參考臨床指引 (Clinical Guidelines)

*   Kemper AR, Newman TB, Slaughter JL, et al. Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation. *Pediatrics* 2022;150(3):e2022058859.
    *   每小時門檻值取自 [PediTools AAP 2022 計算器](https://peditools.org/bili2022/) 的公開 API，96 小時內每 3 小時、之後每 12 小時取一點，以線性內插計算。抽查非取樣時點，誤差都在 0.1 mg/dL 以內。
*   Maisels MJ, Watchko JF, Bhutani VK, Stevenson DK. An approach to the management of hyperbilirubinemia in the preterm infant less than 35 weeks of gestation. *J Perinatol* 2012;32:660–664.

> 本工具僅供臨床參考，不取代醫師判斷。

## 🚀 部署與安裝 (Deployment)

本專案由純 HTML、CSS (Bootstrap 5) 與 JavaScript 撰寫，圖表使用 Chart.js 4.4.1 CDN，不需要後端伺服器。

1.  **線上發布 (GitHub Pages)**：在 `Settings > Pages` 將 Branch 設為 `main`（根目錄）。
2.  **行動裝置安裝 (PWA)**：用手機瀏覽器開啟後，選「加入主畫面」。

## 🧪 測試

```bash
node tests.cjs
```

測試會讀取 `index.html` 中 `/*ENGINE-START*/ … /*ENGINE-END*/` 之間的計算核心，核對 AAP 2022 參考值、Maisels 分級、追蹤建議與狀態判定；也會讀取 `/*TEACH-START*/` 區塊，核對病例與考題中的數字是否與計算核心一致。

## 📁 檔案結構 (File Structure)

```text
├── index.html       # 主程式（介面＋ENGINE 計算核心＋Chart.js 繪圖）
├── tests.cjs        # 計算核心測試
├── manifest.json    # PWA 應用程式清單
├── sw.js            # Service Worker（離線快取）
└── icons/           # icon.svg、icon-192.png、icon-512.png
```
