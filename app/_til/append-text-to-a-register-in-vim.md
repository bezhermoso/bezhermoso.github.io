---
layout: til
title: Append text to a register in Vim
til_category: vim vimscript
date: 2016-02-17
---

Yanking and cutting text overwrites the previous contents of the register by default. But for named
registers, there is a way to append yanked/cut text to the the clipboard
instead. The trick is using the upper-case version of the register name:

<!--stop-->

{% highlight text %}
"ayy // Yanks current line to the named register `a`
"Ayy // Yanks and appends current line to the named register `a`.
"Ayap // so on and so forth...
{% endhighlight %}

> For more info on Vim registers: `:help registers`
