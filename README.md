# 英検準1級 Mobile

英検準1級の語彙学習向けに作っている、モバイル中心の静的 Web アプリです。

GitHub repository:
`https://github.com/6platinumstars-maker/eiken-pre1`

GitHub Pages:
`https://6platinumstars-maker.github.io/eiken-pre1/`

## できること

- Section を切り替えて学習できる
- `例文` モードで英語例文を確認できる
- 例文に関連する単語カードを見られる
- `単語` モードで意味から英単語を答える練習ができる
- 4択モードで復習できる
- チェック状態や学習状態を `localStorage` に保存できる

## 画面構成

- `例文`
  - 例文を順送りで確認
  - 対応する単語カードを表示
- `単語`
  - 意味を見て英単語を答える
  - 答え表示、前後移動、全チェック操作が可能
  - 4択モードの切り替えに対応

## ファイル構成

- `index.html`
  - アプリ本体
- `css/style.css`
  - スタイル
- `js/app.js`
  - 画面制御、学習状態保存、4択処理
- `data/section01.js` 〜 `data/section19.js`
  - Section ごとの例文・単語データ
- `mp3/en`
  - 英語音声置き場
- `mp3/jp`
  - 日本語音声置き場
- `mp3/5en`
  - 連結音声置き場
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

## ローカルで開く方法

このアプリは静的サイトなので、まずは `index.html` をブラウザで開けば動作確認できます。

```bash
cd /home/ps/eiken-jun1-mobile
xdg-open index.html
```

## GitHub へ更新を反映する

```bash
cd /home/ps/eiken-jun1-mobile
git add .
git commit -m "更新内容"
git push
```

## GitHub Pages の公開設定

GitHub の公式ドキュメントでは、静的サイトでビルド工程が不要な場合は `Deploy from a branch` を使い、公開元にブランチとフォルダを指定する方法が案内されています。

このリポジトリでは次の設定で公開できます。

1. GitHub の `eiken-pre1` リポジトリを開く
2. `Settings`
3. 左メニューの `Pages`
4. `Build and deployment` の `Source` を `Deploy from a branch` にする
5. `Branch` を `main`
6. フォルダを `/(root)`
7. `Save`

公開後の URL:
`https://6platinumstars-maker.github.io/eiken-pre1/`

反映には数分かかることがあります。

参考:
- https://docs.github.com/en/pages/quickstart
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 補足

- `source/ocr` や `source/scans` もリポジトリに含まれています
- GitHub Pages は公開サイトなので、外に出したくないファイルは今後コミットしない運用がおすすめです
