---
"@storywright/cli": minor
"@storywright/report": minor
---

Add lazy loading and image preload to report, fix CLI version injection

- DiffCard に IntersectionObserver を導入し、ビューポート付近に入るまで画像を読み込まないようにした
- ImageTabs で全タブの画像を非表示 img で同時にプリロードし、タブ切り替えを瞬時にした
- CLI のバージョンを package.json からビルド時に自動注入するようにした
