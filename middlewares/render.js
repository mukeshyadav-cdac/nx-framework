'use strict'

const exposed = require('../core/symbols')

module.exports = function render (config) {
  config = validateAndCloneConfig(config)
  if (config.cache) {
    config.template = cacheTemplate(config.template)
  }
  if (config.style) {
    const style = document.createTextNode(config.style)
    const styleContainer = document.createElement('style')
    styleContainer.appendChild(style)
    document.head.appendChild(styleContainer)
  }

  return function renderMiddleware (elem, state) {
    if (!(elem instanceof Element)) {
      throw new Error('render only works with element nodes')
    }
    elem.$using('render')

    let template
    if (config.cache) {
      template = document.importNode(config.template, true)
    } else {
      template = cacheTemplate(config.template)
    }
    composeContentWithTemplate(elem, state, template)
    elem.appendChild(template)
  }
}

function composeContentWithTemplate (elem, state, template) {
  let defaultSlot

  Array.prototype.forEach.call(template.querySelectorAll('slot'), (slot) => {
    if (slot.getAttribute('name')) {
      const slotFillers = elem.querySelectorAll(`[slot=${slot.getAttribute('name')}]`)
      if (slotFillers.length) {
        clearContent(slot)
        for (let i = 0; i < slotFillers.length; i++) {
          const slotFiller = slotFillers[i]
          slotFiller[exposed.contextState] = elem[exposed.contextState]
          slot.appendChild(slotFiller)
        }
      }
    } else if (slot.hasAttribute('name')) {
      defaultSlot = slot
    }
  })

  if (defaultSlot && elem.childNodes.length) {
    clearContent(defaultSlot)
    while (elem.firstChild) {
      elem.firstChild[exposed.contextState] = elem[exposed.contextState]
      defaultSlot.appendChild(elem.firstChild)
    }
  }
  clearContent(elem)
}

function cacheTemplate (template) {
  const cachedTemplate = document.createElement('template')
  cachedTemplate.innerHTML = template
  return cachedTemplate.content
}

function clearContent (elem) {
  while (elem.firstChild) {
    elem.firstChild.remove()
  }
}

function validateAndCloneConfig (rawConfig) {
  const resultConfig = {}

  if (typeof rawConfig !== 'object') {
    throw new TypeError('config must be an object')
  }

  if (typeof rawConfig.template === 'string') {
    resultConfig.template = rawConfig.template
  } else {
    throw new TypeError('template config must be a string')
  }

  if (typeof rawConfig.style === 'string') {
    resultConfig.style = rawConfig.style
  } else if (rawConfig.style !== undefined) {
    throw new TypeError('template config must be a string or undefined')
  }

  if (typeof rawConfig.cache === 'boolean') {
    resultConfig.cache = rawConfig.cache
  } else if (rawConfig.cache === undefined) {
    resultConfig.cache = true
  } else {
    throw new TypeError('cache config must be a boolean or undefined')
  }

  return resultConfig
}
