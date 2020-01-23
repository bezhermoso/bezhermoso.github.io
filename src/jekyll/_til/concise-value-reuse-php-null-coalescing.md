---
layout: til
title: "Concise value re-use pattern using PHP's null coalescing operator"
til_category: php
date: 2020-01-22
og_image: /img/keep/til.png
---

PHP's null coalescing operator `??` has made writing certain boilerplate patterns obsolete, like the common pattern of using `isset(...)` to avoid a myriad of errors when addressing deeply-nested array elements that don't exist.

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

> See `man awk`, `man tee`, and `man column`
