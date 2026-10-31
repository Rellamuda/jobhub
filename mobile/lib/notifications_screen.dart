import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) {
        setState(() => _isLoading = false);
        return;
      }

      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/notifications'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _notifications = data is List ? data : [];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
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
        _fetchNotifications();
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text(
          'Notification Alerts',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _fetchNotifications,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: isDark ? Colors.white30 : Colors.black26),
                      const SizedBox(height: 16),
                      Text(
                        'No notification alerts at this time.',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'New job matches, application updates, and alerts will appear here.',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.white38 : Colors.black38,
                        ),
                      ),
                    ],
                  ),
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
                              notif['message'] ?? 'A new alert matching your profile is available.',
                              style: TextStyle(
                                color: isDark ? Colors.white : Colors.black87,
                                fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                              ),
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
