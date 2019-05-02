# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed

## [1.0.0-beta.2] - 2019-05-02
### BREAKING CHANGES
- Ability data types "integer" and "float" are deprecated in favour of using only "number".
- getUsers method in controller api client now request all users by default. This will result in a forbidden response if plugin has not admin permissions granted. For requesting only operator users, which is allowed to all plugins, a role filter has to be provided.

### Added
- Add config and apiKeys methods to Controller api Client.

## [1.0.0-beta.1] - 2019-01-06
### BREAKING CHANGES
- From now, connection process not compatible with Domapic Controller versions lower than 1.0.0-alpha.14.

### Changed
- Send service name and ability service on connection process. Now connection works even when authentication is disabled.
- Upgrade domapic-controller version in end-to-end tests.
- Upgrade domapic-base version.

## [1.0.0-alpha.5] - 2018-12-17
### Added
- Add servicePluginConfigs client
- Add servicePluginConfigs events tests
- Add "addPluginConfig" method. Register plugin configurations on service connection.

### Changed
- Upgrade domapic-controller version in end-to-end tests.

## [1.0.0-alpha.4] - 2018-12-09
### Added
- Expose errors constructors to services

### Changed
- Upgrade domapic-base version, which expose new `getPath` method in storage.

## [1.0.0-alpha.3] - 2018-12-01
### Added
- Expose storage methods to services

### Changed
- Upgrade domapic-base version, which fixes a problem in Client concurrent requests.
- Do not demand data in abilities. Still mandatory in abilities with state defined.

### Fixed
- Extend exposed cli options with service options

## [1.0.0-alpha.2] - 2018-11-20
### BREAKING CHANGES
- Changed Controller uris to adapt them to Controller version 1.0.0-alpha.9
- Expose event emitter in events object, instead of module object directly

### Added
- Add plugin Constructor
- Add events api for plugins
- Add controller api interface for plugins
- Expose extendOpenApi and addOperations methods to module and plugin

## [1.0.0-alpha.1] - 2018-11-4
### Added
- First fully functional pre-release
