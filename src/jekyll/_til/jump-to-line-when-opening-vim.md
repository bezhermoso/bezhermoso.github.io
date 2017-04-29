---
layout: til
title: Jump to a line when opening Vim
til_category: vim
date: 2016-03-14
og_image: /img/keep/til.png
published: true
---

This comes in handy when debugging stack traces. To open a file and jump to line 47:

{% highlight bash %}
vim +47 /path/to/file.rb
{% endhighlight %}

If you are already inside Vim, you can do this instead:

{% highlight vim %}
:e +47 /path/to/file.rb
{% endhighlight %}


> This goes back to [this TIL](/til/jump-to-line-when-opening-vim %}) and is just an application of exactly the same concept.



