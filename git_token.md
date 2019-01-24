今回は、 AWS を使った場合の provider: generic を指定しています。
このように、アプリケーションと開発環境を別に作成します。
そして、ビルド用の script は、このように、 build を実行するだけになります。

```json : package.json
"scripts": {
    "start": "electron ./app",
    "dev": "npm run start",
    "release": "build --ia32"
},
"build": {
    "productName": "ElectronAutoUpdate",
    "appId": "com.hisasann.ElectronAutoUpdate",
    "category": "public.app-category.tools",
    "files": [
        "dist/",
        "node_modules/",
        "index.html",
        "main.js",
        "renderer.js",
        "package.json"
    ],
    "win": {
        "target": "nsis",
        "publish": [
        {
            "provider": "generic",
            "url": "https://s3-ap-northeast-1.amazonaws.com/electron-auto-update/latest"
        }
        ]
    }
},
```

### electron のメインプロセスで autoUpdater を使う

よくあるコードの例として、以下のようにバージョンをセットして、 setFeedURL のがありますが、 electron-builder は自動的に setFeedURL を呼んでくれるので、自前で呼んではいけません。

> setFeedURL を呼び出さないでください。電子ビルダーは自動的に app-update.yml ファイルを作成します resources（このファイルは内部ファイルです、あなたはそれを意識する必要はありません）。

それと、 electron.autoUpdater を使うのではなく、 electron-auto-updater モジュールに内包されている autoUpdater を使うます。

また、イベントに入ったかどうかわかりにくいので、 megahertz/electron-log: Just a very simple logging module for your Electron application を使っています。

```js
const autoUpdater = require("electron-auto-updater").autoUpdater;

const log = require("electron-log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

autoUpdater.addListener("update-available", function(event) {
  log.info("update-available");
});
autoUpdater.addListener("update-downloaded", function(
  event,
  releaseNotes,
  releaseName,
  releaseDate,
  updateURL
) {
  log.info("update-downloaded" + releaseName);
  autoUpdater.quitAndInstall();
  return true;
});
autoUpdater.addListener("error", function(error) {
  log.info(error);
});
autoUpdater.addListener("checking-for-update", function(event) {
  log.info("checking-for-update");
});
autoUpdater.addListener("update-not-available", function() {
  log.info("update-not-available");
});

autoUpdater.checkForUpdates();
```

### latest.yml

今回は AWS を使っていますが、自前サーバーでも同じで、 latest.yml が必須になります。
これで、 electron が毎回起動する度にここに問い合わせをしてバージョンが上がっていれば、 auto update が動くという仕組みのようです。

https://github.com/hisasann/electron-various-tutorials/tree/master/electron-auto-update

### 併用できない

だから私はアプリがすでに autoUpdater ユーザーと Squirrel を使用している場合は electron-updaterNSIS に切り替えるには最初からアンインストールして再インストールする必要があると思います。これは正しいです？
はい。NSIS だけがあなたが他のインストーラーに移行することを許します、しかし Squirrel.Windows は Squirrel.Windows だけをサポートします。

```js
import { autoUpdater } from "electron-updater";

export default class AppUpdater {
  constructor() {
    const log = require("electron-log");
    log.transports.file.level = "debug";
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
```

### GH_TOKEN

GH_TOKEN 環境変数（ユーザーのマシン上）と private オプションを設定することで、電子更新プログラムによる更新にプライベートリポジトリを使用できます。これ GH_TOKEN が設定されていると、電子更新プログラムは GitHub API を更新に使用してプライベートリポジトリを機能させることができます。

Package.JSON の内部では、現在ビルドキーの下に次のものを渡しています。
"win": { "target": ["nsis"], "publish": ["github"] },

GH_TOKEN これは env 変数なので、他の env と同じように設定してください。

例えば Mac の場合は export GH_TOKEN=yourToken、~/.profile

### Win の証明書

どちらの証明書も自動更新で機能します。通常の（そしてより安い）コード署名証明書はインストール中に警告を表示します。十分なユーザーがあなたのアプリケーションをインストールし、あなたが信頼を築いたならばそれは消えます。EV 証明書は信頼性が高いため、警告なしにすぐに機能します。ただし、EV 証明書は物理的な USB ドングルにバインドされているため、エクスポートすることはできません。したがって、AppVeyor などの CI の署名コード用の証明書をエクスポートすることはできません。

### nsis

icon= build/icon.icoString - アプリケーションアイコンへのパス。

