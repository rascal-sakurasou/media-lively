# メディアライブリー

日本最大級、最終的には **MyAnimeList級** を目指す日本向けアニメデータベース・レビュー・コミュニティ。

## 目標

「アニメを探す」だけではなく、

**探す → 観る → 記録する → 評価する → レビューする → 誰かに薦める → 次の作品を発見する**

までを一つのサイトで完結させます。

参考にしているのは季節アニメMAKIやMyAnimeListの情報設計ですが、デザイン・コード・データは独自に構築します。

## 主な機能

- アニメ作品データベース
- 高度な作品検索
- 年・クール・形式・放送状況による探索
- 今期アニメ
- シーズン別ランキング
- 総合ランキング
- ベイズ平均を利用できる評価基盤
- ユーザー登録・ログイン
- マイリスト
- 視聴ステータス
- エピソード進捗
- 個人スコア
- お気に入り
- 作品フォロー
- レビュー
- ネタバレフラグ
- レビューへのリアクション
- レビューコメント
- コミュニティ投稿
- ユーザーフォロー
- 作品間の続編・前日譚・スピンオフ等の関連付け
- エピソードDB
- スタッフ・人物DB
- ジャンル・タグDB
- 外部ID連携用フィールド
- SEO / canonical / sitemap
- Supabase RLS
- 管理者基盤

## データモデル

```text
Anime
├─ Seasons
├─ Episodes
├─ Genres / Tags
├─ People / Staff
├─ Relations
├─ External IDs
├─ Rating Stats
├─ Reviews
├─ Community
└─ User Activity

User
├─ Profile
├─ Following
├─ My List
├─ Scores
├─ Favorites
├─ Anime Follows
├─ Reviews
└─ Community Posts
```

## Supabase

`supabase/mal-scale-schema-v4.sql` は大規模化を想定したDB拡張案です。

**実行前に必ず既存DBをバックアップし、SQLの内容を確認してください。**

フロントエンドにはpublishable keyのみを置き、service_role keyは絶対に置きません。RLSを有効にし、管理者権限はDB側で制御します。

## 大規模化の方針

1. 作品マスターを正規化
2. シーズン・エピソード・スタッフ・ジャンルを分離
3. ユーザーデータを作品データから分離
4. 評価・レビュー・視聴状況を蓄積
5. 統計テーブルでランキングを高速化
6. 検索用ビューを用意
7. キャッシュ・ページネーションを導入
8. 作品数・ユーザー数の増加に応じてDBとホスティングを強化

GitHub Pagesは初期の静的フロントエンド公開用です。アクセス規模や収益化要件が大きくなった段階では、適切なホスティングへ移行します。

## 想定URL

`https://rascal-sakurasou.github.io/media-lively/`
