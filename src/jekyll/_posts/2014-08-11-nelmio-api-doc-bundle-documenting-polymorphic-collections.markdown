---
layout: post
title: "Documenting polymorphic collections in RESTful API endpoints with NelmioApiDocBundle"
date: 2014-08-11
---

Lately I've been using [NelmioApiDocBundle](https://github.com/nelmio/NelmioApiDocBundle) to document REST APIs I implement in Symfony. This bundle generates
a beautiful documentation for your API endpoints, and it base them on the forms you use to gather input and also integrates with [JmsSerializerBundle](https://github.com/schmittjoh/JmsSerializerBundle)
and document the output of the endpoints based on how you configure your entities to be serialized.

Usually `NelmioApiDocBundle` would just work out-of-the-box provided you added the right annotations properly on your controllers. However I discovered that documenting
polymorphic collections is a little tricky and requires some extra work.

To illustrate the use-case:

I have an `/activities/recent.json` endpoint that returns a list of recent activities which could be of different types:

<!--stop-->

{% highlight php %}
<?php

abstract class AbstractActivity implements ActivityInterface
{
    protected $id;

    protected $type;

    protected $description;

    protected $timestamp;

    /* getters and setters */
}

class AnnouncementActivity extends AbstractActivity
{
    protected $detailsUrl;

    /* getters and setters */
}

class UserActivity extends AbstractActivity
{
    /**
     * @var User
     */
    protected $actor;

    /* getters and setters */
}

class InteractionActivity extends UserActivity
{
    /**
     * The receiver of the activity action
     *
     * @var User
     */
    protected $actee;

    /* getters and setters */
}

class ActivityCollection implements \IteratorAggregate, \Countable
{
    protected $activities;

    /* getters and setters; count() and getIterator() */
}

{% endhighlight %}

The controller returns something like this:

{% highlight php %}
<?php

/**
 * @ApiDoc(
 *      output={"class"="AbstractCollection", "groups"={"REST"}},
 *      description="List of recent activities.")
 */
public function recentsAction(Request $request)
{
    $recent = $this->get('activities')->getRecent();

    /** $recent is something like:
     *   new ActivityCollection(array(
     *       new UserActivity($actor, 'join', ...),
     *       new InteractionActivity($actor, $actee, 'follow', ...),
     *       new AnnouncementActivity('http://mysite.com/summer-sale'),
     *   ));
     **/

    $serialized
        = $this->serializer->serialize($recent, 'json', SerializationContext::create()->setGroups('REST'));

    return JsonResponse($serialized);

}
{% endhighlight %}

And the result being:

{% highlight javascript %}
{
    "total" : 3,
    "activities" : [
        {
            "type" : "join",
            "description" : "John joined the community!",
            "actor" : { ... },
            "timestamp" : "2014-06-01T15:22:01+0000"
        },
        {
            "type" : "follow",
            "description" : "John started following Jane!",
            "actor" : { ... },
            "actee" : { ... },
            "timestamp" : "2014-06-01T15:30:01+0000"
        },
        {
            "type" : "announcement",
            "description" : "Store is now at 70% off!",
            "details_url"  : "http://mysite.com/summer-sale",
            "timestamp" : "2014-06-01T09:00:00+0000"
        }
    ],
}
{% endhighlight %}


All these achieved with the following configuration:


{% highlight yaml %}

AbstractActivity:
    properties:
        id:
            expose: false
        type:
            type: string
            groups: [ REST ]
        description:
            type: string
            groups: [ REST ]
        timestamp:
            type: datetime
            groups: [ REST ]

AnnouncementActivity:
    properties:
        detailsUrl:
            type: string
            groups: [ REST ]

UserActivity:
    properties:
        actor:
            type: User
            groups: [ REST ]

InteractionActivity:
    properties:
        actee:
            type: User
            groups: [ REST ]

ActivityCollection:
    properties:
        activities:
            type: array
            groups: [ REST ]
    virtual_properties:
        count:
            serialized_name: total
            type: integer
            groups: [ REST ]

{% endhighlight %}

However, because the serialization config for `ActivityCollection`'s `activities` field is only specified as `array`, `NelmioApiDocBundle` wouldn't know the underlying
structure of its children. This results in a documentation that is not really descriptive.

To fix this you would be tempted change the type to `array<AbstractActivity>`. As a matter of fact, this will result into `NelmioApiDocBundle` to describe `activities` a little more.
However, this will only include fields from the abstract ancestor. But the worst part is that __it breaks the serialization process__:

{% highlight javascript %}
{
    "total" : 3,
    "activities" : [
        {
            "type" : "join",
            "description" : "John joined the community!",
            "timestamp" : "2014-06-01T15:22:01+0000"
        },
        {
            "type" : "follow",
            "description" : "John started following Jane!",
            "timestamp" : "2014-06-01T15:30:01+0000"
        },
        {
            "type" : "announcement",
            "description" : "Store is now at 70% off!",
            "timestamp" : "2014-06-01T09:00:00+0000"
        }
    ],
}
{% endhighlight %}

Because we set it to `array<AbstractActivity>`, `jms-serializer` only serializes fields from `AbstractActivity`. It makes sense, but it is not what we really want.

### Solution

The solution I opted with was to create a set of custom parsers that deals with documenting the `ActivityCollection` and the `AbstractActivity` class:

{% highlight php %}
<?php

class AbstractActivityParser implements ParserInterface
{
    protected $parser;

    public function __construct(JmsMetadataParser $parser)
    {
        $this->parser = $parser;
    }

    public function supports(array $item)
    {
        return $item['class'] === 'AbstractActivity';
    }

    public function parse(array $item)
    {
        $rootParams = $this->parser->parse($item);

        /* Hard-coded here for illustration purposes. Better if injected as constructor argument. */
        $subTypes = array(
            'AnnouncementActivity',
            'UserActivity',
            'InteractionActivity',
        );

        $extraParams = array();

        /*
         * Loop through sub-types and extract extra fields.
         */
        foreach ($subTypes as $subType) {
            $item['class'] = $subType;
            /* Get only params that are not in $rootParams */
            $subParams = array_diff($this->parser->parse($item), $rootParams);
            $extraParams = array_merge_recursive($extraParams, $subParams);
        }

        foreach ($extraParams $name => $attributes) {
            $attributes['required'] = false;
            $attributes['description'] .= '(Available only on activities of certain type.)';
            $rootParams[$name] = $attributes;
        }

        return $rootParams;
    }
}

class AbstractCollectionParser implements ParserInterface
{
    protected $parser;

    public function __construct(AbstractActivityParser $parser)
    {
        $this->parser = $parser;
    }

    public function supports(array $item)
    {
        return $item['class'] === 'AbstractCollection';
    }

    public function parse(array $item)
    {
        $item['class'] = 'AbstractActivity';
        $rootParams = $this->parser->parse($item);

        return array(
            'matches' => array(
                'dataType' => 'array of objects (Activity)',
                'actualType' => DataTypes::COLLECTION,
                'subType' => 'Activity',
                'description' => 'array of activities',
                'required' => true,
                'readonly' => true,
                'default' => null,
                'children' => $rootParams,
            ),
        );
    }
}
{% endhighlight %}

In concert, the API documentation for endpoints that return `AbstractActivity` will contain fields from sub-classes, and the documentation for `/activities/recent.json` will
give more information on the underlying structure of `activities` items.
