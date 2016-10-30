---
layout: til
title: Stop and remove Docker containers, and/or delete images, in bulk
til_category: docker
date: 2016-03-09
og_image: /keep/til.png
---

These commands will come in handy at some point in life:

{% highlight bash %}

# Stop running containers, then delete all containers:
docker stop $(docker ps -q) && docker rm $(docekr ps -a -q)

# Delete all images:
docker rmi --force $(docker images -a -q)

{% endhighlight %}

> _Explanation_: The `-q|--quiet` flag will output just the container IDs or image IDs. `-a|--all` will list out all containers, running or otherwise, or list out all images including intermediary layers.
