---
title: "Keep calm and say `pls`"
layout: post
og_description: Months ago I found this hilarious and useful bash alias on Twitter which is a real gem. I wrote an expansion and made it a bit more polite.
---

Months ago I found [this hilarious and useful bash alias on Twitter](https://twitter.com/liamosaur/status/506975850596536320) which is a real gem. Typing the F word when I
realize I forget to start with `sudo` when I should have is somehow satisfying.

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

<!--stop-->

## Usage

The original use-case still works:

<div class="code">
$: service postgresql restart
<br>
bash: service: command not found
<br>
<br>
$: pls
<br>
<br>
No problem!
<br>
[ ok ] Starting PostreSQL 9.1 database server: main.
</div>

But now you can also do this:

<div class="code">
$: pls service postgresql restart
<br>
<br>
No problem!
<br>
<br>
[ ok ] Starting PostreSQL 9.1 database server: main.
</div>
