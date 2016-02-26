---
layout: til
title: Coordinate tmux windows with `send-keys`
til_category: vim vimscript
date: 2016-02-25
og_image: /keep/til.png
---

I use `tmux` throughout the day and booting up Vagrant machines is a constant part of my daily workflow. Often times I want to create two additional splits: one for SSHing into the machine/containers, and the other one to display some real-time logs. I used to wait until the Vagrant machine is all booted up before I can manually create the splits and type in the commands -- until I learned about `send-keys`:
<!--stop-->
{% highlight bash %}

vagrant up \
&& tmux split-window -h -c "$PWD"; tmux send-keys -t 2 "vagrant ssh" C-j \
&& tmux split-window -h -c "$PWD"; tmux send-keys -t 3 "vagrant ssh -c 'tail -f /var/logs/app.log'" C-j \
&& tmux select-layout even-horizontal \
&& tmux split-window -v -c "$PWD"; tmux send-keys -t 4 "vagrant rsync-auto" C-j

{% endhighlight %}

Since these commands are ran sequentially, the commands executed within the new `tmux` splits are assured to work because the VM should already be up and running.

This is very useful when you are using something like `tmuxinator` to manage and automate the creation of `tmux` sessions on a project-to-project basis.

> `tmux select-layout even-horizontal` will even out the width of the horizontal splits before the vertical split is created. This assures that you get nicely spaced-out windows.
>
> See `man tmux` and [`tmuxinator`](https://github.com/tmuxinator/tmuxinator).


