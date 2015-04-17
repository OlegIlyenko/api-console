jQuery(function ($) {
  window.History = {options: {html4Mode: true}};

  var watchedFields = ["projectKey", "clientId", "clientSecret"];
  var prefix = "credentials-";

  $('.raml-console-sidebar-oauth-scopes input').livequery(function() {
    $(this).change(function() {
      $('.raml-console-sidebar-oauth-scopes input').each(function (idx, cb) {
        localStorage.setItem(prefix + "sphere-scopes-" + idx, $(cb).is(':checked'))
      })
    });
  });

  $('input[name=projectKey]').livequery(function() {
    var $scope = angular.element($(".raml-console-sidebar-oauth-scopes").get()).scope();

    var rememberFields = function (prefix, fields) {
      fields.forEach(function (f) {
        $('input[name=' + f + ']').on('input', function() {
          localStorage.setItem(prefix + f, $(this).val())
        });
      })
    };

    var restoreFields = function (prefix, fields) {
      fields.forEach(function (f) {
        var val = localStorage.getItem(prefix + f)

        if (val && val != '') {
          var input = $('input[name=' + f + ']')
          input.val(val)
          input.trigger('input')
        }
      })
    };

    var setupScopeUpdater = function (prefix, field) {
      $('input[name=' + field + ']').on('input', function() {
        var val = $(this).val();

        $scope.$apply(function() {
          for (var i = 0; i < $scope.scopes.length; i++) {
            $scope.scopes[i] = $scope.scopes[i].replace(/:.*$/, ":" + val)
            $scope.scopes[i] = $scope.scopes[i].replace(/:$/, ":{projectKey}")
          }
        });
      });
    };

    var restoreScopes = function () {
      $('.raml-console-sidebar-oauth-scopes input').each(function (idx, cb) {
        var checked = localStorage.getItem(prefix + "sphere-scopes-" + idx) == 'true'

        if (checked) {
          $(cb).trigger('click') // robot clicking checkboxes :)
        }
      })
    };

    setupScopeUpdater(prefix, watchedFields[0])
    restoreFields(prefix, watchedFields)
    rememberFields(prefix, watchedFields)
    restoreScopes();
  });

  var hash = window.location.hash.replace(/#+/, "").replace(/^request_/, "")

  var waitForElem = function (id, timeout, fn, start) {
    var currTime = new Date().getTime()

    if (start && (currTime - start) > timeout) return

    var elem = document.getElementById(id)

    if (!elem) {
      setTimeout(function () {waitForElem(id, timeout, fn, start ? start : currTime)}, 10)
    } else {
      fn(elem)
    }
  }

  if (hash) {
    var methodParts = hash.split("___")

    if (methodParts.length == 2) {
      var method = methodParts[1]

      $("#" + hash).livequery(function() {
        var that = this
        $(this).parent().find(".raml-console-tab-" + method).trigger('click')

        waitForElem('request-documentation', 20000, function () {
          that.scrollIntoView()
        })

      })

    }
  }
}(jQuery));
