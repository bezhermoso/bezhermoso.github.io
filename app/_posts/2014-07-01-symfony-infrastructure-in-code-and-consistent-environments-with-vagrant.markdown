---
layout: post
title: Symfony2 development, Infrastructure as Code, and consistent environments with Vagrant
date: 2014-07-07
---

My new job at ActiveLAMP has put me in a position where I get to use and learn a wider set of technologies. And its a great
position to be in. Instead of confining myself with the boundaries of the LAMP stack, now I am working on projects with
requirements that necessitate the use of other technologies to achieve specific aspects of the product that are particularly
demanding on their own right that the the unholy quadro that is Linux-Apache2-MySQL-PHP just isn't sufficient anymore.

For one project I have to learn and work with [Apache Solr](http://lucene.apache.org/solr/) to provide performant and speedy search capabilities, which include
fuzzy full-text searches and geo-spatial queries as well. On another I am working with [Elasticsearch](http://www.elasticsearch.org/) to provide the exact same
set of searching capability. In other instances, I have to deal with legacy code which requires legacy versions of PHP and the rest of the
technology stack used.


Back when I was confined to just using the LAMP stack, this wouldn't be much of a problem except for maybe conflicting
PHP versions when working with legacy code. But given these hodge-podge of requirements from different projects that could
differ and conflict with one another (i.e. conflicts with PHP versions, server configurations, firewall entries, ports, etc),
its a different story. I couldn't begin to imagine how I managed to have a manageable development environment and how I keep
everything sane without the help of Vagrant, Chef & Puppet.

###Infrastructure as Code

[Chef](http://www.getchef.com/chef/) and [Puppet](http://puppetlabs.com/)
will take care of preparing a given machine(s) based on your project's server requirements. You can define every aspect of the server provisioning in configuration
files and in code, which has the added benefit of being versioned along with the project in your VCS of choice (we use [Git](http://git-scm.com)).

###Vagrant

[Vagrant](http://vagrantup.com) is a tool that allows you to define what type of machine(s) you need to run a project,
and it will prepare and boot up a virtual machine of it for you. Configuration is written in a `Vagrantfile`, therefore it can be versioned as well.

###Consistent development environments for your Symfony team

I created a simple Vagrant + Infrastructure in Code template for Symfony projects which you can find here: [symfony-vm](https://github.com/bezhermoso/symfony-vm). I hope
the instructions are easy enough to follow.

Using this will add a `vm/` directory within your project-root which you should probably version. This means each member
of your team will have their own environment which is consistent with everyone else. This also guarantees that your testers are testing your
application under the exact same environment. And provided that you provision your production servers using the exact same manifests, then you
are shielded against enviromental errors.

_"But it works on my machine..."_ is not a valid excuse anymore.
