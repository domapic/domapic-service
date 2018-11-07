![Domapic][domapic-logo-image]

# Domapic Service

> Node.js base for Domapic Modules

[![Build status][travisci-image]][travisci-url] <!--[![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]--> [![js-standard-style][standard-image]][standard-url]

[![NPM dependencies][npm-dependencies-image]][npm-dependencies-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url] 

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Website][website-image]][website-url] [![License][license-image]][license-url]

---

## Table of Contents

* [Introduction](#introduction)
* [Creating a module](#creating-your-module)
  * [Abilities](#registering-abilities)
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

Node.js base for creating [Domapic][website-url] Modules.

A Domapic Module is an action-event-state based REST API Micro-service. Can be, as example, a little program that controls a relay, has an `action` to switch it, triggers an `event` when changes, and an `state` that can be consulted. Modules can be paired with a [Domapic Controller][domapic-controller-url], and be controlled through it, making them interact automatically ones with anothers, or with plugins, such as third-party integrations, as [_Amazon's Alexa_][alexa-url], [_Apple's HomeKit_][homekit-url], etc.

This package provides you all the API infrastructure, authentication, data validation, process and logs management, etc. The only thing you have to care about is about the implementation of the module logic itself. When the server starts, an api is automatically created and you, or other applications, such as [Domapic Controller][domapic-controller-url], will be able to interact with the module.

![Domapic system example][domapic-example-image]

> Above, an example of two modules in a [Domapic System][website-url]. Now, the relay can be controlled using the web or mobile applications, or interacting with ["Alexa"][alexa-url] or ["HomeKit"][homekit-url]. Automatisms can be configured in the [Domapic Controller Web UI][domapic-controller-url] to make the [_Phillips Hue_][hue-url] bulb be switched off automatically when the relay bulb is switched on, for example.

## Creating a module

Modules can be created with few lines of code. Here is an example of a module controlling a fake relay:

> package.json file:

```json
{
  "name": "relay-domapic",
  "version": "1.0.0",
  "description": "Domapic module controlling a relay",
  "dependencies": {
    "domapic-service": "1.0.0-alpha.1"
  }
}
```

> server.js file:
```js
const path = require('path')
const domapic = require('domapic-service')

domapic.createModule({ packagePath: path.resolve(__dirname)})
  .then(async module => {
    let status = false

    await module.register({
      switch: {
        description: 'Handle the relay status',
        data: {
          type: 'boolean'
        },
        event: {
          description: 'The relay status has changed'
        },
        state: {
          description: 'Current relay status',
          handler: () => Promise.resolve(status)
        },
        action: {
          description: 'Switch on/off the relay',
          handler: newStatus => {
            status = newStatus
            module.emit('switch', status)
            return Promise.resolve(status)
          }
        }
      }
    })

    return module.start()
  })
```
> When started, a REST api will be available to connect with controller, authenticate using api key, dispatch the switch action, consulting the switch state, the module configuration, etc.

![Swagger example][swagger-example-image]

#### `createModule(options)`

* `options` `<object>` containing:
	* `packagePath` `<string>` Path to the folder where the module's `package.json` is.
	* `customConfig` `<object>` Domapic provides some common [configuration options](#options). Custom options for a module can be added defining them in this property. In this way, for example, you can add a "gpio" option, that will be received when the module instance is started, and can be modified through arguments in the start command: `npm start -- --gpio=12`. For further info about defining custom configuration options, please refer to the ["custom config" chapter in the domapic-base package documentation][domapic-base-url].
* Returns a module instance, containing methods described below.

## Abilities

Each Module can has many abilities, each one with its own action, state and event. Continuing with the example above, the module could have another ability called "toggle", that would change the status based on current status, without need to receive any data.

#### `register(abilitiesData)`

* Register provided abilities in the module, and create correspondants api resources.

Each ability must be an object, which key will be the name of the ability (will be converted to snake case when referenced in api uris). Properties of each ability must be:

* `description` `<string>` Description of the ability.
* `data` `<object>` Defines the type of data that the ability will handle, and will be used to execute data validation for the action, state and event related api resources.
* `event` `<object>` Optional. If present, the ability will be able to emit events.
	* `description` `<string>` Description of the ability event.
* `state` `<object>` Optional. If present, the ability will have an api resource for consulting the state.
	* `description` `<string>` Description of the ability state.
	* `handler` `<function>` Handler for the state api resource. A promise resolving the state must be returned.
* `action` `<object>` Optional. If present, the ability will have an api resource for dispatching the action.
	* `description` `<string>` Description of the ability action.
	* `handler` `<function>` Handler for the action api resource. Will receive the action data as argument. A promise resolving the state must be returned.

[domapic-logo-image]: http://domapic.com/assets/domapic-logo.png
[domapic-example-image]: http://domapic.com/assets/domapic-schema-example_01.png
[swagger-example-image]: swagger-example.jpg

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

[homekit-url]: https://www.apple.com/ios/home
[hue-url]: https://www.developers.meethue.com
[alexa-url]: https://developer.amazon.com/alexa
[domapic-controller-url]: https://npmjs.com/domapic-controller
[domapic-base-url]: https://npmjs.com/domapic-base
[pm2-log-rotate-url]: https://github.com/keymetrics/pm2-logrotate
[pm2-url]: http://pm2.keymetrics.io/
