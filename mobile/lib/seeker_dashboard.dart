import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';
import 'config/theme_manager.dart';

import 'jobs_screen.dart';
import 'applications_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';
import 'screens/resumes/resumes_list_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/network_feed_screen.dart';
import 'screens/career_health_screen.dart';
import 'screens/timeline_screen.dart';
import 'screens/jobs/marketplace_screen.dart';

class SeekerDashboard extends StatefulWidget {
  const SeekerDashboard({super.key});

  @override
  State<SeekerDashboard> createState() => _SeekerDashboardState();
}

class _SeekerDashboardState extends State<SeekerDashboard> {
  int _currentIndex = 0;
  List<dynamic> _applications = [];
  List<dynamic> _inbox = [];
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String _firstName = '';
  String _profilePic = '';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final appsRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/applications/my-applications'), headers: {'Authorization': 'Bearer $token'});
      final inboxRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/messages/inbox'), headers: {'Authorization': 'Bearer $token'});
      final profRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'), headers: {'Authorization': 'Bearer $token'});
      final notifRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/notifications'), headers: {'Authorization': 'Bearer $token'});

      setState(() {
        if (appsRes.statusCode == 200) _applications = jsonDecode(appsRes.body);
        if (inboxRes.statusCode == 200) _inbox = jsonDecode(inboxRes.body);
        if (notifRes.statusCode == 200) _notifications = jsonDecode(notifRes.body);
        if (profRes.statusCode == 200) {
          final prof = jsonDecode(profRes.body);
          _firstName = prof['firstName'] ?? 'Seeker';
          _profilePic = prof['profilePicture'] ?? '';
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _applyWithConsent(dynamic notification) async {
    final jobId = notification['jobId'];
    if (jobId == null) return;

    final bool? consent = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF120B1C) : Colors.white,
          title: Text('Job Application Consent', style: TextStyle(color: isDark ? Colors.white : Colors.black87)),
          content: Text(
            'Do you consent to automatically apply for this job? Your profile details will be submitted to the employer.',
            style: TextStyle(color: isDark ? Colors.white70 : Colors.black54),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Consent & Apply', style: TextStyle(color: Color(0xFF00F0FF))),
            ),
          ],
        );
      },
    );

    if (consent != true) return;

    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final applyRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/applications/$jobId/apply'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'coverLetter': 'Applied automatically via Smart Match Alert with seeker consent.',
        }),
      );

      if (applyRes.statusCode == 200 || applyRes.statusCode == 201) {
        await http.delete(
          Uri.parse('${ApiConfig.baseUrl}/profiles/notifications/${notification['id']}'),
          headers: {'Authorization': 'Bearer $token'},
        );

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Successfully applied!')),
        );
        _fetchData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to apply. You might have already applied.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error applying for job.')),
      );
    }
  }

  Future<void> _dismissAlert(String notificationId) async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/profiles/notifications/$notificationId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200 || res.statusCode == 204) {
        _fetchData();
      }
    } catch (e) {
      // error
    }
  }

  Widget _buildHub() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tools = [
      {'title': 'AI Resumes', 'subtitle': 'Build & ATS optimize', 'icon': Icons.description, 'color': const Color(0xFF6366F1), 'page': ResumesListScreen()},
      {'title': 'Career Health', 'subtitle': 'Score & skill gaps', 'icon': Icons.health_and_safety, 'color': const Color(0xFF10B981), 'page': const CareerHealthScreen()},
      {'title': 'Digital Wallet', 'subtitle': 'Degrees & credentials', 'icon': Icons.account_balance_wallet, 'color': const Color(0xFF00F0FF), 'page': const WalletScreen()},
      {'title': 'Career Timeline', 'subtitle': 'Milestones & progress', 'icon': Icons.timeline, 'color': const Color(0xFFF59E0B), 'page': const TimelineScreen()},
      {'title': 'Pro Network', 'subtitle': 'Connect & share updates', 'icon': Icons.people, 'color': const Color(0xFFEC4899), 'page': const NetworkFeedScreen()},
      {'title': 'Marketplace', 'subtitle': 'Contract gigs & one-tap', 'icon': Icons.storefront, 'color': const Color(0xFF8B5CF6), 'page': const MarketplaceScreen()},
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('AI Career Hub'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          itemCount: tools.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 1.15,
          ),
          itemBuilder: (context, index) {
            final tool = tools[index];
            return InkWell(
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => tool['page'] as Widget));
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.04) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: (tool['color'] as Color).withOpacity(0.3),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isDark ? Colors.black.withOpacity(0.2) : Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (tool['color'] as Color).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(tool['icon'] as IconData, color: tool['color'] as Color, size: 28),
                    ),
                    const Spacer(),
                    Text(
                      tool['title'] as String,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      tool['subtitle'] as String,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white54 : Colors.black45,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : IndexedStack(
              index: _currentIndex,
              children: [
                const JobsScreen(),
                const ApplicationsScreen(),
                _buildHub(),
                _buildInbox(),
                _buildNotifications(),
                const ProfileScreen(),
              ],
            ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: isDark ? const Color(0xFF0A0A0A) : Colors.white,
        selectedItemColor: isDark ? const Color(0xFF00F0FF) : const Color(0xFF6366F1),
        unselectedItemColor: isDark ? Colors.white54 : Colors.black45,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Jobs'),
          const BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
          const BottomNavigationBarItem(icon: Icon(Icons.hub), label: 'AI Hub'),
          const BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
          BottomNavigationBarItem(
            icon: Badge(
              label: _notifications.isNotEmpty ? Text('${_notifications.length}') : null,
              isLabelVisible: _notifications.isNotEmpty,
              child: const Icon(Icons.notifications),
            ),
            label: 'Alerts',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildInbox() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_inbox.isEmpty) {
      return Center(
        child: Text('No messages', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
      );
    }
    return ListView.builder(
      itemCount: _inbox.length,
      itemBuilder: (context, index) {
        final item = _inbox[index];
        return ListTile(
          title: Text('Employer', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold)),
          subtitle: Text(item['latestMessage']?['content'] ?? '', style: TextStyle(color: isDark ? Colors.white54 : Colors.black45)),
        );
      },
    );
  }

  Widget _buildNotifications() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_notifications.isEmpty) {
      return Center(
        child: Text('No match alerts at this time.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
      );
    }
    return ListView.builder(
      itemCount: _notifications.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final notif = _notifications[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.04) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('⚡ Smart Match Alert', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 16)),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    color: isDark ? Colors.white54 : Colors.black45,
                    onPressed: () => _dismissAlert(notif['id']),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                notif['message'] ?? 'A new job matching your profile is available.',
                style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => _applyWithConsent(notif),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Review & Apply with Consent'),
              ),
            ],
          ),
        );
      },
    );
  }
}
