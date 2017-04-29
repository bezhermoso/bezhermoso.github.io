---
layout: til
title: View CSV files in the command-line the right way
til_category: unix command-line
date: 2016-02-18
og_image: /img/keep/til.png
---

I usually open CSV files in _Micrsoft Excel_ even if I only want to take a quick
peek. Not anymore:

<!--stop-->

{% highlight bash %}
column -s, -t path/to/file.csv | less -#5 -NS
{% endhighlight %}

> Use `column -s'","' -t ...` if columns are wrapped in quotes.
