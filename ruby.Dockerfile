FROM ruby:2.7.3

RUN mkdir /src

WORKDIR /src

ADD Gemfile.lock /src

RUN bundle install
