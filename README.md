# 英検準1級 Mobile

`duo-mobile` を土台にした、英検準1級単語学習用のモバイル Web アプリの作業領域です。

## 目的

- 単語数: 1900
- Section 数: 19
- 学習 UI: `duo-mobile` とほぼ同じ構成
- データ投入元: スキャン取り込み内容

## 現在の仕様

- 画面モードは `例文` と `単語` の 2 つ
- `例文`
  - 最初は英語例文のみ表示
  - タップで日本語訳と単語カードを表示
- `単語`
  - チェック済み単語のみ表示
  - 最初は英単語のみ表示
  - タップで訳・補足情報・例文・和訳を表示
  - さらにタップでチェック解除して次の単語へ進む
- 音声ボタンは UI から削除済み
- チェック状態は `localStorage` で保持

## ディレクトリ構成

- `index.html`
  - アプリ本体
- `css/style.css`
  - スタイル
- `js/app.js`
  - 画面制御と localStorage 管理
- `data/section01.js` 〜 `data/section19.js`
  - Section ごとの例文・単語データ雛形
- `mp3/en`
  - 英語音声置き場（現在の UI では未使用）
- `mp3/jp`
  - 日本語音声置き場（現在の UI では未使用）
- `mp3/5en`
  - 5連結英語音声置き場（現在の UI では未使用）
- `source/scans`
  - 元スキャン画像・PDF置き場
- `source/ocr`
  - OCR テキスト置き場
- `scripts`
  - 加工用スクリプト置き場

## section データ雛形

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

`sentences` と `vocab` に、スキャン取り込み後の整形データを入れていく想定です。

## データ入力ルール

- `sentences`
  - 例文 1 件ごとに `sid`, `english`, `japanese`, `vocabRefs` を持たせる
- `vocab`
  - 単語 1 件ごとに `vid`, `word`, `ipa`, `meaning`, `extraInfo`, `usedIn`, `tags` を持たせる
- `source/ocr`
  - スキャンから転記した作業メモを範囲ごとに保存する
  - ファイル名は `sectionNN_XXXX_YYYY.txt` を基本形とする

## 補足記法

- `extraInfo` 内の `[= ...]`
  - 同義語・近い意味
- `extraInfo` 内の `[⇔ ...]`
  - 反対語
- OCR 由来のゆれや誤字が入りやすいため、意味上おかしい `=` / `⇔` は随時見直す
