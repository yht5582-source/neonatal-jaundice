# 新生兒黃疸光療與換血決策工具 (Neonatal Hyperbilirubinemia Decision Tool)

這是一個專為新生兒科 (NICU)、嬰兒室及兒科醫護人員開發的單頁式 Web 應用程式 (SPA)。本工具能將病童的「出生時數」與「總膽紅素 (TSB)」數值，即時標繪於標準化治療曲線上，幫助臨床醫師快速判斷是否需要介入**光療 (Phototherapy)** 或 **換血 (Exchange Transfusion)**。

## ✨ 核心功能 (Features)

*   **動態視覺化曲線 (Chart.js Integration)：** 輸入數值後，系統會自動在畫布上生成黃色光療區間與紅色換血警示線，並將病童目前的 TSB 數值化為顯眼的定位點，距離治療門檻的差距一目瞭然。
*   **雙軌決策邏輯 (Dual-Track Assessment)：** 
    *   **$\ge 35$ 週新生兒：** 根據是否具備「神經毒性風險因子 (Neurotoxicity Risk Factors)」自動判定低、中、高風險群組，並透過**線性內插法 (Linear Interpolation)** 精算特定小時的門檻值。
    *   **$< 35$ 週早產兒：** 動態切換為早產兒體重級距 (Birth Weight Categories) 評估模式，產出平行的早產兒治療門檻。
*   **臨床處置自動建議：** 依據數值落點，自動給予「觀察」、「照光」或「準備換血 / 聯絡 NICU」的警示與建議。
*   **醫囑單匯出 (PDF Export)：** 內建專為病歷歸檔設計的 A4 列印排版，一鍵隱藏網頁 UI，輸出乾淨的風險分級與處置報告。
*   **離線支援 (PWA)：** 支援安裝至手機主畫面，在無網路環境下（如嬰兒室或偏鄉診所）仍可流暢繪圖與運算。

## 📚 參考臨床指引 (Clinical Guidelines)

*   **$\ge 35$ 週新生兒：** 依據美國兒科醫學會 (AAP) *Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation* 所提供之列線圖 (Nomogram) 概念繪製。
*   **$< 35$ 週早產兒：** 採用臨床通用之早產兒出生體重 (Birth Weight) 光療與換血共識門檻。

## 🚀 部署與安裝 (Deployment)

本專案由純 HTML、CSS (Bootstrap 5) 與 JavaScript (含 Chart.js CDN) 撰寫，無需建置後端伺服器。

1.  **線上發布 (GitHub Pages)：**
    進入 GitHub 專案的 `Settings > Pages`，將 Branch 設為 `main` 即可自動生成對外網址。
2.  **行動裝置安裝 (PWA)：**
    使用手機瀏覽器 (Safari / Chrome) 開啟網頁後，選擇選單中的 **「加入主畫面 (Add to Home Screen)」** 即可建立桌面捷徑並啟用離線功能。

## 📁 檔案結構 (File Structure)

```text
├── index.html       # 系統主程式 (包含表單 UI、內插法計算與 Chart.js 繪圖設定)
├── manifest.json    # PWA 應用程式清單 (定義 APP 名稱與外觀設定)
├── sw.js            # PWA Service Worker (處理 Bootstrap 與腳本的離線快取)
└── icons/           # 放置 192x192 與 512x512 的 APP 圖示
