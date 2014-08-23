---
layout: post
title: "ALSwaggerUIBundle v0.1.1 released."
---

After putting a colleague in a short ordeal of testing a feature dependent on `dev-master` that stopped working because of some
backwards-incompatible change I commited to the `master` branch, I finally got off my lazy butt and tagged
a __first stable release for [ALSwaggerUIBundle](https://github.com/activelamp/swagger-ui-bundle)__.

This bundle doesn't do anything much but give a quick and easy way to add a [swagger-ui](https://github.com/wordnik/swagger-ui) page to
your Symfony2 application.

If you are developing a RESTful API and care about having a documentation that is
really descriptive, you really ought to check it out. `swagger-ui` would only require you to provide JSON files
describing your API using the [Swagger specifications](https://github.com/wordnik/swagger-spec).
You should [try it out and what cool things it can do.](http://petstore.swagger.wordnik.com/)


![swagger-ui screenshot]({{ site.url }}/images/swagger-ui-1.png)

<hr>

See how pretty it looks? It's really worth the effort.

If you happen to be following the development of the excellent `NelmioApiDocBundle` closely