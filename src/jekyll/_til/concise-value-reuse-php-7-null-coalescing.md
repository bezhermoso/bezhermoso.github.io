---
layout: til
title: "Concise value re-use pattern using PHP 7.x's null coalescing operator"
til_category: php
date: 2020-01-22
og_image: /img/keep/til.png
---

Since PHP 7.0, the addition of the null coalescing operator `??` has made writing certain boilerplate patterns obsolete, like the common pattern of using `isset(...)` to avoid a myriad of errors when addressing deeply-nested array elements that don't exist.

Another pattern that is ripe for replacement is for value re-use, like those usually found in singletons, in-memory caches, memoizations:

{% highlight php %}
<?php

class Singleton
{
		private static $instance;

		private function __construct() { ... };

		public static function getInstance(): Singleton
		{
				return self::$instance = self::$instance ?? new static();
		}
}
{% endhighlight %}

{%highlight php %}
<?php

class Fibonacci
{
		private $cache = [];

		public function find($n): int
		{
				return $this->cache[$n] =
					$this->cache[$n] ?? self::find($n) + self::find($n - 2);
		}
}
{% endhighlight %}

> See [PHP 7.0 - New Features: null coalescing operator](https://www.php.net/manual/en/migration70.new-features.php#migration70.new-features.null-coalesce-op)
