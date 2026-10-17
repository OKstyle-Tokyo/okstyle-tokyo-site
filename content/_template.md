---
# ===== 新しい記事のテンプレート =====
# 1. このファイルを content/posts/<id>.md にコピーする（例: content/posts/6001.md）
# 2. 下の項目を書き換える（# で始まる行はコメントなので消してOK）
# 3. main に push すると自動でサイトに出る
#
# id      : 記事の番号。URL が /posts/<id>/ になる。他の記事と重ならない数字にする
#           （旧記事は最大 5048。新しい記事は 6001 から順に使うのがおすすめ）
# date    : 公開日時（日本時間）。新しい順の並びに使う
# section : 載せる場所。次のどれか1つ
#             iot / monozukuri / vr  → LAB
#             splatoon               → PLAY
#           （PLAY のジャンルを増やすときは lib/taxonomy.js の SECTIONS に足す）
# format  : markdown と書くと本文を Markdown で書ける。消すと本文は HTML としてそのまま出る
# featured: 一覧カードに出すサムネイル画像。images/<年>/ に置いて /images/<年>/<ファイル名> と書く
# excerpt : 一覧や検索結果に出す短い説明（1〜2文）
id: 6001
title: "記事のタイトル"
date: "2026-10-18T21:00:00"
section: iot
format: markdown
tags: ["タグ1", "タグ2"]
featured: "/images/2026/sample.jpg"
excerpt: "この記事の短い説明。"
---

ここから本文です。Markdown で書けます。

## 見出し

文章は普通に書けば段落になります。**太字** や [リンク](https://example.com) も使えます。

画像は images/<年>/ に置いて、`/images/...` で指定します（サブパス配信でも自動で正しいURLになります）。

![画像の説明](/images/2026/sample.jpg)

YouTube は URL だけの行を書くと埋め込みになります。

https://youtu.be/XXXXXXXXXXX
