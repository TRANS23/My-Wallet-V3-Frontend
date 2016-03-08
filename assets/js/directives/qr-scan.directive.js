
angular
  .module('walletApp')
  .directive('qrScan', qrScan);

function qrScan($rootScope, $timeout, $translate, Wallet, Alerts) {
  const directive = {
    restrict: 'E',
    replace: true,
    scope: {
      onScan: '='
    },
    templateUrl: 'templates/qr-scan-button.jade',
    link: link
  };
  return directive;

  function link(scope) {
    scope.popoverTemplate = 'templates/qr-scan-popover.jade';
    scope.browserWithCamera = $rootScope.browserWithCamera;

    scope.onCameraResult = (result) => {
      scope.scanComplete = true;
      let paymentRequest = Wallet.parsePaymentRequest(result);

      scope.scanSuccess = paymentRequest.isValid;
      if (scope.scanSuccess && scope.onScan) scope.onScan(paymentRequest);

      $timeout(() => scope.cameraOn = false, 1250);
      $timeout(() => scope.scanComplete = false, 1500);
    };

    scope.onCameraError = () => {
      scope.cameraOn = false;
      $translate('CAMERA_PERMISSION_DENIED').then(Alerts.displayWarning);
    };
  }
}
