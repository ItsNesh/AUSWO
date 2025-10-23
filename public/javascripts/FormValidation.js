(function () {
  function isElementWithinScope(scope, element) {
    if (!scope || scope === document) {
      return true;
    }
    if (typeof Element !== 'undefined' && scope instanceof Element) {
      return scope.contains(element);
    }
    return false;
  }

  function attachCustomValidity(scope, messageMap) {
    if (!messageMap || typeof messageMap !== 'object') {
      return;
    }

    Object.entries(messageMap).forEach(([id, message]) => {
      const input = document.getElementById(id);
      if (!input || !isElementWithinScope(scope, input)) {
        return;
      }

      const customMessage = typeof message === 'string' ? message : '';
      if (input.dataset) {
        if (customMessage) {
          input.dataset.defaultValidityMessage = customMessage;
        } else {
          delete input.dataset.defaultValidityMessage;
        }
      }

      const applyMessage = () => {
        const datasetMessage = input.dataset ? input.dataset.defaultValidityMessage : customMessage;
        const activeOverride = input.dataset ? input.dataset.activeValidityMessage : '';
        const messageToApply = activeOverride || datasetMessage || '';
        if (messageToApply) {
          input.setCustomValidity(messageToApply);
        }
      };

      const clearMessage = () => {
        if (input.dataset && input.dataset.activeValidityMessage) {
          delete input.dataset.activeValidityMessage;
        }
        input.setCustomValidity('');
      };

      clearMessage();
      input.addEventListener('invalid', applyMessage);
      input.addEventListener('input', clearMessage);
      input.addEventListener('blur', clearMessage);
      input.addEventListener('change', clearMessage);
    });
  }

  function resolveInput(fieldOrId) {
    if (!fieldOrId) {
      return null;
    }
    if (typeof fieldOrId === 'string') {
      return document.getElementById(fieldOrId);
    }
    return fieldOrId;
  }

  function setFieldError(fieldOrId, message, options = {}) {
    const { scope, focus } = options || {};
    const input = resolveInput(fieldOrId);
    if (!input || !isElementWithinScope(scope, input)) {
      return false;
    }

    const text = typeof message === 'string' ? message : '';

    if (input.dataset) {
      if (text) {
        input.dataset.activeValidityMessage = text;
      } else {
        delete input.dataset.activeValidityMessage;
      }
    }

    input.setCustomValidity(text);

    if (text) {
      if (focus && typeof input.focus === 'function') {
        try {
          input.focus({ preventScroll: true });
        } catch (err) {
          try { input.focus(); } catch (_) {}
        }
      }
      if (typeof input.reportValidity === 'function') {
        input.reportValidity();
      }
    }

    return true;
  }

  function clearFieldError(fieldOrId, options = {}) {
    return setFieldError(fieldOrId, '', options);
  }

  window.AUSWOFormValidation = Object.freeze({
    attachCustomValidity,
    setFieldError,
    clearFieldError,
  });
})();
