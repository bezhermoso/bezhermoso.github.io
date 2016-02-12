---
layout: post
title: Get width of window from within tmux
til_category: tmux
date: 2016-12-02
---

In most circumstances, you can get the width of the terminal window using the
comamnd `tput cols`. However I discovered that this doesn't quite work as
expected if you try it as part of your `status-right` or `status-left`
configuration (and pretty much in any other format strings in `tmux`.) I tried
to implement something that auto-hides certain items on my status-line when the
iTerm2 narrows down to a particular size, but `tput cols`
_always_ return the value `80`.

To properly get the window width, you will need to use the `window_width`
property that is available in all format strings:

{% highlight bash %}
#!/usr/bin/env zsh

local window_width=$(tmux display-message -p "#{window_width}")

# Only attach certain items if window width is greater or equal to 180 columns
if [[ $window_width -ge 180 ]]; then
 ...
{% endhighlight %}

