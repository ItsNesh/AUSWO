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

      const applyMessage = () => {
        if (customMessage) {
          input.setCustomValidity(customMessage);
        }
      };

      const clearMessage = () => {
        input.setCustomValidity('');
      };

      clearMessage();
      input.addEventListener('invalid', applyMessage);
      input.addEventListener('input', clearMessage);
      input.addEventListener('blur', clearMessage);
      input.addEventListener('change', clearMessage);
    });
  }

  window.AUSWOFormValidation = Object.freeze({
    attachCustomValidity,
  });
})();
