angular
  .module('walletApp')
  .controller('LoginCtrl', LoginCtrl);

function LoginCtrl ($scope, $rootScope, $location, $log, $http, Wallet, WalletNetwork, Alerts, $cookies, $uibModal, $state, $stateParams, $timeout, $translate, filterFilter, $q) {
  $scope.status = Wallet.status;
  $scope.settings = Wallet.settings;
  $scope.disableLogin = null;
  $scope.errors = {
    uid: null,
    password: null,
    twoFactor: null
  };

  $rootScope.loginFormUID.then((res) => {
    $scope.uid = $stateParams.uid || Wallet.guid || res;

    $scope.$watch('uid + password + twoFactorCode + settings.needs2FA', () => {
      $rootScope.loginFormUID = $q.resolve($scope.uid);
      let isValid = null;
      $scope.errors.uid = null;
      $scope.errors.password = null;
      $scope.errors.twoFactor = null;
      if ($scope.uid == null || $scope.uid === '') {
        isValid = false;
      }
      if ($scope.password == null || $scope.password === '') {
        isValid = false;
      }
      if ($scope.settings.needs2FA && $scope.twoFactorCode === '') {
        isValid = false;
      }
      if (isValid == null) {
        isValid = true;
      }
      $timeout(() => $scope.isValid = isValid);
    });
  });

  $scope.uidAvailable = !!$scope.uid;

  $scope.user = Wallet.user;

  //   Browser compatibility warnings:
  // * Secure random number generator: https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues
  // * AngularJS support (?)

  const browsers = {
    'ie': {
      browser: 'Internet Explorer',
      requiredVersion: 11
    },
    'chrome': {
      browser: 'Chrome',
      requiredVersion: 11
    },
    'firefox': {
      browser: 'Firefox',
      requiredVersion: 21
    },
    'safari': {
      browser: 'Safari',
      requiredVersion: 6
    },
    'opera': {
      browser: 'Opera',
      requiredVersion: 15
    }
  };

  $scope.displayBrowserWarning = (code) => {
    let browser = browsers[code];
    if (browser) {
      browser.userVersion = browserDetection().version;
      if (browser.userVersion < browser.requiredVersion) {
        $scope.disableLogin = true;
        $translate('MINIMUM_BROWSER', browser).then(Alerts.displayError);
      } else if (code === 'ie') {
        Alerts.displayWarning('WARN_AGAINST_IE');
      }
    } else {
      Alerts.displayWarning('UNKNOWN_BROWSER');
    }
  };

  $scope.displayBrowserWarning(browserDetection().browser);

  $scope.twoFactorCode = '';
  $scope.busy = false;
  $scope.isValid = false;
  if ($cookies.get('password')) {
    $scope.password = $cookies.get('password');
  }
  $scope.login = () => {
    if ($scope.busy) return;
    $scope.busy = true;
    Alerts.clear();
    const error = (field, message) => {
      $scope.busy = false;
      if (field === 'uid') {
        $scope.errors.uid = 'UNKNOWN_IDENTIFIER';
      } else if (field === 'password') {
        $scope.errors.password = message;
      } else if (field === 'twoFactor') {
        $scope.errors.twoFactor = message;
      }
      if (field !== 'twoFactor' && $scope.didAsk2FA) {
        $scope.didEnterCorrect2FA = true;
      }
    };
    const needs2FA = () => {
      $scope.busy = false;
      $scope.didAsk2FA = true;
    };
    const success = () => {
      $scope.busy = false;
      if ($scope.autoReload && $cookies.get('reload.url')) {
        $location.url($cookies.get('reload.url'));
        $cookies.remove('reload.url');
      }
    };
    if ($scope.settings.needs2FA) {
      Wallet.login($scope.uid, $scope.password, $scope.twoFactorCode, () => {}, success, error);
    } else {
      Wallet.login($scope.uid, $scope.password, null, needs2FA, success, error);
    }
    if ($scope.uid != null && $scope.uid !== '') {
      $cookies.put('uid', $scope.uid);
    }
    if ($scope.autoReload && $scope.password != null && $scope.password !== '') {
      $cookies.put('password', $scope.password);
    }
  };

  if ($scope.autoReload && $scope.uid && $scope.password) {
    $scope.login();
  }

  $scope.resend = () => {
    if (Wallet.settings.twoFactorMethod === 5) {
      $scope.resending = true;
      const success = (res) => {
        $scope.resending = false;
        Alerts.displaySuccess('RESENT_2FA_SMS');
        $rootScope.$safeApply();
      };
      const error = (res) => {
        Alerts.displayError('RESENT_2FA_SMS_FAILED');
        $scope.resending = false;
        $rootScope.$safeApply();
      };
      WalletNetwork.resendTwoFactorSms($scope.uid).then(success).catch(error);
    }
  };

  $scope.register = () => {
    $state.go('public.signup');
  };

  $scope.numberOfActiveAccounts = () => {
    filterFilter(Wallet.accounts(), {
      archived: false
    }).length;
  };
  $scope.$watch('status.isLoggedIn', (newValue) => {
    if (newValue) {
      $scope.busy = false;
      $state.go('wallet.common.home');
    }
  });
}
