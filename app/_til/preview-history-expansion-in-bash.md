---
layout: til
title: Preview history expansion in Bash
til_category: angular
date: 2016-02-23
og_image: /keep/til.png
---

History expansion in the shell can be a huge productivity-booster. In `zsh`, the expansion can be previewed by hitting the _Tab_ key. This isn't true in `bash`.

<!--stop-->

To get a preview of history expansions in `bash`:

{% highlight bash %}
setopt -s histverify
{% endhighlight %}

With this, hitting the _Return_ key will result in the the expansion being entered into the prompt to be reviewed or edited further if necessary instead of being executed immediately.

> To learn more about history expansion, consult `man history`.

