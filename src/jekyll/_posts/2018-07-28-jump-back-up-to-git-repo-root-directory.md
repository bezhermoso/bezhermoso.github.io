---
layout: post
title: "Jump back up to your Git repo's root directory"
---

You want to jump back up to your project's root directory from who knows many levels down. What would you do? Figure out the right amount of levels to `cd ../../..` up? Run `cd ..` repeatedly until you get there? or run `cd` to an absolute path directly?

If your project is managed with Git, here is a smarter way:

{% highlight bash %}
$ cd $(git rev-parse --show-toplevel)
{% endhighlight %}

The command `git rev-parse --show-toplevel` is a Git plumbing command that outputs the absolute path of the Git repository root of the project you are in. Therefore the most straight-forward form is to use its result as the argument for `cd`. **No more repeating commands, figuring out exactly how far up the root is, or having to type out paths!**

The next obvious step is to make an alias of that command in your `.bashrc` or equivalent file:

{% highlight bash %}
# Mnemonic: `gr` == `git root`
# Also note the single-quotes; you don't want the sub-command to run on alias definition!
alias gr='cd $(git rev-parse --show-toplevel)'
{% endhighlight %}

From here on out, just run `gr` anytime you need to jump all the way up to your project root.

We can take it a little further...

---

What used to be this `gr` alias on my rc file evolved into a full-on shell function that handles some edge-cases:

  * Do nothing when I'm not in the project root instead of spitting an error and jumping to `/`
  * Be smart with Git submodules: if already in a repo's root, jump up to the nearest parent repo in the tree, if any.

Here it is in it's current form in my rc file ([I hosted this on Github](https://github.com/bezhermoso/jump-to-git-root) if you'd like to clone it instead):

{% highlight bash %}

function jump-to-git-root {
  local _root_dir="$(git rev-parse --show-toplevel 2>/dev/null)"
  if [[ $? -gt 0 ]]; then
    >&2 echo 'Not a Git repo!'
    exit 1
  fi
  local _pwd=$(pwd)
  if [[ $_pwd = $_root_dir ]]; then
    # Handle submodules:
    # If parent dir is also managed under Git then we are in a submodule.
    # If so, cd to nearest Git parent project.
    _root_dir="$(git -C $(dirname $_pwd) rev-parse --show-toplevel 2>/dev/null)"
    if [[ $? -gt 0 ]]; then
      echo "Already at Git repo root."
      return 0
    fi
  fi
  # Make `cd -` work.
  OLDPWD=$_pwd
  echo "Git repo root: $_root_dir"
  cd $_root_dir
}

# Make short alias
alias gr=jump-to-git-root
{% endhighlight %}

