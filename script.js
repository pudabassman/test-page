var DOC = document
var WINDOW = window

const addPreElement = (textContent, style) => {
  if (!document.body) {
    setTimeout(() => addPreElement(textContent))
    return
  }
  const pre = document.createElement('pre')
  Object.entries({ fontSize: '16px', color: 'black', ...style }).forEach(
    ([key, value]) => {
      pre.style[key] = value
    }
  )
  pre.textContent = textContent
  document.body.appendChild(pre)
  pre.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const clearEverything = () => {
  localStorage.clear()

  addPreElement('Cleared local storage...', { color: 'purple' })

  // Delete all cookies for the current domain and path
  function deleteAllCookies() {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      // Remove cookie for current path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      // Remove cookie for root path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`
    }
    addPreElement('Deleted cookies...', { color: 'purple' })
  }

  deleteAllCookies()
}

clearEverything()

const assignUserVisitorId = () => {
  if (!WINDOW['_cq']) {
    WINDOW['_cq'] = {}
  }
  WINDOW['_cq'].getUserVisitorId = () => 'Woo! some dev id!'

  addPreElement('Assigned getUserVisitorId', { color: 'purple' })
}

assignUserVisitorId()

window.util = {
  _setTimeout: setTimeout,
}
window.u = {
  _isFunc: (unk) => typeof unk === 'function',
  /**
   *
   * @param {unknown} unk
   * @returns {boolean}
   */
  _isThenable: function (unk) {
    return u._isObject(unk) && u._isFunc(unk.then)
  },
  /**
   *
   * @param {unknown} unk
   * @returns {boolean}
   */
  _isCatchable: function (unk) {
    return u._isObject(unk) && u._isFunc(unk.catch)
  },
  /**
   *
   * @param {unknown} unk
   * @returns {boolean}
   */
  _isObject: function (unknown) {
    return unknown && typeof unknown === 'object'
  },
  /**
   *
   * @param {unknown} unk
   * @param {function} thenCallback
   * @param {(error: Error) => void} catchCallback
   */
  _executeAsyncIfPromiseLike: function (unk, thenCallback, catchCallback) {
    if (!u._isObject(unk)) {
      return
    }

    if (u._isFunc(catchCallback) && u._isCatchable(unk)) {
      unk.catch(catchCallback)
    }

    if (u._isThenable(unk)) {
      unk.then(function () {
        thenCallback.apply(this, arguments)
      })
    }
  },
  _asPromiseLike: function (
    unk,
    thenCallback,
    catchCallback,
    fallBackCallback
  ) {
    var _resolved = false
    if (u._isCatchable(unk)) {
      unk.catch(catchCallback)
    }
    if (u._isThenable(unk)) {
      unk.then(function () {
        _resolved = true
        thenCallback.apply(this, arguments)
      })
    } else {
      fallBackCallback()
    }
    //If something fails internally and our callback haven't been called at least execute the default
    setTimeout(function () {
      if (!_resolved) {
        fallBackCallback()
        //Log here as well?
      }
    }, 500)
  },
  _getAdobeExperienceCloudId: function (callback) {
    try {
      var ecid
      // First attempt: VisitorAPI.js method
      if (u._isFunc(WINDOW.Visitor) && u._isFunc(WINDOW.Visitor.getInstance)) {
        var cookieMatch = DOC.cookie.match(/AMCV_([^=]+)%40AdobeOrg=/)
        var orgId
        if (cookieMatch) {
          orgId = cookieMatch[1] + '@AdobeOrg'
        }
        if (orgId) {
          var visitor = Visitor.getInstance(orgId)
          ecid = visitor && visitor._fields && visitor._fields.MCMID
          if (ecid) {
            callback(ecid)
            return
          }
        }
      }

      // Fallback: Alloy Web SDK
      if (!ecid && u._isFunc(WINDOW.alloy)) {
        var adobeIdentityPromise = WINDOW.alloy('getIdentity')
        if (u._isObject(adobeIdentityPromise)) {
          var _then = function (result) {
            if (result && result.identity) {
              ecid = result.identity.ECID
            }
            callback(ecid)
          }
          u._executeAsyncIfPromiseLike(adobeIdentityPromise, _then)
        }
      } else {
        callback(null)
      }
    } catch (e) {
      callback(null)
    }
  },
}

// setTimeout(() => {
//   window._cq.events.push({ ecid: 'One time dev ecid' })
// }, 2000)

// Intercept XMLHttpRequest requests
const listenToEvents = () => {
  if (!document.body) {
    setTimeout(() => listenToEvents())
    return
  }
  // Mine - dev
  ;[
    'javascript_variable_event',
    'local_storage_variable_event',
    'cookies_changed_event',
    'cheq_response',
  ]
    // Staging:
    // ["staging-test-event-data-layer","staging-test-event-local-storage","staging-test-event-javascript-variable","staging-test-event-cookie", "cheq_response"]
    // Prod:
    // ["prod-test-event-data-layer", "prod-test-event-local-storage", "prod-test-event-javascript-variable", "prod-test-event-cookie", "cheq_response"]
    .forEach((item) =>
      document.body.addEventListener(item, ({ detail }) =>
        addPreElement(
          `Event dispatched for item: ${item} with details: ${JSON.stringify(
            detail,
            null,
            2
          )}`,
          { color: 'blue' }
        )
      )
    )
}

listenToEvents()

const spoofAAgent = true

;(function () {
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async,
    user,
    password
  ) {
    this._interceptUrl = url
    return originalOpen.apply(this, arguments)
  }

  XMLHttpRequest.prototype.send = function (body) {
    let parsedBody = body
    try {
      if (typeof body === 'string') {
        // Try JSON first
        parsedBody = JSON.parse(body)
      }
    } catch (e) {
      // If not JSON, try URL-encoded
      try {
        const params = new URLSearchParams(body)
        const obj = {}
        for (const [key, value] of params.entries()) {
          obj[key] = value
        }
        parsedBody = obj
      } catch (e2) {
        // Leave as string if parsing fails
        parsedBody = body
      }
    }
    if (this._interceptUrl && this._interceptUrl.match(/\/mon$/)) {
      this.addEventListener('load', function () {
        // Only intercept successful responses
        if (this.status >= 200 && this.status < 300) {
          const text =
            typeof parsedBody === 'object'
              ? JSON.stringify(parsedBody, null, 2)
              : parsedBody || '(empty)'
          const textContent =
            `Intercepted XHR payload from ${this._interceptUrl} responseText:\n "${this.responseText}"\n` +
            `Request Body:\n${text}'}`
          const styles = {}
          if (text.includes('ecid')) {
            styles.color = 'green'
          }
          addPreElement(textContent, styles)
        }
      })
    }
    //Needs "rt": "x" in invocation_options - ct will be triggered as xhr and not embedded as script
    if (spoofAAgent) {
      this.setRequestHeader('x-ai-agent', 'OpenAI-Operator')
    }
    return originalSend.apply(this, arguments)
  }
})()
