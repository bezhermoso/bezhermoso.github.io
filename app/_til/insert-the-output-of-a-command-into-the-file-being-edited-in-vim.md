---
layout: til
title: Insert the output of command into the file being edited in Vim
til_category: vim
date: 2016-03-03
og_image: /keep/til.png
---

`:r <path/to/file>` when executed will read the contents of a file and insert it to where the cursor is in the file being edited. But just like the `:w` command, you can read the output of a command instead. Just prefix the comamnd with `!`.

Here is a quick example:

{% highlight bash %}

:r !echo 'SELECT name, email FROM users ORDER BY created_at DESC LIMIT 10;' | mysql -u root -p app_db

{% endhighlight %}

This will insert the result of the query into the file.

> See `:help :read` for more details.
