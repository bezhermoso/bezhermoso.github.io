---
layout: til
title: Watch file size change
date: 2016-08-12
til_category: unix
og_image: /img/keep/til.png
---

If you have a file of ever growing size i.e. an in-progress download or compressed `tar` file, use this command:

{% highlight bash %}
$ watch du -h /path/to/file.tar.gz
{% endhighlight %}

This will show file size updates every 2 seconds. You can adjust the refresh frequency by passing in `-n <SECONDS>` to the `watch` command i.e. `watch -n 10 du -h /path/to/file.tar.gz`


