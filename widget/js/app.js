define('app', ['angular', 'require'], function(angular, require) {
  var app = angular.module('snippets-manager', []);

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

  app.directive('folding', function($timeout) {
    return {
      link: function ($scope, elem) {

        $timeout(function() {
          if (elem.height() > 40) {
            elem.data('oriHeight', elem.height());
            elem.height(40);

            elem
            .on('mouseover', function () {
              elem.height(elem.data('oriHeight'));
            })
            .on('mouseout', function () {
              elem.height(40);
            })
          }
        })
      }
    }
  })
  return app;
});