import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'config/api_config.dart';

import 'profile_screen.dart';
import 'create_job_screen.dart';
import 'employer_crm_screen.dart';
import 'login_screen.dart';
import 'chat_screen.dart';
import 'widgets/quota_alert_banner.dart';

class EmployerDashboard extends StatefulWidget {
  const EmployerDashboard({super.key});

  @override
  State<EmployerDashboard> createState() => _EmployerDashboardState();
}

class _EmployerDashboardState extends State<EmployerDashboard> {
  int _currentIndex = 0;
  List<dynamic> _jobs = [];
  List<dynamic> _inbox = [];
  List<dynamic> _notifications = [];
  Map<String, dynamic> _employerProfile = {};
  bool _isLoading = true;
  String _companyName = '';
  String _profilePic = '';

  String? _selectedJobId;
  List<dynamic> _matches = [];
  bool _isMatching = false;
  final Set<String> _invitedUserIds = {};
  Map<String, dynamic>? _quota;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final jobsRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/jobs/employer/me'), headers: {'Authorization': 'Bearer $token'});
      final inboxRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/messages/inbox'), headers: {'Authorization': 'Bearer $token'});
      final profRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/employer'), headers: {'Authorization': 'Bearer $token'});
      final notifRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/profiles/notifications'), headers: {'Authorization': 'Bearer $token'});
      final quotaRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/users/quota'), headers: {'Authorization': 'Bearer $token'});

      setState(() {
        if (jobsRes.statusCode == 200) {
          _jobs = jsonDecode(jobsRes.body);
          if (_jobs.isNotEmpty && _selectedJobId == null) _selectedJobId = _jobs[0]['id'];
        }
        if (inboxRes.statusCode == 200) _inbox = jsonDecode(inboxRes.body);
        if (notifRes.statusCode == 200) _notifications = jsonDecode(notifRes.body);
        if (profRes.statusCode == 200) {
          final prof = jsonDecode(profRes.body);
          _employerProfile = prof is Map<String, dynamic> ? prof : {};
          _companyName = prof['companyName'] ?? 'Employer';
          _profilePic = prof['profilePicture'] ?? '';
        }
        if (quotaRes.statusCode == 200) {
          final q = jsonDecode(quotaRes.body);
          _quota = q is Map<String, dynamic> ? q : null;
        }
        _isLoading = false;
      });

