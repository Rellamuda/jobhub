import 'package:flutter/material.dart';
import '../subscription_screen.dart';

class QuotaAlertBanner extends StatelessWidget {
  final Map<String, dynamic>? quota;
  final String? initialRole;
  final VoidCallback? onRefresh;

  const QuotaAlertBanner({
    super.key,
    required this.quota,
    this.initialRole,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (quota == null) return const SizedBox.shrink();

    final isUnlimited = quota!['isUnlimited'] == true;
    if (isUnlimited) return const SizedBox.shrink();

    final bool isExhausted = quota!['isExhausted'] == true;
    final bool isLow = quota!['isLow'] == true;

    if (!isExhausted && !isLow) return const SizedBox.shrink();

    final tierName = quota!['tierName'] ?? 'Plan';
    final nextTier = quota!['nextTier'] ?? 'Higher Tier';
    final used = quota!['used'] ?? 0;
    final limit = quota!['limit'] ?? 0;
    final remaining = quota!['remaining'] ?? 0;
    final metricName = quota!['metricName'] ?? 'credits';

    final Color bannerColor = isExhausted ? const Color(0xFFEF4444) : const Color(0xFFF59E0B);
    final IconData icon = isExhausted ? Icons.lock_clock : Icons.warning_amber_rounded;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bannerColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: bannerColor.withOpacity(0.4), width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: bannerColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: bannerColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isExhausted ? '$tierName Limit Reached' : 'Quota Running Low ($remaining Left)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: bannerColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  isExhausted
                    ? 'You have used all $limit $metricName. Upgrade to $nextTier for more!'
                    : 'Used $used of $limit $metricName on $tierName. Upgrade anytime.',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SubscriptionScreen(initialRole: initialRole),
                ),
              ).then((_) => onRefresh?.call());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: bannerColor,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              'Upgrade',
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