legalTrademarks 文字列 - 商標および登録商標。

### github

GH_TOKEN が定義されている場合- デフォルトはになり[{provider: "github"}]ます。

```json
"win" ： {
  "publish" ： [ "github" 、 "bintray" ]
}
```

tokenString - プライベート github リポジトリからの自動更新をサポートするためのアクセストークンです。設定ファイルには絶対に指定しないでください。setFeedURL 専用です。
privateBoolean - GH_TOKEN 環境変数が定義されている場合にプライベート github 自動更新プロバイダを使用するかどうか。Private GitHub Update Repo を参照してください。
publishAutoUpdate= trueBoolean - 自動更新情報ファイルを公開するかどうか。
repo String - The repository name. Detected automatically.
repository in the application or development package.json,

#### private repo

GH_TOKEN 環境変数（ユーザーのマシン上）と private オプションを設定することで、電子更新プログラムによる更新にプライベートリポジトリを使用できます。これ GH_TOKEN が設定されていると、電子更新プログラムは GitHub API を更新に使用してプライベートリポジトリを機能させることができます。

非常に特別な場合専用のプライベート GitHub プロバイダー- 意図されておらず、すべてのユーザーに適しているわけではありません。

GitHub API は現在、1 時間あたり 1 ユーザーあたり 5000 リクエストのレート制限があります。更新チェックは、チェックごとに最大 3 つの要求を使用します。

アクセストークンにはリポジトリスコープ/パーミッションが必要です。GH_TOKEN 環境変数を定義します。

@ashxdev はい、私はプライベートリポジトリを使用しています。
例えば：

```js
autoUpdater.requestHeaders = { "PRIVATE-TOKEN": "Personal access Token" };
autoUpdater.autoDownload = true;

autoUpdater.setFeedURL({
  provider: "generic",
  url:
    "https://gitlab.com/_example_repo_/-/jobs/artifacts/master/raw/dist?job=build"
});
```

それが価値があるもののために、私はそれについて別の方法で行かなければなりませんでした。私は GitHub Repo Token をアプリケーション内にハードコードしたくありませんでした（これは読み取り専用トークンではありません）ので、私のアプリケーションのユーザーがログインするとすぐに、アプリケーションは私のサーバーから GH トークンを取得し使用します更新をチェックする直前にアップデータの setFeedURL を作成します。

1 月 22 日の私の以前のコメントからの更新：自動アップデータは GitHub のプライベートリポジトリ（そして私がこれを独自にテストしたわけではないけれど、私が理解しているものからのパブリックリポジトリ）では動作しなくなった。私はそれ以来私のリリースを AWS S3 バケットを使うように切り替えました、そしてそれは働いています。

```js
ipcMain.on("autoUpdate.status", (evt, token) => {
  const data = {
    provider: "github",
    owner: "<owner-name>",
    repo: "<repo-name>",
    token: token
  };
  updater.setFeedURL(data);
  updater.autoDownload = false;
  updater.checkForUpdates();
});
```

### misc

```json
"build": {
    "appId": "com.github.owner.repo",
    "productName": "Training Tracker",
    "files": [
      "dist",
      "node_modules",
      "main.js",
      "package.json"
    ],
    "directories": {
      "output": "output"
    },
    "mac": {
      "publish": {
        "provider": "github",
        "private": true,
        "token": "token"
      },
      "target": [
        "zip",
        "dmg"
      ]
    }
  }
```

```json
autoUpdater.setFeedURL({
  "provider": "github",
  "owner": "owner",
  "repo": "repo",
  "token": "token"
})
```

エラーログには以下が表示されます。

表示されたリンク（https://api.github.com/repos/[owner]/[repo]/releases/latest）をたどると、ブラウザのGitHubから次のエラーが表示されます。

[error] Error: Error: Unable to find latest version on GitHub (https://api.github.com/repos/[owner]/[repo]/releases/latest), please ensure a production release exists: Error: net::ERR_CONNECTION_REFUSED

```json
{
  "message": "Not Found",
  "documentation_url": "https://developer.github.com/v3/repos/releases/#get-the-latest-release"
}
```

あなたは、設定することはできません token と private: true、そう呼び出す必要が公開オプションでと setFeedURL。
現在の例では private: true、use にも設定する必要があります PrivateGitHubProvider。

https://developer.mozilla.org/ja/docs/Signing_an_executable_with_Authenticode
https://electronjs.org/docs/tutorial/code-signing
