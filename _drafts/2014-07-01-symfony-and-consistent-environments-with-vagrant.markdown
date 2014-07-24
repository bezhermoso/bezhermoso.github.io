---
layout: post
title: Symfony2 development and consistent environments with Vagrant
date: 2014-07-07
---

My new job at ActiveLAMP has put me in a position where I get to use and learn a wider set of technologies. And its a great
position to be in. Instead of confining myself with the boundaries of the LAMP stack, now I am working on projects with
requirements that necessitate the use of other technologies to achieve specific aspects of the product that are particularly
demanding on their own right that the the unholy quadro that is Linux-Apache2-MySQL-PHP just isn't sufficient anymore.

For one project I have to learn and work with Apache Solr to provide performant and speedy search capabilities, which include
fuzzy full-text searches and geo-spatial queries as well. On another I am working with Elasticsearch to provide the exact same
set of searching capability. In other instances, I have to deal with legacy code which requires legacy versions of PHP and the rest of the
technology stack used.


Back when I was confined to just using the LAMP stack, this wouldn't be much of a problem except for maybe conflicting PHP versions.
But given these hodge-podge of requirements from different projects that could differ and conflict with one another (i.e. conflicting required versions of PHP, server configurations, firewall entries, ports, etc),
its a different story. I couldn't begin to imagine how I managed to have a manageable development environment and how I keep everything sane without the help of Vagrant.

Vagrant is simply a tool that allows you to define what type of machine you need to run a project, and it will prepare and boot up a virtual machine of it for you.
In conjunction with tools like Chef and Puppet, you can also provision the virtual machine with the software packages that you require, and even configure said packages, services,
and the server itself to your needs.