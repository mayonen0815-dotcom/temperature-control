# 現場管理（カミナシ代替）

温度管理・クレーム報告・書類提出を行う、店舗用アプリと事務所（本部）用管理画面のセット。
Next.js + Prisma + Vercel Postgres + Vercel Blob で動作します。

## 機能概要

### 店舗用（スマホ想定）
- ログイン：店舗ID＋（設定していれば）PIN＋自分の名前
- 温度記録：事務所が登録した設備（冷蔵庫①②・冷凍庫①・製氷機①など）ごとに、朝／夜の数値を入力→「提出」ボタンで確定
  - 設備の追加・削除・基準温度の設定は店舗側ではできません（事務所側でのみ管理）
  - 基準温度を外れた値は自動で「基準外」表示になります
- クレーム報告：件名・内容・写真を送信するだけ（進捗確認画面はありません）
- 書類提出：対象者名・書類種別・ファイルを提出

### 事務所用（PC想定）
- 提出状況ダッシュボード：店舗×日付のマトリクスで、朝夜とも提出済みなら○、未提出があれば×で一覧表示。○×をクリックするとその日の内容を確認・訂正できます
- クレーム管理：一覧・状態変更（未対応／対応中／完了）に加えて、電話などで受けたクレームを事務所側から代筆登録できます
- 書類確認：提出書類の一覧・承認／要再提出の管理
- 店舗・設備管理：店舗の追加、店舗ごとの設備（冷蔵庫・冷凍庫など）の登録・削除・基準温度の設定

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

（`postinstall` で `prisma generate` が走ります。社内ネットワークやサンドボックス環境で
`binaries.prisma.sh` への接続がブロックされているとここで失敗しますが、通常のPCや
Vercelのビルド環境では問題なく完了します）

### 2. データベースを用意する

Vercelダッシュボード → Storage → 「Postgres」を作成（Neon経由でも同じ）すると、
`DATABASE_URL` が自動でプロジェクトに設定されます。ローカルで動かす場合は
`.env.example` を `.env` にコピーして、接続文字列を貼り付けてください。

```bash
cp .env.example .env
# .env を編集して DATABASE_URL / SESSION_SECRET を設定
```

テーブルを作成:

```bash
npm run db:push
```

初期管理者アカウントとサンプル店舗（設備込み）を作成:

```bash
npm run db:seed
```

デフォルトの管理者は `admin` / `changeme123` です（`.env` の
`SEED_ADMIN_NAME` / `SEED_ADMIN_PASSWORD` で変更できます）。
**本番投入前に必ずパスワードを変更してください。**

### 3. 画像・書類アップロード（Vercel Blob）

Vercelダッシュボード → Storage → 「Blob」を作成すると、
`BLOB_READ_WRITE_TOKEN` が自動でプロジェクトに設定されます。
ローカルでアップロード機能を試す場合は `.env` にもこのトークンを設定してください。

### 4. ローカルで起動

```bash
npm run dev
```

`http://localhost:3000` を開くと、店舗用／事務所用ログインの入口が表示されます。
サンプル店舗のIDは `BTK-001` です（PIN未設定）。

## Vercelへのデプロイ

1. このフォルダをGitHubリポジトリにpush
2. Vercelで「Add New Project」→ そのリポジトリを選択
3. Storage タブから Postgres と Blob をそれぞれ作成し、プロジェクトに接続
   （`DATABASE_URL` と `BLOB_READ_WRITE_TOKEN` が自動で環境変数に入ります）
4. 環境変数に `SESSION_SECRET`（ランダムな長い文字列）を追加
5. デプロイ後、Vercelの「Storage → Postgres → Query」またはローカルから
   `DATABASE_URL` を向けて `npm run db:push` と `npm run db:seed` を一度だけ実行
6. 完了！ `https://<your-project>.vercel.app` からアクセスできます

## 店舗を増やすとき

事務所用画面の「店舗・設備管理」から、店舗IDと店舗名を入力するだけで追加できます。
店舗数が増えてもサーバー費用は増えません（Vercel + Postgres + Blobの利用量課金のみ）。

## 今後の拡張案（必要であれば）

- 基準外の温度が入力されたときにメールやLINE通知を送る
- 店舗ごとの過去データをCSV/Excelで書き出す
- 複数の事務所アカウント（権限を分ける）
- 写真報告（清掃・開店前チェックなど）の追加

## ディレクトリ構成

```
src/app/            画面・APIルート（Next.js App Router）
  store/            店舗用画面
  admin/            事務所用画面
  api/store/        店舗用API
  api/admin/        事務所用API
src/lib/            共通ロジック（DB接続・認証・日付処理・パスワード）
prisma/schema.prisma  データベース定義
prisma/seed.ts        初期データ投入スクリプト
```
