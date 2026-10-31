import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';
import 'config/theme_manager.dart';

import 'jobs_screen.dart';
import 'applications_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';
import 'chat_screen.dart';
import 'screens/resumes/resumes_list_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/network_feed_screen.dart';
import 'screens/career_health_screen.dart';
import 'screens/timeline_screen.dart';
import 'screens/jobs/marketplace_screen.dart';
import 'employer_dashboard.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widgets/quota_alert_banner.dart';
import 'notifications_screen.dart';
import 'ai_chat_screen.dart';

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
  Map<String, dynamic>? _quota;
  bool _isContractor = false;
  String _contractorCompanyName = '';
  bool _isSwitchingRole = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _switchRole() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1435),
        title: const Row(
          children: [
            Icon(Icons.swap_horiz, color: Color(0xFF00F0FF)),
            SizedBox(width: 8),
            Text('Switch to Employer Mode', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          _contractorCompanyName.isNotEmpty
              ? 'Switch to Employer Mode to post job openings and hire technicians for ${_contractorCompanyName}?'
              : 'Switch to Employer Mode to post vacancies and manage applicant hiring?',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
            child: const Text('Confirm Switch', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSwitchingRole = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/switch-role'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        final newRole = data['role'];
        final newToken = data['access_token'];

        final prefs = await SharedPreferences.getInstance();
        if (newToken != null) {
          await prefs.setString('token', newToken);
        }
        await prefs.setString('user_role', newRole);

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(data['message'] ?? 'Switched to Employer Mode!'),
          ),
        );

        Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
          MaterialPageRoute(builder: (c) => const EmployerDashboard()),
          (r) => false,
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Failed to switch mode: ${res.body}'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Network error switching mode: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSwitchingRole = false);
    }
  }

  Widget _buildContractorBanner() {
    if (!_isContractor) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2C194D), Color(0xFF1E1435)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFA855F7).withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFFA855F7).withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.business_center, color: Color(0xFFC084FC), size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _contractorCompanyName.isNotEmpty ? _contractorCompanyName : 'Contractor Account',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const Text(
                  'Bidding on jobs active',
                  style: TextStyle(color: Colors.white60, fontSize: 11),
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: _isSwitchingRole ? null : _switchRole,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00F0FF),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            icon: _isSwitchingRole
                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                : const Icon(Icons.swap_horiz, size: 14, color: Colors.black),
            label: const Text(
              'Switch to Hiring',
              style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _fetchData() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final appsRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/applications/my-applications'), headers: {'Authorization': 'Bearer $token'});
      final inboxRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/messages/inbox'), headers: {'Authorization': 'Bearer $token'});
      final profRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'), headers: {'Authorization': 'Bearer $token'});
      final notifRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/notifications'), headers: {'Authorization': 'Bearer $token'});
      final quotaRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/users/quota'), headers: {'Authorization': 'Bearer $token'});

      setState(() {
        if (appsRes.statusCode == 200) _applications = jsonDecode(appsRes.body);
        if (inboxRes.statusCode == 200) _inbox = jsonDecode(inboxRes.body);
        if (notifRes.statusCode == 200) _notifications = jsonDecode(notifRes.body);
        if (profRes.statusCode == 200) {
          final prof = jsonDecode(profRes.body);
          _firstName = prof['firstName'] ?? 'Seeker';
          _profilePic = prof['profilePicture'] ?? '';
          _isContractor = prof['seekerType'] == 'COMPANY_CONTRACTOR' || prof['isDualCapacity'] == true;
          _contractorCompanyName = prof['companyName'] ?? '';
        }
        if (quotaRes.statusCode == 200) {
          final q = jsonDecode(quotaRes.body);
          _quota = q is Map<String, dynamic> ? q : null;
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
        Uri.parse('${ApiConfig.baseUrl}/jobs/autonomous/approve/$jobId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(applyRes.body);
      if (applyRes.statusCode == 200 || applyRes.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(data['message'] ?? 'Successfully applied with Autonomous AI!'),
          ),
        );
        _fetchData();
      } else {
        final errorMsg = data['message'] ?? 'Failed to apply.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text(errorMsg),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('Error applying: $e'),
        ),
      );
    }
  }

  Future<void> _markAlertAsRead(dynamic notif) async {
    if (notif == null || notif['id'] == null || notif['isRead'] == true) return;
    setState(() {
      notif['isRead'] = true;
    });
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;
      await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/profiles/notifications/${notif['id']}/read'),
        headers: {'Authorization': 'Bearer $token'},
      );
    } catch (_) {}
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
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Badge(
              label: unreadAlertsCount > 0 ? Text('$unreadAlertsCount') : null,
              isLabelVisible: unreadAlertsCount > 0,
              child: const Icon(Icons.notifications_outlined),
            ),
            tooltip: 'Notification Alerts',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationsScreen()),
              ).then((_) => _fetchData());
            },
          ),
        ],
      ),
      body: Column(
        children: [
          QuotaAlertBanner(
            quota: _quota,
            initialRole: 'JOB_SEEKER',
            onRefresh: _fetchData,
          ),
          Expanded(
            child: Padding(
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
    ),
    ],
  ),
);
}

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unreadAlertsCount = _notifications.where((n) => n['isRead'] != true).length;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SafeArea(
                child: Column(
                  children: [
                    _buildContractorBanner(),
                    Expanded(
                      child: IndexedStack(
                        index: _currentIndex,
                        children: [
                          const JobsScreen(),
                          const ApplicationsScreen(),
                          _buildHub(),
                          _buildInbox(),
                          const AiChatScreen(),
                          const ProfileScreen(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          backgroundColor: isDark ? const Color(0xFF0A0A0A) : Colors.white,
          selectedItemColor: isDark ? const Color(0xFF00F0FF) : const Color(0xFF6366F1),
          unselectedItemColor: isDark ? Colors.white54 : Colors.black45,
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Jobs'),
            BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
            BottomNavigationBarItem(icon: Icon(Icons.hub), label: 'AI Hub'),
            BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome),
              label: 'AI Chat',
            ),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildInbox() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Messages'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Badge(
              label: unreadAlertsCount > 0 ? Text('$unreadAlertsCount') : null,
              isLabelVisible: unreadAlertsCount > 0,
              child: const Icon(Icons.notifications_outlined),
            ),
            tooltip: 'Notification Alerts',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationsScreen()),
              ).then((_) => _fetchData());
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: _inbox.isEmpty
          ? Center(
              child: Text('No messages yet', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _inbox.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = _inbox[index];
                final otherUser = item['otherUser'] ?? {};
                final otherUserId = otherUser['id']?.toString() ?? '';
                final employerName = otherUser['employerProfile']?['companyName'] ??
                    (otherUser['jobSeekerProfile'] != null
                        ? '${otherUser['jobSeekerProfile']['firstName'] ?? ''} ${otherUser['jobSeekerProfile']['lastName'] ?? ''}'.trim()
                        : null) ??
                    (otherUser['email'] != null ? otherUser['email'].toString().split('@').first : 'Employer');

                return Card(
                  color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFF00F0FF).withOpacity(0.15),
                      child: const Icon(Icons.business, color: Color(0xFF00F0FF)),
                    ),
                    title: Text(
                      employerName.isNotEmpty ? employerName : 'Employer',
                      style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      item['latestMessage']?['content'] ?? 'Tap to view conversation',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: isDark ? Colors.white60 : Colors.black54),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: Color(0xFF00F0FF)),
                    onTap: () async {
                      if (otherUserId.isEmpty) return;
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ChatScreen(
                            otherUserId: otherUserId,
                            otherUserName: employerName.isNotEmpty ? employerName : 'Employer',
                            otherUserRole: 'Employer / Recruiter',
                          ),
                        ),
                      );
                      _fetchData();
                    },
                  ),
                );
              },
            ),
    );
  }

  Widget _buildNotifications() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Alerts & Notifications'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: _notifications.isEmpty
          ? Center(
              child: Text('No match alerts at this time.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
            )
          : ListView.builder(
              itemCount: _notifications.length,
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final notif = _notifications[index];
                final bool isRead = notif['isRead'] == true;
                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _markAlertAsRead(notif),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? (isRead ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.06))
                          : (isRead ? Colors.grey.shade50 : Colors.white),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isRead
                            ? (isDark ? Colors.white12 : Colors.black12)
                            : const Color(0xFF00F0FF).withOpacity(0.5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(
                                  notif['jobId'] != null ? '⚡ Smart Match Alert' : '🔔 Notification',
                                  style: TextStyle(
                                    color: isRead ? Colors.grey : const Color(0xFF00F0FF),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isRead
                                        ? Colors.grey.withOpacity(0.2)
                                        : const Color(0xFF00F0FF).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    isRead ? 'Read' : 'New',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isRead ? Colors.grey : const Color(0xFF00F0FF),
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
                          style: TextStyle(
                            color: isDark ? Colors.white : Colors.black87,
                            fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          children: [
                            if (notif['jobId'] != null)
                              ElevatedButton(
                                onPressed: () {
                                  _markAlertAsRead(notif);
                                  _applyWithConsent(notif);
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF6366F1),
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Review & Apply with Consent'),
                              ),
                            if (!isRead)
                              OutlinedButton(
                                onPressed: () => _markAlertAsRead(notif),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF00F0FF),
                                  side: const BorderSide(color: Color(0xFF00F0FF)),
                                ),
                                child: const Text('Mark as Read'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
