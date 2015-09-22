---
title: Download server-side assets and other non-package dependencies with Composer
layout: post
og_description: Sometimes your project has some server-side dependencies that aren't PHP libraries but which your PHP application can't run without. Or they could be assets that you don't want in your code repository, like huge database fixtures that you only need during dev and integration testing. Instead of adding them to your Git repository or any VCS of choice, why not use Composer to resolve them?
---

Sometimes your project has some server-side dependencies that aren't PHP libraries but which your PHP application can't run without. Or they could be assets that you don't want in your code repository, like huge database fixtures that you only need during dev and integration testing. Instead of adding them to your Git repository or any VCS of choice, why not use Composer to resolve them?

<aside>If you are not aware what <strong>Composer</strong> is, then I think you are missing out. Essentially it is a dependency manager for PHP. It's kinda like PEAR, but its so much better. It allows you to define your external library dependencies in a `composer.json` file, typically on your project root, and have it resolve and download them for you, including your dependencies' own dependencies. Its an awesome, widely-adopted tool which greatly improves the PHP developers' quality-of-life. I urge you to <a href="https://getcomposer.org/doc/" target="_blank">read the docs</a> and start using it.</aside>

Not many people are aware that Composer can download stuff from places other than Packagist, a Satis server, Github, or any VCS system. You can actually task it to download files that are served over HTTP, too:

{% highlight javascript %}
{
    "repositories" : [
        {
            "type" : "package",
            "package" : {
                "name" : "bez/xml-specs",
                "version" : "master",
                "dist" : {
                    "type" : "file",
                    "url" : "http://<some server>/specs.xml",
                    "reference" : "master"
                }
            }
        }
    ],
	"require" : {
		"bez/xml-specs" : "dev-master"
	}
}
{% endhighlight %}

Upon `composer install`, Composer will get `specs.yml`  and puts it under `<vendor_dir>/bez/specs-xml` just like one would expect.

This is really useful if you have assets that you don't really want in your VCS repository. One possible reason could be the file size which can adversely affect the speed of which you can clone repositories or even any VCS operations. In this case, I need a ~30Mb XML file which is hosted by a third-party. I felt its too big to be included in the Git repository, and also I don't really change it so why let Git worry about it? It could also be that the file is distributed elsewhere, which is also the case here.

For really huge files, you might want to gzip them. Thankfully, Composer will also de-compress them for you:

{% highlight javascript %}
{
    "repositories" : [
        {
            "type" : "package",
            "package" : {
                "name": "foobar/some-sql-dump",
                "version": "master",
                "dist": {
                    "type": "gzip", /* <-- Look here! */
                    "url": "http://<some server>/dump.sqlite.gz",
                    "reference": "master"
                }
            }
        }
    ],
    "require-dev" : {
        "behat/behat" : "2.4.*@stable",
        "foobar/some-sql-dump": "dev-master"
    }
}
{% endhighlight %}

This will result with a `<vendor_dir>/foobar/some-sql-dump/dump.sqlite` file ready for you to use in your Behat integration tests. Instead of passing around the SQL file around with your team-mates, just upload it somewhere and let Composer pull it down for you when you need it.

You can also download tarballs and Composer will extract the contents for you -- just specify `tar` as the package's type in its entry in the repositories section of your `composer.json` file. It's smart enough to de-compress it if its a `tar.gz` or `tar.bz2` file. You can use `zip` for ZIP files and `rar` for RAR files.

It's a handy feature that doesn't appear to be mentioned anywhere in the docs. Maybe it just means that the use-cases are very few, but its something that is nice to know.

Think thrice before using this to download assets for your front-end, though. There is a dependency manager that was built for that very purpose called [Bower](http://bower.io/). It has the advantage of being to resolve deeper dependencies for front-end packages that Composer just isn't built for. However if it is something that your PHP application consume in the back-end, using Composer is a great option.
