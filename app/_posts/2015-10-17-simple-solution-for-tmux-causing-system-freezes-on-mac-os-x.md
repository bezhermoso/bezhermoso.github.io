---
title: Simple solution for tmux causing system freezes on Mac OS X
#og_image: /keep/vim-indicator-og.png
layout: post
---

> **2015-10-21 Update:** Version 2.1 of `tmux` has just been release a couple
of days ago and from what I can tell it has addressed this fatal issue! So the
simpler solution would be doing `brew upgrade tmux` to get the recent release.
If you are stuck using 2.0 however, I hope this post is helpful.

What fixed it for me was adding a single line to my `~/.zshrc` and a single line to my `~/.tmux.conf` file:

{% highlight bash %}
# ~/.zshrc
tmux start-server
{% endhighlight %}

{% highlight bash %}
# ~/.tmux.conf
new-session
{% endhighlight %}

It turns out, after trial and error, that the OS freezes (or in worst cases, kernel panics on older OS X versions) usually happen
when you close the very last of all `tmux` pane of the very last `tmux` session.

With these additions to my config files, a `tmux` server is started with an empty `tmux` session whenever I fire up a terminal
window for the first time. This means that I always have an empty `tmux` session -- still active although never used -- even after
I exit out all the sessions I create on a daily basis.

I never had my MacBook Pro grind to a stop as soon as I close out all `tmux`
sessions and having to forcibly turn it off.

This does not fix `tmux`, but is a simple work-around for a problem that has
a potential to incur data loss in the future.

