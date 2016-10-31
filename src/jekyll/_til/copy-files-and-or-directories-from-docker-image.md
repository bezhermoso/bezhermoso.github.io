---
layout: til
title: Copy files and/or directories from a Docker image
date: 2016-10-16
til_category: docker
og_image: /img/til.png
---

I found myself needing to copy a bunch of files and directories straight from a Docker image. There is a trivial solution in the form of `docker cp`, but I came up with an alternative using `docker run`:

{% highlight bash %}
$ docker run --rm <IMAGE NAME> \
   tar -cf - <SRC_PATH_1> [<SRC_PATH_2> ...] | tar -xvC - <DEST_PATH>
{% endhighlight %}

This alternative has a few advantages over `docker cp`:

* `docker cp` requires absolute paths. This supports paths relative to the image's `WORKDIR`.
* `docker cp` copies from a container, not an image. This alternative does not require a running container, nor do you need to run `docker create` and having to clean it up later (a container is still being created here, but the `--rm` flag will take care of cleaning it up after use).
* You can copy multiple paths in one go.
* You get an progress/activity indicator for free, thanks to the `-v` flag in the `tar` command.  A list of filenames as they are being extracted to the destination folder.

There is one _caveat_, however: depending on your image's configuration, you might encounter this error:

{% highlight bash %}
$ docker run --rm ...
tar: Unrecognized archive format
{% endhighlight %}

This happens if you have an `ENTRYPOINT` that is polluting the `tar` output stream. If you can't configure your `ENTRYPOINT` to be completely silent when acting in "`bash` pass-through mode", you can chose to just bypass it during `docker run` execution:

{% highlight bash %}
$ docker run --rm --entrypoint= <IMAGE NAME> tar -cf ...
{% endhighlight %}

#### Bonus

This command can potentially produce a ton of output if you are copying a massive amount of files. You can, of course, omit the `-v` flag from the `tar` command. However, you can keep the `-v` flag on but tack this to the end of the command:

{% highlight bash %}
     2>&1 | while read l; do echo -ne "\033[2K\r$l"; done; echo '...done!'
{% endhighlight %}

This reduces the output into a single-line: a "ticker" that displays the filenames as they are being extracted. This way, you don't lose the perk of having an activity indicator.



