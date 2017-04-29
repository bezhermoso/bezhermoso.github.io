---
layout: til
title: "Append running total to each line in CSV file with `awk`"
til_category: awk
date: 2017-04-29
og_image: /img/keep/til.png
---

I had a CSV of bank transactions and I wanted to append a running total on each entry. Here is how I achieved it using only `awk`.

This is what the CSV file looks like:

{% highlight text "transactions.csv" %}
Posted Date,Reference Number,Payee,Address,Amount
04/25/2017,<TRANSACTION ID>,"SEAFOOD CITY SUPERM SOUTH SAN FRACA","SOUTH SAN FRA CA ",-1.77
04/25/2017,<TRANSACTION ID>,"SAFEWAY STORE 00028787 MILBRAE CA","MILBRAE       CA ",-5.67
04/24/2017,<TRANSACTION ID>,"SQ *EGGETTES-MILLBRAE Millbrae CA","Millbrae      CA ",-23.00
04/24/2017,<TRANSACTION ID>,"SEAFOOD CITY SUPERM SOUTH SAN FRACA","SOUTH SAN FRA CA ",-23.13
04/24/2017,<TRANSACTION ID>,"WALGREENS #2939 SAN BRUNO CA","SAN BRUNO     CA ",-2.04
04/24/2017,<TRANSACTION ID>,"REDBOX *DVD RENTAL 866-733-2693 IL","866-733-2693  IL ",-5.44

...

{% endhighlight %}

Here is the command:

{% highlight bash %}
$ awk -F, 'BEGIN { sum=0 } NR>1 { sum+=$5; print $0 "," sum }' transactions.csv \
  | tee transactions-with-running-sum.csv \
  | column -s'","' -t
{% endhighlight %}

We pass `awk`'s output to `tee` so that we can stream the output to both a file and standard output. Here, the altered CSV data is saved as `transactions-with-running-sum.csv`, while we display a better-looking version to our terminal:

{% highlight bash %}
04/25/2017  <TRANSACTION_ID>  SEAFOOD CITY SUPERM SOUTH SAN FRACA       SOUTH SAN FRA CA   -1.77    -1.77
04/25/2017  <TRANSACTION_ID>  SAFEWAY STORE 00028787 MILBRAE CA         MILBRAE       CA   -5.67    -7.44
04/24/2017  <TRANSACTION_ID>  SQ *EGGETTES-MILLBRAE Millbrae CA         Millbrae      CA   -23.00   -30.44
04/24/2017  <TRANSACTION_ID>  SEAFOOD CITY SUPERM SOUTH SAN FRACA       SOUTH SAN FRA CA   -23.13   -53.57
...

{% endhighlight %}

> See `man awk`, `man tee`, and `man column`
