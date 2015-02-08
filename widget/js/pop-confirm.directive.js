define('popConfirmDirective', ['app'], function(app) {
  app.directive('popConfirm', function ($timeout) {
    var $lastDiv;
    var html = '<div class="confirm-bar"><span class="confirm-msg">Sure to delete? </span><i id="confirm-btn" class="icon-ok-circle icon-white"></i> <i id="cancel-btn" class="icon-remove-circle icon-white"></i></div>';

    $('#edc-brackets-snippets-panel').on('click', function (ev) {
      if (!$(ev.target).is('[pop-confirm],#confirm-btn,#cancel-btn')) {
        if ($lastDiv) {
          $lastDiv.addClass('dive');
          $timeout(function() {
            $lastDiv.remove();
          }, 300)
        }
      }
    })

    return {
      scope: {
        confirmCb: '&',
        cancelCb: '&?'
      },
      link: function ($scope, elem) {

        elem.on('click', function () {

          if ($lastDiv)
            $lastDiv.remove();

          var $div = $(html);
          elem.before($div);

          $lastDiv = $div;

          $div.find('#confirm-btn').on('click', function () {
            $div.addClass('explode');
            $timeout(function() {
              $scope.confirmCb();
              $lastDiv.remove();
              $div.remove();
            }, 400)
          });

          $div.find('#cancel-btn').on('click', function () {
            $div.addClass('dive');
            $timeout(function() {
              $scope.cancelCb();
              $lastDiv.remove();
              $div.remove();
            }, 300)
          });
        })
      }
    }
  })
});

