import 'package:flutter/material.dart';
import '../subscription_screen.dart';

class UpgradePromptDialog extends StatelessWidget {
  final String title;
  final String message;
  final String targetTier;
  final String? initialRole;
  final String buttonText;
  final bool isExhausted;

  const UpgradePromptDialog({
    super.key,
    required this.title,
    required this.message,
    required this.targetTier,
    this.initialRole,
    this.buttonText = 'Upgrade Now',
    this.isExhausted = true,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    required String message,
    required String targetTier,
    String? initialRole,
    String buttonText = 'Upgrade Now',
    bool isExhausted = true,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => UpgradePromptDialog(
        title: title,
        message: message,
        targetTier: targetTier,
        initialRole: initialRole,
        buttonText: buttonText,
        isExhausted: isExhausted,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEmployer = initialRole == 'EMPLOYER';
    final accentColor = isExhausted ? const Color(0xFF00F0FF) : const Color(0xFFF59E0B);

    return Dialog(
      backgroundColor: const Color(0xFF16122E),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: accentColor.withOpacity(0.4), width: 1.5),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Icon Badge
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accentColor.withOpacity(0.15),
                  border: Border.all(color: accentColor.withOpacity(0.5), width: 2),
                ),
                child: Icon(
                  isExhausted ? Icons.rocket_launch : Icons.warning_amber_rounded,
                  color: accentColor,
                  size: 32,
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),

            // Message Body
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white70,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => SubscriptionScreen(initialRole: initialRole),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 4,
              ),
              child: Text(
                buttonText,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Maybe Later',
                style: TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
