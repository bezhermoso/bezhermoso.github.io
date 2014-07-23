---
layout: post
title: "Reading Annotations"
date: 2014-07-22
---

This post is a continuation of [this post]({% post_url 2014-07-21-config-cache-reading-bundle-resources-and-caching-for-performance %}).
A quick recap: we wrote an `TheHunt\SitemapBundle` which reads YAML files to generate links for use in a site-map. We hinted
that it would be a delight if we support specifying links via annotations.

The first task is creating an annotation class specific for our use:

{% highlight php %}
<?php

namespace TheHunt\SitemapBundle\Annotation;

use Doctrine\Common\Annotations\Annotation;

/**
 * @Annotation
 * @Target({"METHOD"})
 */
class Link
{
    private $title;

    private $params = array();

    public function __construct(array $options)
    {
        if (!isset($options['title'])) {
            throw new \Exception('You must specify a title.');
        }

        $this->title = $options['title'];

        if (isset($options['params'])) {
            $this->params = $options['params'];
        }

    }

    public function getTitle()
    {
        return $this->title;
    }

    public function getParameters()
    {
        return $this->params;
    }
}
{% endhighlight %}

Notice that we added `@Annotation` in the the class doc-block. This serves as some sort of a tag which signifies that we can
use this class as a valid annotation. The `@Target({"METHOD"})` simply declares that this annotation can only be used
on class methods.

We would use it like this:

{% highlight php %}
<?php

use TheHunt\SitemapBundle\Annotation\Link;

class FAQController
{
    /**
     * @Link(title="FAQs", params={"_locale" = "en"})
     */
    public function indexAction()
    {
        ...
{% endhighlight %}

In the case of the above example, `"FAQs"` will be assigned to `$params['title']`, and `array('_locale' => 'en')` to `$params['params']`
in our own annotation's constructor. Straight-forward, isn't it? You can look back at the constructor's code and see how these values are used.

Extracting annotations is straight-forward as well:

{% highlight php %}
<?php

$reader = new \Doctrine\Common\Annotations\AnnotationReader();
$refClass = new \ReflectionClass('SomeController');
$refMethod = $refClass->getMethod('someAction');
$link = $reader->getMethodAnnotation($refMethod, 'TheHunt\\SitemapBundle\\Annotation\\Link');

var_dump($link->getTitle()); // string(4) "FAQs"

{% endhighlight %}

`AnnotationReader` is available in the [Doctrine Annotations](http://docs.doctrine-project.org/projects/doctrine-common/en/latest/reference/annotations.html)
library. (Available via [Composer](https://getcomposer.org) of course as [`doctrine/annotations`](https://packagist.org/packages/doctrine/annotations)) But of course
Symfony comes with this already.

##Putting it to use...

In order to integrate this to our `TheHunt\SitemapBundle`, we'll create another link collector:

{% highlight php %}
<?php

use TheHunt\SitemapBundle\Sitemap;

use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Doctrine\Common\Annotations\AnnotationReader;

class AnnotationLinkCollector
{
    protected $router;

    protected $container;

    protected $reader;

    const ANNOTATION_CLASS = 'TheHunt\\SitemapBundle\\Annotation\\Link';

    public function __construct(AnnotationReader, RouterInterface $router, ContainerInterface $container)
    {
        $this->reader = $reader;
        $this->router = $router;
        $this->container = $container;
    }

    public function getLinks()
    {
        if (null === $this->links) {

            $this->links = array();

            foreach ($this->router->getRouteCollection()->all() as $name => $route) {

                $method = $this->getReflectionMethod($route->getDefault('_controller'));

                /* Extract @Link annotation */
                if (null === ($link =
                    $this->reader->getMethodAnnotation($method, static::ANNOTATION_CLASS))) {
                    continue;
                }

                $this->links[] = array(
                    'title' => $link->getTitle(),
                    'href' => $this->router->generate($name, $link->getParameters()),
                );
            }
        }

        return $this->links;
    }

    /**
     * Parses a controller string
     * (i.e. Foo\BarBundle\Controller\IndexController::indexAction, or service.id:indexAction)
     * and extracts the \ReflectionMethod instance
     * of the controller method that could contain the Link annotation.
     *
     * @return \ReflectionMethod
     */
    protected function getReflectionMethod($controller)
    {
        if (strpos($controller, '::') !== false) {
            list($controller, $method) = explode('::', $controller);
            $refClass = new \ReflectionClass($contrroller);
            return $refClass->getMethod($method);
        } elseif (strpos($controller, ':') !== false) {
            list($service, $method) = explode(':', $controller);
            $refObject = new \ReflectionObject($this->container->get($service));
            return $refClass->getMethod($method);
        } else {
            throw new \InvalidArgumentException('Invalid controller.');
        }
    }
}
{% endhighlight %}

The service configuration for this class would look something like:

{% highlight yaml %}
services:
    thehunt_sitemap.annotation_link_collector:
        class: TheHunt\SitemapBundle\Sitemap\AnnotationLinkCollector
        arguments:
            - @annotation_reader
            - @router
            - @service_container
{% endhighlight %}

Now we have a service that will return sitemap links based on metadata defined by the use of our own `@Link` annotation.

As it stands, our `AnnotationLinkCollector` doesn't have a caching couterpart like the YAML reading `LinkCollector` do. We could create a
`CachingAnnotationLinkCollector`, but that would just entail reproducing logic from the other class, thereby violating [DRY](http://c2.com/cgi/wiki?DontRepeatYourself). That
won't be the right approach. We'll remedy this by some amount of manageable refactoring, which I can detail on a future blog post.

###Annotations on the classes, properties, and within another annotation

The `@Link` annotation we created only applies to methods. However, you are probably aware that annotations can be added
on the class-level or on properties as well. Extracting them is just as easy. You would simply need to extract the
necessary `\ReflectionClass` or the `\ReflectionProperty` and call the appropriate methods in `AnnotationReader`. All you need
to know you would find [here](http://php.net/manual/en/book.reflection.php) and [here](http://docs.doctrine-project.org/projects/doctrine-common/en/latest/reference/annotations.html).

Another possible use of annotations is nesting them within other annotations. So far I am have only stumbled on one library that
actually uses this, which is [Swagger-PHP](https://github.com/zircote/swagger-php). It is quite interesting and doesn't
look like it can be any more complicated actually, only that annotation classes would receive annotations in their constructors.