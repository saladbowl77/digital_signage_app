# Digital Signage App

Electronベースのデジタルサイネージアプリケーション。MicroCMSから画像・iframeコンテンツを取得し、スライドショー形式で表示します。曜日・週別のスケジュール機能により、コンテンツの表示タイミングを細かく制御できます。

## 主な機能

- **MicroCMSコンテンツ管理**: 画像・iframeコンテンツをMicroCMSから取得
- **スケジュール機能**: 曜日・週別の表示制御（毎週・第1〜5週の指定可能）
- **スライドショー**: 自動切替機能（速度設定可能・即座に反映）
- **設定画面**: MicroCMS設定・スライド速度設定・開発者ツール切替
- **フルスクリーン表示**: 起動時自動フルスクリーン（ESCキーで終了）
- **自動更新**: 1分間隔でコンテンツを自動更新

## 技術スタック

- **Frontend**: Electron (HTML/CSS/JavaScript)
- **Backend**: Node.js
- **CMS**: MicroCMS
- **設定管理**: electron-store

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
# または
pnpm install
```

### 2. MicroCMSの設定

アプリケーションを起動後、設定画面で以下を入力：

- **サービスドメイン**: MicroCMSのサービスドメイン
- **APIキー**: MicroCMSのAPIキー
- **エンドポイント**: コンテンツのエンドポイント名

### 3. MicroCMSのコンテンツ構造

```json
{
  "id": "string",
  "type": "image" | "iframe"[],
  "img": {
    "url": string
  },
  "iframeUrl": string,
  "weekDay": [
    {
      "week": string[],
      "day": string[]
    }
  ]
}
```

#### weekフィールドの値
- `毎週`: 毎週表示
- `第1週`: 月の第1週のみ表示
- `第2週`: 月の第2週のみ表示
- `第3週`: 月の第3週のみ表示
- `第4週`: 月の第4週のみ表示
- `第5週`: 月の第5週のみ表示

#### dayフィールドの値
- `月`, `火`, `水`, `木`, `金`, `土`, `日`

## 使用方法

### アプリケーションの起動

```bash
npm start
```

### ビルド

```bash
npm run build:mac     # Mac用（.dmg作成）
npm run build:linux   # Linux用（AppImage・.deb作成）
npm run build:win     # Windows用（NSIS installer作成）
```

### 設定画面

1. メニューから「設定」を選択（または `⌘ + ,` / `Ctrl + ,`）
2. MicroCMS設定とスライド速度を設定
3. 保存ボタンで設定を保存
4. MicroCMS設定の変更時はアプリケーションを再起動
5. スライド速度の変更は即座に反映

## スケジュール機能

### 曜日別表示

`weekDay`配列で指定した曜日のみコンテンツを表示：

```json
"weekDay": [
  {
    "week": "毎週",
    "day": "月"
  }
]
```

### 週別表示

特定の週のみ表示する場合：

```json
"weekDay": [
  {
    "week": "第1週", 
    "day": "月"
  }
]
```

### 複数条件の指定

複数の曜日や週を指定する場合：

```json
"weekDay": [
  {
    "week": "毎週",
    "day": "月"
  },
  {
    "week": "第1週",
    "day": "金"
  }
]
```

## ファイル構成

```
src/
├── main.js              # メインプロセス
├── preload.js           # セキュアなIPC通信
├── renderer.js          # レンダラープロセス（フロントエンド）
├── services/
│   ├── microcms.js      # MicroCMS API連携
│   └── settings.js      # 設定管理
├── settings/
│   ├── settings.html    # 設定画面UI
│   └── settings.js      # 設定画面ロジック
└── windows/
    └── window-manager.js # ウィンドウ管理
```

## 開発

### デバッグ

設定画面で「開発者ツールを表示」をチェックすると、開発者ツールが表示されます。この設定は次回起動時にも自動的に適用されます。

### キーボードショートカット

- `ESC`: フルスクリーン終了
- `⌘ + ,` / `Ctrl + ,`: 設定画面を開く

### 設定ファイル

設定は`electron-store`により自動的に保存されます。設定ファイルの場所：

- **macOS**: `~/Library/Application Support/digital_signage_app/config.json`
- **Windows**: `%APPDATA%\digital_signage_app\config.json`
- **Linux**: `~/.config/digital_signage_app/config.json`

### アーキテクチャ

- **メインプロセス**: サービスとウィンドウの管理
- **レンダラープロセス**: スライドショー表示
- **IPCセキュリティ**: preload.jsによる安全な通信
- **自動更新**: 1分間隔でのコンテンツ取得・更新

## トラブルシューティング

### MicroCMS接続エラー

1. 設定画面でサービスドメイン・APIキーが正しく入力されているか確認
2. MicroCMSのAPIキーに適切な権限があるか確認
3. アプリケーションを再起動

### コンテンツが表示されない

1. MicroCMSのコンテンツ構造が正しいか確認
2. `weekDay`設定が現在の曜日・週と一致しているか確認
3. 開発者ツールでエラーログを確認

### スライドが動作しない

1. 設定画面でスライド速度が設定されているか確認
2. 有効なコンテンツが存在するか確認

## ライセンス

MIT License