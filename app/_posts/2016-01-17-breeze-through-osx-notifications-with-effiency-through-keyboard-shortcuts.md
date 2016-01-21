---
title: Breeze through OS X alert notifications with swift efficiency through keyboard shortcuts
#og_image: /keep/vim-indicator-og.png
layout: post
---

I think one glaring omission from OS X's huge set of handy keyboard shortcuts for 
common functionality is the ability to dismiss all alert notifications using a global hotkey. Right now,
the only way to clear out a backlog is to click on the <em>"Close"</em> button on each and every single notification item.
Going through a backlog of alert notifications is a constant dilemma I face on a normal work day,
and I was suprised when I learned there is no other way of dimissing alert notifications that is more efficient.

<!--stop-->

I actually [found a solution](http://apple.stackexchange.com/a/155736A) by ___markhunte___ from _Ask Different_ which worked
quite well in the beginning. The solution in a nutshell is creating a custom service using _Automator_
which executes a workflow that runs an _AppleScript_ snippet that automates the
dismissal of notifications, and assigning a global hotkey to execute it.

The solution works well but only when OS X cooperates -- running the
workflow within _Automator_ cause zero problems, but making it work through
a keyboard shortcut is hit-and-miss. I found myself mucking around with accessibility settings in _System
Preferences > Security & Privacy > Privacy_ a lot, adding system applications
tucked away in `/Library/CoreServices/` to the _Accessibility_ list before getting it to work for
the first time, until I discovered that the service simply fails with no
explanation when invoked while I have certain applications in focus.

Eventually I figured out a more reliable way to accomplish this using a third-party application called [__BetterTouchTool__](http://www.boastr.net).

<div class="row">
    <div class="columns large-7 text-justify">
    <p>
        I'll also share additional workflows I wrote that allows you to perform more fine-grained actions like acting on one
        notification item at a time, i.e. dismissing it, clicking it, or clicking on
        the secondary action if available. This is great for those alert notifications
        that supports quick reply:
    </p>
    </div>
    <div class="columns large-5">
        <img src="/img/slackbot-quick-reply.png" />
    </div>
</div>


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
on dismiss()
   tell application "System Events" to tell process "Notification Center"
        set notifications to every window
        repeat with notification in notifications
            try
                click button 1 of notification
            on error
                my dismiss()
            end try
        end repeat
    end tell
end dismiss

on run {input, parameters}
    dismiss()
    return input
end run
{% endhighlight %}

> I must give credit to ___markhunte___ from the _Ask Different_ as I more or less lifted this straight out of his post and just cleaned up the code a little bit.

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

#### 1.4 Click Secondary Action on Top-most Notification.workflow

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

__Important__: Do not save these in iCloud as you will need another non-MAS application to
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
* `⌥ ⌘ '` - Click secondary action on top-most notification

<div class="row">
    <div class="columns large-6">
        <p>
            <em>BetterTouchTool</em> is a really handy application all in all that will allow you to map an unthinkable amount of things to keyboard
            shortcuts, mouse & trackpad gestures, and a bunch of other peripherals.
            It has been a free application for a very long time, but
            it won't be long until the <em>"pay as much as you want"</em> licensing model will take into
            effect. But I highly recommend it.
        </p>
        <p>
            <strong>Important</strong>: If you just installed <em>BetterTouchTool</em>, you will have to grant it access to accessibility services on your system. Go to <em>System Preferences > Security & Privacy > Privacy</em>, and add <em>BetterTouchTool</em> to the list under <em>Accessibility</em>.
        </p>
    </div>
    <div class="columns large-6">
        <img src="/img/accessibility.png" />
    </div>
</div>



## Step 3

Try it out! Go ahead and prune thorugh your alert notifications with more effiency. Or, actually learn to turn on _"Do Not Disturb"_ once in a while (no judgement here -- I am also guilty of this.)

> __Extra protip:__ You can quickly toggle _"Do Not Disturb"_ by Option-clicking
on the _Notification Center_ icon on the menu bar, or you can actually assign
a global hotkey to toggle it in _System Preferences > Keyboard > Shortcuts
> Mission Control > Turn Do Not Disturb On/Off_ for extra keyboard-ninja creds.
(It's so simple I don't even know why I don't bother to do this.)

