import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  // Configurable base URL; defaults to current EC2 deployment, easily overrideable for local dev
  static String baseUrl = 'http://56.228.30.202:3001';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    // Check both 'token' and 'auth_token' for backward compatibility
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('auth_token');
  }

  static Future<Map<String, String>> authHeaders({bool isJson = true}) async {
    final token = await getToken();
    final Map<String, String> headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
