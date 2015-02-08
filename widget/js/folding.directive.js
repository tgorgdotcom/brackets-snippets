define('foldingDirective', ['app'], function(app) {
  app.directive('folding', function($timeout) {
    return {
      link: function ($scope, elem) {

        $timeout(function() {
          if (elem.height() > 80) {
            elem.data('oriHeight', elem.height());
            elem.height(80);

            elem
            .on('mouseover', function () {
              elem.height(elem.data('oriHeight'));
            })
            .on('mouseout', function () {
              elem.height(80);
            })
          }
        })
      }
    }
  })
});