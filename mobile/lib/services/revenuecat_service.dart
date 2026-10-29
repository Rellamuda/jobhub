import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

class RevenueCatService {
  // Public SDK Keys from RevenueCat dashboard
  // Replace these with your actual keys from RevenueCat Project Settings -> API Keys
  static const String _androidApiKey = String.fromEnvironment(
    'REVENUECAT_ANDROID_KEY',
    defaultValue: 'goog_placeholder_revenuecat_android_key',
  );
  static const String _iosApiKey = String.fromEnvironment(
    'REVENUECAT_IOS_KEY',
    defaultValue: 'appl_placeholder_revenuecat_ios_key',
  );

  // Entitlement ID configured in RevenueCat dashboard (e.g. 'premium_access')
  static const String entitlementId = 'jobhub_pro';

  static bool _isConfigured = false;

  /// Initialize RevenueCat SDK
  static Future<void> init({String? userId}) async {
    if (_isConfigured) {
      if (userId != null && userId.isNotEmpty) {
        await logIn(userId);
      }
      return;
    }

    try {
      await Purchases.setLogLevel(kDebugMode ? LogLevel.debug : LogLevel.info);

      PurchasesConfiguration configuration;
      if (Platform.isAndroid) {
        configuration = PurchasesConfiguration(_androidApiKey);
      } else if (Platform.isIOS) {
        configuration = PurchasesConfiguration(_iosApiKey);
      } else {
        debugPrint('[RevenueCat] Platform not supported for in-app purchases');
        return;
      }

      if (userId != null && userId.isNotEmpty) {
        configuration.appUserID = userId;
      }

      await Purchases.configure(configuration);
      _isConfigured = true;
      debugPrint('[RevenueCat] Successfully configured for userId: $userId');
    } catch (e) {
      debugPrint('[RevenueCat] Initialization error: $e');
    }
  }

  /// Log in RevenueCat with JobHub User ID so subscriptions sync across devices and webhooks
  static Future<void> logIn(String userId) async {
    if (!_isConfigured) return;
    try {
      await Purchases.logIn(userId);
      debugPrint('[RevenueCat] Logged in with userId: $userId');
    } catch (e) {
      debugPrint('[RevenueCat] LogIn error: $e');
    }
  }

  /// Log out on sign out
  static Future<void> logOut() async {
    if (!_isConfigured) return;
    try {
      await Purchases.logOut();
      debugPrint('[RevenueCat] Logged out');
    } catch (e) {
      debugPrint('[RevenueCat] LogOut error: $e');
    }
  }

  /// Fetch offerings configured in RevenueCat
  static Future<Offerings?> getOfferings() async {
    if (!_isConfigured) return null;
    try {
      final offerings = await Purchases.getOfferings();
      return offerings;
    } catch (e) {
      debugPrint('[RevenueCat] Fetch offerings error: $e');
      return null;
    }
  }

  /// Purchase a package natively via Google Play / App Store
  static Future<bool> purchasePackage(Package package) async {
    if (!_isConfigured) return false;
    try {
      final purchaseResult = await Purchases.purchasePackage(package);
      final customerInfo = purchaseResult.customerInfo;
      final hasActiveEntitlement = customerInfo.entitlements.all[entitlementId]?.isActive ?? false;
      return hasActiveEntitlement;
    } catch (e) {
      debugPrint('[RevenueCat] Purchase package error: $e');
      return false;
    }
  }

  /// Restore previous purchases (mandatory requirement for Apple App Store review)
  static Future<bool> restorePurchases() async {
    if (!_isConfigured) return false;
    try {
      final customerInfo = await Purchases.restorePurchases();
      final hasActiveEntitlement = customerInfo.entitlements.all[entitlementId]?.isActive ?? false;
      return hasActiveEntitlement;
    } catch (e) {
      debugPrint('[RevenueCat] Restore purchases error: $e');
      return false;
    }
  }

  /// Check current active entitlement status
  static Future<bool> isUserSubscribed() async {
    if (!_isConfigured) return false;
    try {
      final customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.all[entitlementId]?.isActive ?? false;
    } catch (e) {
      debugPrint('[RevenueCat] Check subscription error: $e');
      return false;
    }
  }
}
