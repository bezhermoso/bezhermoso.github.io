---
layout: til
title: Specify additional `ag` options in fzf.vim plugin
til_category: fzf bash
date: 2016-03-11
og_image: /img/keep/til.png
published: true
---

Unlike in `Ag.vim`, `fzf.vim`'s `:Ag` command does not provide the ability to specify additional options to use with _The Silver Searcher_ a.k.a. `ag`. Unfortunately, `fzf` does not use `--exclude-vcs-ignores` by default despite it being useful for programmers i.e. search file contents under a vendor directory or a mount, for example.

The way to do it in `fzf.vim` is to create a custom command that will pass the `-U|--exclude-vcs-ingores` to the underlying `ag` call:

{% highlight vim %}

command! -bang -nargs=* Agu call fzf#vim#ag(<q-args>, '--skip-vcs-ignores', {'down': '~40%'})

{% endhighlight %}

With this in `~/.vimrc`, it is now possible to search the contents of a project by using `:Agu` instead of `:Ag`. The search will no longer ignore files that are  in `.gitignore` or any other VCS ignore lists.

> See [_The Silver Searcher_](https://github.com/ggreer/the_silver_searcher) and [`fzf.vim`](https://github.com/junegunn/fzf.vim).
