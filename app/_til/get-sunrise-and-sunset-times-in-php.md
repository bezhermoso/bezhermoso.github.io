---
layout: til
title: Get sunrise and sunset times in PHP
til_category: php
date: 2016-02-19
og_image: /keep/til.png
---

If you _ever_ wondered how to retrieve the time of sunrise and sunset 
on a given date in PHP, `date_sun_info` got you covered:

<!--stop-->

{% highlight php %}
<?php

date_sun_info($timestamp = strtotime('2016-04-10'), $lat = 10.3079, $lng = 124.0195);

// => [
//      "sunrise" => 1460237721,
//      "sunset" => 1460282077,
//      "transit" => 1460259899,
//      "civil_twilight_begin" => 1460236449,
//      "civil_twilight_end" => 1460283350,
//      "nautical_twilight_begin" => 1460234961,
//      "nautical_twilight_end" => 1460284838,
//      "astronomical_twilight_begin" => 1460233466,
//      "astronomical_twilight_end" => 1460286332,
//    ]
{% endhighlight %}

> Available since PHP 5.1.2. See full documentation:
> [function.date-sun-info.php](http://php.net/manual/en/function.date-sun-info.php)

