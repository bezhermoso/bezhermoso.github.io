---
layout: til
title: Backup remote files directly unto local filesystem
date: 2016-08-19
og_image: /keep/til.png
til_category: linux
---

The trick is to execute `tar` on the remote server and telling it to output to standard output, and piping the output straight to a file on the local filesystem:

{% highlight bash %}
$ ssh <USER>@<HOST> tar -czvf /remote/path/to/backup > /path/to/local/backup.tar.gz
{% endhighlight %}

This will operate exactly as if the `tar ... > ...` command was executed within the remote server, except on that the destination file is written directly on your local machine. This is extremely useful when backing up files from the remote server that you'd like to clean up to free up some space later without having to use up additional space which might be limited already.

To check the uncompressed size of the `tar.gz` file in MB without having to extract it into the filesystem:

{% highlight bash %}
$ tar -xzf /path/to/local/backup.tar.gz --to-stdout \
   | wc -c \
   | (read size; echo "scale=2; $size/1024^3" | bc)
{% endhighlight %}
> `scale=2` tells `bc` to show up to 2 decimal places. It defaults to floor it to the nearest ones place.

You can check the total file size of the remote directory against this to verify you got everything:

{% highlight bash %}
$ ssh <USER>@<HOST> -- du -bs /remote/path/to/backup \
   | (read size _; echo "scale=2; $size/1024^3" | bc)
{% endhighlight %}

> See `man ssh`, `man tar`, & `man du`
