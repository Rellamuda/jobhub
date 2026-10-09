import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';

import 'profile_screen.dart';
import 'create_job_screen.dart';
import 'login_screen.dart';

class EmployerDashboard extends StatefulWidget {
  const EmployerDashboard({super.key});

  @override
  State<EmployerDashboard> createState() => _EmployerDashboardState();
}

class _EmployerDashboardState extends State<EmployerDashboard> {
  int _currentIndex = 0;
  List<dynamic> _jobs = [];
  List<dynamic> _inbox = [];
  bool _isLoading = true;
  String _companyName = '';
  String _profilePic = '';

  String? _selectedJobId;
  List<dynamic> _matches = [];
  bool _isMatching = false;
  final Set<String> _invitedUserIds = {};

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

      setState(() {
        if (jobsRes.statusCode == 200) {
          _jobs = jsonDecode(jobsRes.body);
          if (_jobs.isNotEmpty) _selectedJobId = _jobs[0]['id'];
        }
        if (inboxRes.statusCode == 200) _inbox = jsonDecode(inboxRes.body);
        if (profRes.statusCode == 200) {
          final prof = jsonDecode(profRes.body);
          _companyName = prof['companyName'] ?? 'Employer';
          _profilePic = prof['profilePicture'] ?? '';
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
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
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
            _currentIndex == 0 ? 'My Jobs' : _currentIndex == 1 ? 'Applications' : _currentIndex == 2 ? 'Matches' : _currentIndex == 3 ? 'Messages' : 'Profile',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      floatingActionButton: _currentIndex == 0 ? FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateJobScreen()));
          _fetchData();
        },
        backgroundColor: const Color(0xFF00F0FF),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text('Post Job (AI)', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ) : null,
      body: _isLoading ? const Center(child: CircularProgressIndicator()) : IndexedStack(
        index: _currentIndex,
        children: [
          _buildJobsTab(),
          _buildApplicationsTab(),
          _buildMatchesTab(),
          _buildInbox(),
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
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Jobs'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Matches'),
          BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
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
    return ListView.builder(
      padding: const EdgeInsets.all(16),
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
              ],
            ),
          ),
        );
      },
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
                return Card(
                  color: Colors.white.withOpacity(0.05),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.white.withOpacity(0.1),
                      backgroundImage: (seeker != null && seeker['profilePicture'] != null && seeker['profilePicture'].isNotEmpty) ? NetworkImage(seeker['profilePicture']) : null,
                      child: (seeker == null || seeker['profilePicture'] == null || seeker['profilePicture'].isEmpty) ? const Icon(Icons.person, color: Colors.white) : null,
                    ),
                    title: Text('${seeker?['firstName']} ${seeker?['lastName']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text('Status: ${app['status']}', style: const TextStyle(color: Colors.white70)),
                    trailing: IconButton(icon: const Icon(Icons.message, color: Color(0xFF00F0FF)), onPressed: () => _inviteCandidate(seeker['userId'])),
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
    if (_inbox.isEmpty) return const Center(child: Text('No messages', style: TextStyle(color: Colors.white)));
    return ListView.builder(
      itemCount: _inbox.length,
      itemBuilder: (context, index) {
        final item = _inbox[index];
        final otherName = item['otherUser']?['jobSeekerProfile']?['firstName'] ?? 'Candidate';
        return ListTile(
          leading: const CircleAvatar(backgroundColor: Colors.white12, child: Icon(Icons.person, color: Colors.white)),
          title: Text(otherName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          subtitle: Text(item['latestMessage']?['content'] ?? '', style: const TextStyle(color: Colors.white54), maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: const Icon(Icons.chevron_right, color: Colors.white54),
        );
      },
    );
  }
}
