# 英検準1級 Mobile

英検準1級の語彙学習向けに作っている、モバイル中心の静的 Web アプリです。  
DUO mobile に近い操作感をベースに、Section ごとに単語・熟語と例文を学習できる構成にしています。

GitHub repository:  
`https://github.com/6platinumstars-maker/eiken-pre1`

GitHub Pages:  
`https://6platinumstars-maker.github.io/eiken-pre1/`

## 画面構成と学習範囲

画面上部の `単語` / `熟語` で学習対象を切り替えます。機能ボタンは4個のまま共用し、選択中の対象に合わせて名称と内容が変わります。

| 学習対象 | Section | 問題数 | 利用できる機能 |
| --- | --- | ---: | --- |
| 単語 | 01–16 | 1,600問 | `単語チェック` / `単語復習` / `例文音声` / `単語音声` |
| 熟語 | 17–19 | 300問 | `熟語チェック` / `熟語復習` / `熟語例文音声` / `熟語音声` |

- Section選択欄には、選択中の学習対象に属するSectionだけを表示
- 単語のチェック・復習・音声にはSection 17–19を含めない
- 熟語のチェック・復習・音声にはSection 01–16を含めない
- 選択中の学習対象、Section、表示モード、学習状態、チェック状態を `localStorage` に保存

## 現在の機能

### チェック

`単語チェック` と `熟語チェック` は同じ操作です。

- 最初は英語だけを表示
- 1回目のカードタップで日本語の意味と詳細カードを表示
- 2回目のタップでチェックを付ける
- 3回目以降のタップでチェック状態を切り替える
- 詳細カードに品詞と追加情報を表示
- 単語の動詞は `自動詞 / 他動詞 / 自他両用 / 未確認` の区分を表示
- `再生` で現在位置からSection末尾まで順番に再生
- 各項目では女性2回・男性2回・女性1回の音声を使用

### 復習

`単語復習` と `熟語復習` は、それぞれの学習対象でチェック済みの項目だけを扱います。

- チェック済み項目を番号順に一覧表示
- カードのタップで、訳・追加情報・例文と訳を開閉
- カードの開閉ではチェック状態を変更せず、チェック欄を直接操作した場合だけ変更
- `すべての単語／熟語にチェックを入れる` と `すべての単語／熟語のチェックを外す` に対応
- `すべての単語／熟語カードを表示する` / `閉じる` で詳細を一括開閉
- `再生` / `停止` の1ボタンで、再生開始時にチェック済みの項目を番号順に再生
- 各項目では女性2回・男性2回・女性1回の5回音声を使用
- 再生待ちの項目からチェックを外すと、その項目をスキップ
- 再生途中で追加したチェックは次回の再生開始時に反映
- 再生中のカードを操作ボタン直下へ自動スクロール
- 全チェック解除、表示モード切替、Section変更、学習対象切替で再生を停止

### 例文音声

単語側では `例文音声`、熟語側では `熟語例文音声` と表示されます。

- 例文、日本語訳、対象の単語／熟語カードを最初から表示
- カードのタップでチェック状態を切り替え
- `← 前` / `再生・一時停止` / `次 →` で操作
- 通常再生は現在位置からSection末尾まで連続再生し、末尾で停止
- 末尾で `次 →` を押すとSection先頭へ戻る
- 同じSectionを選び直すと先頭から再開
- `通常` / `5連続` の再生モード切替に対応
- `5連続` は選択中の学習対象内を最大5Section単位でまとめ、各例文の女性音声を1回ずつ再生
  - 単語: `01–05` / `06–10` / `11–15` / `16`
  - 熟語: `17–19`

### 単語・熟語音声

単語側では `単語音声`、熟語側では `熟語音声` と表示されます。

- 対象の単語／熟語カードを最初から表示
- カードのタップでチェック状態を切り替え
- `← 前` / `再生・一時停止` / `次 →` で操作
- 通常再生は現在位置からSection末尾まで連続再生し、各項目では女性2回・男性2回・女性1回の音声を使用
- `5連続` は例文音声と同じSection区分で、各単語／熟語の女性音声を1回ずつ再生

## データ進捗

各Sectionは100問単位です。Section 01–16は単語、Section 17–19は熟語として扱います。

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
- Section 11: `1001–1100` 完了
- Section 12: `1101–1200` 完了
- Section 13: `1201–1300` 完了
- Section 14: `1301–1400` 完了
- Section 15: `1401–1500` 完了
- Section 16: `1501–1600` 完了
- Section 17: `1601–1700` 完了
- Section 18: `1701–1800` 完了
- Section 19: `1801–1900` 完了

登録数は単語 `1,600` 問、熟語 `300` 問、例文 `1,900` 件です。

## ファイル構成

- `index.html`
  - アプリ本体
