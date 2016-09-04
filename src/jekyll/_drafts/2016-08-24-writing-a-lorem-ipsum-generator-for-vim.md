---
title: "Writing a lorem ipsum generator for Vim"
layout: post
---

# Preface

It should be said that there are existing -- and with high probability much better written - plugins for generating Lorem Ipsum in `vim`, namely [`loremipsum`](http://www.vim.org/scripts/script.php?script_id=2289) and [`vim-fake`](http://vim.sourceforge.net/scripts/script.php?script_id=5322) which you can install to get similar functionality. But where is the fun in that? ;) I found it is so easy to write one. If anything, let this be a demonstration of how easy it is to add functionality to `vim` using Vimscript and taking advantage of the underlying UNIX environment.


## Step 1: Install `lorem-ipsum`

`lorem-ipsum` is an `npm` package that provides an executable which we can use to generate the dummy text.

{% highlight bash %}
$ npm install lorem-ipsum --global
{% endhighlight %}

## Step 2: Integrate into `vim`

Here is one way to integrate the `lorem-ipsum` executable into `vim` for easy use:

{% highlight vim %}

" Only register functions & commands if `lorem-ipsum` is installed.
if executable("lorem-ipsum")
    " Function to interface with the executable.
    function! LoremIpsum(args)
      return systemlist("lorem-ipsum " . a:args)
    endfunction

    " Insert dummy text starting from current line.
    function! InsertLoremIpsum(args)
      let cline = line('.')
      let ccolumn = col('.')
      execute append(line('.'), LoremIpsum(a:args))
      call cursor(cline, ccolumn)
    endfunction

    " Ex. `:Lorem 10 paragraphs` will insert 10 pargraphs of lorem ipsum
    command! -nargs=* Lorem call InsertLoremIpsum('<args>')
endif
{% endhighlight %}

With these 10-20 lines of Vimscript in place, we can already do numerous things:

1. Insert 3 paragraphs of _"lorem ipsum"_:

{% highlight vim %}
:Lorem 3 paragraphs
{% endhighlight %}

2. Replace contents of HTML tag with dummy text:

{% highlight vim %}
" In NORMAL mode with the cursor on or inside an HTML tag...
cit<C-r>=LoremIpsum("100 words")<Return>

{% endhighlight %}









