define('miscDirective', ['app', 'keystroke'], function(app, keystroke) {
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
  })
  .directive('myTooltip', function ($document, $timeout) {

    return {
      link: function ($scope, elem, attrs) {
        var template = attrs.template

        var tmpEle
        if (template.charAt(0) === '#') {
          tmpEle = angular.element(template)
        }

        if (!tmpEle)
          return
        
        tmpEle.hide()

        var isHoverTmp, isHoverElem

        tmpEle.on('mouseenter', function () {
          isHoverTmp = true
        })

        tmpEle.on('mouseleave', function () {
          isHoverTmp = false
          $timeout(function () {
            if (tmpEle && !isHoverElem) {
              tmpEle.hide()
              isHoverTmp = false
            }
          }, 50)
        })

        tmpEle.addClass('mytooltip')
        var $container = $('.right-panel'), $content = $('.main-view > .content')
        elem.on('mouseenter', function () {
          isHoverElem = true
          if (tmpEle) {
            var top
            if (tmpEle.height() > ($container.height() - 100 + $container.scrollTop()))
              top = $content.height() - tmpEle.height() - 20
            else
              top = elem.position().top

            tmpEle.css({
              top: top,
              left: elem.position().left
            })
            tmpEle.show()
          }
        })

        elem.on('mouseleave', function () {
          isHoverElem = false
          $timeout(function () {
            if (tmpEle && !isHoverTmp) {
              tmpEle.hide()
              isHoverElem = false
            }
          }, 50)
        })
      }
    }
  })
  .directive('keystroke', function() {
    return {
      require: 'ngModel',
      link: function($scope, elem, attrs, ngModel) {
        ngModel.$validators.keystroke = function(modelValue, viewValue) {

          if (ngModel.$isEmpty(modelValue))
            return true;

          modelValue = modelValue.replace(/\s/g, '')

          ngModel.$setViewValue(modelValue)
          ngModel.$render();

          return keystroke.parse(modelValue);
        };
      }
    };
  })
  .directive('focusOn', function ($timeout) {
    return {
      link: function ($scope, elem, attrs) {
        $scope.$watch(attrs.focusOn, function (val) {
          $timeout(function() {
            val ? elem.focus() : elem.blur();
          });
        });
      }
    }
  })
});
