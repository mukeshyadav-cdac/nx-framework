'use strict'

const secret = {
  handlers: Symbol('attribute handlers')
}

module.exports = function attributes (elem, state, next) {
  if (!(elem instanceof Element)) return
  elem.$require('expression')
  elem.$using('attributes')

  elem.$hasAttribute = $hasAttribute
  elem.$attribute = $attribute

  next()

  processAttributesWithoutHandler(elem)
  processAttributesWithHandler(elem)
}

function $hasAttribute (name) {
  return (this.hasAttribute(name) || this.hasAttribute('$' + name) || this.hasAttribute('@' + name))
}

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (!this[secret.handlers]) {
    this[secret.handlers] = new Map()
  }
  this[secret.handlers].set(name, handler)
}

function processAttributesWithoutHandler (elem) {
  const attributesToRemove = []

  Array.prototype.forEach.call(elem.attributes, (attribute) => {
    if (attribute.name[0] === '$') {
      const name = attribute.name.slice(1)
      if (!elem[secret.handlers] || !elem[secret.handlers].has(name)) {
        const expression = elem.$compileExpression(attribute.value || name)
        const value = expression()
        if (value) elem.setAttribute(name, value)
        else elem.removeAttribute(name)
        attributesToRemove.push(attribute.name)
      }
    } else if (attribute.name[0] === '@') {
      const name = attribute.name.slice(1)
      if (!elem[secret.handlers] || !elem[secret.handlers].has(name)) {
        const expression = elem.$compileExpression(attribute.value || name)
        elem.$observe(() => {
          const value = expression()
          if (value) elem.setAttribute(name, value)
          else elem.removeAttribute(name)
        })
        attributesToRemove.push(attribute.name)
      }
    }
  })

  for (let attribute of attributesToRemove) {
    elem.removeAttribute(attribute)
  }
}

function processAttributesWithHandler (elem) {
  if (!elem[secret.handlers]) return
  const attributesToRemove = []

  elem[secret.handlers].forEach((handler, name) => {
    const onceName = '$' + name
    const observedName = '@' + name

    if (elem.hasAttribute(onceName)) {
      const expression = elem.$compileExpression(elem.getAttribute(onceName) || name)
      handler(expression(), elem)
      attributesToRemove.push(onceName)
    } else if (elem.hasAttribute(observedName)) {
      const expression = elem.$compileExpression(elem.getAttribute(observedName) || name)
      elem.$observe(() => handler(expression(), elem))
      attributesToRemove.push(observedName)
    } else if (elem.hasAttribute(name)) {
      handler(elem.getAttribute(name), elem)
    }
  })

  for (let attribute of attributesToRemove) {
    elem.removeAttribute(attribute)
  }
}
