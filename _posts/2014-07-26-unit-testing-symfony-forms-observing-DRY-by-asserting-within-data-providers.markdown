---
layout: post
title: "Unit-testing Symfony forms: observing DRY by asserting within data providers "
data: 2014-07-26
---

I've been using a lot of the [Symfony Form](http://symfony.com/doc/current/book/forms.html) component lately to handle
input in REST endpoints.
Instead of handling the parameters myself within controllers, I use forms to do it for me for various reasons:

* It keeps the [controllers thin](http://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc).
* It makes the definition of the parameters explicit. The form itself serves as the documentation of what the REST endpoint will
accept as valid input.
* It makes validation a breeze thanks to how the Form component integates with [Symfony Validation.](http://symfony.com/doc/current/book/validation.html)
* It makes our Swagger API documentation up-to-date with our code at all times,
thanks to [NelmioApiDocBundle](https://github.com/nelmio/NelmioApiDocBundle)
* It helps making changes to the endpoint's interface a lot easier.
* ...and quite importantly, __it makes the parameter handling and validation testable__.

Writing tests for forms involves repetitive tasks, though: 1. Create the form, 2. submit data, 3. assert validation, 4. assert
if data is properly populated. Then we do the same steps again but with different data to submit, and most likely a different
set of assertions to go with it. This leads to ~500 lines of code, but could be more depending on the complexity of the forms.

To solve this problem, I've been writing my tests like this:

{% highlight php %}
<?php

class UserFormTest extends KernelTestCase
{
    protected $formFactory;

    public function setUp()
    {
        static::bootKernel();
        $this->formFactory = static::$kernel->getContainer()->get('form.factory');
    }

    /**
     * @dataProvider dataFormTest
     */
    public function testForm(array $data, callable $assertions)
    {
        $user = new User();
        $form = $this->formFactory->create(new UserType(), $user);
        $form->submit($data);
        $assertions($form, $user, $this);
    }

    /**
     * This method returns an associative array of
     * array + callable pairs to satisfy the arguments of
     * our test-case above.
     */
    public function dataFormTest()
    {
        return array(
            'scenario_1' => array(
                array(
                    'first_name' => 'Bezalel',
                    'last_name' => 'Hermoso',
                    'title' => 'Mr.',
                    'username' => 'BezHermoso',
                    /* Rest of data */
                ),
                function (Form $form, User $user, KernelTestCase $testCase) {
                    $testCase->assertTrue($form->isValid());
                    $testCase->assertEquals('Mr. Bezalel Hermoso', $user->getDisplayName());
                    $testCase->assertEquals('bezhermoso', $user->getUsername());
                    /* More assertions */
                },
            ),
            'scenario_2' => array(
                array(
                    'first_name' => 'Justin',
                    'last_name' => 'Case',
                    'title' => null,
                    'username' => null,
                    /* Rest of data */
                ),
                function (Form $form, User $user, KernelTestCase $testCase) {
                    $testCase->assertFalse($form->isValid());
                    $errors = $form->getErrors();
                    $testCase->assertCount(1, $errors);
                    $testCase->assertEquals('Username cannot be blank.', $errors[0]->getMessage());
                    /* More assertions */
                },
            ),
            /* More scenarios */
        );
    }
}
{% endhighlight %}

This strategy of unit-testing forms leverages the utility of [data providers](http://phpunit.de/manual/3.7/en/writing-tests-for-phpunit.html#writing-tests-for-phpunit.data-providers)
to keep my tests lean and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)-compliant.