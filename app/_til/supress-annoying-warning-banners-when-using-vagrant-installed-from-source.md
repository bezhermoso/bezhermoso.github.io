---
layout: til
title: Supress annoying warning banners when using Vagrant installed from source
til_category: vagrant
date: 2016-07-14
og_image: /keep/til.png
---

If you installed Vagrant from source and you are getting annoyed by this warning banner:

{% highlight bash %}

  You appear to be running Vagrant outside of the official installers.
  Note that the installers are what ensure that Vagrant has all required
  dependencies, and Vagrant assumes that these dependencies exist. By
  running outside of the installer environment, Vagrant may not function
  properly. To remove this warning, install Vagrant using one of the
  official packages from vagrantup.com.
{% endhighlight %}


Just add this to your `.zprofile` (or `.bash_profile`, whichever file applies to your shell):

{% highlight bash %}
if [[ -n "$(vagrant -v | grep '\.dev$')" ]]; then
  export VAGRANT_I_KNOW_WHAT_IM_DOING_PLEASE_BE_QUIET=true
fi
{% endhighlight %}
