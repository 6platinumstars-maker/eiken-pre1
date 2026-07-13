# 英検準1級 Mobile

英検準1級の語彙学習向けに作っている、モバイル中心の静的 Web アプリです。  
DUO mobile に近い操作感をベースに、Section ごとに例文と単語を学習できる構成にしています。

GitHub repository:  
`https://github.com/6platinumstars-maker/eiken-pre1`

GitHub Pages:  
`https://6platinumstars-maker.github.io/eiken-pre1/`

## 現在の機能

- Section 切り替え
- `例文` モード
  - 最初は英語例文のみ表示
  - タップで日本語訳と単語カードを表示
  - 単語カードからチェック状態を切り替え
- `単語` モード
  - チェック済み単語のみ表示
  - 最初は英単語のみ表示
  - タップで訳・追加情報・例文と訳を表示
  - もう一度タップするとチェックを外して次の単語へ進行
  - `すべてチェックを入れる` / `すべてのチェックを外す` に対応
- 英単語入力による確認
- `4択` モード
- 学習状態・チェック状態・正誤履歴の `localStorage` 保存

## データ進捗

各 Section は 100 語単位です。

- Section 01: `0001–0100` 完了
- Section 02: `0101–0200` 完了
- Section 03: `0201–0300` 99語
- Section 04: `0301–0400` 完了
- Section 05: `0401–0500` 完了
- Section 06: `0501–0600` 完了
- Section 07: `0601–0700` 完了
- Section 08: `0701–0800` 完了
- Section 09: `0801–0900` 完了
- Section 10: `0901–1000` 完了
- Section 11: `1001–1100` 91語
- Section 12: `1101–1200` 完了
- Section 13: `1201–1300` 完了
- Section 14: `1301–1400` 完了
- Section 15: `1401–1500` 未着手
- Section 16: `1501–1600` 未着手
- Section 17: `1601–1700` 未着手
- Section 18: `1701–1800` 未着手
- Section 19: `1801–1900` 未着手

## ファイル構成

- `index.html`
  - アプリ本体
- `css/style.css`
  - スタイル
- `js/app.js`
  - 画面制御、状態保存、4択処理
- `data/section01.js` 〜 `data/section19.js`
  - Section ごとの例文・単語データ
- `mp3/en`
  - 英語音声
- `mp3/jp`
  - 日本語音声
- `mp3/5en`
  - 英語5連続再生用音声
- `source/scans`
  - 元スキャン画像・PDF
- `source/ocr`
  - OCR テキスト
- `scripts`
  - データ加工用スクリプト

## データ形式

各 `data/sectionXX.js` は次の形です。

```js
window.SECTIONS = window.SECTIONS || {};

window.SECTIONS["sec01"] = {
  id: "sec01",
  title: "Section 01",
  sentences: [],
  vocab: []
};
```

### `sentences`

- `sid`
- `english`
- `japanese`
- `vocabRefs`

### `vocab`

- `vid`
- `word`
- `ipa`
- `meaning`
- `extraInfo`
- `usedIn`
- `tags`

## OCR テキスト

`source/ocr` には、スキャンから手入力・整形した OCR テキストを置いています。

- 命名例: `section14_1301_1338.txt`
- 1ファイルに連番のまとまりを保存
- 後で `data/sectionXX.js` に反映

## ローカルで開く方法

静的サイトなので、まずは `index.html` をブラウザで開けば確認できます。

```bash
cd /home/ps/eiken-jun1-mobile
xdg-open index.html
```

## GitHub へ反映する

```bash
cd /home/ps/eiken-jun1-mobile
git add .
git commit -m "更新内容"
git push
```

## GitHub Pages の公開設定

このリポジトリはビルド不要の静的サイトなので、`Deploy from a branch` で公開できます。

1. GitHub の `eiken-pre1` リポジトリを開く
2. `Settings`
3. 左メニューの `Pages`
4. `Build and deployment` の `Source` を `Deploy from a branch` にする
5. `Branch` を `main`
6. フォルダを `/(root)`
7. `Save`

公開 URL:  
`https://6platinumstars-maker.github.io/eiken-pre1/`

反映には数分かかることがあります。

参考:
- https://docs.github.com/en/pages/quickstart
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 補足

- `source/ocr` と `source/scans` もリポジトリに含めています
- GitHub Pages は公開サイトなので、外部公開したくない素材は今後コミットしない運用がおすすめです
