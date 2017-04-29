---
layout: til
title: Vim function ranges
til_category: vim vimscript
date: 2016-02-16
og_image: /img/keep/til.png
---

If you are writing a custom function in Vimscript that operates on a range, 
you may not want to rely on the `'<,'>` range to get the visual selection
because it can also refer the *previous* selection which you are no longer
interested in.

To ensure that you are only operating on the *current* visual selection, mark
your function as a range function by adding `range` after the argument list:
<!--stop-->

{% highlight vim %}
{% raw %}
"Convert GitHub-Flavored Markdown syntax-highlighting to Liquid syntax-highlighting.
function! ConvertToLiquidHighlighting() range
  silent! execute a:firstline . "," . a:lastline . 's/^```\([a-z]\+\)$/{% highlight \1 %}/g'
  silent! execute a:firstline . "," . a:lastline . 's/^```$/{% endhighlight %}/g'
endfunction

"Convert within visual selection
vnoremap <leader>H :call ConvertToLiquidHighlighting()<cr>
"Convert entire file
nnoremap <leader>H  :0,$call ConvertToLiquidHighlighting()<cr>
{% endraw %}
{% endhighlight %}


With the `range` keyword in place, the `a:firstline` and `a:lastline` will be available within
the function and will contain the line numbers of
the current visual selection's first line and the last line, respectively.

> `:help func-range` for more info.
