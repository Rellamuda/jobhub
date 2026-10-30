import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../widgets/glass_card.dart';
import '../config/api_config.dart';
import '../login_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  List<dynamic> _users = [];
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _aiStats;
  bool _isLoading = true;
  String _searchQuery = '';
  String _roleFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchAllData();
  }

  Future<void> _fetchAllData() async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiConfig.getToken();
      final headers = {'Authorization': 'Bearer $token'};

      final results = await Future.wait([
        http.get(Uri.parse('${ApiConfig.baseUrl}/admin/users'), headers: headers),
        http.get(Uri.parse('${ApiConfig.baseUrl}/admin/stats'), headers: headers),
        http.get(Uri.parse('${ApiConfig.baseUrl}/ai/admin/monitoring'), headers: headers).catchError((_) => http.Response('{}', 404)),
      ]);

      if (mounted) {
        setState(() {
          if (results[0].statusCode == 200) {
            _users = jsonDecode(results[0].body);
          }
          if (results[1].statusCode == 200) {
            _stats = jsonDecode(results[1].body);
          }
          if (results[2].statusCode == 200) {
            _aiStats = jsonDecode(results[2].body);
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    final token = await ApiConfig.getToken();
    final res = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}/admin/users/$id/status'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token'
      },
      body: jsonEncode({'status': newStatus}),
    );
    if (res.statusCode == 200 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('User status updated to $newStatus'), backgroundColor: Colors.green),
      );
      _fetchAllData();
    }
  }

  Future<void> _updateUser(String id, String role, String tier, String status, bool isFlagged) async {
    final token = await ApiConfig.getToken();
    final res = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}/admin/users/$id'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token'
      },
      body: jsonEncode({
        'role': role,
        'subscriptionTier': tier,
        'accountStatus': status,
        'isFlagged': isFlagged,
      }),
    );
    if (res.statusCode == 200 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User updated successfully'), backgroundColor: Colors.green),
      );
      _fetchAllData();
    }
  }

  Future<void> _deleteUser(String id) async {
    final token = await ApiConfig.getToken();
    final res = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/admin/users/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User deleted permanently'), backgroundColor: Colors.redAccent),
      );
      _fetchAllData();
    }
  }

  String? _resolvePicUrl(dynamic path) {
    if (path == null) return null;
    final s = path.toString().trim();
    if (s.isEmpty) return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    final clean = s.startsWith('/') ? s : '/$s';
    return '${ApiConfig.webUrl}$clean';
  }

  void _showEditModal(Map<String, dynamic> user) {
    String selectedRole = user['role'] ?? 'JOB_SEEKER';
    String selectedTier = user['subscriptionTier'] ?? 'FREE';
    String selectedStatus = user['accountStatus'] ?? 'ACTIVE';
    bool isFlagged = user['isFlagged'] == true;
    final profile = user['jobSeekerProfile'];
    final employer = user['employer'];
    final picUrl = _resolvePicUrl(profile?['profilePicture'] ?? employer?['profilePicture']);
    final displayName = (profile != null && profile['firstName'] != null)
        ? '${profile['firstName']} ${profile['lastName'] ?? ''}'.trim()
        : (employer != null && employer['companyName'] != null ? employer['companyName'] : '');
    final initial = (displayName.isNotEmpty ? displayName : (user['email'] ?? '?')).toString()[0].toUpperCase();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF16122E),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF00F0FF), width: 1),
              ),
              title: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: const Color(0xFF6366F1),
                    backgroundImage: picUrl != null ? NetworkImage(picUrl) : null,
                    child: picUrl == null
                        ? Text(
                            initial,
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (displayName.isNotEmpty)
                          Text(
                            displayName,
                            style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 15, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        Text(
                          user['email'] ?? '',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.normal),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Role', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: selectedRole,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      items: const [
                        DropdownMenuItem(value: 'JOB_SEEKER', child: Text('JOB_SEEKER')),
                        DropdownMenuItem(value: 'EMPLOYER', child: Text('EMPLOYER')),
                        DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
                      ],
                      onChanged: (v) => setModalState(() => selectedRole = v!),
                    ),
                    const SizedBox(height: 12),
                    const Text('Subscription Tier', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: selectedTier,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      items: const [
                        DropdownMenuItem(value: 'FREE', child: Text('FREE')),
                        DropdownMenuItem(value: 'SILVER', child: Text('SILVER')),
                        DropdownMenuItem(value: 'PREMIUM', child: Text('PREMIUM (Diamond)')),
                      ],
                      onChanged: (v) => setModalState(() => selectedTier = v!),
                    ),
                    const SizedBox(height: 12),
                    const Text('Account Status', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: selectedStatus,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      items: const [
                        DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')),
                        DropdownMenuItem(value: 'SUSPENDED', child: Text('SUSPENDED')),
                      ],
                      onChanged: (v) => setModalState(() => selectedStatus = v!),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Checkbox(
                          value: isFlagged,
                          activeColor: Colors.orangeAccent,
                          onChanged: (v) => setModalState(() => isFlagged = v ?? false),
                        ),
                        const Expanded(
                          child: Text('Flagged for Fraud Review', style: TextStyle(color: Colors.white, fontSize: 13)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _updateUser(user['id'], selectedRole, selectedTier, selectedStatus, isFlagged);
                  },
                  child: const Text('Save', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredUsers = _users.where((u) {
      final email = (u['email'] ?? '').toString().toLowerCase();
      final role = (u['role'] ?? '').toString();
      final matchesSearch = email.contains(_searchQuery.toLowerCase().trim());
      final matchesRole = _roleFilter == 'ALL' || role == _roleFilter;
      return matchesSearch && matchesRole;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('🛡️ Admin Control Center', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        elevation: 0,
        backgroundColor: const Color(0xFF120B1C),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF00F0FF)),
            tooltip: 'Refresh Data',
            onPressed: _fetchAllData,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            tooltip: 'Sign Out',
            onPressed: () async {
              await ApiConfig.clearToken();
              if (!mounted) return;
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF)))
          : Column(
              children: [
                // Top Stats Strip
                if (_stats != null)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Row(
                      children: [
                        _buildStatChip('Total Users', '${_stats!['totalUsers'] ?? 0}', const Color(0xFF00F0FF)),
                        const SizedBox(width: 8),
                        _buildStatChip('Job Seekers', '${_stats!['jobSeekers'] ?? 0}', const Color(0xFF6366F1)),
                        const SizedBox(width: 8),
                        _buildStatChip('Employers', '${_stats!['employers'] ?? 0}', const Color(0xFF10B981)),
                        const SizedBox(width: 8),
                        _buildStatChip('Paid Users', '${_stats!['paidUsers'] ?? 0}', Colors.amber),
                        const SizedBox(width: 8),
                        _buildStatChip('Suspended', '${_stats!['suspendedUsers'] ?? 0}', Colors.redAccent),
                        if (_aiStats != null) ...[
                          const SizedBox(width: 8),
                          _buildStatChip('AI Calls', '${_aiStats!['totalRequests'] ?? 0}', Colors.purpleAccent),
                        ],
                      ],
                    ),
                  ),

                // Search & Role Filter
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search email...',
                            hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                            prefixIcon: const Icon(Icons.search, color: Color(0xFF00F0FF), size: 18),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          ),
                          onChanged: (v) => setState(() => _searchQuery = v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: DropdownButton<String>(
                          value: _roleFilter,
                          underline: const SizedBox.shrink(),
                          dropdownColor: const Color(0xFF16122E),
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          items: const [
                            DropdownMenuItem(value: 'ALL', child: Text('All Roles')),
                            DropdownMenuItem(value: 'JOB_SEEKER', child: Text('Seekers')),
                            DropdownMenuItem(value: 'EMPLOYER', child: Text('Employers')),
                            DropdownMenuItem(value: 'ADMIN', child: Text('Admins')),
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _roleFilter = v);
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Users List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredUsers.length,
                    itemBuilder: (context, index) {
                      final user = filteredUsers[index];
                      final isActive = user['accountStatus'] == 'ACTIVE';
                      final profile = user['jobSeekerProfile'];
                      final employer = user['employer'];
                      String displayName = '';
                      if (profile != null && profile['firstName'] != null) {
                        displayName = '${profile['firstName']} ${profile['lastName'] ?? ''}'.trim();
                      } else if (employer != null && employer['companyName'] != null) {
                        displayName = employer['companyName'];
                      }

                      final picUrl = _resolvePicUrl(profile?['profilePicture'] ?? employer?['profilePicture']);
                      final initial = (displayName.isNotEmpty ? displayName : (user['email'] ?? '?')).toString()[0].toUpperCase();

                      return GlassCard(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: user['role'] == 'JOB_SEEKER'
                                      ? const Color(0xFF4338CA)
                                      : (user['role'] == 'EMPLOYER' ? const Color(0xFF0891B2) : const Color(0xFFB45309)),
                                  backgroundImage: picUrl != null ? NetworkImage(picUrl) : null,
                                  child: picUrl == null
                                      ? Text(
                                          initial,
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (displayName.isNotEmpty)
                                        Text(
                                          displayName,
                                          style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                      Text(
                                        user['email'] ?? '',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isActive ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    user['accountStatus'] ?? 'ACTIVE',
                                    style: TextStyle(
                                      color: isActive ? Colors.greenAccent : Colors.redAccent,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Role: ${user['role']}  •  Tier: ${user['subscriptionTier']}',
                              style: const TextStyle(color: Colors.white60, fontSize: 12),
                            ),
                            const Divider(color: Colors.white12, height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _showEditModal(user),
                                  icon: const Icon(Icons.edit, size: 15, color: Color(0xFF00F0FF)),
                                  label: const Text('Edit', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 12)),
                                ),
                                TextButton(
                                  onPressed: () => _updateStatus(user['id'], isActive ? 'SUSPENDED' : 'ACTIVE'),
                                  style: TextButton.styleFrom(foregroundColor: isActive ? Colors.orangeAccent : Colors.greenAccent),
                                  child: Text(isActive ? 'Suspend' : 'Activate', style: const TextStyle(fontSize: 12)),
                                ),
                                TextButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (c) => AlertDialog(
                                        backgroundColor: const Color(0xFF16122E),
                                        title: const Text('Confirm Delete', style: TextStyle(color: Colors.white)),
                                        content: Text('Permanently delete ${user['email']}?', style: const TextStyle(color: Colors.white70)),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(c);
                                              _deleteUser(user['id']);
                                            },
                                            child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                                  child: const Text('Delete', style: TextStyle(fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
