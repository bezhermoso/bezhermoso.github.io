---
title: "Ask nicely: showing a little courtesy to your system\'s authorization policy"
layout: post
og_description: Months ago I found this hilarious and useful bash alias on Twitter which is a real gem.
---

Months ago I found this hilarious and useful bash alias on Twitter which is a real gem. It perfectly
portrays what goes on in my mind when I forget to prefix `sudo` to authorization-sensitive shell commands.

Lately I expanded it a bit more, while also replacing the profanity with a little bit of courtesy. In `.bashrc`:
{% highlight bash %}
pls() {

   echo ''
   echo 'No problem!'
   echo ''

   if [ $# -eq 0 ]
   then
        sudo $(history -p !!)
   else
        sudo $@
   fi
}
{% endhighlight %}

### Usage

The original use-case still works:

{% highlight bash %}
$: service postgresql restart
bash: service: command not found
$: pls

No problem!

[ ok ] Starting PostreSQL 9.1 database server: main.
{% endhighlight %}

But now you can also do this:

{% highlight bash %}
$: pls service postgresql restart

No problem!

[ ok ] Starting PostreSQL 9.1 database server: main.
{% endhighlight %}

