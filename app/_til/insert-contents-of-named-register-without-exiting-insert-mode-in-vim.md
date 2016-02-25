---
layout: til
title: Insert contents of named register without exiting Insert mode in Vim
til_category: vim vimscript
date: 2016-02-24
og_image: /keep/til.png
---

If you want to paste the contents of a named register without exiting _Insert_ mode, hit `<C-r>`, and then the register name.

For example, `<C-r>1` will paste the text that was most recently deleted, `<C-r>0` will paste the text that was most recently yanked, `<C-r>q` will paste the contents of the `q` macro, etc.

This also works while in _Comand-line mode_, too:

{% highlight text %}
:%s/(... hit <C-r>0 to paste in yanked text to replace ...)/<replacement text>/g
{% endhighlight %}

> Alternately, you can just do `<C-o>p` to paste from within _Insert_ mode. (Hitting `<C-o>` will temporarily bring you to _Normal_ mode for one command and dropping you back into
> _Insert_ mode right after.)
>
> See `:help register` for more information on what the various registers contain.



