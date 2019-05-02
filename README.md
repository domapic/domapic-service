![Domapic][domapic-logo-image]

# Domapic Service

> Node.js base for creating [Domapic][website-url] Modules and Plugins.

[![Build status][travisci-image]][travisci-url] <!--[![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]--> [![js-standard-style][standard-image]][standard-url]

[![NPM dependencies][npm-dependencies-image]][npm-dependencies-url] [![Last commit][last-commit-image]][last-commit-url] <!--[![Last release][release-image]][release-url] -->

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Website][website-image]][website-url] [![License][license-image]][license-url]

---

## Table of Contents

* [Modules](#modules)
	* [Creating a module](#creating-a-module)
	* [Abilities](#abilities)
		* [Action](#action)
		* [State](#state)
		* [Event](#event)
  * [Plugins configurations](#plugins-configurations)
* [Plugins](#plugins)
	* [Creating a plugin](#creating-a-plugin)
	* [Controller events listeners](#controller-events-listeners)
	* [Controller interface](#controller-interface)
* [Start the server](#start-the-server)
	* [Process and logs management](#process-and-logs-management)
* [Connecting with Domapic Controller](#connecting-with-domapic-controller)
* [Options](#options)
	* [Custom options](#custom-options)
* [Security](#security)
* [Extending API](#extending-api)
* [Logs](#logs)

---

## Modules

A Domapic Module is an action-event-state based REST API Micro-service. Can be, as example, a little program that controls a relay, has an `action` to switch it, triggers an `event` when changes, and an `state` that can be consulted. Modules can be paired with a [Domapic Controller][domapic-controller-url], and be controlled through it, making them interact automatically ones with anothers, or with plugins, such as third-party integrations, as [_Amazon's Alexa_][alexa-url], [_Apple's HomeKit_][homekit-url], etc.

This package provides you all the API infrastructure, authentication, data validation, process and logs management, etc. The only thing you have to care about is about the implementation of the module logic itself. When the server starts, an api is automatically created and you, or other applications, such as [Domapic Controller][domapic-controller-url], will be able to interact with the module.

If you are going to __publish your module, add the `domapic-module` suffix to the name__, in order to allow npm users finding it easily searching in the website that keyword.

__NOTE: The next schema includes some Domapic pieces that are still not released. The web ui for the Controller, Domapic Cloud, mobile apps, as well as Homekit and Alexa plugins will be available soon.__

![Domapic system example][domapic-example-image]

> Above, an example of two modules in a [Domapic System][website-url]. Now, the relay can be controlled using the web or mobile applications, or interacting with ["Alexa"][alexa-url] or ["HomeKit"][homekit-url]. Automatisms can be configured in the [Domapic Controller Web UI][domapic-controller-url] to make the [_Phillips Hue_][hue-url] bulb be switched off automatically when the relay bulb is switched on, for example.

### Creating a module

Modules can be created with few lines of code. Here is an example of a module controlling a fake relay:

> package.json file:

```json
{
  "name": "example-domapic-module",
  "version": "1.0.0",
  "description": "Domapic module controlling a relay",
  "dependencies": {
    "domapic-service": "1.0.0-alpha.5"
  }
}
```

> server.js file:
```js
const path = require('path')
const domapic = require('domapic-service')

domapic.createModule({ packagePath: path.resolve(__dirname) })
  .then(async dmpcModule => {
    let status = false

    await dmpcModule.register({
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
            dmpcModule.events.emit('switch', status)
            return Promise.resolve(status)
          }
        }
      }
    })

    return dmpcModule.start()
  })
```
> When started, a REST api will be available to connect with controller, authenticate using api key, dispatch the switch action, consulting the switch state, the module configuration, etc.

![Swagger example][swagger-example-image]

#### `createModule(options)`

* `options` `<object>` containing:
	* `packagePath` `<string>` Path to the folder where the module's `package.json` is.
	* `customConfig` `<object>` Domapic provides some common [configuration options](#options). Custom options for a module can be added defining them in this property. In this way, for example, you can add a "gpio" option, that will be received when the module instance is started, and can be modified through arguments in the start command: `npm start -- --gpio=12`. For further info about defining custom configuration options, please refer to the ["custom options" chapter](#custom-options)

Returns a module instance, containing:

* `tracer` `<object>` containing methods for tracing with different log levels (`log`, `trace`, `debug`, `info`, `warn`, `error`). Read the ["traces" chapter in the domapic-base documentation][domapic-base-url] for further info.
* `config` `<object>` containing methods for getting and setting configuration.
	* `get([key])` - Returns a promise resolved with the module configuration. Resolved with specific property value if argument `key` is provided.
	* `set(key [, value])` - Sets `value` for provided `key` into module configuration. Returns a promise.
* `storage` `<object>` containing methods for getting and setting data in the built-in file system storage.
  * `get([key])` - Returns a promise resolved with the module storage. Resolved with specific property value if argument `key` is provided.
  * `set(key [, value])` - Sets `value` for provided `key` into module storage. Returns a promise.
* `api` - Object containing methods for [extending the built-in api](#extending-api).
* `register(abilitiesData)` - Register provided abilities into the module. Read the [abilities](#abilities) chapter for further info.
* `addPluginConfig(pluginConfigs)` - Add module default configurations for domapic plugins. Read the [Plugins configurations](#plugins-configurations) chapter for further info.
* `start` - Starts the server.
* `events`- [Node.js emitter object][nodejs-events-url]. Used to emit abilities events to the controller.
* `errors` - Domapic errors constructors. Useful for rejecting abilities handlers with specific http errors. For further info read the [errors chapter in the domapic-base documentation][domapic-base-url]

### Abilities

Each Module can has many abilities, each one with its own action, state and event. Continuing with the example above, the module could have another ability called "toggle", that would change the status based on current status, without needing to receive any data.

#### `register(abilitiesData)`

* Register provided abilities into the module, and create correspondants api resources.

Each ability must be an object, which key will be the name of the ability (will be converted to snake case when referenced in api uris). Properties of each ability must be:

* `description` `<string>` Description of the ability.
* `data` `<object>` Defines the type of data that the ability will handle, and will be used to execute data validation for the action, state and event related api resources. If the ability don't needs any type of data, this property should be omitted (in that case, the ability can't have an state, because it has no sense).
	* `type` `<string>` Type of data. Can be one of `string`, `boolean`, `number`
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

When an [ability](#abilities) has an `action` property defined, an api resource will be created with the uri `/api/[ability_key]/action`. It has to be requested using `POST` method, and data (if needed) has to be provided in the request body, contained in the "data" property:

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
dmpcModule.events.emit('switch', true)
```
In this example, the module will call to the correspondant controller api resource, passing `true` as data.

### Plugins configurations

Some Domapic Plugins require extra configurations for modules _(as an example, the `homebridge-domapic-plugin` needs to map the module abilities to an specific HomeKit accesory type, in order to be controlled by Siri)_.  The modules can define a default configuration for certain types of Domapic Plugins. This configurations can be modified afterwards by users through the Controller UI in order to allow more customization, _(for example, a `contact-sensor-domapic-module` sometimes needs to be mapped to a `Door` accesory, and sometimes to a `Window` accesory)_

For defining default plugins configurations, the `addPluginConfig` method is available in the module instances:

#### `addPluginConfig(pluginConfigs)`

Add plugin configuration or configurations (can receive an array of configurations too). Each configuration must have the next properties:
* `pluginPackageName` `<string>` Package name of the plugin for which the configuration is destined.
* `config` `<object>` Object containing the plugin configuration. Its format depends of each specific plugin configuration requisites.

```js
dmpcModule.addPluginConfig({
  pluginPackageName: 'homebridge-domapic-plugin',
  config: {
    foo: 'foo-plugin-config'
  }
})
```

## Plugins

A Domapic Plugin is an action-event-state based REST API Micro-service that can "extend" the Domapic Controller functionality. Once it is connected with the Controller, it will receive events each time an entity is created, modified or deleted in the Controller. Plugins will be informed too about all module events or actions received by the Controller. Plugins also have an interface to the Controller, that allows to perform actions such as consult module states, dispatch module actions, create users, etc.

If you are going to __publish your plugin, add the `domapic-plugin` suffix to the name__, in order to allow npm users finding it easily searching in the website that keyword.

### Creating a Plugin

Here is an example of a plugin implementation that receives all Controller events, and gets all modules' states once it is connected:

```json
{
  "name": "example-domapic-plugin",
  "version": "1.0.0",
  "description": "Domapic plugin that receives all Controller events and print logs",
  "dependencies": {
    "domapic-service": "1.0.0-alpha.2"
  }
}
```

> server.js file:
```js
const path = require('path')
const domapic = require('domapic-service')

domapic.createPlugin({ packagePath: path.resolve(__dirname) })
  .then(async plugin => {
    plugin.events.on('*', eventData => {
      plugin.tracer.info(`Received ${eventData.entity}:${eventData.operation} event. Data: ${JSON.stringify(eventData.data)}`)
    })

    plugin.events.on('connection', async () => {
      const abilities = await plugin.controller.abilities.get()
      abilities.map(async ability => {
        if (ability.state) {
          const state = await plugin.controller.abilities.state(ability._id)
          console.log(`Ability "${ability.name}" of module "${ability._module}" has state "${state.data}"`)
        }
      })
    })

    return plugin.start()
  })
```

> When started and connected with Controller, the plugin will receive all Controller events an print their data. It will also request all registered abilities and print their current states.

#### `createPlugin(options)`

* `options` `<object>` containing:
	* `packagePath` `<string>` Path to the folder where the plugin's `package.json` is.
	* `customConfig` `<object>` Domapic provides some common [configuration options](#options). Custom options for a plugin can be added defining them in this property. For further info about defining custom configuration options, please refer to the ["custom options" chapter](#custom-options)

Returns a plugin instance, containing:

* `tracer` `<object>` containing methods for tracing with different log levels (`log`, `trace`, `debug`, `info`, `warn`, `error`). Read the ["traces" chapter in the domapic-base documentation][domapic-base-url] for further info.
* `config` `<object>` containing methods for getting and setting configuration.
	* `get([key])` - Returns a promise resolved with the plugin configuration. Resolved with specific property value if argument `key` is provided.
	* `set(key [, value])` - Sets `value` for provided `key` into module configuration. Returns a promise.
* `api` - Object containing methods for [extending the built-in api](#extending-api).
* `start` - Starts the server.
* `events`- [Node.js emitter object][nodejs-events-url]. Used to subscribe to events from the Controller.
* `controller` - Object containing an interface to make requests to Controller. Read the [Controller interface chapter for further info](#controller-interface).

### Controller events listeners

Controller emit all module received events and actions, as well as other internal entities events to all registered plugins.
From a Plugin, you can subscribe to an specific entity events, or to an specific operation, etc.

```js
plugin.events.on('ability:created', eventData => {
  console.log('A new ability has been created with data:')
  console.log(eventData.data)
})
```

All available events are:

* ability:updated
* ability:created
* ability:deleted
* ability:action
* ability:event
* service:created
* service:updated
* service:deleted
* servicePluginConfig:created
* servicePluginConfig:updated
* servicePluginConfig:deleted
* user:created
* user:updated
* user:deleted

Received event data has the next format, where `data` contains all details about the performed operation:

```json
{
  "entity": "ability",
  "operation": "created",
  "data": {}
}
```

Wildcards are available for subscribing to all events of an specific `entity`, or to all entities of an specific `operation`, or to all events:

* `*` - All events
* `service:*` - All events of "service" entity.
* `*:created` - All operations "created" of any entity.

### Controller api client

A Domapic Plugin provides an api client that allows to perform operations into the Controller. All methods returns a Promise, and are available under the `plugin.controller` object, which contains:

* `users` - Interface for Controller's "user" entities:
	* `me()` - Returns data about plugin user
	* `get([id][,filter])` - Returns users data. Because of security reasons, only "operator" users are allowed to be returned until plugin has "adminPermissions". For plugins without admin permissions granted, request must be filtered providing a role filter as `{role:'operator'}`. Extra filters can be provided too, id as \<String\>, or an \<Object\> containing any other api supported filter (such as `{name:'foo-name'}`).
	* `create(userData)` - Creates an user, and returns the new `id`. Only creating users with "operator" role is supported.
* `services`- Interface for Controller's "service" entities:
	* `get([id][,filter])` - Returns services data. Request can be filtered providing an specific service id as \<String\>, or an \<Object\> containing any other api supported filter (such as `{type:'module'}`).
* `servicePluginConfigs`- Interface for Controller's "servicePluginConfigs" entities:
	* `get([id][,filter])` - Returns servicePluginConfigs data. Request can be filtered providing an specific servicePluginConfig id as \<String\>, or an \<Object\> containing any other api supported filter (such as `{service:'service-id', 'plugin-package-name': 'foo-plugin-package-name'}`).
	* `create(configData)` - Creates a service plugin configuratin, and returns the new `id`.
	* `update(id, configData)` - Updates an specific service plugin configuration.
* `abilities`- Interface for Controller's "ability" entities:
	* `get([id][,filter])` - Returns abilities data. Request can be filtered providing an specific ability id as \<String\>, or an \<Object\> containing any other api supported filter (such as `{service:'foo-module-id'}`).
	* `state(id)` - Returns state of provided ability.
	* `action(id, data)` - Dispatches ability action with provided data.
* `logs` - Interface for Controller's "log" entity:
	* `get([filter])` - Returns Controller logs with all modules' actions and events. A query filter can be provided.
* `config` - Interface for Controller's configuration. 
	* `get()` - Returns Controller configuration.
* `apiKeys` - Interface for Controller's "securityTokens" entity, filtered by "apiKey" type. For security reasons, only plugins with admin permissions granted can access to this resource, otherwise requests will return a forbidden error.
	* `get()` - Returns Controller user's api keys.
	* `create(userData)` - Creates an api key for the given user, and returns it.

Consult the Controller Swagger interface to get more info about supported filters (queries) and requested data for each api interface.

### Security in plugins

Plugins are registered into the Controller with a "plugin" role, that, for security reasons, can't perform certain types of operations and have limited access to some resources, such as security tokens, etc.
Depending of the plugin behavior, it may need accessing to this resources to can work. If a plugin need special permissions to work, you can use the Controller web interface to modify it, and check the "grant admin permissions" option.

## Start the server

First of all, remember to start the server programatically after adding the abilities in your code:

```js
dmpcModule.start()
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

Connect your module or plugin with [Domapic Controller][domapic-controller-url] inside your local network to get the most of it.

Doing this, you'll can use the Domapic Controller Web Interface to control all your modules, and make them interact through automatisms. Domapic plugins will have access to the module at same time, so you´ll can control it with your voice using the _Amazon's Alexa_ plugin, or the _Homebridge plugin_, for example.

### Connect using options

Use the `controller` option to define the controller url, and the `controller-api-key` option to define the authorized api key (you can get it from the controller logs when started, indicated with "Use the next api key to register services"). Remember to use the `save` option to make the module remember them for next executions:

```bash
npm start -- --controller=http://192.168.1.100:3000 --controller-api-key=foo-controller-key --save
```

In this way, the module will connect automatically with controller when started.

> If Controller has the authentication disabled, the controller-api-key option will not be necessary to perform the connection.

### Connect using controller web ui

The connection can be executed using the provided api as well, through the controller web ui. When the module or plugin is started, an api key for connecting is displayed in logs:

> Try adding connection from Controller, using the next service Api Key: xxxxx-foo-api-key-xxxx

Use the controller web user interface to authorize the connection with your module or plugin using the specified api key.

## Options

Domapic-service provides a set of command line options that are available when starting the module:

```bash
# Displays help with detailed information about all available options 
npm start -- --help
```

* `name` - Service instance name. You can start many instances of the same module or plugin defining different names for each one.
* `port` - Http port used by the server. Default is 3000.
* `hostName` - Hostname for the server.
* `sslCert` - Path to an ssl certificate. The server will start using https protocol if provided.
* `sslKey` - Path to an ssl key.
* `controller` - Url of the Domapic Controller to connect with.
* `controllerApiKey` - Api key that allows connection with controller.
* `authDisabled` - Array of IPs or CIDR IP ranges with authentication disabled (separated with whitespace). Default is ['127.0.0.1', '::1/128'], so authentication will be disabled for localhost by default. To enable authentication even for localhost, specify `--authDisabled` without any ip.
* `auth` - If false, authentication will be disabled for all origins. Default is true.
* `color` - Use ANSI colors in traces.
* `logLevel` - Tracing level. Choices are 'log', 'trace', 'debug', 'info', 'warn' and 'error'. Default is `info`.
* `path` - Path to be used as home path for the process, instead of user´s default (a `.domapic` folder will be created inside).
* `saveConfig` - Save current options for next execution (except `name` and `path`). Default is false.
* `rejectUntrusted` - Reject untrusted ssl certificates when making requests to modules or plugins. Use it if you are using a self-signed certificate in your Controller. Default is false.

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
}).then(async dmpcModule => {
  let status = await dmpcModule.config.get('initialStatus')
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

## Extending API

The built-in api of Modules and Plugins can be extended to implement your own api resources. For this purpose, the `api` object is provided to module and plugins instances. This object contains methods:

* `extendOpenApi(openApiDefinition)`
* `addOperations(operationsDefinitions)`

All custom api methods implemented with these methods will require authentication as well as built-in api methods, as long as you remember to define the `"security": [{"apiKey": []}]` property to each openapi path definition.

For further info about how to define api resources using these methods, please refer to the ["Adding api resources" chapter of the Domapic-base documentation](https://npmjs.com/domapic-base#adding-api-resources)

## Security

The Domapic Modules are intended to be used only in your local network by the Domapic Controller, without exposing them to the Internet, but, despiting this fact, all HTTP communications are secured as well using OAUTH Api Keys in order to make the system more robust, and to provide a role based securization. Only requests coming from localhost are not secured by default, to make easier the configuration process, but this behavior can be modified too.

* __Enable ssl:__
	Enable ssl for your module generating an SSL certificate. Use options `--sslCert` and `--sslKey` to define the paths to each file, and remember to use the `--save` option to store that settings for next server restarts. From now, your server will start using *https* instead of *http*.

* __Disabling authentication:__
  Authentication can be disabled for desired IPs or IP ranges using the `--authDisabled` option, or for all origins using the `--auth=false` option. By default, authentication is disabled only for the 172.0.0.1 IP in order to make easier the first configuration, but you can disable it for your whole your local network, etc. *Because of security reasons, this is not recommended*, take into account that users accessing to services with authentication disabled will have equivalent permissions to an user with "admin" role.
  If you want to force the authentication requirement even for localhost, use the `--authDisabled` as a flag, without specifying any IP.

## Logs

If you used the built-in CLI to start the module, you can display the logs using the `logs` command:

```bash
npm run relay logs -- --lines=300
# --lines is optional. Default is 30
```

This command will display last logs of server, and will continue displaying logs until CTRL-C is pressed.

Service process and logs are managed by [PM2][pm2-url] when using CLI, so, it is recommended to install [_PM2 log rotate_][pm2-log-rotate-url] to avoid pm2 logs file growing too much.

Service logs are saved too into a daily file. These files are rotated automatically and only last ten days files are kept. You´ll find these files in the `~/.domapic/[module-name]/logs` folder.


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

