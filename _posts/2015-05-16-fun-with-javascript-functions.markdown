---
title: "High-order functions, currying, and more fun with functions in Javascript"
layout: post
---

[Functional programming](http://en.wikipedia.org/wiki/Functional_programming) is the new buzz lately. It's an interesting paradigm for solving problems and departs quite a bit from familiar concepts programmers like me who use object-oriented languages are used to.

Just like object-oriented programming, it has its own sets of sub-paradigms, design principles, and philosophies. There is too much of them to discuss in a blog post and I myself has only barely scratched the surface, but two concepts has stood
out to me so far -- its the concept of _high-order functions_ and _function currying_. (I promise, none of monad business)

**High-order functions** are simply functions that operate on _other_ functions, by taking them as arguments are having functions as a return value (so meta). This is one of those goodies you get in a language like Haskell, Erlang, or even Javascript (barring some short-comings) where functions are first-class citizens which is the cool way of saying that they can be treated like they are values i.e., you can assign them to a variable, append them to an array, take them as parameters or return them as return values, etc. (i.e. `function foo () {}` is equivalent to `var foo = function() {}`)


**Function currying** is just a fancy term for a pretty simple concept of taking a function of multiple arguments and into a function of a single argument. Sounds simple, right? But you might be wondering why would you want to do this.

Honestly, I don't have a ready and complete answer, but I'd like to show a very simple application of the concept which I hope illustrates both these concepts at some extent.

<div style="text-align: center; font-size: 1.1em; margin: 30px  0; color: #111; background-color: #f1f1f1; padding: 20px;">
<strong>Challenge:</strong> Pre-process a tweet so that mentions, hashtags, and links are appropriately wrapped in anchor tags.
</div>

We'll look at some node.js code that interacts with the Twitter API.

Let's inspect what a tweet entity looks like as provided by Twitter, minus the fields we don't need:

{% highlight javascript %}
{
    text: 'Check out what we\'ve done with #Drupal #Symfony #Elasticsearch  &amp; #AngularJS at @activelamp: http://t.co/d4EXKNGv3h',
    entities: {
      hashtags: [
        { text: 'Drupal', indices: [ 31, 38 ] },
        { text: 'Symfony', indices: [ 39, 47 ] },
        { text: 'Elasticsearch', indices: [ 48, 62 ] },
        { text: 'AngularJS', indices: [ 70, 80 ] }
      ],
      user_mentions: [
        { screen_name: 'activelamp',
          name: 'ActiveLAMP',
          id: 40290704,
          id_str: '40290704',
          indices: [ 84, 95 ]
        }
      ],
      urls: [
        { url: 'http://t.co/d4EXKNGv3h',
          expanded_url: 'http://actvl.mp/1cwJMZA',
          display_url: 'actvl.mp/1cwJMZA',
          indices: [ 97, 119 ]
        }
      ]
    }
}
{% endhighlight %}

What the of interest here are the list of entities that are embedded in this tweet and the indices which tells us where to find them in the plain-text tweet; i.e. the `Symfony` hashtag starts on the 48th character up to the 62nd (zero-indexed).

It's pretty obvious that the essence of the solution is a chain of string substitutions, and the solution abstract is basically taking a string and replacing a piece of it with something else. Here is a function that does that:

{% highlight javascript %}

function substitute(str, start, end, replacement) {
  return str.substr(0, start) + replacement + str.substr(end, str.length);
}

{% endhighlight %}

Straight-forward. We now have a function that is atomic, predictable, and stable, with no ambiguity with what it does. We can reuse this with great ease:

{% highlight javascript %}

function substitute_mention(str, mention) {
  var repl = '<a href="https://twitter.com/' + mention.screen_name + '">@' + mention.screen_name + '</a>';
  return substitute(str, mention.indices[0], mention.indices[1], repl);
}

function substitute_hashtag(str, hashtag) {
  var repl = '<a href="https://twitter.com/hashtag/' + hashtag.text + '?src=hash">#' + hashtag.text + '</a>';
  return substitute(str, hashtag.indices[0], hashtag.indices[1], repl);
}

function substitute_url(str, url) {
  var repl = '<a href="' + url.expanded_url + '">' + url.display_url + '</a>';
  return substitute(str, url.indices[0], url.indices[1], repl);
}

{% endhighlight %}

We are just building on top of our `substitute` function, just differing on what replacement string to pass in depending on the context.

## Now this is where the fun begins...

Here is an aspect to the problem that is not readily apparent on first reading: it is that __string replacements must be done in a certain order to get the proper result__. Think about it: the moment you modify the plain-text tweet by replacing a portion of it with something else, **the rest of indices will be off.** For example, the moment you replace `#Drupal` with `<a href="https://twitter.com/hashtag/Drupal?src=hash">#Drupal</a>`, the indices `[ 39, 47 ]` for `Symfony` would no longer point to the right spot in the string.

Its now apparent what we can't just execute these `substitute*` functions out-right -- we need to somehow make them into discrete pieces of procedures that we can treat like values which are sorted in the sequence we want them executed.

## Enter high-order functions...

**High-order functions** as I stated before are functions that take functions as argument and/or returns a function. Let's create such function which operates on the ones we have written so far:

{% highlight javascript %}

function substitute_func(func, data) {
  return function (str) {
    return func(str, data);
  }
}
{% endhighlight %}

Here is an example usage to illustrate how it behaves:

{% highlight javascript %}

var s = substitute_func(substitute_hashtag, hashtagData);

/**
 * s is essentially == function (str) { substitute_hashtag(str, hashtagData); }
 *
 * So doing:
 */

s(plainTweet); // ...is equivalent to substitute_hashtag(plainTweet, hashtagData);

{% endhighlight %}

What we also achieved here is <em>currying the `substitute_hashtag` function -- a function that takes 2 arguments -- into a function that only takes 1 argument.</em>

<img src="/images/yudodis.jpg" style="margin: 10px auto; display: block;"/>

We went to all these "trouble" so that we can do something like this:

{% highlight javascript %}

/**
 * Create an array of `substitute_func`s for each `tweet.entities.hashtag` via Array.prototype.map.
 * Do the same thing for `tweet.entities.urls` and `tweet.entities.user_mentions`,
 * and simply concatenate them to the first array.
 *
 * This gives us a single array of `replace_func`s for all entities.
 */

var replace_funcs =
    tweet.entities.hashtags.map(function (hashtag) {
        return substitute_func(substitute_hashtag, hashtag);
    }).concat(tweet.entities.urls.map(function (url) {
        return substitute_func(substitute_url, url);
    })).concat(tweet.entities.user_mentions.map(function (mention) {
        return substitute_func(substitute_mention, mention);
    }));

 {% endhighlight %}

 Now we'll use `Array.prototype.reduce` to apply these functions iteratively to the plain-text tweet:

 {% highlight javascript %}

 replace_funcs.reduce(function (str, func) {
   return func(str);
 }, tweet.text);

{% endhighlight %}

> Here is an explanation of what `Array.prototype.reduce` does:  [https://www.airpair.com/javascript/javascript-array-reduce](https://www.airpair.com/javascript/javascript-array-reduce).
>
>
> Basically, `[1, 2, 3].reduce(fn, 0);` is a concise way of saying `fn(fn(fn(fn(0, 1)), 2), 3);`
>
>
> i.e. if `fn = function (a, b) { return a + b; };` then the above expression returns `6`.

### But wait...

We still haven't solved the execution order problem. The current code will simply execute them in the order in which they are added into the array, which is hashtags first, then urls, then user-mentions. This is totally arbitrary and does not gurantee the correct result by any stretch of imagination.

What we need to do to get the correct result every time is to **do the string substitutions from the right-most entity to left-most** --
this assures that any previous substitutions does not affect the indices, as the indices are counted left to right, i.e. what happens to `[9, 12]` could _never_ shift anything from `[0, 8]` which will remain unchanged.

Let's modify the `substitute_func` function and the array mapping routine, and introduce another high-order function `map_substitute_func`:

{% highlight javascript %}

function substitute_func(func, data) {
  var f = function (str) {
    return func(str, data);
  };
  f.weight = weight; // Add weight to the function.
  return f;
}

function map_substitute_func(repl_func) {
  return function (data) {
    return substitute_func(repl_func, data, data.indices[0]);
  }
}

var replace_funcs =
    tweet.entities.hashtags
      .map(map_substitute_func(substitute_hashtag))
      .concat(tweet.entities.urls.map(map_substitute_func(substitute_url)))
      .concat(tweet.entities.user_mentions.map(map_substitute_func(substitute_mentions)))
      .sort(function (a, b) { return b.weight - a.weight; }); // Sort in reverse order.

var htmlTweet = replace_funcs.reduce(function (str, func) {
  return func(str);
}, tweet.text);

{% endhighlight %}

As you can see, we just added a third parameter to `substitute_func` which indicates the weight to assign to the resulting function. We also using the fact that _Javascript functions are basically *objects*_, and that you can actually assign properties to it. Here we just added a `weight` property which we use within `Array.prototype.sort` to order them in reverse. We also introduced `map_substitute_func` which is another high-order function which curries `substitute_func` into a single-argument function which we can immediately pass into `Array.prototype.map`.

As a result, the folding routine (via `Array.prototype.reduce`) applies the functions to the plain-text tweet in the correct order which ultimately produces an HTML formatted tweet with the correct anchor tags present:

{% highlight javascript %}
console.log(htmlTweet);
//'Check out what we\'ve done with <a href="https://twitter.com/hashtag/Drupal?src=hash" target="_blank">#Drupal</a> <a href="https://twitter.com/hashtag/Symfony?src=hash" target="_blank">#Symfony</a> <a href="https://twitter.com/hashtag/Elasticsearch?src=hash" target="_blank">#Elasticsearch</a>  &amp; <a href="https://twitter.com/hashtag/AngularJS?src=hash" target="_blank">#AngularJS</a> at <a href="https://twitter.com/activelamp" target="_blank">@activelamp</a>: <a href="http://t.co/d4EXKNGv3h" target="_blank">actvl.mp/1cwJMZA</a>';
{% endhighlight %}

In conclusion we have code that I think is concise and a solution that is well-composed. See the full source-code **[here](https://gist.github.com/bezhermoso/8cd3de18b2028533f0aa)**. Let me know what you think in the comments section below. :)
