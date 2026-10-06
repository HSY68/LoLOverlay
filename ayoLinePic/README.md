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

## 內建貼圖包：日常用語 24 張

依上傳角色圖生成，路徑：`public/packs/daily24/`

| 主題 | 檔名 |
| --- | --- |
| 謝謝！ | `01.png` |
| 對不起… | `02.png` |
| 好的！ | `03.png` |
| 加油！ | `04.png` |
| 讚！ | `05.png` |
| 掰掰！ | `06.png` |
| 蛤？ | `07.png` |
| 了解！ | `08.png` |
| 拜託了！ | `09.png` |
| 不好意思… | `10.png` |
| 我在忙！ | `11.png` |
| 吃飯中！ | `12.png` |
| 讓我想想… | `13.png` |
| 沒問題！ | `14.png` |
| 累了… | `15.png` |
| 什麼！？ | `16.png` |
| 哈哈哈！ | `17.png` |
| 嗚嗚… | `18.png` |
| 收到！ | `19.png` |
| 晚安！ | `20.png` |
| 感恩啦！ | `21.png` |
| 辛苦了！ | `22.png` |
| 搞定！ | `23.png` |
| 一切順利！ | `24.png` |

下載：`/packs/daily24/ayoLinePic-daily24-line-stickers.zip`

重新處理來源圖：

```bash
python3 scripts/process_pack.py \
  --src /path/to/generated-jpgs \
  --out public/packs/daily24
```

## 匯出說明

ZIP 內資料夾 `png/`：

| 檔名 | 用途 | 尺寸 |
| --- | --- | --- |
| `01.png` … | 貼圖本體 | 最大 370×320 |
| `main.png` | 主圖 | 240×240 |
| `tab.png` | 聊天室縮圖 | 96×74 |

官方建議貼圖包張數為 8／16／24／32／40，背景需透明，單檔 ≤ 1MB。
