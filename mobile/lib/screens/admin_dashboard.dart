import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/glass_card.dart';
import '../config/api_config.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  List<dynamic> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      final token = await ApiConfig.getToken();
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/admin/users'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _users = jsonDecode(res.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    final token = await ApiConfig.getToken();
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}/admin/users/$id/status'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token'
      },
      body: jsonEncode({'status': newStatus}),
    );
    _fetchUsers();
  }

  Future<void> _deleteUser(String id) async {
    final token = await ApiConfig.getToken();
    await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/admin/users/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    _fetchUsers();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin Panel')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Admin Control Panel'),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _users.length,
        itemBuilder: (context, index) {
          final user = _users[index];
          final isActive = user['accountStatus'] == 'ACTIVE';

          return GlassCard(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      user['email'],
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isActive ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        user['accountStatus'],
                        style: TextStyle(
                          color: isActive ? Colors.green : Colors.redAccent,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Role: ${user['role']}  •  Tier: ${user['subscriptionTier']}', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 16),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => _updateStatus(user['id'], isActive ? 'SUSPENDED' : 'ACTIVE'),
                      style: TextButton.styleFrom(foregroundColor: isActive ? Colors.orange : Colors.green),
                      child: Text(isActive ? 'Suspend' : 'Activate'),
                    ),
                    TextButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (c) => AlertDialog(
                            title: const Text('Confirm Delete'),
                            content: const Text('Are you sure you want to delete this user permanently?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(c);
                                  _deleteUser(user['id']);
                                },
                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                      },
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
