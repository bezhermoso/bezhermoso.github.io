---
layout: post
title: "Subreddit quick-switcher in Google Chrome -- no extensions required"
---

Here is a convenient & versatile yet stependously easy trick you can do in Google Chrome, leveraging the built-in custom search engine functionality:

* Go to ___Chrome Menu &raquo; Settings &raquo; Manage search engines... (under Search)___ and scroll all the way down to the ___Other search engines___ section.
* Add a new entry:
    - Name: Anything you like (i.e. _"Subreddit"_)
    - Keyword: __r__
    - URL: `https://reddit.com/r/%s`
    
    <br>
    <img src="/img/chrome-quick-switch-setup.png">


Now, Whenever you want to visit a subreddit, simply jump to the _Address Bar_ (_Alt + D_ or _F5_ on Windows/Linux, _Command + L_ on Mac), type in _"r"_, hit _Tab_, followed by the subreddit and then hit _Enter_; and you should be taken there.

<div style='position:relative;padding-bottom:39%'><iframe src='https://gfycat.com/ifr/WeakNauticalAvocet' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>

<hr>

#### It's not for Reddit only

This is obviously not limited to the use for subreddits; you can create multiple other quick-switching "profiles" triggered by different keywords to bring you to other website URLs you visit/navigate to-and-fro frequently.

For example, if your organization uses Jira, you can set-up the following:

* Name: Jira
* Keyword: __j__
* URL: `https://<ORG NAME>.atlassian.net/browse/%s`

This will allow you to quickly navigate to any project or issue via typing _"j"_, hitting _Tab_, followed by the project/issue number in the _Address Bar_.

You are also not limited to create substitutions to the path segment of URLs; you can configure it to fill in any part of URLs; for example, `https://%s.google.com` will let you switch to the various Google services, etc.

