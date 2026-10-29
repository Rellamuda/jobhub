import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/config/theme_manager.dart';
import 'package:mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('JobHubAIApp smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await ThemeManager.init();
    await tester.pumpWidget(const JobHubAIApp());

    expect(find.byType(JobHubAIApp), findsOneWidget);
  });
}
