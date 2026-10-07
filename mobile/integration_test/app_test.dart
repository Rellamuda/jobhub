import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('end-to-end test', () {
    testWidgets('tap on the login button, verify welcome text',
        (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify the welcome screen is visible
      expect(find.textContaining('Welcome to'), findsOneWidget);
      expect(find.textContaining('JobHub AI'), findsOneWidget);

      // Find Log In button
      final Finder loginButton = find.text('Log In');
      expect(loginButton, findsOneWidget);

      // Tap Log In
      await tester.tap(loginButton);
      await tester.pumpAndSettle();

      // Verify Login Screen rendered
      expect(find.textContaining('Email'), findsOneWidget);
      expect(find.textContaining('Password'), findsOneWidget);
    });
  });
}
