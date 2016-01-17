---
title: A crash course on bash history completion
#og_image: /keep/vim-indicator-og.png
layout: post
---

In my opinion, if there is one thing that you could do to bring your bash game to the next level,
it would be learning **history completions**. If you are like me who spend a huge chunk of your time doing things on the terminal, being proficient with them will save a lot of time.

## Basic Expansions

### `!!` - Most recent command

This is especially useful if you forgot to use `sudo`:

{% highlight bash %}
~:$ apt-get update

E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)
E: Unable to lock directory /var/lib/apt/lists/
E: Could not open lock file /var/lib/dpkg/lock - open (13: Permission denied)
E: Unable to lock the administration directory (/var/lib/dpkg/), are you root?

~:$ sudo !!
sudo apt-get update
Ign http://us-west-2.ec2.archive.ubuntu.com trusty InRelease
Get:1 http://us-west-2.ec2.archive.ubuntu.com trusty-updates InRelease [64.4 kB]
...
{% endhighlight %}

### `!$` - Right-most (last) argument of most recent command

{% highlight bash %}
~:$ touch script.sh
~:$ chmod +x !$
chmod +x script.sh
~:$ vi script.sh
{% endhighlight %}

### `!-n` - Execute `n`th most recent command

{% highlight bash %}
~: $ sudo service apache2 start
apache2: unrecognized service

~:$ sudo apt-get install apache2

...

~:$ !-2
sudo service apache2 restart
/etc/apache2/sites-available:$ 
{% endhighlight %}
{% highlight bash %}
$ mkdir -p /Projects/OpenSource/cool-idea
$ cd !$
cd /Projects/OpenSource/cool-idea
$ git init .
Initialized empty Git repository in /Projects/OpenSource/cool-idea
$ vi README.md
{% endhighlight %}
