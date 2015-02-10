define('popConfirmDirective', ['app'], function(app) {
  app.directive('popConfirm', function ($timeout) {
    var $lastDiv;
    var html = '<div class="confirm-bar"><span id="confirm-btn">Confirm</span> </div>';

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
        cancelCb: '&?',
        confirmMsg: '@'
      },
      link: function ($scope, elem) {
        elem.parent().css('position', 'relative');

        elem.on('click', function () {

          // remove last div
          if ($lastDiv)
            $lastDiv.remove();

          // parseHtml
          var $div = $(html);

          // change text
          if ($scope.confirmMsg)
            $div.find('#confirm-btn').text($scope.confirmMsg);

          // add click event
          $div.find('#confirm-btn').on('click', function () {
            $div.addClass('explode');
            $timeout(function() {
              $scope.confirmCb();
              $lastDiv.remove();
              $div.remove();
            }, 400)
          });

          elem.before($div);

          // adjust position
          var offsetHeight = elem.parent().innerHeight() - $div.innerHeight();
          $div.css('top', offsetHeight / 2);

          $lastDiv = $div;

          // $div.find('#cancel-btn').on('click', function () {
          //   $div.addClass('dive');
          //   $timeout(function() {
          //     $scope.cancelCb();
          //     $lastDiv.remove();
          //     $div.remove();
          //   }, 300)
          // });
        })
      }
    }
  })
});

