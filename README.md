![Domapic][domapic-logo-image]

# Domapic Service

> Node.js base for Domapic Modules

[![Build status][travisci-image]][travisci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url] [![js-standard-style][standard-image]][standard-url]

[![NPM dependencies][npm-dependencies-image]][npm-dependencies-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url] 

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Website][website-image]][website-url] [![License][license-image]][license-url]

---

## Table of Contents

* [Introduction](#introduction)
* [Creating your module](#creating-your-module)
  * [Registering abilities](#registering-abilities)
  * [Data type](#data-type)
  * [Action](#action)
  * [Event](#event)
  * [State](#state)
* [Start the server](#start-the-server)
* [Display logs](#display-logs)
* [Connecting with Domapic Controller](#connecting-with-domapic-controller)
* [Stop and restart](#stop-and-restart)
* [Options](#options)
* [Security](#security)

---

## Introduction

Node.js base for creating Domapic Modules.

A Domapic Module is an action-event-state based REST API Micro-service. Can be, as example, a little program that controls a relay, has an action to switch it, triggers an event when the state change, and an state that can be requested at any time. Modules can be paired with a Domapic Controller, and be controlled through it, making them interact automatically ones with anothers, or with plugins, such as third-party integrations, as "Alexa", "HomeKit", etc.

This package provides you all the API infrastructure, authentication, data validation, process and logs management, etc. The only thing you have to care about is about the implementation of the module logic itself. When the server starts, an api is automatically created and you, or other applications, such as Domapic Controller, will be able to interact with the module.

![Domapic system example][domapic-example-image]

> Above, an example of two modules in a Domapic System. Now, the relay can be controlled using the web or mobile applications, or interacting with Alexa or Homekit. Automatisms can be configured in the Domapic Controller to make the Hue bulb be switched off automatically when the relay bulb is switched on, for example.

[domapic-logo-image]: http://domapic.com/assets/domapic-logo.png
[domapic-example-image]: http://domapic.com/assets/domapic-schema-example_01.png

[coveralls-image]: https://coveralls.io/repos/github/domapic/domapic-service/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/domapic/domapic-service
[travisci-image]: https://travis-ci.com/domapic/domapic-service.svg?branch=master
[travisci-url]: https://travis-ci.com/domapic/domapic-service
[last-commit-image]: https://img.shields.io/github/last-commit/domapic/domapic-service.svg
[last-commit-url]: https://github.com/domapic/domapic-service/commits
[license-image]: https://img.shields.io/npm/l/domapic-service.svg
[license-url]: https://github.com/domapic/domapic-service/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/domapic-service.svg
[npm-downloads-url]: https://www.npmjs.com/package/domapic-service
[npm-dependencies-image]: https://img.shields.io/david/domapic/domapic-service.svg
[npm-dependencies-url]: https://david-dm.org/domapic/domapic-service
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=domapic-service&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=domapic-service
[release-image]: https://img.shields.io/github/release-date/domapic/domapic-service.svg
[release-url]: https://github.com/domapic/domapic-service/releases
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/

[website-image]: https://img.shields.io/website-up-down-green-red/http/domapic.com.svg?label=domapic.com
[website-url]: http://domapic.com/

[pm2-log-rotate-url]: https://github.com/keymetrics/pm2-logrotate
[pm2-url]: http://pm2.keymetrics.io/