      if (_selectedJobId != null) {
        _fetchMatches();
      }
    } catch (e) {
      setState(() => _isLoading = false);
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
    } catch (_) {}
  }

  void _showCompanyProfileDownloadModal() {
    final name = _employerProfile['companyName'] ?? (_companyName.isNotEmpty ? _companyName : 'My Organization');
    final industry = _employerProfile['industry'] ?? 'Corporate & Professional Services';
    final bizType = _employerProfile['businessType'] ?? 'Employer / Agency';
    final location = '${_employerProfile['locationCity'] ?? ''} ${_employerProfile['locationCountry'] ?? 'Global'}'.trim();
    final website = _employerProfile['website'] ?? 'https://jobhub-app.duckdns.org';
    final desc = _employerProfile['description'] ?? '$name is a premier $industry organization dedicated to excellence and top talent acquisition.';
    final mission = _employerProfile['mission'] ?? 'To empower global talent and deliver industry-leading solutions in $industry.';
    final vision = _employerProfile['vision'] ?? 'Being the most trusted and innovative employer and agency partner worldwide.';
    final culture = _employerProfile['culture'] ?? 'Collaborative, merit-driven, inclusive, and high-growth culture.';
    final whyWork = _employerProfile['whyWorkWithUs'] ?? 'Competitive compensation, clear career progression, and impactful work.';
    final values = (_employerProfile['coreValues'] is List && (_employerProfile['coreValues'] as List).isNotEmpty)
        ? (_employerProfile['coreValues'] as List).join(', ')
        : 'Excellence, Integrity, Innovation, Diversity';
    final benefits = (_employerProfile['benefits'] is List && (_employerProfile['benefits'] as List).isNotEmpty)
        ? (_employerProfile['benefits'] as List).join(', ')
        : 'Competitive Salary, Flexible Work Mode, Career Development, Health Coverage';

    final formattedDoc = '''
==================================================
$name - OFFICIAL AI COMPANY / AGENCY PROFILE
==================================================
Organization Type: $bizType
Industry: $industry
Location: $location
Website: $website

EXECUTIVE OVERVIEW
$desc

MISSION STATEMENT
$mission

VISION
$vision

CORE VALUES
$values

COMPANY CULTURE & ENVIRONMENT
$culture

WHY WORK WITH US
$whyWork

EMPLOYEE BENEFITS & PERKS
$benefits
==================================================
Generated by JobHub Global
''';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E162B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.75,
          maxChildSize: 0.92,
          minChildSize: 0.5,
          builder: (_, scrollCtrl) => Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        ' AI Company / Agency Profile',
                        style: TextStyle(color: Color(0xFF00F0FF), fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white54),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollCtrl,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: SelectableText(
                        formattedDoc,
                        style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: formattedDoc));
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: Color(0xFF10B981),
                              content: Text('AI Company Profile copied & ready to save/paste!'),
                            ),
                          );
                        },
                        icon: const Icon(Icons.download, color: Colors.black, size: 18),
                        label: const Text('Copy / Save Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00F0FF),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final uri = Uri.parse(
                            'https://wa.me/?text=${Uri.encodeComponent(formattedDoc)}',
                          );
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          } else {
                            Clipboard.setData(ClipboardData(text: formattedDoc));
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Copied profile to clipboard for sharing!')),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.share, color: Color(0xFF10B981), size: 18),
                        label: const Text('Share Profile', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFF10B981)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _fetchMatches() async {
    if (_selectedJobId == null) return;
    setState(() => _isMatching = true);
    try {
      final token = await ApiConfig.getToken();
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/jobs/$_selectedJobId/matches'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) {
        setState(() {
          _matches = jsonDecode(res.body);
        });
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isMatching = false);
    }
  }

  Future<void> _inviteCandidate(String userId) async {
    if (_invitedUserIds.contains(userId)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Message already sent')),
        );
      }
      return;
    }
    try {
      final token = await ApiConfig.getToken();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/messages'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'receiverId': userId, 'content': "Hi! We think you'd be a great fit for our recent job posting. We invite you to apply!"})
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        setState(() {
          _invitedUserIds.add(userId);
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invitation sent!')));
        _fetchData();
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadAlertsCount = _notifications.where((n) => n['isRead'] != true).length;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF120B1C),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120B1C),
          elevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            _currentIndex == 0
                ? 'My Jobs'
                : _currentIndex == 1
                    ? 'Applications'
                    : _currentIndex == 2
                        ? 'Matches'
                        : _currentIndex == 3
                            ? 'Messages'
                            : _currentIndex == 4
                                ? 'Alerts & Notifications'
                                : 'Profile',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.download_for_offline, color: Color(0xFF10B981)),
              tooltip: 'Download AI Company Profile',
              onPressed: _showCompanyProfileDownloadModal,
            ),
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70),
              tooltip: 'Refresh',
              onPressed: _fetchData,
            ),
          ],
        ),
        floatingActionButton: _currentIndex == 0
            ? FloatingActionButton.extended(
                onPressed: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateJobScreen()));
                  _fetchData();
                },
                backgroundColor: const Color(0xFF00F0FF),
                icon: const Icon(Icons.add, color: Colors.black),
                label: const Text('Post Job (AI)', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              )
            : null,
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : IndexedStack(
                index: _currentIndex,
                children: [
                  _buildJobsTab(),
                  _buildApplicationsTab(),
                  _buildMatchesTab(),
                  _buildInbox(),
                  _buildNotificationsTab(),
                  const ProfileScreen(),
                ],
              ),
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          backgroundColor: const Color(0xFF0A0A0A),
          selectedItemColor: const Color(0xFF00F0FF),
          unselectedItemColor: Colors.white54,
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: [
            const BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Jobs'),
            const BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
            const BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Matches'),
            const BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
            BottomNavigationBarItem(
              icon: Badge(
                label: unreadAlertsCount > 0 ? Text('$unreadAlertsCount') : null,
                isLabelVisible: unreadAlertsCount > 0,
                child: const Icon(Icons.notifications),
              ),
              label: 'Alerts',
            ),
            const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildJobsTab() {
    if (_jobs.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.work_outline, size: 64, color: Colors.white24),
              const SizedBox(height: 16),
              const Text('No jobs posted yet.', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Create job vacancies with AI assistance to discover verified matching candidates.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, fontSize: 14)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateJobScreen()));
                  _fetchData();
                },
                icon: const Icon(Icons.add, color: Colors.black),
                label: const Text('Post Job with AI', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00F0FF),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              )
            ],
          ),
        ),
      );
    }
    return Column(
      children: [
        QuotaAlertBanner(
          quota: _quota,
          initialRole: 'EMPLOYER',
          onRefresh: _fetchData,
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _jobs.length,
            itemBuilder: (context, index) {
              final item = _jobs[index];
              return Card(
                color: Colors.white.withOpacity(0.05),
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.white.withOpacity(0.1))),
                child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['title'] ?? 'Job', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Location: ${item['location'] ?? 'Remote'}', style: const TextStyle(color: Colors.white70)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                      child: Text('${item['_count']?['applications'] ?? 0} Apps', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => EmployerCrmScreen(jobId: item['id'], jobTitle: item['title'] ?? 'Job')),
                      ).then((_) => _fetchData());
                    },
                    icon: const Icon(Icons.people, size: 16, color: Color(0xFF00F0FF)),
                    label: const Text('Review Applicants & Resumes', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 13, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF00F0FF)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ),
  ),
  ],
);
}

  Widget _buildApplicationsTab() {
    if (_jobs.isEmpty) return const Center(child: Text('No applications yet.', style: TextStyle(color: Colors.white)));
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: DropdownButtonFormField<String>(
            value: _selectedJobId,
            dropdownColor: const Color(0xFF1E162B),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            items: _jobs.map<DropdownMenuItem<String>>((j) => DropdownMenuItem(value: j['id'], child: Text(j['title']))).toList(),
            onChanged: (val) {
              setState(() => _selectedJobId = val);
            },
          ),
        ),
        Expanded(
          child: Builder(builder: (context) {
            final job = _jobs.firstWhere((j) => j['id'] == _selectedJobId, orElse: () => null);
            if (job == null || job['applications'] == null || job['applications'].isEmpty) {
              return const Center(child: Text('No applications for this job.', style: TextStyle(color: Colors.white54)));
            }
            final apps = job['applications'] as List<dynamic>;
            return ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: apps.length,
              itemBuilder: (context, index) {
                final app = apps[index];
                final seeker = app['jobSeekerProfile'];
                final resume = app['resume'];
                final resumeSummary = (resume != null ? resume['summary'] : null) ?? seeker?['summary'] ?? seeker?['bio'];

                return Card(
                  color: Colors.white.withOpacity(0.05),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.white.withOpacity(0.1))),
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Colors.white.withOpacity(0.1),
                            backgroundImage: (seeker != null && seeker['profilePicture'] != null && seeker['profilePicture'].isNotEmpty) ? NetworkImage(seeker['profilePicture']) : null,
                            child: (seeker == null || seeker['profilePicture'] == null || seeker['profilePicture'].isEmpty) ? const Icon(Icons.person, color: Colors.white) : null,
                          ),
                          title: Row(
                            children: [
                              Text('${seeker?['firstName'] ?? 'Applicant'} ${seeker?['lastName'] ?? ''}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              if (seeker?['verificationStatus'] == 'VERIFIED') ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.verified, color: Color(0xFF00F0FF), size: 16),
                              ],
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Status: ${app['status']}', style: const TextStyle(color: Colors.white70)),
                              if (app['aiMatchScore'] != null)
                                Text('★ ${app['aiMatchScore']}% Match', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.message, color: Color(0xFF00F0FF)),
                            tooltip: 'Message Seeker',
                            onPressed: () async {
                              if (seeker?['userId'] != null) {
                                final fullName = '${seeker?['firstName'] ?? 'Applicant'} ${seeker?['lastName'] ?? ''}'.trim();
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ChatScreen(
                                      otherUserId: seeker['userId'].toString(),
                                      otherUserName: fullName.isNotEmpty ? fullName : 'Applicant',
                                      otherUserRole: 'Job Seeker',
                                    ),
                                  ),
                                );
                                _fetchData();
                              }
                            },
                          ),
                        ),
                        if (resumeSummary != null && resumeSummary.toString().isNotEmpty) ...[
                          Container(
                            margin: const EdgeInsets.only(top: 4, bottom: 8),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF00F0FF).withOpacity(0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.2)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(' ', style: TextStyle(fontSize: 12)),
                                Expanded(
                                  child: Text(
                                    resumeSummary.toString(),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.3),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              if (_selectedJobId != null) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => EmployerCrmScreen(jobId: _selectedJobId!, jobTitle: job['title'] ?? 'Job')),
                                ).then((_) => _fetchData());
                              }
                            },
                            icon: const Icon(Icons.description, size: 16, color: Colors.black),
                            label: const Text('Review Full Resume & Decide', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00F0FF),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          }),
        ),
      ],
    );
  }

  Widget _buildMatchesTab() {
    if (_jobs.isEmpty) return const Center(child: Text('No jobs posted yet.', style: TextStyle(color: Colors.white)));
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: DropdownButtonFormField<String>(
            value: _selectedJobId,
            dropdownColor: const Color(0xFF1E162B),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            items: _jobs.map<DropdownMenuItem<String>>((j) => DropdownMenuItem(value: j['id'], child: Text(j['title']))).toList(),
            onChanged: (val) {
              setState(() => _selectedJobId = val);
              _fetchMatches();
            },
          ),
        ),
        if (_isMatching) const Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator())
        else Expanded(
          child: _matches.isEmpty ? const Center(child: Text('No matches found for this job.', style: TextStyle(color: Colors.white54))) : ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _matches.length,
            itemBuilder: (context, index) {
              final m = _matches[index];
              return Card(
                color: Colors.white.withOpacity(0.05),
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.white.withOpacity(0.1))),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.white.withOpacity(0.1),
                            backgroundImage: (m['profilePicture'] != null && m['profilePicture'].isNotEmpty) ? NetworkImage(m['profilePicture']) : null,
                            child: (m['profilePicture'] == null || m['profilePicture'].isEmpty) ? const Icon(Icons.person, color: Colors.white) : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${m['firstName']} ${m['lastName']}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                                Text('${m['headline'] ?? m['profession'] ?? 'Candidate'}', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 12)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: Text('Score: ${m['matchScore']}', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 12)),
                          )
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('${m['residenceCity'] ?? ''} ${m['residenceCountry'] ?? ''} • Exp: ${m['expectedSalary'] ?? 'Negotiable'}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => _inviteCandidate(m['user']['id']),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _invitedUserIds.contains(m['user']['id']) ? Colors.white24 : const Color(0xFF00F0FF),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: Text(
                                _invitedUserIds.contains(m['user']['id']) ? 'Message already sent' : 'Invite to Apply',
                                style: TextStyle(color: _invitedUserIds.contains(m['user']['id']) ? Colors.white70 : Colors.black, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInbox() {
    if (_inbox.isEmpty) {
      return const Center(
        child: Text('No messages yet.', style: TextStyle(color: Colors.white70)),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _inbox.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = _inbox[index];
        final otherUser = item['otherUser'] ?? {};
        final otherUserId = otherUser['id']?.toString() ?? '';
        final seekerProfile = otherUser['jobSeekerProfile'];
        final otherName = seekerProfile != null
            ? '${seekerProfile['firstName'] ?? ''} ${seekerProfile['lastName'] ?? ''}'.trim()
            : (otherUser['email'] != null ? otherUser['email'].toString().split('@').first : 'Candidate');

        return Card(
          color: Colors.white.withOpacity(0.05),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.white.withOpacity(0.1)),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            leading: const CircleAvatar(
              backgroundColor: Colors.white12,
              child: Icon(Icons.person, color: Color(0xFF00F0FF)),
            ),
            title: Text(
              otherName.isNotEmpty ? otherName : 'Candidate',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              item['latestMessage']?['content'] ?? 'Tap to view conversation',
              style: const TextStyle(color: Colors.white60),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: const Icon(Icons.chevron_right, color: Color(0xFF00F0FF)),
            onTap: () async {
              if (otherUserId.isEmpty) return;
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatScreen(
                    otherUserId: otherUserId,
                    otherUserName: otherName.isNotEmpty ? otherName : 'Candidate',
                    otherUserRole: 'Job Seeker',
                  ),
                ),
              );
              _fetchData();
            },
          ),
        );
      },
    );
  }

  Widget _buildNotificationsTab() {
    if (_notifications.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'No employer notifications at this time. When candidates apply, respond to interview invitations, or send messages, alerts will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white60, fontSize: 14),
          ),
        ),
      );
    }

    return ListView.builder(
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
              color: isRead ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isRead ? Colors.white12 : const Color(0xFF00F0FF).withOpacity(0.5),
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
                          ' Employer Alert',
                          style: TextStyle(
                            color: isRead ? Colors.white54 : const Color(0xFF00F0FF),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isRead ? Colors.white10 : const Color(0xFF00F0FF).withOpacity(0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            isRead ? 'Read' : 'New',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isRead ? Colors.white54 : const Color(0xFF00F0FF),
                            ),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18, color: Colors.white54),
                      onPressed: () => _dismissAlert(notif['id']),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  notif['message'] ?? 'You have a new recruitment notification.',
                  style: TextStyle(
                    color: Colors.white,
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
                          setState(() {
                            _selectedJobId = notif['jobId'];
                            _currentIndex = 1; // Switch to Applications tab
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00F0FF),
                          foregroundColor: Colors.black,
                        ),
                        child: const Text('Review Applicants', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    OutlinedButton(
                      onPressed: () {
                        _markAlertAsRead(notif);
                        setState(() => _currentIndex = 3); // Switch to Messages tab
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24),
                      ),
                      child: const Text('Open Messages'),
                    ),
                    if (!isRead)
                      TextButton(
                        onPressed: () => _markAlertAsRead(notif),
                        child: const Text('Mark Read', style: TextStyle(color: Color(0xFF00F0FF))),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
