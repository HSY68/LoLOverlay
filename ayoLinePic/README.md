# ayoLinePic

快速把圖片轉成 [LINE Creators Market](https://creator.line.me/en/guideline/sticker/) 規格貼圖，並匯出可上傳的 ZIP。

## 功能

- 拖放／多選匯入圖片
- 自動套用最大 **370×320** 貼圖畫布（透明底 PNG）
- 微調縮放、位移、contain／cover
- 指定 **Main 240×240** 與 **Tab 96×74**
- 一鍵匯出 `png/01.png …`、`main.png`、`tab.png`

## 開發

```bash
cd ayoLinePic
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview
```

## 匯出說明

ZIP 內資料夾 `png/`：

| 檔名 | 用途 | 尺寸 |
| --- | --- | --- |
| `01.png` … | 貼圖本體 | 最大 370×320 |
| `main.png` | 主圖 | 240×240 |
| `tab.png` | 聊天室縮圖 | 96×74 |

官方建議貼圖包張數為 8／16／24／32／40，背景需透明，單檔 ≤ 1MB。
