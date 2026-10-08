import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isLoading = false;
  int _selectedTab = 0; // 0: Job Seekers, 1: Employers

  Future<void> _upgradeTier(String tier, String role) async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/profiles/upgrade'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'tier': tier}),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Successfully upgraded to $tier tier! 🎉')),
        );
        Navigator.pop(context);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upgrade.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Network error.')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('JobHub Plans & Pricing', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            const Text(
              'Unlock Full AI Potential',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tailored monetization tiers for ambitious job seekers and scaling recruiters.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 24),

            // Tab Selector
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedTab = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedTab == 0 ? const Color(0xFF00F0FF) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            'Job Seekers',
                            style: TextStyle(
                              color: _selectedTab == 0 ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedTab = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedTab == 1 ? const Color(0xFF00F0FF) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            'Employers',
                            style: TextStyle(
                              color: _selectedTab == 1 ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (_selectedTab == 0) ...[
              // Free Tier Seeker
              _buildPlanCard(
                title: 'Free Tier',
                price: '\$0',
                subtitle: 'Starter package for exploring jobs',
                features: [
                  '1 Resume & Cover Letter built',
                  '1 Autonomous Application credit',
                  '1-Click Apply enabled',
                  'Only 3 Job matches after onboarding',
                ],
                isCurrent: true,
                accentColor: Colors.grey,
              ),
              const SizedBox(height: 20),

              // Silver Seeker ($10/mo)
              _buildPlanCard(
                title: 'Silver Plan',
                price: '\$10',
                subtitle: 'Supercharge your job hunt on auto-pilot',
                features: [
                  'Unlimited AI Resume Tailoring',
                  'Unlimited AI Cover Letter building',
                  'Autonomous Applications on auto-pilot',
                  'Unlimited Job matches & instant alerts',
                  'Priority application ranking with employers',
                ],
                isPopular: true,
                accentColor: const Color(0xFF00F0FF),
                onUpgrade: () => _upgradeTier('SILVER', 'JOB_SEEKER'),
              ),
            ] else ...[
              // Free Tier Employer
              _buildPlanCard(
                title: 'Free Tier',
                price: '\$0',
                subtitle: 'Post limited jobs and test hiring tools',
                features: [
                  'Post up to 3 jobs',
                  'Only 3 candidate matches per month',
                  'Standard candidate messaging',
                ],
                isCurrent: true,
                accentColor: Colors.grey,
              ),
              const SizedBox(height: 20),

              // Premium Employer ($50/mo)
              _buildPlanCard(
                title: 'Premium',
                price: '\$50',
                subtitle: 'Scale active hiring with high-impact AI',
                features: [
                  'Post up to 70 jobs per month',
                  'Up to 50 instant qualified candidate matches',
                  'AI Job vacancy build assist before posting',
                  'Priority Applicant Ranking',
                  'Verified Profile Badge option',
                  '40 AI Match Scoring advance career coaching',
                ],
                isPopular: true,
                accentColor: const Color(0xFF00F0FF),
                onUpgrade: () => _upgradeTier('PREMIUM', 'EMPLOYER'),
              ),
              const SizedBox(height: 20),

              // Silver / Enterprise Employer ($100/mo)
              _buildPlanCard(
                title: 'Silver / Enterprise',
                price: '\$100',
                subtitle: 'Full agency recruitment powerhouse',
                features: [
                  'Unlimited AI Resume & Cover Letter building',
                  'Unlimited AI Match Scoring',
                  'Best Priority Ranking across platform',
                  'Verified Profile Badge options',
                  'Advanced Career Coaching Insight',
                  'Unlimited Job Postings & Candidate Pipeline',
                ],
                accentColor: const Color(0xFFC084FC),
                onUpgrade: () => _upgradeTier('SILVER', 'EMPLOYER'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String price,
    required String subtitle,
    required List<String> features,
    bool isCurrent = false,
    bool isPopular = false,
    Color accentColor = const Color(0xFF00F0FF),
    VoidCallback? onUpgrade,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isPopular ? accentColor : Colors.white.withOpacity(0.1), width: isPopular ? 2 : 1),
        boxShadow: isPopular ? [BoxShadow(color: accentColor.withOpacity(0.15), blurRadius: 20, spreadRadius: -2)] : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isPopular) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(12)),
              child: const Text('RECOMMENDED', style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),
          ],
          Text(title, style: TextStyle(color: accentColor, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(price, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.black)),
              const SizedBox(width: 4),
              const Text('/mo', style: TextStyle(color: Colors.white54, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const Divider(color: Colors.white12, height: 28),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Icon(Icons.check_circle_outline, color: accentColor, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Text(f, style: const TextStyle(color: Colors.white, fontSize: 13))),
              ],
            ),
          )),
          const SizedBox(height: 20),
          if (isCurrent)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
              child: const Center(child: Text('Default Active Tier', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.bold, fontSize: 13))),
            )
          else
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : onUpgrade,
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  _isLoading ? 'Processing...' : 'Upgrade Now ($price/mo)',
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
