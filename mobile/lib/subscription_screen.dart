import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';

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
  String? _currentTier;

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
    } catch (e) {
      debugPrint('Error initializing role: $e');
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

  void _showPaymentModal(String tier, String role, int amount) {
    String selectedProvider = 'PAYSTACK';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF161028),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Row(
                    children: [
                      Icon(Icons.lock, color: Color(0xFF00F0FF), size: 16),
                      SizedBox(width: 6),
                      Text('SECURE CHECKOUT', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Upgrade to $tier Plan',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Total amount due: \$$amount USD / month',
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 20),
                  const Text('Select Payment Gateway:', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 12),

                  // Paystack tile
                  InkWell(
                    onTap: () => setModalState(() => selectedProvider = 'PAYSTACK'),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: selectedProvider == 'PAYSTACK' ? const Color(0xFF00F0FF).withOpacity(0.12) : Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selectedProvider == 'PAYSTACK' ? const Color(0xFF00F0FF) : Colors.white10,
                          width: selectedProvider == 'PAYSTACK' ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.credit_card, color: Color(0xFF00F0FF), size: 24),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Paystack', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                SizedBox(height: 2),
                                Text('Cards, Bank Transfer, USSD & Apple Pay', style: TextStyle(color: Colors.white60, fontSize: 11)),
                              ],
                            ),
                          ),
                          Icon(
                            selectedProvider == 'PAYSTACK' ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: selectedProvider == 'PAYSTACK' ? const Color(0xFF00F0FF) : Colors.white30,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Flutterwave tile
                  InkWell(
                    onTap: () => setModalState(() => selectedProvider = 'FLUTTERWAVE'),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: selectedProvider == 'FLUTTERWAVE' ? const Color(0xFFF59E0B).withOpacity(0.12) : Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selectedProvider == 'FLUTTERWAVE' ? const Color(0xFFF59E0B) : Colors.white10,
                          width: selectedProvider == 'FLUTTERWAVE' ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.waves, color: Color(0xFFF59E0B), size: 24),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Flutterwave', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                SizedBox(height: 2),
                                Text('Debit/Credit Cards, Mobile Money, Accounts', style: TextStyle(color: Colors.white60, fontSize: 11)),
                              ],
                            ),
                          ),
                          Icon(
                            selectedProvider == 'FLUTTERWAVE' ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: selectedProvider == 'FLUTTERWAVE' ? const Color(0xFFF59E0B) : Colors.white30,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _processPaymentAndUpgrade(tier, role, amount, selectedProvider);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00F0FF),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'Proceed with $selectedProvider (\$$amount)',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _processPaymentAndUpgrade(String tier, String role, int amount, String provider) async {
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

      // Initialize payment via backend gateway
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/payments/initialize'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'amount': amount,
          'plan': tier,
          'email': _userEmail ?? 'user@jobhub.ai',
          'provider': provider,
          'callbackUrl': 'http://56.228.30.202:3000/pricing?status=success',
        }),
      );

      final data = jsonDecode(res.body);
      if ((res.statusCode == 200 || res.statusCode == 201) && data['authorization_url'] != null) {
        final authUrl = data['authorization_url'] as String;
        final reference = data['reference'] as String? ?? '';
        final uri = Uri.parse(authUrl);

        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          await launchUrl(uri);
        }

        if (mounted) {
          _showPaymentVerificationDialog(reference, tier, authUrl, provider);
        }
      } else {
        final errorMsg = data['message'] ?? 'Payment initialization failed. Please try again.';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.redAccent,
              content: Text(errorMsg.toString()),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Error initiating payment: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showPaymentVerificationDialog(String reference, String tier, String authUrl, String provider) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) {
        bool isVerifying = false;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E1435),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFF00F0FF), width: 1.5),
              ),
              title: const Row(
                children: [
                  Icon(Icons.open_in_browser, color: Color(0xFF00F0FF)),
                  SizedBox(width: 10),
                  Text('Checkout Launched', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'We have opened the secure $provider payment checkout in your external browser.',
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    '1. Complete your card / bank payment in the browser window.\n2. Tap "Verify Payment" below once finished.',
                    style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                  ),
                  if (isVerifying) ...[
                    const SizedBox(height: 16),
                    const Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF))),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogCtx),
                  child: const Text('Close', style: TextStyle(color: Colors.white54)),
                ),
                TextButton(
                  onPressed: () async {
                    final uri = Uri.parse(authUrl);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  child: const Text('Re-open Link', style: TextStyle(color: Color(0xFF00F0FF))),
                ),
                ElevatedButton(
                  onPressed: isVerifying
                      ? null
                      : () async {
                          setDialogState(() => isVerifying = true);
                          try {
                            final res = await http.get(
                              Uri.parse('${ApiConfig.baseUrl}/payments/verify/$reference?provider=$provider'),
                            );
                            final verifyData = jsonDecode(res.body);
                            if (res.statusCode == 200 && verifyData['success'] == true) {
                              if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: const Color(0xFF10B981),
                                    content: Text('🎉 Payment verified! Successfully upgraded to $tier tier!'),
                                  ),
                                );
                                _fetchUserRole();
                              }
                            } else {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: Colors.amber[800],
                                    content: Text(verifyData['message'] ?? 'Payment verification pending. If you just paid, please wait a few seconds and try again.'),
                                  ),
                                );
                              }
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: Colors.redAccent,
                                  content: Text('Verification check error: $e'),
                                ),
                              );
                            }
                          } finally {
                            if (dialogCtx.mounted) setDialogState(() => isVerifying = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00F0FF),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Verify Payment', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: Text(
          _userRole == 'EMPLOYER' ? 'Employer Hiring Plans' : _userRole == 'JOB_SEEKER' ? 'Job Seeker Plans' : 'Plans & Pricing',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  const Text(
                    'Unlock Full AI Potential',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _userRole == 'EMPLOYER'
                        ? 'Accelerate hiring with AI vacancy assistance, verified badge, and priority ranking.'
                        : 'Supercharge your job hunt with unlimited AI resumes, cover letters, and auto-pilot applications.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  // Tab Selector: ONLY visible if role is unknown/guest (role strictly separated)
                  if (_userRole == null) ...[
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
                  ],

                  // JOB SEEKER PLANS: Visible ONLY for Job Seekers
                  if (_userRole == 'JOB_SEEKER' || (_userRole == null && _selectedTab == 0)) ...[
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
                      isCurrent: _currentTier == null || _currentTier == 'FREE',
                      accentColor: Colors.grey,
                    ),
                    const SizedBox(height: 20),

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
                        'Career Health & Digital Credential Verification',
                      ],
                      isPopular: true,
                      isCurrent: _currentTier == 'SILVER' || _currentTier == 'PREMIUM',
                      accentColor: const Color(0xFF00F0FF),
                      onUpgrade: () => _showPaymentModal('SILVER', 'JOB_SEEKER', 10),
                    ),
                  ],

                  // EMPLOYER PLANS: Visible ONLY for Employers
                  if (_userRole == 'EMPLOYER' || (_userRole == null && _selectedTab == 1)) ...[
                    _buildPlanCard(
                      title: 'Free Tier',
                      price: '\$0',
                      subtitle: 'Post limited jobs and test hiring tools',
                      features: [
                        'Post up to 3 jobs',
                        'Only 3 candidate matches per month',
                        'Standard candidate messaging',
                      ],
                      isCurrent: _currentTier == null || _currentTier == 'FREE',
                      accentColor: Colors.grey,
                    ),
                    const SizedBox(height: 20),

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
                      isCurrent: _currentTier == 'PREMIUM',
                      accentColor: const Color(0xFF00F0FF),
                      onUpgrade: () => _showPaymentModal('PREMIUM', 'EMPLOYER', 50),
                    ),
                    const SizedBox(height: 20),

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
                      isCurrent: _currentTier == 'SILVER',
                      accentColor: const Color(0xFFC084FC),
                      onUpgrade: () => _showPaymentModal('SILVER', 'EMPLOYER', 100),
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
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'POPULAR',
                style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(height: 12),
          ],
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
