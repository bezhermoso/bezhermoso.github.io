---
title: "Fun with functions in Javascript: high-order functions"
layout: post
---

[Functional programming](http://en.wikipedia.org/wiki/Functional_programming) has been gaining popularity lately. It's an interesting paradigm for solving problems and departs quite a bit from familiar concepts programmers like me who use object-oriented languages are used to.
Just like object-oriented programming, it has its own sets of design principles and philosophies. I don't pretend to know a lot of them -- in fact I only have barely scratched the surface, but two concepts has stood
out to me so far -- its the concept of _high-order functions_ and the slew of interesting things you can do with them.

## High-order functions

**high-order functions** are simply functions that operate on _other_ functions, by taking them as arguments are having functions as a return value (so meta). This is one of things you find in a languages like Haskell and Erlang (so I've heard) or even Javascript barring some short-comings where functions are first-class citizens, which is a cool way of saying that they can be treated like any other value i.e., you can assign them to a variable, append them to an array, pass them around as function arguments or return them as return values, etc. i.e. In Javascript, `function foo () {}` is equivalent to `var foo = function() {}`.

<!--stop-->
## Function Composition

Let's look at the following functions:

{% highlight javascript %}

/**
 * Takes function f(x) and g(x)
 * and returns a function h(x) which is equivalent to f(g(x))
 */
var _compose = function (f, g) {
  return function (x) {
    return f(g(x));
  };
};

var shout = function (text) {
  return (text.toUpperCase()) + '!!!1!';
};

var strong = function (text) {
  return '<strong>' + text + '</strong>';
}

var emphasize = function (text) {
  return '<em>' + text + '</em>';
}

var strongShout = _compose(strong, shout);

strongShout('this is sparta'); //<strong>THIS IS SPARTA!!!1!</strong>

var strongShoutWithEmphasis = _compose(emphasize, strongShout);

strongShoutWithEmphasis('this is sparta'); //<em><strong>THIS IS SPARTA!!!1!</strong></em>

{% endhighlight %}

`strong`, `shout`, and `emphasize` is said to be composable with each other because you can take any two of them and compose them together to create a completely new function at run-time like `strongShout`. You can also nest compositions to produce a function like `strongShoutWithEmphasis`, which is pretty cool.

I'd like to show a very simple application of the concept which takes things a little further:

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
var substitute = function (str, start, end, replacement) {
  return str.substr(0, start) + replacement + str.substr(end, str.length);
}

{% endhighlight %}

Straight-forward. We now have a function that is stable and does one very basic thing. Pay special attention to the to the function signature:

<div class="code">
Takes a String, a Number, a Number, and another String and returns a String
<br>
or...
<br>
<strong>substitute: (String, Number, Number, String) -> String</strong>
</div>

We can reuse this with great ease:

{% highlight javascript %}

var substituteMention = function (str, mention) {
  var repl = '<a href="https://twitter.com/' + mention.screen_name + '">@' + mention.screen_name + '</a>';
  return substitute(str, mention.indices[0], mention.indices[1], repl);
}

var substituteHashtag = function (str, hashtag) {
  var repl = '<a href="https://twitter.com/hashtag/' + hashtag.text + '?src=hash">#' + hashtag.text + '</a>';
  return substitute(str, hashtag.indices[0], hashtag.indices[1], repl);
}

var substituteUrl = function (str, url) {
  var repl = '<a href="' + url.expanded_url + '">' + url.display_url + '</a>';
  return substitute(str, url.indices[0], url.indices[1], repl);
}

{% endhighlight %}

We are just building on top of our `substitute` function, just differing on what replacement string to pass in depending on the context.

Take note of each of their function signatures as well:

<div class="code">
substitute<sub>x</sub>: (String, Object) -> String
</div>

## Now this is where the fun begins...

Here is an aspect to the problem that is not readily apparent on first reading: it is that __string replacements must be done in a certain order to get the proper result__. Think about it: the moment you modify the plain-text tweet by replacing a portion of it with something else, **the rest of indices will be off.** For example, the moment you replace `#Drupal` with `<a href="https://twitter.com/hashtag/Drupal?src=hash">#Drupal</a>`, the indices `[ 39, 47 ]` for `Symfony` would no longer point to the right spot in the string.

What we need to do to get the correct result every time is to **do the string substitutions from the right-most entity to left-most** --
this assures that any previous substitutions does not affect the indices, as the indices are counted left to right, i.e. what happens to `[9, 12]` could _never_ shift anything from `[0, 8]` which will remain unchanged.

Its now apparent what we can't just loop through each of the entity type and execute these `substitute_*` functions against our plain-text string off-the-bat -- we need to somehow make them into a sequence of discrete procedures that are ordered in the sequence we want them executed.

Our execution logic should resemble something like this:

<div class="code">
  String(plainText) -> substitute<sub>1</sub> -> substitution<sub>2</sub> -> ... -> substitution<sub>n</sub> -> String(htmlText)
</div>

Essentially, our program should basically be about taking the tweet -- a String -- and piping through _n_ substitutions of hashtags, mentions, and URLs in a well-defined order, and getting an HTML-formatted text at the end.

## Enter high-order functions

**High-order functions** as I stated before are functions that take functions as argument and/or returns a function. Let's create such function which operates on the ones we have written so far:

{% highlight javascript %}

var substituteFunc = function (func, data) {
  return function (str) {
    return func(str, data);
  }
}
{% endhighlight %}

Here is an example usage to illustrate how it behaves:

{% highlight javascript %}

var s = substituteFunc(substituteHashtag, hashtagData);

s(plainTweet); // ...is equivalent to substituteHashtag(plainTweet, hashtagData);
{% endhighlight %}

What we achieved here is <em>we effectively took the `substituteHashtag` function -- a function that takes a string and an object as arguments -- into a function that only takes a string as argument.</em>

The function signature is:

<div class="code">
substituteFunc: (Function, Object) -> function: (String) -> (String)
<br><br>
Takes a Function and an Object and returns a <strong>Function</strong> which takes a String and returns a String.
</div>

<img src="/img/yudodis.jpg" style="margin: 10px auto; display: block;"/>

Remember our function composition examples? We can finally apply the concept of function composition to our substitution functions, as they can now be composed together, thanks to `substituteFunc`.

{% highlight javascript %}

var sub1 = substituteFunc(substituteHashtag, hashtagData);
var sub2 = substituteFunc(substituteMention, mentionData);
var sub3 = substituteFunc(substituteUrl, urlData1);
var sub4 = substituteFunc(substituteUrl, urlData2);


_compose(sub4, _compose(sub3, _compose(sub2, sub1)))(tweet);
{% endhighlight %}

However it looks muddled and does not scale at all; adding more substitutions requires careful attention, and even re-ordering the operations is a PITA. Plus you can't even add or reorder substitutions at run-time (which we need to do because we will never know ahead of time how many substitutions are necessary let alone in which order.).  Using `_compose` does really solve our bigger problem, but its almost there.

## Piping functions

Let's introduce a `_pipe` function:

{% highlight javascript %}

function _pipe(value, fnList) {
  for (var i = 0; i <= fnList.length; i++) {
    value = fnList[i](value);
  }
  return value;
};

_pipe('this is sparta', [shout, strong, emphasize]); //<em><strong>THIS IS SPARTA!!!1!</strong></em>

{% endhighlight %}

What `_pipe` does is basically take the value and apply the functions from the list to it iteratively, and returning the final product of all the operations. Obviously, the biggest requirement is that a function in the list must be compatible with the return value of the function before it. It just so happens that `shout`, `strong`, & `emphasize` are compatible with each other no matter the order, so we can pipe a string value through them in any order we want.

We can actually write `_pipe` this way to be even fancier:

{% highlight javascript %}

function _pipe(value, fnList) {
  return fnList.reduce(function(v, f) { return f(v); }, value);
};

{% endhighlight %}
> Here is an explanation of what `Array.prototype.reduce` does and how it works:  [https://www.airpair.com/javascript/javascript-array-reduce](https://www.airpair.com/javascript/javascript-array-reduce).

Try it out.

We can use the `_pipe` function to our string substitution dilemma:

{% highlight javascript %}

/**
 * Create an array of all the substitution functions we need first.
 */
var hashtagSubs = tweet.entities.hashtags.map(function (hashtagData) {
    return substituteFunc(substituteHashtag, hashtagData);
});

var urlSubs = tweet.entities.urls.map(function (urlData) {
    return substituteFunc(substituteUrl, urlData);
});

var mentionSubs = tweet.entities.user_mentions.map(function(mentionData) {
    return substituteFunc(substituteMention, mentionData);
});

_pipe(tweet.text. hashtagSubs.concat(urlSubs).concat(mentionSubs));

{% endhighlight %}

As you can see, `_pipe` allows us to compose our functions at run-time, making the number of functions
to work with arbitrary and inconsequential in our implementation.

### But wait...

We still haven't solved the execution-order problem. The current code will simply execute them in the order in which they are added into the array. Its nothing different from looping through each of them and applying them to a continuously-evolving tweet. Remember, we need to substitute starting from the right-most entities first.

Let's modify the `substituteFunc` function:

{% highlight javascript %}

function substituteFunc(func, data) {
  var f = function (str) {
    return func(str, data);
  };
  f.weight = data.indices[0]; // Use the start index as weight.
  return f;
}

var subs = hashtagSubs.concat(urlSubs).concat(mentionSubs);
var orderedSubs = subs.sort(function (a, b) { return b.weight - a.weight; });

var htmlTweet = _pipe(tweet.text, orderedSubs);

{% endhighlight %}

We are just using the fact that __Javascript functions are also objects at heart__, and that you can not only treat them like any other value -- like assign them to variables or append them to arrays --  but you can actually assign properties to it. Here we just added a `weight` property which we use to order them in reverse.

Now, `_pipe` applies the substitutions in the order we need.

{% highlight javascript %}
console.log(htmlTweet);
//'Check out what we\'ve done with <a href="https://twitter.com/hashtag/Drupal?src=hash" target="_blank">#Drupal</a> <a href="https://twitter.com/hashtag/Symfony?src=hash" target="_blank">#Symfony</a> <a href="https://twitter.com/hashtag/Elasticsearch?src=hash" target="_blank">#Elasticsearch</a>  &amp; <a href="https://twitter.com/hashtag/AngularJS?src=hash" target="_blank">#AngularJS</a> at <a href="https://twitter.com/activelamp" target="_blank">@activelamp</a>: <a href="http://t.co/d4EXKNGv3h" target="_blank">actvl.mp/1cwJMZA</a>';
{% endhighlight %}

In conclusion we have code that is concise and more eloquent -- well, at least compared to an implementation littered with loops and conditionals in different stages of the routine.

Here is the full source-code:

{% highlight javascript %}
#!/usr/bin/env node

'use strict';

/**
 * Takes function f(x) and g(x)
 * and returns a function h(x) which is equivalent to f(g(x))
 */
var _compose = function (f, g) {
  return function (x) {
    return f(g(x));
  };
};

/**
 * Takes a value and a list of functions to pass the value through iteratively.
 * _pipe(v, [f, g, h, i]) === compose(i, compose(h, compose(g, f)))(v);
 */
function _pipe(value, fnList) {
  return fnList.reduce(function(v, f) { return f(v); }, value);
};

/* Our bread & butter -- replaces a sub-string with something else */
function substitute(str, start, end, replacement) {
  return str.substr(0, start) + replacement + str.substr(end, str.length);
}

/* Replaces user mentions based on object from tweet.entities.user_mentions */
function substituteMention(str, mention) {
  var repl = '<a href="https://twitter.com/' + mention.screen_name + '">@' + mention.screen_name + '</a>';
  return substitute(str, mention.indices[0], mention.indices[1], repl);
}

/* Replaces hashtags based on object from tweet.entities.hashtags */
function substituteHashtag(str, hashtag) {
  var repl = '<a href="https://twitter.com/hashtag/' + hashtag.text + '?src=hash">#' + hashtag.text + '</a>';
  return substitute(str, hashtag.indices[0], hashtag.indices[1], repl);
}

/* Replaces URLs based on object from tweet.entities.urls */
function substituteUrl(str, url) {
  var repl = '<a href="' + url.expanded_url + '">' + url.display_url + '</a>';
  return substitute(str, url.indices[0], url.indices[1], repl);
}

/** Adds a compatibility layer around our substitute functions
 *
 * Also assigns weight to the function as an extra.
 */
function substituteFunc(func, data) {
  var f = function (str) {
    return func(str, data);
  }
  f.weight = data.indices[0];
  return f;
}

function renderTweet(tweet) {

  /**
   * Create an array of all the substitution functions we need first.
   */
  var hashtagSubs = tweet.entities.hashtags.map(function (hashtagData) {
      return substituteFunc(substituteHashtag, hashtagData);
  });

  var urlSubs = tweet.entities.urls.map(function (urlData) {
      return substituteFunc(substituteUrl, urlData);
  });

  var mentionSubs = tweet.entities.user_mentions.map(function(mentionData) {
      return substituteFunc(substituteMention, mentionData);
  });

  var subs = hashtagSubs.concat(urlSubs).concat(mentionSubs);
  var orderedSubs = subs.sort(function (a, b) { return b.weight - a.weight; });

  return _pipe(tweet.text, orderedSubs);
}

var tweet = {
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
};

console.log(renderTweet(tweet));

{% endhighlight %}
