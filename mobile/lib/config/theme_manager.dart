import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeManager {
  static final ValueNotifier<ThemeMode> themeModeNotifier = ValueNotifier<ThemeMode>(ThemeMode.dark);

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final isDark = prefs.getBool('is_dark_mode') ?? true;
    themeModeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  static bool get isDarkMode => themeModeNotifier.value == ThemeMode.dark;

  static Future<void> toggleTheme() async {
    final newMode = themeModeNotifier.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    themeModeNotifier.value = newMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark_mode', newMode == ThemeMode.dark);
  }

  static Future<void> setDarkMode(bool isDark) async {
    themeModeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark_mode', isDark);
  }
}
