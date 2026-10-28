import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';
import 'chat_screen.dart';

class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  List<dynamic> _applications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    try {
      final token = await ApiConfig.getToken();
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/applications/my-applications'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        setState(() {
          _applications = jsonDecode(res.body);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _respondToInvitation(String appId, String status) async {
    try {
      final headers = await ApiConfig.authHeaders();
      final res = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/applications/$appId/seeker-status'),
        headers: headers,
        body: jsonEncode({'status': status}),
      );
      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: status == 'ACCEPTED_OFFER' ? const Color(0xFF10B981) : Colors.orange,
              content: Text(
                status == 'ACCEPTED_OFFER'
                    ? '✅ Invitation accepted! The employer has been notified in their Messages & Alerts.'
                    : 'Invitation declined. The employer has been notified.',
              ),
            ),
          );
        }
        _fetchApplications();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error responding: $e')),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPLIED': return Colors.grey;
      case 'VIEWED': return const Color(0xFFF59E0B); // Amber
      case 'SHORTLISTED': return const Color(0xFF3B82F6); // Blue
      case 'HIRED':
      case 'ACCEPTED_OFFER': return const Color(0xFF10B981); // Green
      case 'REJECTED':
      case 'DECLINED_OFFER': return const Color(0xFFEF4444); // Red
      case 'INVITED': return const Color(0xFF8B5CF6); // Purple
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('My Applications'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchApplications();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Track the status of your recent job applications and respond to interview invitations.',
                style: TextStyle(
                  fontSize: 15,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
              ),
              const SizedBox(height: 20),
              
              if (_isLoading)
                const Expanded(child: Center(child: CircularProgressIndicator()))
              else if (_applications.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inbox, size: 64, color: isDark ? Colors.white24 : Colors.black26),
                        const SizedBox(height: 16),
                        Text(
                          'No applications yet',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Apply to jobs or use Autonomous Agent to auto-apply.',
                          style: TextStyle(color: isDark ? Colors.white38 : Colors.black45),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _fetchApplications,
                    child: ListView.separated(
                      itemCount: _applications.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final app = _applications[index];
                        final job = app['job'] ?? {};
                        final jobTitle = job['title'] ?? 'Untitled Position';
                        final company = job['employer']?['companyName'] ?? 'Company';
                        final employerUserId = job['employer']?['userId']?.toString() ?? '';
                        final status = app['status'] ?? 'APPLIED';
                        final statusColor = _getStatusColor(status);
                        final date = (app['createdAt'] ?? '').toString().split('T').first;
                        final matchScore = app['aiMatchScore'];

                        return Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.04) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isDark ? Colors.black.withOpacity(0.2) : Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      jobTitle,
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : Colors.black87,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: statusColor.withOpacity(0.4)),
                                    ),
                                    child: Text(
                                      status,
                                      style: TextStyle(
                                        color: statusColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.business, size: 15, color: isDark ? Colors.white54 : Colors.black45),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      company,
                                      style: TextStyle(
                                        color: isDark ? Colors.white70 : Colors.black87,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  if (matchScore != null) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF6366F1).withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        'Match: $matchScore%',
                                        style: const TextStyle(
                                          color: Color(0xFF6366F1),
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today, size: 14, color: isDark ? Colors.white38 : Colors.black38),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Applied: $date',
                                    style: TextStyle(
                                      color: isDark ? Colors.white54 : Colors.black54,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  if (status == 'INVITED') ...[
                                    ElevatedButton.icon(
                                      onPressed: () => _respondToInvitation(app['id'], 'ACCEPTED_OFFER'),
                                      icon: const Icon(Icons.check_circle, size: 16, color: Colors.black),
                                      label: const Text('Accept Invitation', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF00F0FF),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: () => _respondToInvitation(app['id'], 'DECLINED_OFFER'),
                                      icon: const Icon(Icons.cancel_outlined, size: 16, color: Colors.redAccent),
                                      label: const Text('Decline', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: Colors.redAccent),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    ),
                                  ],
                                  if (employerUserId.isNotEmpty)
                                    OutlinedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => ChatScreen(
                                              otherUserId: employerUserId,
                                              otherUserName: company,
                                              otherUserRole: 'Employer / Recruiter',
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.chat_bubble_outline, size: 15, color: Color(0xFF00F0FF)),
                                      label: const Text('Message Employer', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 12)),
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: Color(0xFF00F0FF)),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
