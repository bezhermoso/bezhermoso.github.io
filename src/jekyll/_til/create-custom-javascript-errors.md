---
layout: til
title: Create custom Javascript errors
til_category: javascript
date: 2016-02-29
og_image: /img/keep/til.png
---

When building complex Javascript applications for the browser or server, sooner or later you'll find the need to create custom error objects especially when implementing fail-safes, error handling (i.e. catching specific errors in a Promise chain), etc.

<!--stop-->

Here is a short snippet of how to create a custom `Error` sub-type in Javascript:

{% highlight javascript %}
function CustomError(message) {
  this.message = message || "You shouldn't have done that.";
  this.stack = (new Error()).stack;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;
CustomError.prototype.name = "CustomError";
{% endhighlight %}

It's more succinct in `ES6`:

{% highlight javascript %}
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.message = message || "You shouldn't have done that.";
        this.name = this.constructor.name;
        this.stack = (new Error()).stack;
    }
}
{% endhighlight %}

