---
layout: post
title: Locating bundle resources
date: 2014-07-15
published: true
---

A month ago when I was writing a bundle that I needed for a Symfony project, I was presented with a challenge that I couldn't quite figure how to solve:
I needed to locate files from with other bundles' `Resources/` directory during my bundle's "bootstrap" phase. Basically, I was trying to configure a service
definition to pass in an array of file paths to YAML files that are scattered across different bundles as an argument.

Normally, you could just do something like this to get the absolute file path to a file from within any bundle:

{% highlight php %}
<?php

$location = $this->container->get('kernel')->locateResource('@FooBundle/Resources/config/foo_metadata.yml');

/** do stuff **/

{% endhighlight %}

However, since I needed to perform this during the early stages of the application life-cycle -- even before the compiler is even compiled -- the `kernel` service isn't available yet.

Reproducing it from within the `DependencyInjecton\*Extension#load` method seems to be the next logical step, but I quickly realized
that the underlying the logic for locating files relative to other bundles isn't that trivial at all, considering the fact that
bundles can exist practically anywhere within the application; under `src/` or deep inside `vendor/` -- the only requirement is that the autoloader can autoload it. Tricky!

After some research, I arrived at a robust solution. This is inspired by how [`JmsSerializerBundle`](https://github.com/schmittjoh/JMSSerializerBundle) does something similar.
The solution involves the use of [__reflection__](http://php.net/manual/en/book.reflection.php):

{% highlight php %}
<?php

namespace Acme\FooBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\Config\Resource\FileResource;

class FooBundleExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container)
    {
        /* Some boilerplate stuff */

        $bundles = $container->getParameter('kernel.bundles');

        $files = array();

        foreach ($bundles as $bundleName => $bundleClass) {

            $refClass = new \ReflectionClass($bundleClass);
            $bundleDir = dirname($refClass->getFileName());
            $files[] = $bundleDir . '/Resources/config/foo_metadata.yml';

            /** Do your thing **/

        }
    }
}

{% endhighlight %}

The `kernel.bundles` parameter is already available even at a stage this early. Afterall it's just a list of registered bundles, whether or not they have been prepped.
Since the the `kernel.bundles` parameter provides us with the list of bundles and conveniently provides the main bundle class, a class that
always resides in a given bundle's root directory, we can use `ReflectionClass#getFileName` to locate it and ultimately tell us where the resource files can be located.

###"What do I do with this information?"

That's entirely up to you!

Located resources from within bundles can be of many use. In fact, the core Symfony2 components locate resource files from within other bundle's directories for various purposes:
rendering templates, configuring services, applying metadata for validation and persistence, etc.
This allows us developers to define how the a certain aspect of an application will behave without having to muck around `app/config/config.yml` too much,
keeping our bundle-specific configurations contained and, well, bundled together. It is nice to provide such flexibility in the bundles we write, too. Its a good plus and is a good
investment towards keeping our bundles decoupled from one another. That is always a good thing.
