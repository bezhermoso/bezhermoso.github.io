---
layout: til
title: Integrate bluebird into Angular 1.x
til_category: angular
date: 2016-02-22
og_image: /keep/til.png
---

The [`bluebird`](http://bluebirdjs.com/) library doesn't quite work with
Angular out-of-the-box. You'll have to configure `bluebird` to execute resolution/rejection functions within Angular's
digest loop. However I also learned that even if you have that in place,
[`ui-router`'s Resolve](https://github.com/angular-ui/ui-router/wiki#resolve) functionality still wouldn't work with
`bluebird` promises. You'll have to do something extra for that, too:

<!--stop-->

If you need `bluebird`'s superior `Promise` objects within Angular and with `ui-router`, you'll have to configure it like this:

{% highlight javascript %}

var app = angular.module('main');

app.run(function ($rootScope, $q) {
    
  // This ensures that resolutions/rejections are ran
  // within Angular's digest loop:
  Promise.setScheduler(function (fn) {
    $rootScope.$evalAsync(fn);
  });

  // Wrap the promise's resolution/rejection within a $q.defer promise.
  Promise.prototype.qDeferred = function () {
    var deferred = $q.defer();
    this.then(deferred.resolve, deferred.reject);
    return deferred.promise;
  };
});
{% endhighlight %}

With that in place, we can now easily produce a Promise object of the proper type whenever necessary:

{% highlight javascript %}

$stateProvider.state('stuff', {
  resolve: {
    collection: function () {
      return Promise.all([ ... ]).qDeferred();
    }
  }
});

// This will work now as well:

Promise.map(urls, function (url) {
  return $http.get(url);
}).then(function (results) {
  $scope.results = results;
});

{% endhighlight %}

