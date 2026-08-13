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
  - 展開した単語カードに `品詞` を表示
  - 動詞は `自動詞 / 他動詞 / 自他両用 / 未確認` の区分を表示
- `単語` モード
  - チェック済み単語のみ表示
  - 最初は英単語のみ表示
  - タップで訳・追加情報・例文と訳を表示
  - もう一度タップするとチェックを外して次の単語へ進行
  - `すべてチェックを入れる` / `すべてのチェックを外す` に対応
- `英語音声` モード
  - Duo3.0 アプリの `英語音声` ボタンに合わせた画面構成
  - 例文ごとの英語音声再生領域
  - `← 前` / `再生・一時停止` / `次 →`
  - 再生開始後はセクション末尾まで自動で次の音声へ進行
  - セクションの最後まで来たら自動停止
  - 最後の例文表示中に `次 →` を押すと先頭の例文へ戻る
  - 同じセクションを選び直したときも先頭の例文から再開
  - 1セクション最大 100 例文の連続再生に対応
  - `通常` / `5連続` の再生モード切替に対応
  - `5連続` では 5セクション単位で女性英語音声を順番に再生
  - 英語音声中の単語カードは最初から情報展開済みで表示
  - 例文欄タップで表示内容を切り替え
- 英単語入力による確認
- `4択` モード
- 学習状態・チェック状態・正誤履歴の `localStorage` 保存

## データ進捗

各 Section は 100 語単位です。

- Section 01: `0001–0100` 完了
- Section 02: `0101–0200` 完了
- Section 03: `0201–0300` 完了
- Section 04: `0301–0400` 完了
- Section 05: `0401–0500` 完了
- Section 06: `0501–0600` 完了
- Section 07: `0601–0700` 完了
- Section 08: `0701–0800` 完了
- Section 09: `0801–0900` 完了
- Section 10: `0901–1000` 完了
- Section 11: `1001–1100` 91語（`1059–1067` 欠番）
- Section 12: `1101–1200` 完了
- Section 13: `1201–1300` 完了
- Section 14: `1301–1400` 完了
- Section 15: `1401–1500` 完了
- Section 16: `1501–1600` 完了
- Section 17: `1601–1700` 完了
- Section 18: `1701–1800` 完了
- Section 19: `1801–1900` 完了

総例文数は `1891` 件です。  
Section 11 は元データが `91` 文のため、全体は `1900` ではなく `1891` 文になっています。

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
  - 英語音声（Section 単位）
- `mp3/jp`
  - 日本語音声
- `mp3/5en`
  - 英語連続再生用音声
- `source/scans`
  - 元スキャン画像・PDF
- `source/ocr`
  - OCR テキスト
- `scripts`
  - データ加工用スクリプト
  - 音声生成スクリプト

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

単語カードの表示では、基本的に `tags` と `extraInfo` を使って品詞を推定しています。  
動詞は説明文の表記から `自動詞 / 他動詞 / 自他両用 / 未確認` を判定して表示します。

## OCR テキスト

`source/ocr` には、スキャンから手入力・整形した OCR テキストを置いています。

- 命名例: `section14_1301_1338.txt`
- 1ファイルに連番のまとまりを保存
- 後で `data/sectionXX.js` に反映

## 音声ファイルの前提

英語音声モードでは、Duo3.0 側と同じ考え方で `mp3` 配下の音声ファイルを参照します。

- 例文ごとの英語音声:
  - `mp3/en/section01/0001_female_slow.mp3`
- 例文ごとの日本語音声:
  - `mp3/jp/section01/0001_female.mp3`
- 英語連続再生用:
  - `mp3/5en/section01/0001_female_5x.mp3`

### 生成済み状況

- `section01` 〜 `section19` の音声生成済み
- 合計:
  - `mp3/en`: `3782` 件
  - `mp3/jp`: `1891` 件
  - `mp3/5en`: `1891` 件

内訳:

- 英語音声は 1 例文につき `female_slow` と `male_slow` の 2 本
- 日本語音声は 1 例文につき 1 本
- `5en` は `female slow ×2 → male slow ×2 → female slow ×1` を連結した英語連続再生用ファイル
- `5連続` ボタンは `5en` を使わず、各例文の `female_slow` を 1 回ずつ使って 5 セクションを順番に再生
- `通常` ボタンでいつでも通常の `5en` 再生モードへ戻せる

### 再生仕様

- `英語音声` モードで再生を始めると、現在位置からその Section の最後まで自動で連続再生します
- 最終例文の再生が終わると停止します
- `← 前` はセクション先頭で止まります
- `次 →` は通常どおり次の例文へ進み、末尾では先頭の例文へ戻ります
- 同じセクションを選び直した場合、音声位置は先頭にリセットされます
- 5連続再生を使わない通常再生でも、1セクション最大 100 例文を連続で流せます
- `5連続` は選択した 5 セクションのまとまりをまたいで進み、各例文は女性英語音声を 1 回だけ再生します
- `5連続` の再生が終わった後や、`通常` ボタン・`← 前`・`次 →` を使った時は通常モードへ戻ります

### 生成スクリプト

音声生成には `scripts/generate_section_audio.py` を使います。

```bash
cd /home/ps/eiken-jun1-mobile
/home/ps/.venv/bin/python scripts/generate_section_audio.py data/section01.js --base-dir /home/ps/eiken-jun1-mobile --overwrite
```

複数 Section をまとめて生成することもできます。

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
