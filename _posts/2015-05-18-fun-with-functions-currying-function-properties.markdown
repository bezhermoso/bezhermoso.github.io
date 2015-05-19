---
title: "Function currying, high-order functions, and more fun with functions in Javascript"
layout: post
---

So what is function currying? It's just a fancy term for a pretty simple concept of taking a function of multiple arguments and into a function of a single argument. Sounds simple, right?

But you might be wondering why would you want to do this. Honestly, I don't have a ready and complete answer, but I'd like to show a very simple application of the concept which I hope illustrates why you'd do function currying:

**Challenge:** Pre-process a tweet so that mentions, hashtags, and links are appropriately wrapped in anchor tags.

Let's inspect what a tweet entity looks like in the Twitter API, minus the fields we don't need:

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

function _replace(str, start, end, replacement) {
  return str.subtr(0, start) + replacement + str.substr(end, str.length);
}

{% endhighlight %}

Straight-forward. We now have a function that is really really atomic with no ambiguity with what it does. We can reuse this with great ease:

{% highlight javascript %}

function _replace_mention(str, mention) {
  var repl = '<a href="https://twitter.com/' + mention.screen_name + '">@' + mention.screen_name + '</a>';
  return _replace(str, mention.indices[0], mention.indices[1], repl);
}

function _replace_hashtag(str, hashtag) {
  var repl = '<a href="https://twitter.com/hashtag/' + hashtag.text + '?src=hash">#' + hashtag.text + '</a>';
  return _replace(str, hashtag.indices[0], hashtag.indices[1], repl);
}

function _replace_url(str, url) {
  var repl = '<a href="' + url.expanded_url + '">@' + url.display_url + '</a>';
  return _replace(str, url.indices[0], url.indices[1], repl);
}

{% endhighlight %}

We are just building on top of our `_replace` function, just differing on what replacement string to pass in depending on the context.

## Now this is where the fun begins...

Here is an aspect to the problem that is not readily apparent on first reading: it is that __string replacements must be done in a certain order to get the proper result__. Think about it: the moment you modify the plain-text tweet by replacing a portion of it with something else, **the rest of indices will be off.** For example, the moment you replace `#Drupal` with `<a href="https://twitter.com/hashtag/Drupal?src=hash">#Drupal</a>`, the indices `[ 39, 47 ]` for `Symfony` would no longer point to the right spot in the string.

Its now apparent what we can't just execute these `_replace*` functions out-right -- we need to somehow make them into discrete pieces of procedures that we can treat like values which are sorted in the sequence we want them executed.

## Enter high-order functions...

**High-order functions** are simply functions that operate on _other_ functions, by taking them as arguments are having functions as a return value (so meta). This is one of those goodies you get in a language like Javascript where functions are first-class citizens which is the cool way of saying that they can be treated like they are values i.e., you can assign them to a variable, append them to an array, take them as parameters or return them as return values, etc. (i.e. `function foo () {}` is equivalent to `var foo = function() {}`)

Let's create such function which operates on the functions we have written so far:

{% highlight javascript %}

function _replace_func(func, data) {
  return function (str) {
    return func(str, data);
  }
}
{% endhighlight %}

Here is an example usage to illustrate how it behaves:

{% highlight javascript %}

var r = _replace_func(_replace_hashtag, hashtagData);

/**
 * r is essentially == function (str) { _replace_hashtag(str, hashtagData); }
 *
 * So doing:
 */

r(plainTweet); // ...is equivalent to _replacement_hashtag(plainTweet, hashtagData);

{% endhighlight %}

What we also achieved here is currying the `_replace_hashtag` function -- a function that takes 2 arguments -- into a function that only takes 1 argument.

<img src="/images/yudodis.jpg" style="margin: 10px auto; display: block;"/>

We went to all these "trouble" so that we can do something like this:

{% highlight javascript %}

/**
 * Loop through tweet.entities.hashtags and return _replace_hashtag functions
 * that are curried via _replace_func and collecting them in an array
 * (Array.prototype.map). We will do the same with user_mentions and urls.
 *
 * We also concatenate all three arrays into a single array.
 */

var replace_funcs =
  [ ].concat(tweet.entities.hashtags.map(function (hashtag) {
    return _replace_func(_replace_hashtag, hashtag);
  })).concat(tweet.entities.user_mentions.map(function (mention) {
    return _replace_func(_replace_mention, mention);
  })).concat(tweet.entities.urls.map(function (url) {
    return _replace_func(_replace_url, url);
  }));

/**
 * Now we have an array `replace_funcs` containing a list of functions that does string replacements.
 */

 {% endhighlight %}

 Now we'll use `Array.prototype.reduce` to apply these functions iteratively to the plain-text tweet:

 {% highlight javascript %}

 replace_funcs.reduce(function (str, func) {
   return func(str);
 }, tweet.text)

{% endhighlight %}

> Here is an explanation of what `Array.prototype.reduce` does:  [https://www.airpair.com/javascript/javascript-array-reduce](https://www.airpair.com/javascript/javascript-array-reduce).
