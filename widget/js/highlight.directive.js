define('highlightDirective', ['app', 'highlight'], function(app, hljs) {
  app.directive('hljs', function($timeout) {
    return {
      link: function ($scope, elem) {
        $timeout(function() {
          hljs.highlightBlock(elem[0]);
        }, 100)
      }
    }
  })
});