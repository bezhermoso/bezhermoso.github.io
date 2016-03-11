---
layout: til
title: Support both A+ promise spec & Node-like callbacks
til_category: vim
date: 2016-03-07
og_image: /keep/til.png
---

If for some reason you wish to support both the use of promises _and_ Node-like callbacks (_eww!_), `bluebird`'s `Promise.prototype.asCallback(...)` can come in handy:

{% highlight javascript %}

function myAsyncFunc = function (param, callback) {
    var p = return new Promise(function (resolve, reject) {
        ...
    });
    return p.asCallback(callback);
}

// You can do this:
myAsyncFunc("foo", function (err, result) {
    ...
});

// or you can use it like a promise...
myAsyncFunc("foo")
    .then(function (result) {
        ...
    }, function (err) {
        ...
    });

{% endhighlight %}

Both will work.

> See [`bluebird`'s `asCallback(...)`](http://bluebirdjs.com/docs/api/ascallback.html)
