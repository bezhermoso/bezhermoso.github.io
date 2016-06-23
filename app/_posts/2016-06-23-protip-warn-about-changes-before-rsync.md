---
title: "Protip: warn about file changes, deletions & additions before rsync"
layout: post
---

I wrote a shell script that wraps `rsync` with a user prompt in cases where files are going to be added, deleted, or changed, which is a scenario when some work might get lost:

`safe-rsync.sh`:

{% highlight bash %}
#!/usr/bin/env bash

args=$@

diffs="$(rsync --dry-run --itemize-changes $args | grep '^[><ch.][dfLDS]')"

if [ -z "$diffs" ]; then
  echo "Nothing to sync."
  exit 0
fi

echo "These are the differences detected during dry-run. You might lose work.  Please review before proceeding:"
echo "$diffs"
echo ""
read -p "Confirm? (y/N): " choice

case "$choice" in
  y|Y ) rsync $args;;
  * ) echo "Cancelled.";;
esac
{% endhighlight %}

### Usage

{% highlight bash %}
> ./safe-rsync.sh --exclude='node_modules/' --recursive --progress --verbose ubuntu@aws-server102:/var/www/html ./html

{% endhighlight %}

To skip the dry-run and just `rsync` regardless of any diffs:

{% highlight bash %}
> yes | ./safe-rsync.sh --exclude='node_modules/' --recursive --progress --verbose ubuntu@aws-server102:/var/www/html ./html
{% endhighlight %}
