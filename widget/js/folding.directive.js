define('foldingDirective', ['app'], function(app) {
  app.directive('folding', function($timeout) {
    var minHeight = 160;

    return {
      link: function ($scope, elem) {

        $timeout(function() {
          if (elem.height() > minHeight) {
            elem.data('oriHeight', elem.height());
            elem.height(minHeight);

            elem
            .on('mouseover', function () {
              elem.height(elem.data('oriHeight'));
            })
            .on('mouseout', function () {
              elem.height(minHeight);
            })
          }
        })
      }
    }
  })
});