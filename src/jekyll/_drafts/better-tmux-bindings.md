---
layout: post
title: "tmux bindings, with some sense"
---

If there is one tool I use the most, it has to be `tmux`. I do almost everything _in_ it.

However, as useful as it is, I feel like its not very user-friendly out-of-the-box. This post is a collection of things in my `~/.tmux.conf` that makes `tmux` easier to use and to bring its more powerful capabilities within closer reach.

<br>

## A better prefix

{% highlight bash %}
set -g prefix C-s
{% endhighlight %}

`C-s` requires far less finger-flinging than the default `C-b` -- the keys are close enough together, and it doesn't conflict with any key-sequence I commonly use. This is extra awesome with `Capslock` to `Ctrl`.

> `Ctrl + s` is typically bound in terminals to "stop output to screen". I can live without it, as entering  "Visual Mode" in `tmux` is a functional alternative.

Alternatively, here is a more advanced configuration that does the same thing except when you are in an active SSH connection:

{% highlight bash  %}
if-shell '[ -z "$SSH_TTY" ] && [ -z "$SSH_CLIENT" ] && [ -z "$SSH_CONNECTION" ]' \
    'set -g prefix C-s' ''
{% endhighlight %}

This is particularly handy if you are using the same `tmux` configuration file in remote machines you SSH into. If you running `tmux` on a remote server while `tmux`ing on your local machine, the default prefix `C-b` will allow you to operate on the remote `tmux` session.

<br>

## Fix clipboard integration on macOS + vi-style bindings

Support for copying and pasting to the system clipboard doesn't quite work on macOS. Thankfully, getting it to work takes very little effort.

First you need to install the `reattach-to-user-namespace` program. You can grab it straight from Homebrew:

{% highlight bash %}
$ brew install reattach-to-user-namespace
{% endhighlight %}

Add this to `~/.tmux.conf` and you are off to the races:

{% highlight bash %}
# Check whether we are on macOS / OS X
if-shell 'test "$(uname)" = "Darwin"' \
  'set-option -g default-command "reattach-to-user-namespace -l zsh"' ''

# vi bindings in copy-mode
setw -g mode-keys vi

# Bind `v` to enter VISUAL-like selection mode.
bind-key -t vi-copy v begin-selection
bind-key -t vi-copy y copy-pipe "reattach-to-user-namespace pbcopy"

{% endhighlight %}

<br>

## Intuitive window splitting

{% highlight bash %}
# Horizontal split (left & right):
bind-key \ split-window -h -c '#{pane_current_path}'
# Verical split (top & bottom):
bind-key - split-window -v -c '#{pane_current_path}'
{% endhighlight %}

Compared to the default `<prefix> %` and `<prefix> "`, these bindings makes which way splits occur _really_ obvious. The `-c #{pane_current_path}` argument passed will start new splits in the same working directory you are on.

As of version 2.3, `split-window` now understands the `-f` flag, which indicates full-width or full-height splits. These are perfect when you want a "scratch" shell to appear on the bottom or to the right of everything else:

{% highlight bash %}
# For tmux 2.3 or newer
# Full-height horizontal split with 33% width:
bind-key | split-window -fh -c '#{pane_current_path}' -p 33
# Full-width vertical split with 33% height:
bind-key _ split-window -fv -c '#{pane_current_path}' -p 33
{% endhighlight %}


<br>

## Tiered navigation controls

{% highlight bash %}

# Move between windows/tabs with `o` and `p`:
bind-key -r p next-window
bind-key -r o previous-window

# Move between splits vi-style:
bind-key -r h select-pane -L
bind-key -r j select-pane -D
bind-key -r k select-pane -U
bind-key -r l select-pane -R

{% endhighlight %}

Although the default `<prefix> n` and `<prefix> p` are easier to remember (_"next"_ and _"previous"_), I find moving between windows faster with `<prefix> o` and `<prefix> p` as they are right next to each other. I happen to like vim-style cursor movements, so binding split navigations to `<prefix> {h,j,k,l}` is just logical.

With this configuration,  the navigation controls are tiered:

1. ___Pane navigation___: I can use home-row keys in vi-like bindings to move between panes in the current window.
2. ___Window navigation___: I can find `o` and `p` right above the home-row keys to move between windows or "tabs" in the current session.
3. ___Session navigation___: Above `o` and `p` I can use the parentheses keys to move between various sessions.

> The `-r` flag marks the bindings repeatable -- this means they will not bring you out of prefix-mode after invocation, allowing you to repeat them or even invoke other bindings right after.

<br>

## Moving panes to another window

It's possible to move panes between different windows using `join-pane`. However it is slightly cumbersome to use (you have to pass in the window's index as the `-t` argument). However using `choose-window` makes it as easy as selecting a window from a list:

{% highlight bash %}

# Move pane to a different window. You can choose window from a list:
bind-key m choose-window -F "#{window_index}: #{window_name}" "join-pane -h -t %%"
bind-key M choose-window -F "#{window_index}: #{window_name}" "join-pane -v -t %%"

# Swap windows. Choose window to swap with from a list:
bind-key c-w choose-window -F "#{window_index}: #{window_name}" "swap-window -t %1"

{% endhighlight %}

You can pick a window from a list and the current pane will be sent there as a horizontal split. `<prefix> M` will do the same, but will result in a vertical split.

`<prefix> C-w` in will bring up a list of all windows. The current window will swap places with the one you select.

<br>

## Resizing panes

{% highlight bash %}
# Resize panes directionally via vi-style bindings
bind-key -r C-k resize-pane -u 5
bind-key -r C-j resize-pane -d 5
bind-key -r C-h resize-pane -l 5
bind-key -r C-l resize-pane -r 5
{% endhighlight %}

These binds `<prefix> C-{h,j,k,l}` to resize the current window by 5 columns or rows, depending on the direction. I find resizing 1 unit at a time takes a bit too long and I rarely need precise control. Resizing by 5 units is just right.

<br>

## Natural numbering

Speaking of window indices, `tmux` starts numbering things at 0. Zero-based index is second nature to programmers and all, but the `0` key does not appear next to `1` on any keyboard. It's awkward for this purpose.
I think its more natural to have `tmux` starting counting from 1:

{% highlight bash %}
# Begin numbering at 1:
set -g base-index 1
set -g pane-base-index 1

# Maintain ordinality after swapping windows; and also make sure there is no gaps after killing windows:
set -g renumber-windows on
{% endhighlight %}

## Closing panes & windows

`<prefix> x` to close the pane, `<prefix> X` to close the window, and `<prefix> Q` to quit the session:

{% highlight bash %}
bind-key x confirm-before -p "kill-pane #P? (y/n)" kill-pane
bind-key X confirm-before -p "Kill window #W? (y/n)" kill-window
bind-key Q confirm-before -p "Kill session #S? (y/n)" kill-session
{% endhighlight %}

A prompt will be presented to confirm the action.

## Synchronize panes

Another neat trick that `tmux` can do is synchronizing key-strokes across all panes in a window. I thought `<prefix> &` is an apt binding to toggle the behavior:

{% highlight bash %}
bind-key & set-window-option synchronize-panes
{% endhighlight %}




