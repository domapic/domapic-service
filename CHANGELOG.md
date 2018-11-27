# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
### Changed
- Do not demand data in abilities. Still mandatory in abilities with state defined.
### Fixed
### Removed

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
