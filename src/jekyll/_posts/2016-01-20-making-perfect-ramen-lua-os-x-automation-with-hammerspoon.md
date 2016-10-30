---
title: "Making perfect ramen with Lua: OS X automation with Hammerspoon"
og_image: /keep/hammerspoon.png
layout: post
---

Yesterday I discovered __[Hammerspoon](http://www.hammerspoon.org)__, a project
that touts itself as a _"tool for powerful automation of OS X"_. After giving
it a try, not only did I find that statement to be true, but as someone who has 
__ZERO__ prior practical experience with Lua, I was surprised by how relatively easy it was to
get on board. Now, I'm hooked.

## __Lua scripting__

<div class="row">
    <div class="columns large-6">
    <p>
<em>Hammerspoon</em> exposes system level APIs into a Lua environment, and config files
are written in Lua.
    </p>
    <p>
    Syntactically, Lua reminds me a lot of Javascript and Ruby and, by extension, CoffeeScript. If you write in any of these three languages,
    you already have a leg up on the rest.
    </p>
    <p>
    I find Lua's simplicity refreshing. I found it easy to pick up the basics of <em>Lua</em> and start writing something in it, and was able to just learn more as I went. Functions are first-class citizens in Lua (can be passed around as arguments or as return values) so familiarity with functional programming paradigms goes a long way.
    </p>
    </div>
    <div class="columns large-6">
        <img src="/img/lua-preview.png">
        <div class="caption">From <a
        href="https://learnxinyminutes.com/docs/lua/" target="_blank">Learn Lua in Y Minutes</a></div>
    </div>
</div>
<br>

However, unlike Javascript and Ruby, Lua does not have a built-in
functional library to do things like `map`, `filter`, `reduce`,
_etc._, but Hammerspoon comes with [`hs.fnutils`](http://www.hammerspoon.org/docs/hs.fnutils.html) which provides a bunch of
functional utilities. Its not exhaustive, but its good enough for not-so-complex
scripting which Hammerspoon falls into.

## Inside my `~/.hammerspoon/init.lua`

> OS X already comes with _Automator_, which allows you to do automation on
Macs. But there are things that you  can't do with _Automator_ alone. 

<a href="#cycle-displays">1. Cycle through displays</a>
<br>
<a href="#webpage-on-wifi-connect">2. Open a web-page as soon as I connect to a particular WiFi network</a>
<br>
<a href="#perfect-ramen">3. Make perfect ramen every time</a>

<h3 id="cycle-displays">1. Cycle through displays</h3>

I wanted to start small, so I picked a little annoyance I find myself battling with daily and aimed to solve it. One such annoyance pertains to switching focus between multiple displays:

I have a dual-display setup at work and I have all my GUI applications running on the
primary display, with the exception of a couple of full-screen terminal windows running `tmux`, `vim`, a `zsh` shell, monitoring tools, logs, _etc._ occupying the
entirety of a secondary screen across multiple Spaces. I also have other full-screen applications
living in their own Spaces on the primary display. My setup works really well for me most of the time, but
there are certain combinations of circumstances on how applications are laid out across all
Spaces and the order in which I have accessed them that results in a state where
Command (⌘)-Tab or a three-finger swipe doesn't bring me where I want to go. So my
first challenge was to make something in Hammerspoon that would allow me to
cycle through the displays with ___consistency___.

Here is my solution:

{% highlight lua %}
-- DISPLAY FOCUS SWITCHING --

--One hotkey should just suffice for dual-display setups as it will naturally
--cycle through both.
--A second hotkey to reverse the direction of the focus-shift would be handy
--for setups with 3 or more displays.

--Bring focus to next display/screen
hs.hotkey.bind({"alt"}, "`", function ()
  focusScreen(hs.window.focusedWindow():screen():next())
end)

--Bring focus to previous display/screen
hs.hotkey.bind({"alt", "shift"}, "`", function() 
  focusScreen(hs.window.focusedWindow():screen():previous())
end)

--Predicate that checks if a window belongs to a screen
function isInScreen(screen, win)
  return win:screen() == screen
end

-- Brings focus to the scren by setting focus on the front-most application in it.
-- Also move the mouse cursor to the center of the screen. This is because
-- Mission Control gestures & keyboard shortcuts are anchored, oddly, on where the
-- mouse is focused.
function focusScreen(screen)
  --Get windows within screen, ordered from front to back.
  --If no windows exist, bring focus to desktop. Otherwise, set focus on
  --front-most application window.
  local windows = hs.fnutils.filter(
      hs.window.orderedWindows(),
      hs.fnutils.partial(isInScreen, screen))
  local windowToFocus = #windows > 0 and windows[1] or hs.window.desktop()
  windowToFocus:focus()

  -- Move mouse to center of screen
  local pt = geometry.rectMidPoint(screen:fullFrame())
  mouse.setAbsolutePosition(pt)
end

-- END DISPLAY FOCUS SWITCHING --

{% endhighlight %}

With this in place, I can now confidently move across applications (and
subsequently, across Spaces) with a few key-strokes. Thanks to Lua's concise syntax and [Hammerspoon's well-documented API](http://www.hammerspoon.org/docs/), this only took a few minutes to write. As you can see, binding hotkeys to custom actions are trivial with Hammerspoon.

<h3 id="webpage-on-wifi-connect">2. Open a web-page as soon as I connect to a particular WiFi network</h3>

I admit I am a forgetful person, especially when it comes to relatively small routine stuff.
At work we use Zenefits to keep track of our working hours, clocking in and
clocking out from within their web portal. I don't feel confident that I will
always remember to clock first thing in the morning, so I naturally started
looking for applications that I could configure to somehow remind me to clock in whenever I connect to our office's network. I initially used [ControlPlane](http://www.controlplaneapp.com/) for this and it worked well. But why not do it in Hammerspoon now that I got my feet wet?

{% highlight lua %}

-- WORK-RELATED AUTOMATION --

-- Open Zenefits Dashboard once connected to WiFi network at work.
local workWifi = "ActiveLAMP Airport"
local employeeDashboardUrl = "https://secure.zenefits.com/dashboard/#/"
local defaultBrowser = "Google Chrome"

hs.wifi.watcher.new(function ()
  local currentWifi = wifi.currentNetwork()
  -- short-circuit if disconnecting
  if not currentWifi then return end

  local note = hs.notify.new({
    title="Connected to WiFi", 
    informativeText="Now connected to " .. currentWifi
  }):send()

  --Dismiss notification in 3 seconds
  --Notification does not auto-withdraw if Hammerspoon is set to use "Alerts"
  --in System Preferences > Notifications
  hs.timer.doAfter(3, function ()
    note:withdraw()
    note = nil
  end)

  if currentWifi == workWifi then
    -- Allowance for internet connectivity delays.
    hs.timer.doAfter(3, function ()
      -- @todo: Explore possibilities of using `hs.webview`
      hs.execute("open " .. employeeDashboardUrl)

      --Make notification clickable. Browser window will be focused on click:
      hs.notify.new(function () 
        hs.application.launchOrFocus(defaultBrowser)
      end, {title="Make sure you clock in!"}):send()
    end)
  end
end):start()

-- END WORK-RELATED AUTOMATION --

{% endhighlight %}

Next thing to automate is opening _Tempo Timesheets_ in Jira every 2 hours as
long as I'm in our ofice network to remind me to put in worklogs.

<h3 id="perfect-ramen">3. Make perfect ramen every time</h3>

A hot, 3-minute ramen is good. Sometimes its better _al-dente_. But warm, soggy, 10-minute ramen? Not cool. 

For better ramen:

{% highlight lua %}

-- RAMEN TIMER --

--Schedule a notification in 3 minutes.
function startRamenTimer()
  hs.timer.doAfter(3 * 60, function ()
    hs.notify.new({
        title="Ramen time!",
        informativeText="Your ramen is ready!"
    }):send()
  end)
  hs.alert(" Ramen timer started! ")
end

--Bind timer to `hammerspoon://ramentime`:
hs.urlevent.bind("ramentime", startRamenTimer)

-- END RAMEN TIMER --

{% endhighlight %}

Hammerspoon's `hs.urlevent` is a beautiful thing: it allows you to bind some
action to a URL with a `hammerspoon://` scheme. This makes Hammerspoon actions
almost universally accessible! In this case, opening `hammerspoon://ramentime` will start the timer. Now, we can if we want create a bookmarklet on the browser's
toolbar pointing to it that when clicked will activate the timer.

Because of the portability of URL schemes, I was able to create a very basic _Alfred Workflow_ that triggers the timer. have to do is type `ramen` into [__Alfred__](https://www.alfredapp.com/) to ensure prime ramen all the time:

<div class="text-center">
<p>
<blockquote class="imgur-embed-pub" lang="en" data-id="cpZ73Xs"><a href="//imgur.com/cpZ73Xs">View post on imgur.com</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>
</p>
    <p>
        <em>...and three minutes minutes later...</em>
    </p>
    <p>
    <img src="/img/ramen-notification.png" alt="">
    </p>
</div>

### "Hey, Jarvis..."
<div class="row">
<div class="columns large-6">
<p>Another nifty thing you can do is create a dictation command to trigger the timer.
Enable <em>Dictation</em> on your Mac, go to <em>System Preferences > Accessibility
Dictation...</em>, click the <em>Dictation Commands...</em> button, and turn on <em>Enable advanced
commands</em>.
From here you can add a new voice command in the list and configure it to open the
time via URL. Have fun!</p>
</div>
<div class="columns large-6">
<img src="/img/ramen-dictation.png">
</div>
</div>


---

If you are into automating things on your Mac, give _Hammerspoon_ a spin. You
might like it, too.
