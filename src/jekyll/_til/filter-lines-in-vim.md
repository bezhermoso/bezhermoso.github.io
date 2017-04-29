---
layout: til
title: Filter lines in Vim
til_category: vim
date: 2016-03-04
og_image: /img/keep/til.png
---

In Vi/Vim, `!` is the portal to the underlying UNIX shell, and with it you can do powerful things. One of them is the ability to filter the lines in a range with an external command:


{% highlight vim %}

:'<'>! grep error
:'<'>! grep '^[A-Z]'

{% endhighlight %}

The first command will filter the selected lines, keeping the ones that contains the text `error` in them. The second one will only keep lines that begins with an upper-case character, etc.

`'<'>` just denotes the range of the visually-selected portion of the document. This can be any valid range, like `%` for the entire document.

