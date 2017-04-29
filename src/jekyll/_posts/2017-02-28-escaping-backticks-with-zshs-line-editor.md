---
layout: post
title: "Escaping backticks with the zsh line editor"
---

I just wrote my very first `zsh` plugin this week, and it has proven to be quite useful -- I like to wrap identifiers/symbols in commit messages with backticks and often-times neglect to escape them. This would result in the identifier/symbol being evaluated, which is not what I want to happen.

Here is my solution:

{% highlight bash %}
# Expands `` to \`
function expand-double-backtick-to-escaped-backtick {
  if [[ $LBUFFER = *[^\\]\` ]]; then
    zle backward-delete-char
    LBUFFER+='\`'
    # Bind backspace to something that undos the escape.
    bindkey '^?' undo-escaped-backtick-or-backward-delete-char
  else
    LBUFFER+='`'
  fi
}

function undo-escaped-backtick-or-backward-delete-char {
  if [[ $LBUFFER = *\` ]]; then
    # If chars to the left is an escaped backtick, unescape it.
    zle backward-delete-char
    zle backward-delete-char
    LBUFFER+='`'
  fi
  # Rebind backspace to default behavior
  bindkey '^?' backward-delete-char
}

zle -N expand-double-backtick-to-escaped-backtick
zle -N undo-escaped-backtick-or-backward-delete-char

bindkey "\`" expand-double-backtick-to-escaped-backtick
{% endhighlight %}

<!--stop-->

Now when I need an escaped backtick, I only have to type the backtick character twice. Also, hitting `Backspace` will undo the escaping instead of leaving me with just a backslash.

---

I have put this script in a Git repo which you can find here: [https://github.com/bezhermoso/zsh-escape-backtick](https://github.com/bezhermoso/zsh-escape-backtick). If you want to try it, just clone it and source `escape-backtick.zsh` and you should be good to go.

