describe "LoginCtrl", ->
  scope = undefined
  Alerts = undefined

  modal =
   open: (args) ->
     result:
       then: ->

  beforeEach angular.mock.module("walletApp")

  beforeEach ->
   angular.mock.inject ($injector, $rootScope, $controller) ->
     Wallet = $injector.get("Wallet")
     WalletNetwork = $injector.get("WalletNetwork")
     Alerts = $injector.get("Alerts")

     spyOn(WalletNetwork, "resendTwoFactorSms").and.callThrough()

     MyWallet = $injector.get("MyWallet")

     scope = $rootScope.$new()

     $controller "LoginCtrl",
       $scope: scope,
       $stateParams: {}
       $uibModal: modal

  it "should login",  inject((Wallet) ->
    scope.uid = "user"
    scope.password = "pass"

    spyOn(Wallet, "login")

    scope.login()
  )

  it "should resend two factor sms", inject((Wallet, WalletNetwork) ->
    Wallet.settings.twoFactorMethod = 5
    scope.sessionToken = "token"
    scope.uid = "user"

    scope.resend()

    expect(WalletNetwork.resendTwoFactorSms).toHaveBeenCalled()
    expect(WalletNetwork.resendTwoFactorSms).toHaveBeenCalledWith("user", "token")
  )

  describe "browser detection", ->

    beforeEach ->
      spyOn(Alerts, 'displayError')
      spyOn(Alerts, 'displayWarning')

    it "should warn against an unknown browser", ->
      scope.displayBrowserWarning('netscape')
      expect(Alerts.displayWarning).toHaveBeenCalledWith('UNKNOWN_BROWSER')

    it "should warn against IE", ->
      scope.displayBrowserWarning('ie')
      expect(Alerts.displayWarning).toHaveBeenCalledWith('WARN_AGAINST_IE')

    it "should show an error when below minimum version", ->
      scope.displayBrowserWarning('firefox')
      expect(scope.disableLogin).toBe(true)
      expect(Alerts.displayError).toHaveBeenCalledWith('MINIMUM_BROWSER')

    it "should not show an error when above minimum version", ->
      scope.displayBrowserWarning('chrome')
      expect(scope.disableLogin).toBe(null)
      expect(Alerts.displayError).not.toHaveBeenCalled()
