---
title: Fix errors when building PHP 5.6.14 with phpbrew on Mac OS X
#og_image: /keep/vim-indicator-og.png
layout: post
---

Last night I decided to make the switch from using purely Homebrew to
manage my local machine's PHP version to using
[__phpbrew__](https://github.com/phpbrew/phpbrew). However the switch was
without any issues.

I needed to install PHP version 5.6.14 with `mcrypt`:

{% highlight bash %}
> phpbrew install 5.6.14 +default+mcrypt
{% endhighlight %}

However the build process keeps failing. Inspecting the build log gives me the following errors
at different stages of troubleshooting:

{% highlight text %}
configure: error: Cannot find OpenSSL's <evp.h>
{% endhighlight %}

{% highlight text %}
configure: error: Please reinstall the BZip2 distribution
{% endhighlight %}

{% highlight text %}
ld: symbol(s) not found for architecture x86_64 clang: error: linker command failed with exit code 1 (use -v to see invocation) make: *** [sapi/cli/php] Error 1
{% endhighlight %}

## Solution

What I ended up having to do was re-install XCode Command-Line Tools and install
a few libraries via Homebrew (because apparently, OS X does not ship them, or
ship older versions):

{% highlight bash %}
> xcode-select --install
> brew install openssl libxml2 mcrypt
> brew link openssl libxml2 --force
{% endhighlight %}

And that's it! The build completed, and now I have PHP 5.6.14 available
whenever I want it.

If you are encountering these errors, I hope this helps you. Or if you haven't attempted it yet but are planning to build PHP with
`phpbrew`, I hope this will save you the trouble.

_Happy coding!_
