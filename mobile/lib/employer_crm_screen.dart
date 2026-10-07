import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';

class EmployerCrmScreen extends StatefulWidget {
  final String jobId;
  final String jobTitle;

  const EmployerCrmScreen({super.key, required this.jobId, required this.jobTitle});

  @override
  State<EmployerCrmScreen> createState() => _EmployerCrmScreenState();
}

class _EmployerCrmScreenState extends State<EmployerCrmScreen> {
  bool _isLoading = true;
  List<dynamic> _applications = [];
  
  String? _schedulingAppId;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  final _linkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchApplicants();
  }

  Future<void> _fetchApplicants() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/applications/job/${widget.jobId}'),
        headers: {'Authorization': 'Bearer $token'},
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

  Future<void> _updateStatus(String appId, String status) async {
    try {
      final token = await ApiConfig.getToken();
      final res = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/applications/$appId/status'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'status': status}),
      );
      if (res.statusCode == 200) {
        _fetchApplicants(); // refresh
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> _scheduleInterview(String appId) async {
    if (_selectedDate == null || _selectedTime == null) return;

    final dateTime = DateTime(
      _selectedDate!.year, _selectedDate!.month, _selectedDate!.day,
      _selectedTime!.hour, _selectedTime!.minute,
    );

    try {
      final token = await ApiConfig.getToken();
      
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/applications/$appId/schedule-interview'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'interviewDate': dateTime.toIso8601String(),
          'interviewLink': _linkController.text.isNotEmpty ? _linkController.text : null,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _schedulingAppId = null;
        });
        _fetchApplicants(); // refresh
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Interview scheduled!')));
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  void _showScheduleDialog(String appId) {
    setState(() {
      _schedulingAppId = appId;
      _selectedDate = DateTime.now();
      _selectedTime = TimeOfDay.now();
      _linkController.clear();
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF120B1C),
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Schedule Interview', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ListTile(
                    title: Text(_selectedDate == null ? 'Select Date' : '${_selectedDate!.toLocal()}'.split(' ')[0], style: const TextStyle(color: Colors.white)),
                    trailing: const Icon(Icons.calendar_today, color: Color(0xFF00F0FF)),
                    onTap: () async {
                      final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                      if (d != null) setModalState(() => _selectedDate = d);
                    },
                  ),
                  ListTile(
                    title: Text(_selectedTime == null ? 'Select Time' : _selectedTime!.format(context), style: const TextStyle(color: Colors.white)),
                    trailing: const Icon(Icons.access_time, color: Color(0xFF00F0FF)),
                    onTap: () async {
                      final t = await showTimePicker(context: context, initialTime: TimeOfDay.now());
                      if (t != null) setModalState(() => _selectedTime = t);
                    },
                  ),
                  TextField(
                    controller: _linkController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Meeting Link (Optional)',
                      labelStyle: TextStyle(color: Colors.white70),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
                      focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF00F0FF))),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _scheduleInterview(appId);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
                    child: const Text('Send Invite', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final columns = ['APPLIED', 'SHORTLISTED', 'INVITED', 'HIRED', 'REJECTED'];

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: Text('CRM: ${widget.jobTitle}'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : DefaultTabController(
              length: columns.length,
              child: Column(
                children: [
                  TabBar(
                    isScrollable: true,
                    indicatorColor: const Color(0xFF00F0FF),
                    labelColor: const Color(0xFF00F0FF),
                    unselectedLabelColor: Colors.white54,
                    tabs: columns.map((col) {
                      final count = _applications.where((a) => a['status'] == col || (col == 'APPLIED' && a['status'] == 'VIEWED')).length;
                      return Tab(text: '$col ($count)');
                    }).toList(),
                  ),
                  Expanded(
                    child: TabBarView(
                      children: columns.map((col) {
                        final apps = _applications.where((a) => a['status'] == col || (col == 'APPLIED' && a['status'] == 'VIEWED')).toList();
                        return ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: apps.length,
                          itemBuilder: (context, index) {
                            final app = apps[index];
                            final seeker = app['jobSeekerProfile'] ?? {};
                            return Card(
                              color: Colors.white.withOpacity(0.05),
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${seeker['firstName']} ${seeker['lastName']}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                                    Text(seeker['headline'] ?? 'Job Seeker', style: const TextStyle(color: Colors.white70)),
                                    
                                    if (col == 'INVITED' && app['interviewDate'] != null) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('📅 Interview: ${DateTime.parse(app['interviewDate']).toLocal()}', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 12)),
                                            if (app['interviewLink'] != null)
                                              Text('🔗 ${app['interviewLink']}', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 12)),
                                          ],
                                        ),
                                      ),
                                    ],

                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: DropdownButtonFormField<String>(
                                            value: app['status'],
                                            dropdownColor: const Color(0xFF1E1E1E),
                                            style: const TextStyle(color: Colors.white, fontSize: 12),
                                            items: columns.map((c) => DropdownMenuItem(value: c, child: Text('Move to $c'))).toList(),
                                            onChanged: (val) {
                                              if (val != null) _updateStatus(app['id'], val);
                                            },
                                            decoration: InputDecoration(
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                                              filled: true,
                                              fillColor: Colors.black26,
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                          ),
                                        ),
                                        if (col != 'INVITED' && col != 'HIRED' && col != 'REJECTED') ...[
                                          const SizedBox(width: 8),
                                          ElevatedButton(
                                            onPressed: () => _showScheduleDialog(app['id']),
                                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF), padding: const EdgeInsets.symmetric(horizontal: 12)),
                                            child: const Text('Schedule', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
