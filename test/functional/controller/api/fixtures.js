'use strict'

const services = [
  {
    id: 'd123123asdads',
    name: 'foo-service',
    version: '1.0',
    description: 'foo description'
  },
  {
    id: 'dasdaar31rwggsfdads',
    name: 'foo-service-2',
    version: '2.0',
    description: 'foo description 2'
  },
  {
    id: '9k7eAaN7kL93xeNhO3i7MwBGnNZ0NVT1',
    name: 'foo-service-3',
    version: '3.0',
    description: 'foo description 3'
  }
]

const abilities = [
  {
    id: 12313424335,
    name: 'console',
    type: 'event',
    description: 'Foo old description',
    data: {
      type: 'boolean'
    }
  },
  {
    id: 2342325455,
    name: 'console',
    type: 'state',
    description: 'Last character printed in console',
    data: {
      type: 'boolean'
    }
  },
  {
    id: 2304234234,
    name: 'console',
    type: 'command',
    description: 'Print the received character into console',
    data: {
      type: 'string'
    }
  }
]

module.exports = {
  services: services,
  abilities: abilities
}
