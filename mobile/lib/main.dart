import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'register_screen.dart';
import 'config/theme_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeManager.init();
  runApp(const JobHubAIApp());
}

class JobHubAIApp extends StatelessWidget {
  const JobHubAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeManager.themeModeNotifier,
      builder: (context, currentMode, _) {
        return MaterialApp(
          title: 'JobHub AI',
          debugShowCheckedModeBanner: false,
          themeMode: currentMode,
          theme: ThemeData(
            brightness: Brightness.light,
            scaffoldBackgroundColor: const Color(0xFFF8FAFC),
            primaryColor: const Color(0xFF6366F1),
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF6366F1),
              secondary: Color(0xFF00B4D8),
              surface: Colors.white,
            ),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF0A0A0A),
            primaryColor: const Color(0xFF6366F1),
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF6366F1),
              secondary: Color(0xFF00F0FF),
              surface: Color(0xFF120B1C),
            ),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
            useMaterial3: true,
          ),
          home: const WelcomeScreen(),
        );
      },
    );
  }
}

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.5,
            colors: isDark
                ? const [Color(0xFF120B1C), Color(0xFF0A0A0A)]
                : const [Color(0xFFEEF2FF), Color(0xFFF8FAFC)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: Icon(
                      isDark ? Icons.light_mode : Icons.dark_mode,
                      color: isDark ? const Color(0xFF00F0FF) : const Color(0xFF6366F1),
                    ),
                    tooltip: 'Toggle Theme',
                    onPressed: () => ThemeManager.toggleTheme(),
                  ),
                ),
                const Spacer(),
                Text(
                  'Welcome to\nJobHub AI',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    foreground: Paint()
                      ..shader = const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF00F0FF)],
                      ).createShader(const Rect.fromLTWH(0.0, 0.0, 300.0, 70.0)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'The global AI employment operating system that helps job seekers build careers and employers hire talent efficiently.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark ? Colors.white.withOpacity(0.7) : Colors.black87,
                  ),
                ),
                const Spacer(),
                
                // Glass panel card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.03) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: isDark ? Colors.white.withOpacity(0.08) : Colors.black12),
                    boxShadow: [
                      BoxShadow(
                        color: isDark ? Colors.black.withOpacity(0.3) : Colors.black.withOpacity(0.06),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 8,
                          shadowColor: const Color(0xFF00F0FF).withOpacity(0.6),
                        ),
                        child: const Text('Log In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const RegisterScreen()),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: Color(0xFF00F0FF)),
                          foregroundColor: isDark ? Colors.white : const Color(0xFF6366F1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Sign Up', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
