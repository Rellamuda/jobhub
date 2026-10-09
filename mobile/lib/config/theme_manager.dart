import 'package:flutter/material.dart';

class ThemeManager {
  static final ValueNotifier<ThemeMode> themeModeNotifier = ValueNotifier<ThemeMode>(ThemeMode.dark);

  static Future<void> init() async {
    themeModeNotifier.value = ThemeMode.dark;
  }

  static bool get isDarkMode => true;

  static Future<void> toggleTheme() async {
    // Application is permanently locked to Dark Mode
    themeModeNotifier.value = ThemeMode.dark;
  }

  static Future<void> setDarkMode(bool isDark) async {
    // Application is permanently locked to Dark Mode
    themeModeNotifier.value = ThemeMode.dark;
  }
}
