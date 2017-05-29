---
layout: post
title: "vim-gnupg + Neovim + MacOS and how to get pinentry to work"
---

`vim-gnupg` provides transparent PGP encryption/decryption when editing `*.gpg` *et al* files with `vim`. Sadly, if you are using a TTY-based pinentry your GNUPG setup like `pinentry-curses`, [it won't work](https://github.com/jamessan/vim-gnupg/issues/32) (with no fault from the plugin author).

The trick to get it to work is to somehow tell the `gpg-agent` to use an external pinentry program when triggered by `vim-gnupg`. For this, the `pinentry-mac` program fits the bill:

{% highlight bash %}
$ brew install pinentry-mac
{% endhighlight %}

Configure `gpg-agent` to use it as the pinentry program:

{% highlight bash %}
# ~/.gnupg/gpg-agent.conf:
pinentry-program /usr/local/bin/pinentry-mac
{% endhighlight %}

Configure your shell to use the TTY-based pinentry in most circumstances:

{% highlight bash %}
# ~/.bashrc ~/.zshrc, etc. :

GPG_TTY=$(tty)
# Tell the pinentry program to use the nice, full-screen pinentry program:
PINENTRY_USER_DATA="USE_CURSES=1"
{% endhighlight %}

Restart your terminal application (or source your config file), then restart the `gpg-agent`:

{% highlight bash %}
$ gpgconf --kill gpg-agent
{% endhighlight %}

Now it's just a matter of configuring `vim-gnupg` to override the `PINENTRY_USER_DATA` so that PGP prompts will use the GUI pinentry:

{% highlight vim %}
let g:GPGExecutable = "PINENTRY_USER_DATA='' gpg --trust-model always"
{% endhighlight %}

Now, whenever you edit/write PGP encrypted files in Neovim, the GUI pinentry will be used and `vim-gnupg` should start working as expected.

![GUI pinentry from pinentry-mac](/img/pinentry-mac.png)
