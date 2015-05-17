define('app', ['angular', 'require', 'uiAce', 'ace'], function(angular, require) {
  var app = angular.module('snippets-manager', ['ui.ace']);

  app.run(function($rootScope) {

    /**
     * Get real file path
     * @param  {String} path   Relative path, based on `./widget`
     * @return {String}        Absolute path
     */
    $rootScope.url = function (path) {
      return require.toUrl(path);
    }
  })

  return app;
});