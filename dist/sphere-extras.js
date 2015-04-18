jQuery(function ($) {
  var watchedFields = ["projectKey", "clientId", "clientSecret"];
  var prefix = "credentials-";



  var extract = function (prefix) {
    var queryString = URI(window.location).search(true)
    var queryProps = Object.keys(queryString)

    var params = {}

    for (var i = 0; i < queryProps.length; i++) {
      var match = RegExp("^" + prefix + "\\.(.*)$").exec(queryProps[i]);

      if (match) params[match[1]] = queryString[queryProps[i]]
    }

    return params
  }

  var params = extract("param")
  var queryParams = extract("qparam")

  console.info(params)

  $('.raml-console-sidebar-oauth-scopes input').livequery(function() {
    $(this).change(function() {
      $('.raml-console-sidebar-oauth-scopes input').each(function (idx, cb) {
        localStorage.setItem(prefix + "sphere-scopes-" + idx, $(cb).is(':checked'))
      })
    });
  });

  var definedScopes = function($scope) {
    var defaultSchemaKey = Object.keys($scope.securitySchemes).sort()[0];
    var defaultSchema    = $scope.securitySchemes[defaultSchemaKey];

    return defaultSchema.settings.scopes
  }

  var watchers = []

  var setupWatch = function ($scope) {
    watchers.push($scope.$watch(function () {return $scope.credentials.clientId}, function () {
      localStorage.setItem(prefix + 'clientId', $scope.credentials.clientId)
    }))

    watchers.push($scope.$watch(function () {return $scope.credentials.clientSecret}, function () {
      localStorage.setItem(prefix + 'clientSecret', $scope.credentials.clientSecret)
    }))

    watchers.push($scope.$watchCollection(function () {return $scope.context.uriParameters.values.projectKey}, function () {
      var val = $scope.context.uriParameters.values.projectKey[0]

      if (typeof val === "undefined") return

      localStorage.setItem(prefix + 'projectKey', val)
      var defScopes = definedScopes($scope)

      for (var i = 0; i < defScopes.length; i++) {
        var old = defScopes[i]
        defScopes[i] = old.replace(/:.*$/, ":" + val).replace(/:$/, ":{projectKey}")

        if (old != defScopes[i] && $scope.credentials.scopes.hasOwnProperty(old)) {
          $scope.credentials.scopes[defScopes[i]] = $scope.credentials.scopes[old]
          delete $scope.credentials.scopes[old]
        }
      }
    }))

    watchers.push($scope.$watchCollection(function () {return $scope.credentials.scopes}, function () {
      var defScopes = definedScopes($scope)

      for (var i = 0; i < defScopes.length; i++) {
        var on = !!($scope.credentials.scopes && $scope.credentials.scopes[defScopes[i]])

        localStorage.setItem(prefix + "sphere-scopes-" + i, on)
      }
    }))
  }

  var restore = function ($scope) {
    $scope.credentials.clientId = localStorage.getItem(prefix + 'clientId')
    $scope.credentials.clientSecret = localStorage.getItem(prefix + 'clientSecret')
    $scope.context.uriParameters.values.projectKey = [localStorage.getItem(prefix + 'projectKey')]

    var paramKeys = Object.keys(params)

    for (var i = 0; i < paramKeys.length; i++) {
      if ($scope.context.uriParameters.values[paramKeys[i]]) {
        $scope.context.uriParameters.values[paramKeys[i]] = [params[paramKeys[i]]]
      }
    }

    var paramKeys = Object.keys(queryParams)

    for (var i = 0; i < paramKeys.length; i++) {
      if ($scope.context.queryParameters.values[paramKeys[i]]) {
        $scope.context.queryParameters.values[paramKeys[i]] = [queryParams[paramKeys[i]]]
      }
    }

    var defScopes = definedScopes($scope)

    $scope.credentials.scopes = {}

    for (var i = 0; i < defScopes.length; i++) {
      $scope.credentials.scopes[defScopes[i]] = localStorage.getItem(prefix + "sphere-scopes-" + i) == "true"
    }
  }

  var cleanupWatchers  = function () {
    watchers.forEach(function (w) {w()})
    watchers = []
  }

  window.tabOpened = function ($scope) {
    cleanupWatchers()

    restore($scope)
    setupWatch($scope)
  }

  window.tabChanged = function ($scope) {
    cleanupWatchers()

    restore($scope)
    setupWatch($scope)
  }

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
