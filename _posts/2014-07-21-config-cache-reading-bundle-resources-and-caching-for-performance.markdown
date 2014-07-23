---
layout: post
title: "ConfigCache: Reading bundle resources and caching for performance"
date: 2014-07-21
---

__Some back-story:__ In the course of contributing some [Swagger](https://helloreverb.com/developers/swagger)-specific features
to the awesome [NelmioApiDocBundle](https://github.com/nelmio/NelmioApiDocBundle),
 the `Symfony\Component\Config\ConfigCache` class was brought to my attention. To give you an idea how this fits in, you
 should know that the bundle generates an HTML page
 documenting your REST API. It gets the needed information from metadata declared as `@ApiDoc` annotations in controllers
 in the Symfony app. On top of that, the bundle also processes metadata from different libraries:
 integration with [JmsSerializerBundle](https://github.com/schmittjoh/JMSSerializerBundle),
 Symfony's [Validator](http://symfony.com/doc/current/book/validation.html)
 and [Routing](http://symfony.com/doc/current/book/routing.html) component,
 [FOSRestBundle](https://github.com/FriendsOfSymfony/FOSRestBundle) is built-in.

 All these libraries does a good amount of caching on their end. However, `NelmioApiDocBundle` does not.
 This means, every time the documentation page is being viewed, all documentation metadata is being re-built: annotations
 read, external metadata processed; every single time
 the page is requested. Although it did not present any significant performance issues in the beginning, it is apparent
  that things can speed up a bit if we could skip
 all these steps if none of the configuration regarding routes, serialization, or validation hasn't changed at all.
 I mean, how often do they change in production, anyway?

I raised this concern on a PR when the project lead, [Will Durand](http://williamdurand.fr/), broached the subject about
using `ConfigCache` to address this. So scurried
to learn how it works. Sure enough,
there I found a nice, succinct [documentation](http://symfony.com/doc/current/components/config/caching.html) for it.

I decided to write this article to provide a comprehensive example of how to utilize `ConfigCache`,
in case some of you out there still
require a little bit of help after reading the official documentation.

<hr>

In a [previous blog post]({% post_url 2014-07-15-locating-bundle-resources %}), I detailed a way to locate resources within all registered bundles prior to or during
the compile stage of the service container. Let us build on top of that in a way that illustrates how to utilize the `ConfigCache` class as well.

I'll illustrate these topics by telling a story of a certain fictional bundle named `TheHunt/SitemapBundle`, which offers this set of functionality:

* Creates a page which lists links in the site
* Automates the generation of the `sitemap.xml` file
* Requires very minimal to zero configuration

By _"very minimal to zero"_ configuration, I mean it would require very little work to add a link to the list of links, and most importantly does not require changing any of
the major configuration files within `app/config/*`. In fact, let us define how exactly we can specify links for this bundle to use:

1. Links defined within `sitemap.yml` files scattered across different bundles.
2. Via annotations in controller actions.

Both of these styles of defining metadata seems to be the most popular within the Symfony community. For this article, lets focus on defining metadata
via YAML files within bundles. Lets set aside configuring by annotations for another blog post...

##Building the bundle

###Resources -- sitemap.yml files
Let's define how sitemap metadata can be defined in `sitemap.yml` files:

{% highlight yaml %}

# Simple routes
registration_page:
    title: Join Us!
    route: fos_security_register

about_us:
    title: About Us
    route: about_us_page

# Routes with parameters
french_site:
    title: French site
    route: home_page
    params:
        _locale: 'fr'

# External links
sponsor_1:
    title: Pearson Specter & Litt
    url: "http://pearsonspecterlitt.com?_ref=%affiliate_code"

{% endhighlight %}

Such files will be locate under the `Resources/config` directory across different bundles in your app.
(For example, your `TheHunt\UserBundle\Resources\config\sitemap.yml` would register the user pages to the sitemap,
while a similar file in `TheHunt\BlogBundle` would register blog posts, etc.)

###Services

This bundle doesn't do that many things, and all of its responsibilities can be broken down across only a few services. The service of primary interest for us would be this, though:

`TheHunt\SitemapBundle\Sitemap\LinkCollector` - This class is responsible for collecting links that are defined across different bundles:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\Sitemap;

use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Yaml\Yaml;

class LinkCollector
{
    protected $files;

    protected $links;

    protected $generator;

    public function __construct(array $files, UrlGeneratorInterface $generator)
    {
        $this->files = $files;
        $this->generator = $generator;
    }

    public function getLinks()
    {
        if (null === $this->links) {

            $this->links = array();

            foreach ($this->files as $file) {

                $linkDefs = Yaml::parse(file_get_contents($file));
                foreach ($linkDefs as $name => $linkDef) {
                    $this->links[$name] = $this->generateLink($linkDef);
                }
            }
        }

        return $this->links;
    }

    private function generateLink($linkDef)
    {
        if (!empty($linkDef['route'])) {
            $href =
                $this->generator->generate(
                    $linkDef['route'],
                    !empty($linkDef['params']) ? $linkDef['params'] : array(),
                    UrlGeneratorInterface::ABSOLUTE_URL
                );
        } elseif (!empty($linkDef['url']) {
            $href = $linkDef['url'];
        } else {
            throw new \DomainException('Not enough information provided to generate a link.');
        }

        return array(
            'title' => $linkDef['title'],
             'href' => $href,
        );

    }
}
{% endhighlight %}

And we will register this as a service:

{% highlight yaml %}
# TheHunt\SitemapBundle\Resources\config\services.yml

services:
    thehunt_sitemap.link_collector:
        class: TheHunt\SitemapBundle\Sitemap\LinkCollector
        arguments:
            - []
            - @router

{% endhighlight %}

Notice that the first constructor argument is an empty array. We have to create the actual values at run-time,
using the technique describe in this [post]({% post_url 2014-07-15-locating-bundle-resources %}):

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class TheHuntSitemapExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container)
    {
        /** Some boilerplate stuff **/

        $bundles = $container->getParameter('kernel.bundles');


        // Let's gather the paths of all sitemap.yml files that exist in bundles
        $files = array();

        foreach ($bundles as $bundleName => $bundleClass) {

            $refClass = new \ReflectionClass($bundleClass);
            $file = dirname($refClass->getFileName()) . '/Resources/config/sitemap.yml';

            if (file_exists($file) === true) {
                $files[] = $file;
            }
        }

        // Let's replace the placeholder blank array with the actual list.
        $collector = $container->getDefinition('TheHunt_sitemap.link_collector');
        $collector->replaceArgument(0, $files);
    }
}

{% endhighlight %}

As far as collecting and generating sitemap links go, we are done. Consumers of the `TheHunt_sitemap.link_collector` will simply have to call its `getLinks` method and do with the results
however they wish (to generate an XML file, or to use them in a Twig template, etc.)

###Caching

Everything works they way it should. However, if you study the whole mechanism, we are doing some potentially expensive operations:

1. Reading the contents of multiple files.
2. Parsing YAML contents
3. Generating URLs from route names and parameters.

The first item may not be expensive, but the last two can potentially a negative effect on performance, especially if we are dealing with huge YAML files or a list of 100+ routes. Imagine if we
decide to support configuration by annotations. That additional complexity would take a toll, too. We could really use some caching mechanism. Fortunately, Symfony ships with `Symfony\Component\Config\ConfigCache` which is perfect for our needs.

To make it more interesting, let us exercise some OOP chops: Instead of refactoring the existing `LinkCollector`, lets create another class that extends it and simply adds a thin layer of caching:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\Sitemap;

use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Config\ConfigCache;
use Symfony\Component\Config\Resource\FileResource;

class CachingLinkCollector extends LinkCollector
{
    protected $cacheFile;

    public function __construct($files, UrlGeneratorInterface $generator, $cacheDir, $debug)
    {
        parent::__construct($files, $generator);
        $this->cacheFile = $cacheDir . '/sitemap-links.php.cache';
        $this->cache = new ConfigCache($cacheDir, $debug);
    }

    public function getLinks()
    {
        if ($this->cache->isFresh() === false) {

            $resources = array();

            foreach ($this->files as $file) {
                // Register files that we are interested in as a FileResource instance.
                $resources[] = new FileResource($file);
            }

            $links = parent::getLinks();

            $this->cache->write(sprintf('<?php return %s', var_export($links, true)), $resources);

            return $links;
        }

        // Since the cache is clean, then just use the data stored in our cache file.
        return require $this->cacheFile;
    }
}

{% endhighlight %}

Now, when `$this->get('TheHunt_sitemap.link_collector')->getLinks()` is run for the first time, a file named `sitemap-links.php.cache` will
be created under the cache directory which contains something like:

{% highlight php %}
<?php

return array(
    'registration_page' => array(
        'title' => 'Join Us!',
        'href' => 'http://yoursite.com/user/register',
    ),
    'french_site' => ...
);
{% endhighlight %}

_(Since the data we are caching is just an array that contains primitive and scalar values, storing it as an executable PHP file with the help of `var_export` can do the job very well.
If however you are dealing with objects, this won't really work. In such a case, using `serialize` to store it and using `deserialize` during retrieval is the way to go.)_

Now, as long as none of the `sitemap.yml` files remains unmodified, this file will remain there and will never be regenerated.

The `ConfigCache` class takes care most of the complicated logic of implementing a caching layer which is smart enough to know when it should be busted or invalidated.
Compared to the TTL (time-to-live) based caching wherein the cache is busted after a set period of time, `ConfigCache` is way smarter because it actually checks whether or not
any of the resources we registered has changed since (using [`filemtime`](http://php.net/manual/en/function.filemtime.php)). If any of them has been modified, it is only logical
to bust the cache is there is a chance that the underlying data should change. This means that your cache is only built once in production as the files would remain unchanged until your next deploy (unless
you change stuff directly on production, you evil you).
Symfony's service container and router generator/matcher uses this very mechanism.

This will be the rest of the changes to finally put our caching layer to use:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{

    public function getConfigTreeBuilder()
    {
        /** Some boilerplate stuff **/

        $rootNode
            ->children()
                ->booleanNode('cache')->defaultValue(true)->end()
            ->end();

        return $treeBuilder;
    }
}

{% endhighlight %}

The above changes to our bundle's configuration clas will now expose the ability to turn caching layer on or off within our config file:

{% highlight yaml %}
# app/config/config.yml

thehunt_sitemap:
    cache: true # We can turn the caching layer on/off from here.

{% endhighlight %}

And finally, the switching between the non-caching and caching `LinkCollector`s is done via:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class TheHuntSitemapExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container)
    {
        /** Gather files... **/

        // Let's replace the placeholder blank array with the actual list.
        $collector = $container->getDefinition('TheHunt_sitemap.link_collector');
        $collector->replaceArgument(0, $files);


        // If caching is turned on in the bundle's configuration
        if ($config['cache'] === true) {

            // Replace the link collector class to use the one with caching awareness
            $collector->setClass('TheHunt\SitemapBundle\Sitemap\CachingLinkCollector');

            // Add the additional required values needed by the cache-aware counterpart
            $collector->addArgument($container->getParameter('kernel.cache_dir'));
            $collector->addArgument($container->getParameter('kernel.debug'));

        }
    }
}

{% endhighlight %}

Now our mechanism for gathering sitemap links from YAML files is complete! We wrote two classes each having their own responsibilities.

We also managed to inject just the right amount of information that these classes need, and no more.
We could have injected the container into `LinkCollector` and have it pull the `router` service from there to generate
the URLs, or even use the `$this->container->locateResource(...)` method for finding the `sitemap.yml` files.
But giving the `kernel` or the `service_container` to our `LinkCollector` is not optimal as it introduces coupling and can be considered an [anti-pattern](http://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/) in
our particular use-case.
After-all, all it needs is the list of files to read from and the `router` service to generate fully-qualified URLs, and that is all that we are giving it. Its easy to determine
what this class needs to do its job, which makes it easier to understand, manage, and test with mocks or otherwise.

Perhaps for the next blog post, lets improve this bundle even more by giving it the ability to read configuration from annotations. That task, too, will really benefit from our
caching mechanism...