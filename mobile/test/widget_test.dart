import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('JobHubAIApp smoke test', (WidgetTester tester) async {
    // Build the JobHub AI app widget tree
    await tester.pumpWidget(const JobHubAIApp());

    // Verify root app widget mounts cleanly
    expect(find.byType(JobHubAIApp), findsOneWidget);
  });
}
