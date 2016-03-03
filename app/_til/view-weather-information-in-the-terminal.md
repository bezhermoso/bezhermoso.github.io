---
layout: til
title: View weather information in the terminal
til_category: bash
date: 2016-03-01
og_image: /keep/til.png
---

If you prefer your weather info in text and ASCII-art form, this is the command for you:

{% highlight bash %}

curl -4 http://wttr.in/New_York

{% endhighlight %}

Not only does the website display weather information purely with text and ASCII-art, it also
looks identical when pulling it in with `curl` if you are so inclined.

The location is optional. It will do its best to guess where you are if you omit it.


> See [http://wttr.in](http://wttr.in)
