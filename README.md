# KATAWAKU PRO — 現場利益管理アプリ

型枠工事向け現場利益管理アプリです。

---

## ▶ Vercelへのデプロイ手順（初心者向け）

### ① GitHubにアップロード

1. [github.com](https://github.com) にログイン
2. 右上の「＋」→「New repository」をクリック
3. Repository name に `katawaku-pro` と入力
4. 「Create repository」をクリック
5. 画面に表示される「uploading an existing file」をクリック
6. このフォルダの中身を**すべて**ドラッグ＆ドロップ
7. 「Commit changes」をクリック

### ② Vercelで公開

1. [vercel.com](https://vercel.com) にアクセス
2. 「Continue with GitHub」でログイン
3. 「Add New Project」をクリック
4. `katawaku-pro` を選んで「Import」
5. 設定はそのままで「Deploy」をクリック
6. ✅ 完了！URLが発行されます

---

## 📱 iPhoneのホーム画面に追加する方法

1. **Safari**（必ずSafariを使う）でVercelのURLを開く
2. 画面下の「**共有ボタン**」（四角から矢印が出ているアイコン）をタップ
3. 「**ホーム画面に追加**」をタップ
4. 「追加」をタップ

→ ホーム画面に「KATAWAKU」アイコンが追加されます！

---

## 📁 ファイル構成

```
katawaku-pro/
├── index.html          # エントリーポイント
├── vite.config.js      # ビルド設定（PWA含む）
├── package.json        # 依存パッケージ
├── public/
│   ├── icon-192.png    # アプリアイコン（小）
│   └── icon-512.png    # アプリアイコン（大）
└── src/
    ├── main.jsx        # Reactエントリー
    └── App.jsx         # メインアプリ
```

---

## 機能一覧

- 📊 ダッシュボード（売上・利益・現場ランキング）
- 🏗 現場管理（フロア別利益計算対応）
- 📋 出勤管理（日当・残業代自動計算）
- 👷 従業員管理
- 💴 給与計算・明細表示
