define('miscDirective', ['app'], function(app) {
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
  .directive('stopEvent', function() {
    return {
      link: function(scope, elem, attr) {
        elem.bind('click', function(e) {
          e.stopPropagation();
        });
      }
    };
  })
  .directive('validFile',function(){
    return {
      require:'ngModel',
      link:function(scope,el,attrs,ngModel){
        //change event is fired when file is selected
        el.bind('change',function(){
          scope.$apply(function(){
            ngModel.$setViewValue(el.val());
            ngModel.$render();
          });
        });
      }
    }
  })
  .directive('readFile', function($timeout) {
    return {
      require: 'ngModel',
      scope: {
        acceptSuffix: '@',  // 'yml,yaml'
        successHandler: '=?',
        errorHandler: '=?'       // 0: suffix not matched
      },
      link: function ($scope, elem, attrs, ngModel) {
        var file;

        var reader = new FileReader();
        reader.onload = function (event) {
          file.content = event.target.result;
          ngModel.$setViewValue(file);
          if ($scope.successHandler) $scope.$apply(function() {$scope.successHandler()});
        };

        elem.bind('change',function(){
          if(elem[0].files){
            file = elem[0].files[0];

            // judge if the file should be read
            if ($scope.acceptSuffix) {
              var regex = new RegExp($scope.acceptSuffix.split(',').map(function(e){return '.'+e+'$'}).join('|'));

              if (!regex.test(file.name))
                return $scope.errorHandler && $scope.$apply(function() {
                  ngModel.$setViewValue(null);
                  $scope.errorHandler(1);
                });
            }

            reader.readAsText(file);
          }
        });
      }
    }
  });
});
