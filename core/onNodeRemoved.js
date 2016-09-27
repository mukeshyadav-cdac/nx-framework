'use strict'

const symbols = require('./symbols')

module.exports = function onNodeRemoved (node) {
  if (!shouldProcess(node)) return
  node[symbols.lifecycleStage] = 'detached'

  if (node[symbols.contentWatcher]) {
    node[symbols.contentWatcher].disconnect()
  }
  if (node[symbols.cleanupFunctions]) {
    node[symbols.cleanupFunctions].forEach(runCleanupFunction)
  }
  Array.prototype.forEach.call(node.childNodes, onNodeRemoved)
}

function shouldProcess (node) {
  const validStage = (node[symbols.lifecycleStage] === 'attached')
  const validParent = (!node.parentNode || node.parentNode[symbols.lifecycleStage] === 'detached')
  return validStage && validParent
}

function runCleanupFunction (cleanupFunction) {
  cleanupFunction()
}