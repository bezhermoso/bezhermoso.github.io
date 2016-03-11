---
layout: til
title: Fuzzy-find all the things!
til_category: fzf bash
date: 2016-03-10
og_image: /keep/til.png
published: true
---

There is nothing much to say other than that _junegunn_'s `fzf` is an awesome utility. It accepts a list of things and provides an interface to fuzzy-find through them. Its output is simply the string that you have selected. It's a perfect embodiment of the perfect UNIX program -- it does one thing and one thing well.

Here is a super simple example:

{% highlight  bash %}

ps aux | fzf | awk 'print $2' | xargs kill

{% endhighlight %}

We are piping the output of `ps aux` -- a list of running processes -- into `fzf`, which allows you to fuzzy-find through them. Once you find the process that you like and hit `Return`, the line is piped into `awk 'print $2'` which grabs the PID (which is the second column, hence `$2`). The PID is then ultimately piped into `xargs kill` which results in exactly what we want: `kill <PID>`.

Another quick, illustrative example: `vim $(find . | fzf)`: fuzzy-find among the files in the current working directory and edit it in Vim.

> These example are here more for illustrating the nature of `fzf`, and by no means bug-free. See [`fzf`](https://github.com/junegunn/fzf), especially the the [various Examples sections](https://github.com/junegunn/fzf/wiki/Examples), to see
> full-fledged, battle-hardened implementations of similar functionality.
>
> If you are using `ctrlp.vim`, `command-t` or similar Vim plugins, check out [`fzf.vim`](https://github.com/junegunn/fzf.vim).
