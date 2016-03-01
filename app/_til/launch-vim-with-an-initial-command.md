---
layout: til
title: Launch Vim with an init command
til_category: vim vimscript
date: 2016-02-26
og_image: /keep/til.png
---

To launch Vim and have a command executed as soon as it starts, prefix the command with a `+` and pass it as an argument. For example:

<!--stop-->

{% highlight bash %}
vim +digraphs
{% endhighlight %}

This is equivalent to doing `:digraphs` as soon as Vim starts. Commands can be chained as well. Say you have [`XtermColorTable`](https://github.com/guns/xterm-color-table.vim) installed:

{% highlight bash %}
alias colortable='vim +XtermColorTable +only'
{% endhighlight %}

Executing `colortable` in your shell will launch Vim showing a color table occupying the full-window instead of the plugin's default
vertical split, thanks to `:only`.
