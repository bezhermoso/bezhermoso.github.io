---
title: "Vim indicator in Powerline theme"
og_image: /keep/vim-indicator-og.png
layout: post
---

<img src="/img/vim-indicator.png">

I find it hard to remember if I stepped in to the shell from `vim` or not. I find myself attempting to open a file only to be told by `vim` that I already have the file open – indeed, I already was editing the file. I just forgot that I stepped into shell via `:sh` a few minutes before. Worst yet are the times when I typed `exit` on my shell thinking that I was coming `vim`, only to find I was wrong because terminal window closes.

I can’t be the only one.

<!--stop-->

I spent some time tweaking my Powerline config to get what I need: an indicator
that tells me whether or not I am currently in `vim` shell or not. As you can see
on the screenshot, this is indicated by a green segment with `:sh` in it.

I am using [ **powerline-status** ](http://powerline.readthedocs.org/en/latest/) to add use Powerline glyphs throughout my
development tools like `zsh`, `vim`, and `tmux`.

Although `powerline-status` doesn’t come with a segment that is specifically
addressed for this, you can repurpose the
`powerline.segments.common.env.environment` segment to show an indicator based on
whether or not the `VIMRUNTIME` environment variable is set.

Inside your `~/.zshrc` (or `.bashrc`, `.bash_profile` or equivalent):

{% highlight bash %}
if [[ -n "$VIMRUNTIME" ]]; then
    export POWERLINE_VIM_SHELL_INDICATOR=':sh'
fi
{% endhighlight %}

Then register an `environment` segment inside your Powerline theme JSON file
and tell it to display `$POWERLINE_VIM_SHELL_INDICATOR`.

For example, this is what your
`~/.config/powerline/themes/shell/default.json` could look like:

{% highlight javascript %}
{
    "segments": {
        "left": [
            {
                "function": "powerline.segments.common.env.environment",
                "args": {
                    "variable": "POWERLINE_VIM_SHELL_INDICATOR"
                },
                "priority": 30
            },
    ...
{% endhighlight %}

Restart Powerline with `powerline-daemon -rq` to make sure the changes take effect.
Open a file in `vim`, step into the shell via `:sh`, and you should see a green
indicator as the left-most segment on your shell.

The only problem I had with this method though is that there isn’t a way to change
the colors in with which the new segment is rendered with.  Theoretically you can
re-define the environment highlight group in your color-schemes JSON file, but
this isn’t a viable solution if you use the environment segment multiple times and
you want each of them styled differently.

## vim-power

Just for kicks I wrote a tiny Python package which allows for easier configuration of `vim`
shell indicators in Powerline by eliminating the need for adding variables into your
environment and has the added benefit of being customizable via its own highlight group.

To get it just do:

{% highlight bash %}
$ pip install --user vim-power --pre
{% endhighlight %}

…and a new segment function `vim_power.segments.in_vim_shell` will be available for you to use.
It can take an option argument `text` which you can use to override what to show in the
segment when in `vim` shell i.e. `:sh`.

Now its just a matter of adding a definition for `in_vim_shell` in color scheme JSON file.

Here is what my `~/.config/powerline/colorschemes/default.json` looks like:

{% highlight javascript %}
{
    "name": "Default",
    "groups": {

        ...

        "in_vim_shell": { "fg": "gray0", "bg": "brightgreen", "attrs": ["bold"] }
    }
}
{% endhighlight %}

`vim-power` also comes with `vim_power.segments.prompt_text`, which I use to
display the `λ` on my shell’s prompt with the ability to target it with styling
using the prompt_text highlight group.

See my `powerline-status` config on GitHub if you want to dig around more:

[https://github.com/bezhermoso/dotfiles/tree/master/.config/powerline](https://github.com/bezhermoso/dotfiles/tree/master/.config/powerline)

Peace!
