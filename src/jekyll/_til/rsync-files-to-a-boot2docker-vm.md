---
layout: til
title: Rsync files to a boot2docker VM
til_category: rsync bash
date: 2016-03-02
og_image: /img/keep/til.png
---

`rsync` is usually a smarter choice for syncing code from the host machine to a directory inside a VM compared to `scp`, and is a lot performant than relying on an NFS share to sync files.

{% highlight bash %}

rsync --recursive --delete --relative \
    --rsh "ssh -i $DOCKER_CERT_PATH/id_rsa" \
    code/ docker@$(docker-machine ip default)/opt/volumes/my_service/

{% endhighlight %}

The key concept here is the use of the `--rsh` option, which allows you to specify the proper SSH command using the necessary identity file. `DOCKER_CERT_PATH` is an environment variable that gets set when we do `eval $(docker-machine env default)` to get Docker commands to work against the Docker daemon on the `boot2docker` instance.

> See `man rsync` and [Docker Machine](https://docs.docker.com/machine/get-started/)

