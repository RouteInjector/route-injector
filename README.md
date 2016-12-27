# Route Injector

[![Build Status](https://travis-ci.org/RouteInjector/route-injector.svg?branch=master)](https://travis-ci.org/RouteInjector/route-injector) [![Code Climate](https://codeclimate.com/github/RouteInjector/route-injector/badges/gpa.svg)](https://codeclimate.com/github/RouteInjector/route-injector) [![npm version](https://badge.fury.io/js/route-injector.svg)](https://badge.fury.io/js/route-injector)

Web framework to quick bootstrap CRUD applications for [node](http://nodejs.org/)

## Installation

```js
$ npm install route-injector
```

## Documentation

Documentation can be found [here](https://routeinjector.github.io/docs-js/).

## Features

* Focus on prototyping
* Automatic generation for framework entities
* Administration panel
* API Documentation
* Extend functionality by plugins

## Development

It is possible to link this package to projects to test new functionalities or debug route-injector on other existing projects. To do this you **require at least node 6**.

1. Creating the linking reference. On route-injector directory (where you have cloned this framework) run:
```js
# npm link
```
2. On the project that you want to use the cloned instance, just run the following command.
```js
# npm link route-injector
```
3. Now, in order to make peer dependencies work (mongoose) you must execute your application as the next command. Again, this **requires node 6**
```js
# node --preserve-symlinks bin/www 
``` 

## About us

This framework has been designed and programmed by [alterAid](https://www.alteraid.com) and [Ondho](https://www.ondho.com/)

