---
title: "A practical usage of JavaScript's Function.toString method: CouchDB maps & reduces"
layout: post
og_description:
---

After reading a brief on [CouchDB](http://couchdb.apache.org/), I decided to use it instead of MongoDB for a pet project and
began diving right in. [Cradle](https://github.com/flatiron/cradle), a CouchDB client for Node.js, was one `npm install` away. Installing CouchDB and creating the database was a breeze. I was able to quickly store data
and refined the structure when needed. Gotta love NoSQL!

Querying data is where it got a bit more interesting: fetching data requires the creation
of *views*. This is unlike other popular data stores that has their own query DSLs (domain-specific language), like
SQL for SQL-flavored RDBMS, JSON-based query DSLs for MongoDB and other NoSQL stores.

CouchDB views are simply applications of the [MapReduce](http://en.wikipedia.org/wiki/MapReduce) paradigm. In a nutshell, you provide
map functions and/or reduce functions which will be used to narrow down the data-set and/or to reduce
a data-set into a single aggregate value. Sounds easy. So I went ahead and pecked these on my keyboard:
{% highlight ruby %}

exports.initialize = (db, onError) ->

    db.create (err) ->
    	onError err if onError
    	return

    db.save '_design/games',
      views:
        # Emit all document of type 'game'
        all:
          map: (doc) ->
            emit(null, doc) if doc.type == 'game'
            return
        # Same as 'all', but only if game is waiting for more players.
        open:
          map: (doc) ->
            emit(null, doc) if doc.type == 'game' && doc.status == 'open'
            return
        # Same as 'all', but emit documents indexed by the players.
        # Figure out how to deal with duplicates later using `reduce`.
        by_player:
          map: (doc) ->
            emit(doc.player1, doc) if doc.type == 'game' && doc.player1
            emit(doc.player2, doc) if doc.type == 'game' && doc.player2
            return
    return
 {% endhighlight %}
<blockquote>
If you are not familiar with <a href="http://coffeescript.org/" target="_blank">CoffeeScript</a> and the above is gibberish to you (unless you know Ruby), the above
snippet will eventually be <a target="_blank" href="http://js2.coffee/#coffee/try:%23%23%23%0A%20cofee%2Fmodules%2Fengine%2Fdb-init.coffee%0A%0A%20Initialize%20and%20prepare%20a%20CouchDB%20database%20like%20this%3A%20%60require('.%2Fmodules%2Fengine%2Fdb-init').initialize(couchdb%2C%20console.error)%60%0A%23%23%23%0Aexports.initialize%20%3D%20(db%2C%20onError)%20-%3E%0A%20%20%20%20%0A%20%20%20%20db.create%20(err)%20-%3E%0A%20%20%20%20%09onError%20err%20if%20onError%0A%20%20%20%20%09return%0A%20%20%20%20%0A%20%20%20%20db.save%20'%2F_design%2Fgames'%2C%0A%20%20%20%20%20%20views%3A%0A%20%20%20%20%20%20%20%20%23%20Emit%20all%20document%20of%20type%20'game'%0A%20%20%20%20%20%20%20%20all%3A%0A%20%20%20%20%20%20%20%20%20%20map%3A%20(doc)%20-%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20emit(null%2C%20doc)%20if%20doc.type%20%3D%3D%20'game'%0A%20%20%20%20%20%20%20%20%20%20%20%20return%0A%20%20%20%20%20%20%20%20%23%20Same%20as%20'all'%2C%20but%20only%20if%20game%20is%20waiting%20for%20more%20players.%0A%20%20%20%20%20%20%20%20open%3A%0A%20%20%20%20%20%20%20%20%20%20map%3A%20(doc)%20-%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20emit(null%2C%20doc)%20if%20doc.type%20%3D%3D%20'game'%20%26%26%20doc.status%20%3D%3D%20'open'%0A%20%20%20%20%20%20%20%20%20%20%20%20return%0A%20%20%20%20%20%20%20%20%23%20Same%20as%20'all'%2C%20but%20emit%20documents%20indexed%20by%20the%20players.%0A%20%20%20%20%20%20%20%20%23%20Figure%20out%20how%20to%20deal%20with%20duplicates%20later%20using%20%60reduce%60.%0A%20%20%20%20%20%20%20%20by_player%3A%0A%20%20%20%20%20%20%20%20%20%20map%3A%20(doc)%20-%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20emit(doc.player1%2C%20doc)%20if%20doc.type%20%3D%3D%20'game'%20%26%26%20doc.player1%0A%20%20%20%20%20%20%20%20%20%20%20%20emit(doc.player2%2C%20doc)%20if%20doc.type%20%3D%3D%20'game'%20%26%26%20doc.player2%0A%20%20%20%20%20%20%20%20%20%20%20%20return%0A%20%20%20%20return">
compiled into JavaScript.</a></blockquote>

However, this doesn't really work, and it took me a while to realize my mistake: <strong>the map and reduce functions shouldn't be
function definitions, but function definition <em>strings</em>.</strong> \*facepalm\*

Not a huge problem: I can just substitute the `(doc) -> ...` blocks with actual JavaScript code and wrap them in quotation marks (and carefully escape inner strings). Kinda
sucks since I am operating with CoffeeScript to minimize actual coding and to avoid syntax gotchas.

Then I remembered that JavaScript functions _are_ objects, and has a `toString` method.
So simply changing the map functions like these solves the problem:
{% highlight ruby %}
((doc) ->
    emit(null, doc) if doc.type == 'game'
    return
).toString()
 {% endhighlight %}

This results in JavaScript that looks like:
{% highlight javascript %}
function (doc) {
    if(doc.type === 'game') {
       emit(null, doc);
    }
    return;
}.toString()
 {% endhighlight %}

 Calling the `toString` method on the function returns the whole function block *as a string* which is exactly what
 we need to create CouchDB views. Yay!

This approach still allows me to write zero actual JavaScript at all -- I still get to have the function strings while
still operating in CoffeeScript, which I find really helpful in minimizing the volume of code I write and also in avoiding
the occasional syntax gotchas which are sometimes frustrating to debug in JavaScript.
