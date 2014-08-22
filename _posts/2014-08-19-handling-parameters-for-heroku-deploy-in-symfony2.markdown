---
layout: post
title: "Handling parameters for Heroku deploy in Symfony2"
date: 2014-08-19
---

Configuring environment-specific parameters in Symfony2 has been made easy thanks to `Incenteev\ParameterHandler\ScriptHandler::buildParameters`. Attaching itself
to the Composer workflow, it provides a very intuitive interface for defining required parameters defined in `app/config/parameters.yml.dist`.

In case you don't know, this mechanism also gives you the ability to specify required parameters specific to your app which developers/deployers need to fill out:

{% highlight yaml %}
# app/config/parameters.yml.dist
parameters:
    database_driver:   pdo_mysql
    database_host:     127.0.0.1
    ...

    # Project-specific parameters not part of the standard distribution:
    elasticsearch_hosts: [ http://localhost:9200 ]
    elasticsearch_index: main
{% endhighlight %}

A value for `elasticsearch_hosts` & `elasticssearch_index` will be prompted during `composer install` or `composer update`, and will default to the specified values if none are provided during the prompt. Really handy.

__However, this doesn't work well with [Heroku](https://heroku.com) deploys.__ [Because Heroku runs Composer with `--no-interaction` flag](https://devcenter.heroku.com/articles/php-support#build-behavior),
the prompts are suppressed, and the parameters generated would silently fall back to the default values in the `.dist` file.

Work-arounds have been formulated to solve this; the one which is widely adopted being [the use of environment variables to set container parameters](https://github.com/Incenteev/ParameterHandler#using-environment-variables-to-set-the-parameters) in conjunction with [Symfony's built-in functionality of converting `SYMFONY__*` env variables to container parameters.](http://symfony.com/doc/current/cookbook/configuration/external_parameters.html)

Unfortunately, I had some troubles adopting these solutions with the mere fact that some parameters I need are arrays and hashes. Environment variables can only contain scalars like strings and integers.

So I came up with this solution:

__Create an `app/config/env_parameters.php` file:__

{% highlight php %}
<?php

use Symfony\Component\Yaml\Yaml;

/** @var $container \Symfony\Component\DependencyInjection\ContainerBuilder */
$container;

$dist = Yaml::parse(file_get_contents(__DIR__ . '/parameters.yml.dist'));
$distParameters = $dist['parameters'];

foreach ($distParameters as $parameterName => $default) {
    if (false !== ($value = getenv('sf2.' . $parameterName))) {
        $container->setParameter($parameterName, Yaml::parse($value));
    }
}
{% endhighlight %}

_(`Yaml::parse` has an unfortunate behavior that can pose a problem here. See the updates section at the end of this post.)_

__Update `app/config/config.yml` and add `env_parameters.php` as a resource to import:__

{% highlight yaml %}
    imports:
        - { resource: parameters.yml }
        - { resource: env_parameters.php }
        ...
{% endhighlight %}

With this strategy, you can specify Heroku-specific parameters like so:

{% highlight bash %}
$ heroku config:set sf2.database_host=us-cdbr-iron-east-01.cleardb.net
$ heroku config:set sf2.database_name=heroku_...
{% endhighlight %}

This will also allow for non-scalars like arrays and hashes:

{% highlight bash %}
$ heroku config:set sf2.elasticsearch_hosts=[https://....us-east-1.bonsai.io, https://....us-east-1.bonsai.io]
$ heroku config:set sf2.some_config={foo: true, bar: 3.14}
{% endhighlight %}

In a nutshell, `env_parameters.php` will look at the required parameters defined in `parameters.yml.dist` file, and look for
any matching environment variables prefixed with `sf2.*`.

If you don't like mucking around with the `composer.json` file to support Heroku deployment,
or you just need to specify non-scalar parameters, give this approach a try.

<hr>

__2014-08-20 Update__: `Yaml::parse` have an often-unwanted behavior of parsing file contents if the value passed is a valid file-name. A fix is needed in case
one of your parameters are actual filenames:

{% highlight php %}
<?php

use Symfony\Component\Yaml\Yaml;

/** @var $container \Symfony\Component\DependencyInjection\ContainerBuilder */
$container;

$dist = Yaml::parse(file_get_contents(__DIR__ . '/parameters.yml.dist'));
$distParameters = $dist['parameters'];

foreach ($distParameters as $parameterName => $default) {
    if (false !== ($value = getenv('sf2.' . $parameterName))) {
        $container->setParameter($parameterName, is_file($value) ? $value : Yaml::parse($value));
    }
}
{% endhighlight %}

<hr>

__2014-08-21 Update__: A better, cleaner fix for the unfortunate `Yaml::parse` behavior is just instantiating a new `Symfony\Component\Yaml\Parser` object:

{% highlight php %}
<?php

use Symfony\Component\Yaml\Parser;

/** @var $container \Symfony\Component\DependencyInjection\ContainerBuilder */
$container;

$parser = new Parser();

$dist = $parser->parse(file_get_contents(__DIR__ . '/parameters.yml.dist'));
$distParameters = $dist['parameters'];

foreach ($distParameters as $parameterName => $default) {
    if (false !== ($value = getenv('sf2.' . $parameterName))) {
        $container->setParameter($parameterName, $parser->parse($value));
    }
}
{% endhighlight %}