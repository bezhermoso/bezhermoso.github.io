---
layout: post
title: "Consolidating alike services via service tags and the Composite design pattern: \"Reading bundle resources...\" part 3"
date: 2014-07-27
---

This post dives into the concept of __tagged services__ and how it can be utilized to compose services with pluggable components to
add extra behavior to a service without modifying its underlying code, as stipulated by the [SOLID](http://en.wikipedia.org/wiki/SOLID_(object-oriented_design))
 principles.

This is a continuation of a series of blog posts
I wrote about reading resource bundles & caching in the context of a fictional `TheHunt\SitemapBundle` bundle.
Here are [part 1]({% post_url 2014-07-21-config-cache-reading-bundle-resources-and-caching-for-performance %})
 & [part 2]({% post_url 2014-07-22-reading-annotations-reading-bundle-resources-continued %}) if you haven't read them yet.

<hr/>
In the previous post, we added a new service named `thehunt_sitemap.annotation_link_collector`, which gathers metadata from annotations on
controllers. This is somewhat similar to `thehunt_sitemap.link_collector`, although this one reads YAML files instead of annotations, and has a
thin caching layer. However both of them have similarities, which is being able to produce a list of links. Afterall, this is their ultimate responsibility; from
where they gather links from are just implementation details.

###Backwards-compatibility challenge

You actually glimpse at the progression of our bundle architecture by looking at the name of our services: the annotation-reading
service appears to have a very descriptive name, while its YAML-reading counterpart has a very generic one. You could look
at this and see that when we wrote the `thehunt_sitemap.link_collector` service, we have never considered that there could be another variant of a link collector.
Only until we considered support annotations did we realize that the naming is too generic.

We could easily change the name to
`thehunt_sitemap.yaml_link_collector` to make it more meaningful. But what if there are other services that already depends on the `thehunt_sitemap.link_collector`
service name? __Removing the `thehunt_sitemap.link_collector` will break backward-compatibility__ as doing so will render dependent services broken.

We can solve this by the use of the [__Composite design pattern__](http://sourcemaking.com/design_patterns/composite). Here is a brief
description from Wikipedia:

<blockquote>The composite pattern describes that a group of objects is to be treated in the same way as a single instance of an object. The intent of a composite is to "compose" objects into tree structures to represent part-whole hierarchies. Implementing the composite pattern lets clients treat individual objects and compositions uniformly.</blockquote>

This pattern will help solve our BC-break problem by allowing us to keep the service name and assign it a service that interacts
with the two existing collectors, but can also be treated as if its just another link collector variant. Existing consumers
of the `thehunt_sitemap.link_collector` will be none-the-wiser.

## A much needed refactoring...
Lets get the ball rolling by defining what actually _is_ a link collector. We do this by defining an interface:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\Sitemap;

interface LinkCollectorInterface
{
    /**
     * Returns a list of links with a title,
     * the updated timestamp, and the section where the link should appear.
     *
     * Each element should have these properties:
     *    - href: The absolute URL
     *    - title: The page title
     *    - updated: A DateTime object of the updated date of the link.
     *    - sections: An array of section names where the link should be displayed.
     *
     * @return array
     */
    public function getLinks();
}

{% endhighlight %}

The doc-block should be pretty explanatory of what is expected from each concrete link collectors.

Now let's rename `LinkCollector` and `CachingLinkCollector` to `YamlLinkCollector` and `CachingYamlCollector` respectively,
and update it and the other collectors to implement our new interface:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\Sitemap;

class YamlLinkCollector implements LinkCollectorInterface
{
    ...
}

class CachingYamlLinkCollector extends YamlLinkCollector implements LinkCollectorInterface
{
    ...
}

class AnnotationLinkCollector implements LinkCollectorInterface
{
    ...
}

{% endhighlight %}

As these classes already has a `getLinks` method, we don't have to change the rest of the code at all.

We can now create a new class which will be our composite class:

{% highlight php %}
<?php

class LinkCollectorChain implements LinkCollectorInterface
{
    protected $collectors = array();

    /**
     * Adds a link collector to the chain.
     *
     * @param LinkCollectorInterface $collector
     */
    public function addCollector(LinkCollectorInterface $collector)
    {
        $this->collectors[] = $collector;
    }

    /**
     * Collects links from the various link collectors added in the chain
     * and collate them into a single list.
     *
     * @return array
     */
    public function getLinks()
    {
        $links = array();

        foreach ($this->collectors as $collector) {
            $links = array_merge($links, $collector->getLinks());
        }

        return $links;
    }
}
{% endhighlight %}

As you can see, the `LinkCollectorChain` doesn't do that much: all it does is loop through the link collectors that it is composed
of, and collate the results into one. Think of it as a link collector which collects links from other link collectors. __It disguises
the use of multiple link collectors as a single link collector.__ This dynamic is the essence of the _Composite design pattern._

As far as the architecture is concerned, we are basically done!

###Building the chain

Internally, this is what we want to achieve to make use of our composite class:

{% highlight php %}
<?php

$collector = new LinkCollectorChain(array(
    new CachingYamlLinkCollector($yamlFiles, $router, $cacheDir, $debug),
    new AnnotationLinkCollector($reader, $reader, $container),
    /** possibly more link collectors **/
));

$links = $collector->getLinks();
{% endhighlight %}

Since we want to support link collectors that other bundles wishes to use, we need to build the chain at run-time. We do this by
using [__tagged services__](http://symfony.com/doc/current/components/dependency_injection/tags.html):

Let us stipulate that link collectors should be tagged as a `sitemap.link_collector`. Our service definition will look
like this:

{% highlight yaml %}

services:
    thehunt_sitemap.yaml_link_collector:
        class: TheHunt\SitemapBundle\Sitemap\YamlLinkCollector
        arguments:
            - []
            - @router
        tags:
            - { name: thehunt_sitemap.link_collector } #Service is now tagged.

    thehunt_sitemap.annotation_link_collector:
        class: TheHunt\SitemapBundle\Sitemap\AnnotationLinkCollector
        arguments:
            - @annotation_reader
            - @router
            - @service_container
        tags:
            - { name: sitemap.link_collector } #Service is now tagged.

    thehunt_sitemap.link_collector_chain:
        class: TheHunt\SitemapBundle\Sitemap\LinkCollectorChain
        public: false
        arguments:
            - []

    thehunt_sitemap.link_collector:
        class: TheHunt\SitemapBundle\Sitemap\LinkCollectorInterface
        alias: sitemap.link_collector_chain

{% endhighlight %}

And finally, we have to create a __compiler pass__ that will take care of the actual composition of our chain:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\DependencyInjection\CompilerPass;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;

class LinkCollectorsPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container)
    {
        $chain = $container->getDefinition('thehunt_sitemap.link_collector_chain');

        $collectors = $container->findTaggedServiceIds('sitemap.link_collector');

        /**
         * Loop through the tagged services and add them to the provider chain
         * through the `addLinkCollector` method.
         */
        foreach ($collectors as $serviceId => $attributes) {
            foreach ($attributes as $attr) {
                $chain->addMethodCall('addLinkCollector', array(
                    new Definition($serviceId),
                ));
            }
        }
    }
}
{% endhighlight %}

Now, whenever the `thehunt_sitemap.link_collector_chain` service is initialized the first time, all services tagged with
`thehunt_sitemap.link_collector` are injected into it. Calling `getLinks` on it will return links read from both YAML and annotation
resources.

We also achieved backwards-compatibility such that any existing user-land code using the `thehunt_sitemap.link_collector` service somewhere
still work the way they should.

<hr>

Since we renamed our YAML-reading link collector and its caching variant, we need to update the bootstrapping logic to point
to the right services:

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

        $collector = $container->getDefinition('thehunt_sitemap.yaml_link_collector');
        $collector->replaceArgument(0, $files);

        // If caching is turned on in the bundle's configuration
        if ($config['cache'] === true) {

            // Replace the link collector class to use the one with caching awareness
            $collector->setClass('TheHunt\SitemapBundle\Sitemap\CachingYamlLinkCollector');

            /** Rest of the stuff **/

        }
    }
}

{% endhighlight %}

#### Hiding internals by protecting services

You might be wondering what's up with the `public: false` and the `alias` clause in our new service configuration...

We set `thehunt_sitemap.link_collector_chain` as __private__ so that we can hide it from the user-land. This means that
calling `$this->container->get('thehunt_sitemap.link_collector_chain')` will result to an exception. This prevents any
code from possibly registering more link collectors on-the-fly after the container is compiled.

However we can still have it available for use by setting aliasing
it as `thehunt_sitemap.link_collector`, which is simply defined as a `LinkCollectorInterface`. Consumers only needs to know
that the service implements that interface, and that's it. This way we can shield ourselves from possible BC breaks in the future caused by consumers that
know too much and __wrongfully__ rely on the underlying implementation. This will help enforce that our consumers should
program against our interface and not against an implementation, in respect to the [__Liskov substitution principle__](http://en.wikipedia.org/wiki/Liskov_substitution_principle).