---
layout: post
title: "Reading Annotations"
date: 2014-07-22
---

There seems to be quite a sizable portion of the PHP community that think that PHP annotations are a [bad idea](http://www.marclewis.com/2013/10/25/php_annotations_are_a_bad_idea/).
However, there is also a sizable portion that think that PHP annotations is not evil, and maybe actually a godsend, if the wide-spread usage is of any indication.

Personally I acknowledge that using them can be pain to deal with in when used in the wrong places, but I also think that it has a place in a limited set of areas.
It provides a lot of convenience with almost to zero drawbacks if used within the bounds of the domain exclusive to a Symfony app, but it can cause a lot of coupling when used to define metadata on
third-party libraries/bundles that you hope to plug into your app, making it brittle. I think this is rooted in the fact that there is currently no easy way to override configuration specified via annotations,
or actually to support such mechanism.

There is also the problem that the configuration will reside where the subjected class is on. This poses a huge problem when you
try to add configuration on a third-party class. Going in and modifying a class shipped by a third-party library is obviously a very
horrible idea. I was faced with this problem when trying to document a REST API I was writing using [Swagger-PHP](https://github.com/zircote/swagger-php): since I was using
[FOSUserBundle](https://github.com/FriendsOfSymfony/FOSUserBundle) and extending its `User` class for use in my app, I was faced with two
possible approaches:

1. Add `@Swagger\*` annotations within `FOS\UserBundle\Model\User` itself.
2. Extend `FOS\UserBundle\Model\User` and re-declare the properties just for the sole purpose of annotating those.

Option 1 shouldn't even be a consideration, and option 2 doesn't feel right, either. If only Swagger-PHP supports configuration via YAML or XML files...


A rule of thumb that I follow is that I only ever use annotations on application-specific classes (i.e. under `src/<your app specific vendor>`). Anything outside that is off-limits.
I think a library that wishes to construct class metadata from annotations should also support configuration via other resource files. I think annotations should only be
thought as a secondary option in defining domain metadata and not the sole option.

This post is a continuation of [this]({% post_url 2014-07-21-config-cache-reading-bundle-resources-and-caching-for-performance %}).
A quick recap: we wrote an `TheHunt\SitemapBundle` which reads YAML files to generate links for use in a site-map. In this post we will compliment
the link collection logic by adding support on specifying links through PHP annotations.

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

    private $updated;

    private $sections = array();

    public function __construct(array $options)
    {
        if (empty($options['title'])) {
            throw new \Exception('You must specify a title.');
        }

        if (empty($options['sections'])) {
            throw new \Exception('You must specify at least one section.');
        }

        $this->title = $options['title'];
        $this->sections = $options['sections'];
        $this->updated = empty($options['updated']) ? strtotime('Y-m-d H:i:s') : $options['updated'];

        if (!empty($options['params'])) {
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

    public function getUpdated()
    {
        return $this->updated;
    }

    public function getSections()
    {
        return $this->sections;
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
     * @Link(title="FAQs", params={"_locale" = "en"}, sections={"footer"}, updated="2014-05-01")
     */
    public function indexAction()
    {
        ...
{% endhighlight %}

In the case of the above example, `"FAQs"` will be assigned to `$params['title']`, `array("footer")` to `$params['sections']`,
and `array('_locale' => 'en')`, `$params['params']`, etc. in our own annotation's constructor. Straight-forward, isn't it?
    You can look back at the constructor's code and see how these values are used.

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
library. (Available via [Composer](https://getcomposer.org) of course as [`doctrine/annotations`](https://packagist.org/packages/doctrine/annotations))

Its important to note that the annotations library require us to actually configure an exclusive autoloader to autoload annotation classes. This is done by
interfacing with the `Doctrine\Common\Annotations\AnnotationRegistry` class. However if you are using Symfony, this is already taken care of (you can check `app/autoload.php` to see
how its done.)

##Putting it to use...

In order to integrate this to our `TheHunt\SitemapBundle`, we'll create another link collector:

{% highlight php %}
<?php

use TheHunt\SitemapBundle\Sitemap;

use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
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
                    'sections' => $link->getSections(),
                    'href' =>
                        $this->router->generate($name, $link->getParameters(), UrlGeneratorInterface::ABSOLUTE_URL),
                    'updated' => $link->getUpdated(),
                );
            }
        }

        return $this->links;
    }

    /**
     * Parses a controller string
     * (i.e. Foo\BarBundle\Controller\IndexController::indexAction, or service.id:indexAction)
     * and creates an appropriate \ReflectionMethod instance.
     *
     * @return \ReflectionMethod
     */
    protected function getReflectionMethod($controller)
    {
        if (strpos($controller, '::') !== false) {
            list($controller, $method) = explode('::', $controller);
            $refClass = new \ReflectionClass($controller);
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

##Caching

The `annotation_reader` service in Symfony is actually an instance of `Doctrine\Common\Annotations\FileCacheReader`, which already caches annotations
as long as the files are not being modified. However, we still have to maintain our own cache of our underlying domain data which is the collection of links.

As it stands, our `AnnotationLinkCollector` doesn't have a caching couterpart like the YAML reading `LinkCollector` does. We could create a
`CachingAnnotationLinkCollector`, but that would just entail reproducing logic from the other class, thereby violating [DRY](http://c2.com/cgi/wiki?DontRepeatYourself). That
won't be the right approach. We'll remedy this by some manageable amount of refactoring which I will detail on a future blog post.

##Annotations on the classes, properties, and within another annotation

The `@Link` annotation we created only applies to methods. However, you are probably aware that annotations can be added
on the class-level or on properties as well. Extracting them is just as easy. You would simply need to extract the
necessary `\ReflectionClass` or the `\ReflectionProperty` and call the appropriate methods in `AnnotationReader`. All you need
to know you would find [here](http://php.net/manual/en/book.reflection.php) and [here](http://docs.doctrine-project.org/projects/doctrine-common/en/latest/reference/annotations.html).

Another possible use of annotations is nesting them within another. So far I am have only stumbled on one library that
actually uses this, which is [Swagger-PHP](https://github.com/zircote/swagger-php).
