# Supabase setup

1. 既存の `schema.sql` を確認。
2. `mal-scale-schema.sql` をSupabase SQL Editorで実行。
3. Auth > ProvidersでEmailを有効化。
4. 初回管理者を作成後、`profiles.is_admin` をSQLで明示的にtrueにする。
5. animeテーブルに `season_year`, `season`, `poster_url` 等を投入。
6. RLSを有効にしたまま、公開データとユーザー所有データを分離する。

本番公開前にRLSを必ず確認してください。
