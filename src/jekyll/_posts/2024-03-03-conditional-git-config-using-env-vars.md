---
layout: post
title: "Conditional Git configuration based on environment variables"
---

A thought that seem to recur in my head every quarter or so is _"Can I set a Git config based on some environment variables?"_. Then I'd go reading the `git-config` man page and find out for the <i>n</i>th time that its just not possible: it only supports conditionals by matching branch names or the directory they're in. Nothing about setting configurations based on environment variables.

If you also wondered the same, I have good news for you: it is actually possible.
You just gotta look at the right man page!

Straight from `man git` is this gem:

```
--config-env=<name>=<envvar>
    Like -c <name>=<value>, give configuration variable <name> a value,
    where <envvar> is the name of an environment variable
    from which to retrieve the value. 
```
Equipped with this new knowledge, I am finally able to apply some Git configurations based on context that `.gitconfig`
isn't equipped to handle.

## Use-case: Disable 1Password GPG signing when accessing remotely

I have 1Password setup as an SSH agent on my Mac Studio, and have it configured to sign commits via its SSH keys.
However sometimes signing commits this way is just not possible: 1Password rightfully requires me to be physically present at
my desk to approve a Touch ID prompt, but I am SSHing to it with my iPad while doing laundry in my garage. The prompt is blocking: unless I go
authenticate it through the prompt on the Mac, the commit operation just hangs, waiting for something that isn't happening.

Here's how I solve it today: in my `.zshrc`:

```sh
# .zshrc

# Checks if we are accessing the machine remotely via SSH:
if [[ -n "$SSH_CONNECTION" ]]; then
    # Desired configuration is:
    # gpg.format set to "openpgp" instead of "ssh" (1Password SSH agent)
    # user.signingkey  set to GPG pubkey instead of SSH pubkey in 1Password
    export GIT_CONFIG_GPG_FORMAT="openpgp"
    export GIT_CONFIG_USER_SIGNINGKEY="<MY_SIGINING_GPG_PUBKEY>"
    
    # Always give --config-env=... to all Git operations:
    alias git='git --config-env=gpg.format=GIT_CONFIG_GPG_FORMAT --config-env=user.signingkey=GIT_CONFIG_USER_SIGNINGKEY'
fi
```

...et voila! I am finally able to sign commits of work I've done on my iPad, straight from my iPad.

### Bonus: Conditional SSH configuration via shell checks

Not long after putting the iPad-friendly Git configurations in place did I run into another problem: since 1Password is the SSH agent, pushing my changes up to Github.com doesn't really work, for fundamentally the same reasons.

After a quick visit to `man ssh_config`, I've formulated this SSH configuration:

```sh
Host *
    # Use 1Password the default SSH identity agent:
    IdentityAgent "<PATH_TO_1PASSWORD_SSH_AUTH_SOCK>"

Match exec "[[ -n $SSH_CONNECTION ]]" Host github.com
    # Reset IdenittyAgent to default:
    IdentityAgent SSH_AUTH_SOCK
    # Only offer identity & certificate files.
    # Without this, SSH will still ask the 1Password agent for identities,
    # which blocks the push indefinitely:
    IdentitiesOnly yes
    # Finally, tell it where to find the private key on disk:
   IdentityFile ~/.ssh/id_fallback
```

That's the final piece of the puzzle to smoothen out my remote iPad workflow.
