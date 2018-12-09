# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed

## [1.0.0-alpha.4] - 2018-12-09

## [1.0.0-alpha.3] - 2018-12-01
### Added
- Expose storage method to services

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
