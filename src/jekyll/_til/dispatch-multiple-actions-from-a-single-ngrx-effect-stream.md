---
layout: til
title: Dispatch multiple actions from a single ngrx @Effect stream
date: 2016-11-29
til_category: angular2 javascript rxjs
og_image: /keep/til.png
---

If you need a single `@Effect` stream to have multiple side-effects i.e. dispatch more than one action, you can use `Rx.Observable.of` in conjunection with `mergeMap`:

{% highlight typescript %}

import { Oservable } from 'rxjs/Observable';

@Injectable()
class Effects {

   @Effect() loadList$ = this.actions$
      .ofType(this.actions.LOAD_LIST)
      .map(action => action.payload)
      .switchMap(id => { 
         return this.service.list(id)
            .map(res => res.json())
            .mergeMap(list => this.actions.setList(list))
            .mergeMap(action => {
               // Here we return an Observable that produces two actions, one after the other:
               return Observable.of(action, this.actions.secondAction());
            });
            .catch(err => this.errorActions.createWith(err))
      })
}
{% endhighlight %}

> _Note to self_: `concat` seem to be the more obvious choice, but the `concat` operator is not available for reasons I don't know.
