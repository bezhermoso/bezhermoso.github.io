---
layout: til
title: View CSV files in the command-line the right way
til_category: unix command-line
date: 2016-02-18
---

I usually open CSV files in Micrsoft Excel even if I only want to take a quick
peek. Not anymore:

{% highlight bash %}
$ cat path/to/file.csv | column -s, -t | less -#5 -NS
{% endhighlight %}
