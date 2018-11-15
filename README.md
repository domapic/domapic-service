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
    * [Action](#action)
    * [State](#state)
    * [Event](#event)
* [Start the server](#start-the-server)
	* [Process and logs management](#process-and-logs-management)
* [Connecting with Domapic Controller](#connecting-with-domapic-controller)
* [Options](#options)
	* [Custom options](#custom-options)
* [Security](#security)
* [Logs](#logs)

---

## Introduction

Node.js base for creating [Domapic][website-url] Modules.

A Domapic Module is an action-event-state based REST API Micro-service. Can be, as example, a little program that controls a relay, has an `action` to switch it, triggers an `event` when changes, and an `state` that can be consulted. Modules can be paired with a [Domapic Controller][domapic-controller-url], and be controlled through it, making them interact automatically ones with anothers, or with plugins, such as third-party integrations, as [_Amazon's Alexa_][alexa-url], [_Apple's HomeKit_][homekit-url], etc.

This package provides you all the API infrastructure, authentication, data validation, process and logs management, etc. The only thing you have to care about is about the implementation of the module logic itself. When the server starts, an api is automatically created and you, or other applications, such as [Domapic Controller][domapic-controller-url], will be able to interact with the module.

If you are going to __publish your module, add the `domapic-module` suffix to the name__, in order to allow npm users finding it easily searching in the website that keyword.

![Domapic system example][domapic-example-image]

> Above, an example of two modules in a [Domapic System][website-url]. Now, the relay can be controlled using the web or mobile applications, or interacting with ["Alexa"][alexa-url] or ["HomeKit"][homekit-url]. Automatisms can be configured in the [Domapic Controller Web UI][domapic-controller-url] to make the [_Phillips Hue_][hue-url] bulb be switched off automatically when the relay bulb is switched on, for example.

## Creating a module

Modules can be created with few lines of code. Here is an example of a module controlling a fake relay:

> package.json file:

```json
{
  "name": "relay-domapic-module",
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

domapic.createModule({ packagePath: path.resolve(__dirname) })
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
          handler: () => status
        },
        action: {
          description: 'Switch on/off the relay',
          handler: newStatus => {
            status = newStatus
            module.events.emit('switch', status)
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
	* `customConfig` `<object>` Domapic provides some common [configuration options](#options). Custom options for a module can be added defining them in this property. In this way, for example, you can add a "gpio" option, that will be received when the module instance is started, and can be modified through arguments in the start command: `npm start -- --gpio=12`. For further info about defining custom configuration options, please refer to the ["custom options" chapter](#custom-options)
* Returns a module instance, containing:
	* `tracer` `<object>` containing methods for tracing with different log levels (`log`, `trace`, `debug`, `info`, `warn`, `error`). Read the ["traces" chapter in the domapic-base documentation][domapic-base-url] for further info.
	* `config` `<object>` containing methods for getting and setting configuration.
		* `get([key])` - Returns a promise resolved with the module configuration. Resolved with specific property value if argument `key` is provided.
		* `set(key [, value])` - Sets `value` for provided `key` into module configuration. Returns a promise.
	* `register(abilitiesData)` - Register provided abilities into the module. Read the [abilities](#abilities) chapter for further info.
	* `start` - Starts the server.
  * `events`- [Node.js emitter object][nodejs-events-url]. Used to emit abilities events to the controller.

## Abilities

Each Module can has many abilities, each one with its own action, state and event. Continuing with the example above, the module could have another ability called "toggle", that would change the status based on current status, without needing to receive any data.

#### `register(abilitiesData)`

* Register provided abilities into the module, and create correspondants api resources.

Each ability must be an object, which key will be the name of the ability (will be converted to snake case when referenced in api uris). Properties of each ability must be:

* `description` `<string>` Description of the ability.
* `data` `<object>` Defines the type of data that the ability will handle, and will be used to execute data validation for the action, state and event related api resources.
	* `type` `<string>` Type of data. Can be one of `string`, `boolean`, `number`, `integer` or `float`
	* `enum` `<array>` Used to restrict data to a fixed set of values. It must be an array with at least one element, where each element is unique.
	* `minLength` `<number>` Minimum length of the data string.
	* `maxLength` `<number>` Maximum length of the data string.
	* `pattern` `<string>` Used to restrict the data to a particular regular expression.
	* `format` `<string>` Basic semantic validation on certain kinds of string values that are commonly used. Can be one of `date-time`, `email`, `hostname`, `ipv4`, `ipv6` or `uri`.
	* `multipleOf` `<number>` Used to restrict numbers to a multiple of given number.
	* `minimum` `<number>` Minimum value of numeric data.
	* `maximum` `<number>` Maximum value of numeric data.
	* `exclusiveMaximum` `boolean` Indicates if provided `maximum` is exclusive of the value.
	* `exclusiveMinimum` `boolean` Indicates if provided `minimum` is exclusive of the value.
* `event` `<object>` Optional. If present, the ability will be able to emit events.
	* `description` `<string>` Description of the ability event.
* `state` `<object>` Optional. If present, the ability will have an api resource for consulting the state.
	* `description` `<string>` Description of the ability state.
	* `handler` `<function>` Handler for the state api resource. The status, or a promise resolving the status must be returned.
	* `auth` `<boolean>` If false, the state api resource will not demand authentication. Default is `true`.
* `action` `<object>` Optional. If present, the ability will have an api resource for dispatching the action.
	* `description` `<string>` Description of the ability action.
	* `handler` `<function>` Handler for the action api resource. Will receive the action data as argument. The status, or a promise resolving the status must be returned.
	* `auth` `<boolean>` If false, the action api resource will not demand authentication. Default is `true`.

#### Action

When an [ability](#abilities) has an `action` property defined, an api resource will be created with the uri `/api/[ability_key]/action`. It has to be requested using `POST` method, and data has to be provided in the request body, contained in the "data" property:

> Example: http://localhost:3000/api/switch/action
```json
{
  "data": false
}
```
In this example, the action's `handler` method will be called with `false`.

#### State

If [ability](#abilities) has an `state` property defined, an api resource will be created with the uri `/api/[ability_key]/state`. It has to be requested using `GET` method. Will return the value resolved by the returned promise in the state's `handler` method.

> Example: http://localhost:3000/api/switch/state
```json
{
  "data": true
}
```
In this example, the action's `handler` method returned `Promise.resolve(true)`.

#### Event

When [ability](#abilities) has an `event` property defined, the `emit` method of the module's `events` object can be used to emit the ability event, passing the correspondant data. This will produce module calling to controller api to inform about the trigered event.

```js
module.events.emit('switch', true)
```
In this example, the module will call to the correspondant controller api resource, passing `true` as data.

## Start the server

First of all, remember to start the server programatically after adding the abilities in your code:

```js
module.start()
```

Once the module code is ready, the server can be started calling directly to the `npm start` command

```bash
npm start
```

#### Process and logs management

If you want to implement the built-in Domapic CLI into your module, that provides process and logs management, you'll need to add a "cli.js" file to your module:

```js
#!/usr/bin/env node

const path = require('path')
const domapic = require('domapic-service')
 
domapic.cli({
  packagePath: path.resolve(__dirname),
  script: path.resolve(__dirname, 'server.js')
})
```

Add `bin` and `scripts` properties to your package.json, that will make available the CLI:

```json
"bin": {
  "relay": "./cli.js"
},
"scripts": {
  "relay": "./cli.js"
}
```

Now, you can use `start`, `stop` and `logs` commands to start and manage your module in background:

```bash
# Starts the module (with debug log level)
npm run relay start -- --logs=debug
# Stops the module
npm run relay stop
# Displays module's logs
npm run relay logs -- --lines=300

#If the module is installed globally (using -g), next commands will be available:
relay start
relay stop
relay logs
```

You can define __custom CLI commands__ for your module too. For further info read the [custom options and commands chapter in the domapic-base documentation][domapic-base-url]

## Connecting with Domapic Controller

Connect your module with [Domapic Controller][domapic-controller-url] inside your local network to get the most of it.

Doing this, you'll can use the Domapic Controller Web Interface to control all your modules, and make them interact through automatisms. Domapic plugins will have access to the module at same time, so you´ll can control it with your voice using the _Amazon's Alexa_ plugin, or the _Homebridge plugin_, for example.

### Connect using options

Use the `controller` option to define the controller url, and the `controller-api-key` option to define the authorized api key (you can get it from the controller logs when started, indicated with "Use the next api key to register services"). Remember to use the `save` option to make the module remember them for next executions:

```bash
npm start -- --controller=http://192.168.1.100:3000 --controller-api-key=foo-controller-key --save
```

In this way, the module will connect automatically with controller when started.

### Connect using controller web ui

The connection can be executed using the provided api as well, through the controller web ui. When the module is started, an api key for connecting is displayed in logs:

> Try adding connection from Controller, using the next service Api Key: xxxxx-foo-api-key-xxxx

Use the controller web user interface to authorize the connection with your module using the specified api key.

## Options

Domapic-service provides a set of command line options that are available when starting the module:

```bash
# Displays help with detailed information about all available options 
npm start -- --help
```

* `name` - Service instance name. You can start many instances of the same module defining different names for each one.
* `port` - Http port used by the server. Default is 3000.
* `hostName` - Hostname for the server.
* `sslCert` - Path to an ssl certificate. The server will start using https protocol if provided.
* `sslKey` - Path to an ssl key.
* `controller` - Url of the Domapic Controller to connect with.
* `controllerApiKey` - Api key that allows connection with controller.
* `authDisabled` - Array of IPs or CIDR IP ranges with authentication disabled (separated with whitespace). Default is ['127.0.0.1', '::1/128'], so authentication will be disabled for localhost by default. To enable authentication even for localhost, specify `--authDisabled` without any ip.
* `color` - Use ANSI colors in traces.
* `logLevel` - Tracing level. Choices are 'log', 'trace', 'debug', 'info', 'warn' and 'error'. Default is `info`.
* `path` - Path to be used as home path for the process, instead of user´s default (a `.domapic` folder will be created inside).
* `saveConfig` - Save current options for next execution (except `name` and `path`). Default is false.

> Example of defining options from command line:

```bash
npm start -- --name=room-light-switch --logLevel=debug --port=3100 --authDisabled --save
```

#### Custom options

You can add your own custom configuration options. They will be seteable from command line execution, displayed in help and validated as the rest of options. Use `customConfig` option in the `createModule` method and in the `cli` method to define them.

[_Yargs_][yargs-url] is used as underlayer to manage options, so you can read its documentation for more details about how to define them.

> Following with the example, add an `options.js` file to the module:

```js
module.exports = {
  initialStatus: {
    type: 'boolean',
    alias: ['status'],
    describe: 'Set initial status of the relay when module is started',
    default: false
  }
}
```

> Use it in the `server.js` file:

```js
const path = require('path')
const domapic = require('domapic-service')

const options = require('./options')

domapic.createModule({
  packagePath: path.resolve(__dirname),
  customConfig: options
}).then(async module => {
  let status = await module.config.get('initialStatus')
  //...
})
```

> Now, the custom `initialStatus` option can be used from command line when starting the module:

```bash
npm start -- --initialStatus=true
# The module will be started, and "initialStatus" value in config will be true
```

> Custom options defined for a service should be defined in CLI implementation too. Add them to the `cli.js` file:

```js
const path = require('path')
const domapic = require('domapic-service')

const options = require('./options')
 
domapic.cli({
  packagePath: path.resolve(__dirname),
  script: path.resolve(__dirname, 'server.js'),
  customConfig: options
})
```

> Now, the custom `initialStatus` option can be used from CLI too:

```bash
relay start --initialStatus=true
# The module will be started, and "initialStatus" value in config will be true
```


## Security

The Domapic Modules are intended to be used only in your local network by the Domapic Controller, without exposing them to the Internet, but, despiting this fact, all HTTP communications are secured as well using OAUTH Api Keys in order to make the system more robust, and to provide a role based securization. Only requests coming from localhost are not secured by default, to make easier the configuration process, but this behavior can be modified too.

* __Enable ssl:__
	Enable ssl for your module generating an SSL certificate. Use options `--sslCert` and `--sslKey` to define the paths to each file, and remember to use the `--save` option to store that settings for next server restarts. From now, your server will start using *https* instead of *http*.

* __Disable the authentication whitelist:__
	Authentication can be disabled for desired IPs or IP ranges using the `--authDisabled` option. By default, authentication is disabled only for the 172.0.0.1 IP, in order to make easier the first configuration, but you can disable it for all your local network, etc. Because of security reasons, this is not recommended. Use always the built-in api keys method to identify your Domapic Services.
	If you want to force the authentication requirement even for localhost, use the `--authDisabled` as a flag, without specifying any IP.

## Logs

If you used the built-in CLI to start the module, you can display the logs using the `logs` command:

```bash
npm run relay logs -- --lines=300
# --lines is optional. Default is 30
```

This command will display last logs of server, and will continue displaying logs until CTRL-C is pressed.

Server logs are managed by [PM2][pm2-url] when using CLI, so, it is recommended to install [_PM2 log rotate_][pm2-log-rotate-url] to avoid pm2 logs file growing too much.

Server logs are saved too into a daily file. These files are rotated automatically and only last ten days files are kept. You´ll find these files in the `~/.domapic/[module-name]/logs` folder.


[domapic-logo-image]: http://domapic.com/assets/domapic-logo.png
[domapic-example-image]: http://domapic.com/assets/domapic-schema-example_01.png
[swagger-example-image]: http://domapic.com/assets/swagger-example.jpg

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

[yargs-url]: https://www.npmjs.com/package/yargs
[homekit-url]: https://www.apple.com/ios/home
[hue-url]: https://www.developers.meethue.com
[alexa-url]: https://developer.amazon.com/alexa
[domapic-controller-url]: https://npmjs.com/domapic-controller
[domapic-base-url]: https://npmjs.com/domapic-base
[pm2-log-rotate-url]: https://github.com/keymetrics/pm2-logrotate
[pm2-url]: http://pm2.keymetrics.io/
[nodejs-events-url]: https://nodejs.org/api/events.html

<!--
TODO, add events documentation

ability:updated
ability:created
ability:deleted

ability:action
ability:event

service:created
service:updated
service:deleted

user:created
user:updated
user:deleted

-->