- `css/style.css`
  - スタイル
- `js/app.js`
  - 画面制御、状態保存、4択処理
- `data/section01.js` 〜 `data/section19.js`
  - Sectionごとの例文・単語／熟語データ
- `mp3/en`
  - 英語音声（Section 単位）
- `mp3/jp`
  - 日本語音声
- `mp3/5en`
  - 例文の 5回連続再生用音声
- `mp3/word`
  - 単語／熟語音声（女性・男性）
- `mp3/5word`
  - 単語／熟語の5回音声
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

単語・熟語カードの表示では、基本的に `tags` と `extraInfo` を使って品詞を推定しています。Section 17–19の `vocab` には `phrase` タグを設定しています。

動詞は説明文の表記から `自動詞 / 他動詞 / 自他両用 / 未確認` を判定して表示します。

## OCR テキスト

`source/ocr` には、スキャンから手入力・整形した OCR テキストを置いています。

- 命名例: `section14_1301_1338.txt`
- 1ファイルに連番のまとまりを保存
- 後で `data/sectionXX.js` に反映

## 音声ファイルの前提

例文音声・単語／熟語音声モードでは、`mp3` 配下の音声ファイルを参照します。熟語も同じディレクトリ構成を使用し、Section 17–19へ配置しています。

- 例文ごとの英語音声:
  - `mp3/en/section01/0001_female_slow.mp3`
- 例文ごとの日本語音声:
  - `mp3/jp/section01/0001_female.mp3`
- 英語連続再生用:
  - `mp3/5en/section01/0001_female_5x.mp3`
- 単語／熟語ごとの音声:
  - `mp3/word/section01/0001_female_slow.mp3`
  - `mp3/word/section01/0001_male_slow.mp3`
- 単語／熟語の5回音声:
  - `mp3/5word/section01/0001_female_5x.mp3`

### 生成済み状況

- `section01` 〜 `section19` の音声生成済み
- 合計:
  - `mp3/en`: `3800` 件
  - `mp3/jp`: `1900` 件
  - `mp3/5en`: `1900` 件
  - `mp3/word`: `3800` 件
  - `mp3/5word`: `1900` 件

内訳:

- 英語音声は 1 例文につき `female_slow` と `male_slow` の 2 本
- 日本語音声は 1 例文につき 1 本
- `5en` は `female slow ×2 → male slow ×2 → female slow ×1` を連結した英語連続再生用ファイル
- 単語／熟語音声は 1 項目につき `female_slow` と `male_slow` の 2 本
- `5word` は `female slow ×2 → male slow ×2 → female slow ×1` を連結した単語／熟語の5回音声
- `5連続` ボタンは `5en` を使わず、各例文の `female_slow` を 1 回ずつ使って、選択中の学習対象内を最大5Section単位で再生
- 単語／熟語音声の `5連続` も `5word` を使わず、各項目の `female_slow` を 1 回ずつ再生
- `通常` ボタンで、例文音声は `5en`、単語／熟語音声は `5word` を使う通常再生へ戻せる

### 音声の保守メモ

- `2026-08-19` に英語音声ファイルのサイズ再チェックを実施
- 再生成して修正した対象:
  - `section01/018_male_slow.mp3`
  - `section05/472_female_slow.mp3`
  - `section16/1501_female_slow.mp3`
  - `section16/1501_male_slow.mp3`
- 上記に連動する `mp3/5en` 側のファイルも再生成済み
- `2026-08-26` に全音声ファイルのサイズを再チェック
  - `mp3/en`: 3,800件、最小 13.8KB
  - `mp3/jp`: 1,900件、最小 18.3KB
  - `mp3/5en`: 1,900件、最小 153.3KB
  - `mp3/word`: 3,800件、最小 4.0KB
  - `mp3/5word`: 1,900件、最小 67.4KB
- 空ファイル・1KB未満のファイルはなく、サイズ上の明らかな異常はなし
- 単語音声で最も小さい4件（`app`、`ache`、`owe`、`edge`）は、再生時間が約0.67〜0.74秒の短い単語音声であることを確認済み

### 再生仕様

- `例文音声` / `熟語例文音声` / `単語音声` / `熟語音声` で再生を始めると、現在位置からそのSectionの最後まで自動で連続再生します
- 最終項目の再生が終わると停止します
- `← 前` はセクション先頭で止まります
- `次 →` は通常どおり次の項目へ進み、末尾では先頭へ戻ります
- 同じセクションを選び直した場合、音声位置は先頭にリセットされます
- 5連続再生を使わない通常再生でも、1セクション最大 100 項目を連続で流せます
- `5連続` は選択中の学習対象内で選んだ最大5Sectionのまとまりをまたいで進み、各項目は女性音声を1回だけ再生します
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
