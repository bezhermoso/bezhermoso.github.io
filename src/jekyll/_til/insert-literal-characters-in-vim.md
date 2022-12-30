---
layout: til
title: "Insert literal characters in Vim"
til_category: vim
date: 2022-12-29
og_image: /img/keep/til.png
---

In the rare occasion that I need to insert a tab character while having `expandtab` on, the `C-v` command in Normal mode comes in handy:

```vim
# While in Normal mode, <C-v> signals vim that the next key-press is to be inserted literally:
<C-v><TAB>
```
