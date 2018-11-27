---
layout: til
title: Move a tmux pane from one window to another
til_category: vim
date: 2016-03-08
og_image: /img/keep/til.png
---

As the day gets busier, a `tmux` session could really need some little re-organization. To tidy things a bit, you can move a pane from one crowded window to another using `join-pane`.

It requires two steps:

1. break the pane out via `break-pane`. This is bound to `<prefix> !` by default.
2. Execute this in the `tmux` command-line: `:join-pane -t <int>`, where `<int>` is the index of the window you want to move it into. You can optionally specify `-h` or `-v` to explicitly tell
`tmux` to attach the current pane as a horizontal-split or a vertical-split on the target window, respectively.

> For more info, consult `man tmux`.
