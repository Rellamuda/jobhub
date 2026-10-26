import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'config/api_config.dart';
import 'services/revenuecat_service.dart';

class SubscriptionScreen extends StatefulWidget {
  final String? initialRole;

  const SubscriptionScreen({super.key, this.initialRole});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isLoading = false;
  int _selectedTab = 0; // 0: Job Seekers, 1: Employers
  String? _userRole;
  String? _userEmail;
  String? _userId;
  String? _currentTier;
  Offerings? _offerings;

  @override
  void initState() {
    super.initState();
    _userRole = widget.initialRole;
    if (_userRole == 'EMPLOYER') {
      _selectedTab = 1;
    } else if (_userRole == 'JOB_SEEKER') {
      _selectedTab = 0;
    }
    _initRoleAndData();
  }

  Future<void> _initRoleAndData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_userRole == null) {
        final cachedRole = prefs.getString('user_role');
        if (cachedRole != null && mounted) {
          setState(() {
            _userRole = cachedRole;
            _selectedTab = cachedRole == 'EMPLOYER' ? 1 : 0;
          });
        }
      }
      await _fetchUserRole();
      await _loadRevenueCatOfferings();
    } catch (e) {
      debugPrint('Error initializing subscription screen: $e');
    }
  }

  Future<void> _loadRevenueCatOfferings() async {
    try {
      await RevenueCatService.init(userId: _userId);
      final offerings = await RevenueCatService.getOfferings();
      if (mounted) {
        setState(() {
          _offerings = offerings;
        });
      }
    } catch (e) {
      debugPrint('Error loading RevenueCat offerings: $e');
    }
  }

  Future<void> _fetchUserRole() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final user = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _userId = user['id'];
            _userRole = user['role'] ?? _userRole;
            _userEmail = user['email'];
            _currentTier = (user['subscriptionTier'] ?? 'FREE').toString().toUpperCase();
            if (_userRole == 'EMPLOYER') {
              _selectedTab = 1;
            } else if (_userRole == 'JOB_SEEKER') {
              _selectedTab = 0;
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching user role: $e');
    }
  }

  Future<void> _processNativePurchase(String tier, String role, int amount) async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please log in to upgrade.')),
          );
        }
        return;
      }

      // Check for native RevenueCat offerings first
      Package? targetPackage;
      if (_offerings != null && _offerings!.current != null) {
        final packages = _offerings!.current!.availablePackages;
        final tierKey = tier.toLowerCase();
        for (final p in packages) {
          final id = p.identifier.toLowerCase();
          if (id.contains(tierKey) ||
              (tierKey == 'premium' && id.contains('diamond')) ||
              (tierKey == 'diamond' && id.contains('premium'))) {
            targetPackage = p;
            break;
          }
        }
        targetPackage ??= packages.isNotEmpty ? packages.first : null;
      }

      final displayTierName = (tier == 'PREMIUM' || tier == 'DIAMOND') ? 'Diamond' : tier;

      if (targetPackage != null) {
        final success = await RevenueCatService.purchasePackage(targetPackage);
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF10B981),
              content: Text('🎉 Successfully upgraded to $displayTierName!'),
            ),
          );
          _fetchUserRole();
          return;
        }
      }

      // Sync subscription intent with backend
      final syncRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/payments/mobile-upgrade'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'tier': tier,
          'platform': Theme.of(context).platform == TargetPlatform.iOS ? 'IOS' : 'ANDROID',
        }),
      );

      if (syncRes.statusCode == 200 || syncRes.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF10B981),
              content: Text('Upgraded to $displayTierName tier successfully!'),
            ),
          );
          _fetchUserRole();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Upgrade to $displayTierName initiated. Processing in-app confirmation.'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Upgrade error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _restorePurchases() async {
    setState(() => _isLoading = true);
    try {
      final restored = await RevenueCatService.restorePurchases();
      if (mounted) {
        if (restored) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Purchases restored successfully!'),
            ),
          );
          _fetchUserRole();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No active subscriptions found to restore.'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error restoring purchases: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0C20),
      appBar: AppBar(
        title: const Text('Upgrade Plan', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF16122E),
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _restorePurchases,
            child: const Text('Restore', style: TextStyle(color: Color(0xFF00F0FF))),
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTabSelector(),
                const SizedBox(height: 20),
                if (_selectedTab == 0) ..._buildJobSeekerPlans(),
                if (_selectedTab == 1) ..._buildEmployerPlans(),
                const SizedBox(height: 24),
                _buildStoreComplianceNotice(),
                const SizedBox(height: 30),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFF00F0FF)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTabSelector() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1938),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedTab = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _selectedTab == 0 ? const Color(0xFF6366F1) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Job Seekers',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _selectedTab == 0 ? Colors.white : Colors.white60,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedTab = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _selectedTab == 1 ? const Color(0xFF00F0FF) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Employers',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _selectedTab == 1 ? Colors.black : Colors.white60,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildJobSeekerPlans() {
    return [
      _buildPlanCard(
        title: 'Free Tier',
        price: '\$0',
        subtitle: 'Essential starter tools to begin your career journey.',
        accentColor: Colors.white60,
        isCurrent: _currentTier == 'FREE',
        features: const [
          '✔️ 1 Resume & Cover Letter built',
          '✔️ 1 Autonomous Application credit',
          '✔️ One-Click Apply enabled',
          '✔️ Only 3 Job Matches after onboarding',
          '❌ Unlimited Autonomous Applications',
          '❌ Unlimited AI Resume & Cover Letters',
        ],
        onUpgrade: null,
      ),
      const SizedBox(height: 16),
      _buildPlanCard(
        title: 'Silver Plan',
        price: '\$13',
        subtitle: 'Unlimited AI power to match, tailor and autonomously apply.',
        accentColor: const Color(0xFF94A3B8),
        isCurrent: _currentTier == 'SILVER',
        badge: 'POPULAR',
        features: const [
          '✨ 15 AI Resume tailoring & builder',
          '✨ 15 AI Cover Letter generation',
          '✨ 5 Autonomous Job Applications auto-pilot',
          '✨ 20 Job Matches & Instant Alerts',
          '✨ Priority Application Delivery to Employers',
          '✨ Career Health & Digital Credential Verification',
        ],
        onUpgrade: () => _processNativePurchase('SILVER', 'JOB_SEEKER', 13),
      ),
      const SizedBox(height: 16),
      _buildPlanCard(
        title: 'Diamond Plan',
        price: '\$20',
        subtitle: 'Unlimited AI power to match, tailor and autonomously apply.',
        accentColor: const Color(0xFF00F0FF),
        isCurrent: _currentTier == 'PREMIUM' || _currentTier == 'DIAMOND',
        badge: 'BEST VALUE',
        features: const [
          '✨ Unlimited AI Resume tailoring & builder',
          '✨ Unlimited AI Cover Letter generation',
          '✨ Autonomous Job Applications auto-pilot',
          '✨ Unlimited Job Matches & Instant Alerts',
          '✨ Priority Application Delivery to Employers',
          '✨ Career Health & Digital Credential Verification',
        ],
        onUpgrade: () => _processNativePurchase('PREMIUM', 'JOB_SEEKER', 20),
      ),
    ];
  }

  List<Widget> _buildEmployerPlans() {
    return [
      _buildPlanCard(
        title: 'Free Plan',
        price: '\$0',
        subtitle: 'For occasional hiring',
        accentColor: Colors.white60,
        isCurrent: _currentTier == 'FREE',
        features: const [
          'Post up to 2 active jobs',
          'Basic candidate dashboard',
          'Standard application view',
        ],
        onUpgrade: null,
      ),
      const SizedBox(height: 16),
      _buildPlanCard(
        title: 'Silver Plan',
        price: '\$49.99',
        subtitle: 'For growing businesses',
        accentColor: const Color(0xFF94A3B8),
        isCurrent: _currentTier == 'SILVER',
        badge: 'POPULAR',
        features: const [
          'Post up to 10 active jobs',
          'AI candidate match ranking & score',
          'Full resume synthesis & review modal',
          'Automated interview scheduling',
        ],
        onUpgrade: () => _processNativePurchase('SILVER', 'EMPLOYER', 50),
      ),
      const SizedBox(height: 16),
      _buildPlanCard(
        title: 'Enterprise Plan',
        price: '\$149.99',
        subtitle: 'For high-volume recruiters & agencies',
        accentColor: const Color(0xFF00F0FF),
        isCurrent: _currentTier == 'PREMIUM',
        badge: 'ALL INCLUSIVE',
        features: const [
          'Unlimited active job postings',
          'AI Company & Agency Profile generator',
          'Full CRM recruiter pipeline & analytics',
          'Autonomous talent matching recommendations',
        ],
        onUpgrade: () => _processNativePurchase('PREMIUM', 'EMPLOYER', 150),
      ),
    ];
  }

  Widget _buildStoreComplianceNotice() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: const Row(
        children: [
          Icon(Icons.security, color: Color(0xFF10B981), size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Subscriptions are billed securely through your app store account. Cancel anytime from your device subscription settings.',
              style: TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String price,
    required String subtitle,
    required Color accentColor,
    required bool isCurrent,
    String? badge,
    required List<String> features,
    VoidCallback? onUpgrade,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1435),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent ? accentColor : accentColor.withOpacity(0.3),
          width: isCurrent ? 2 : 1,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (badge != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: accentColor.withOpacity(0.5)),
              ),
              child: Text(
                badge,
                style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 11),
              ),
            ),
          Text(title, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: accentColor)),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(price, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(width: 4),
              const Text('/ month', style: TextStyle(color: Colors.white60, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          const Divider(color: Colors.white12, height: 28),
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(feature, style: const TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: isCurrent
                ? OutlinedButton(
                    onPressed: null,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.white.withOpacity(0.2)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Current Plan', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.bold)),
                  )
                : ElevatedButton(
                    onPressed: onUpgrade,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: accentColor,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Upgrade to $title', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
          ),
        ],
      ),
    );
  }
}
