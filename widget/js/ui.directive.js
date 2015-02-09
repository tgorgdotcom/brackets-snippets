define('uiDirective', ['app'], function(app) {
  app.directive('blink', function($timeout) {
    return {
      link: function ($scope, elem) {
        var timeoutObj;
        elem.on('click', function () {
          if (timeoutObj)
            $timeout.cancel(timeoutObj);

          elem.removeClass('success');

          $timeout(function() {
            elem.addClass('success');
          })

          timeoutObj = $timeout(function() {
            elem.removeClass('success');
          }, 1500)
        })
      }
    }
  })
});
