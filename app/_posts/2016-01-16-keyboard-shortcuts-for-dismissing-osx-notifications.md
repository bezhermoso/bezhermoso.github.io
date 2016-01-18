---
title: Create keyboard shortcuts to manage alert notifications on OS X
#og_image: /keep/vim-indicator-og.png
layout: post
---

I think one glaring omission from OS X's huge set of handy keyboard shortcuts for 
common functionality is the ability to dismiss all alert notifications using a global hotkey. Right now,
the only way to clear out a backlog is to click on the <em>"Close"</em> button on each and every single notification item.
Going through a backlog of alert notifications is a constant dilemma I face on a normal work day,
and I was suprised when I learned there is no quicker way of dimissing all alert notifications.

I actually [found a solution](http://apple.stackexchange.com/a/155736A) by ___markhunte___ from _Ask Different_ which worked
quite well in the beginning. The solution in a nutshell is creating a custom service using _Automator_
which executes a workflow that runs an _AppleScript_ snippet that automates the
dismissal of notifications, and assigning a global hotkey to execute it.

The solution works well but only when OS X cooperates -- running the
workflow within _Automator_ cause zero problems, but making it work through
a keyboard shortcut is hit-and-miss. I found myself mucking around in _System
Preferences > Security & Privacy > Privacy_ a lot before getting it to work for
the first time, until I discovered that they service simply fails with no
explanation when invoked while I have certain applications in focus.

Eventually I figured out a more consistent way to accomplish this using a third-party application called [__BetterTouchTool__](http://www.boastr.net),
and also show you how to perform more fine-grained actions like dismissing just the
top-most alert notification, clicking it, or clicking on the secondary action if available -- all via global hotkeys.

## Step 1: Create workflows in _Automator_

You will need to create a workflow in ___Automator___ for each of the
AppleScript programs listed below.

On each workflow, select ___"Run AppleScript"___ from the _Actions_ menu, put
in the corresponding AppleScript code in the text box that appears on the right-side, and
save the workflow somewhere you can find it later on.

<div class="row">
    <div class="columns large-6">
        <img src="/img/automator-create-workflow.png" />
    </div>
    <div class="columns large-6">
        <img src="/img/automator-workflow.png" />
    </div>
</div>

#### 1.1 Dismiss All Notifications.workflow

_Actions > Run AppleScript..._
{% highlight applescript %}
on run {input, parameters}
   tell application "System Events" to tell process "Notification Center"
        set notifications to every window
        repeat with i from 1 to number of items in notifications
            set notification to item i of notifications
            try
                click button 1 of notification
            end try
        end repeat
    end tell
    return input
end run
{% endhighlight %}

> I must give credit to ___markhunte___ from the _Ask Different_ as I more or less lifted this straight out of his post with only some minor modifications.

#### 1.2 Dismiss Top-most Notification.workflow

_Actions > Run AppleScript..._
{% highlight applescript %}
on run {input, parameters}
    tell application "System Events" to tell process "Notification Center"
        try
            click button 1 of last item of windows
        end try
    end tell
    return input
end run
{% endhighlight %}

#### 1.3 Click Top-most Notification.workflow

_Actions > Run AppleScript..._
{% highlight applescript %}
on run {input, parameters}
    tell application "System Events" to tell process "Notification Center"
        try
            click last item of windows
        end try
    end tell
    return input
end run
{% endhighlight %}

#### 1.4 Secondary-click Top-most Notification.workflow

_Actions > Run AppleScript..._
{% highlight applescript %}
on run {input, parameters}
    tell application "System Events" to tell process "Notification Center"
        try
            click button 2 of last item of windows
        end try
    end tell
    return input
end run
{% endhighlight %}

> Teaching AppleScript is obviously beyond the scope of this post. If you are
not familiar with it, there are tons of articles online that can get you started, like [this one](http://computers.tutsplus.com/tutorials/the-ultimate-beginners-guide-to-applescript--mac-3436).

_Important_: Do not save these in iCloud as you will need another non-MAS application to
access them on a later step.

<!--## Step 2: Grant assistive services to the AppleScript applications-->

<!--Go to ___System Preferences > Security & Privacy > Privacy___, and add the-->
<!--applications you just created (_not the AppleScript source files_) to the list.-->

<!--<img src="/img/security-and-privacy.png" />-->

## Step 2: Assign global hotkeys to the Automator workflows

There is a number of productivity applications out there that allows you to invoke an Automator workflow
through a global hot-key, like [__Alfred__](https://www.alfredapp.com/) and [__Keyboard Maestro__](https://www.keyboardmaestro.com/main/).

However, I personally use __[BetterTouchTool](http://www.boastr.net/)__ as I already have
it installed to accomplish similar tasks. 

<img src="/img/bettertouchtool.png">

My mapping is as follows:

* `⇧ ⌥ ⌘ ]` - Dismiss all notifications
* `⌥ ⌘ ]` - Dismiss top-most notification
* `⌥ ⌘ [` - Click top-most notification

> _BetterTouchTool_ is a really handy application all in all that will allow you to map an unthinkable amount of things to keyboard
> shortcuts, mouse & trackpad gestures, and a bunch of other peripherals.
> It has been a free application for a very long time, but
> it won't be long until the _"pay as much as you want"_ licensing model will take into
> effect. But I highly recommend it.

## Step 3

Now go ahead and dismiss all those notifications with impunity... Or, don't be like me and learn to turn on _"Do Not Disturb"_ once in a while.
