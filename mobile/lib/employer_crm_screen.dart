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

  void _showReviewApplicantSheet(dynamic app) {
    final seeker = app['jobSeekerProfile'] ?? {};
    final resume = app['resume'] ?? {};
    final coverLetter = app['coverLetter'];
    final skills = (resume['skills'] is List) ? List<dynamic>.from(resume['skills']) : (seeker['skills'] is List ? List<dynamic>.from(seeker['skills']) : []);
    final experience = (resume['experience'] is List) ? List<dynamic>.from(resume['experience']) : (seeker['experience'] is List ? List<dynamic>.from(seeker['experience']) : []);
    final education = (resume['education'] is List) ? List<dynamic>.from(resume['education']) : (seeker['education'] is List ? List<dynamic>.from(seeker['education']) : []);
    final summary = resume['summary'] ?? seeker['summary'] ?? seeker['bio'] ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF120B1C),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text('${seeker['firstName'] ?? ''} ${seeker['lastName'] ?? ''}', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      ),
                      if (app['aiMatchScore'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.2), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF00F0FF))),
                          child: Text('⭐ ${app['aiMatchScore']}% Match', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(seeker['headline'] ?? seeker['profession'] ?? 'Candidate', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 14, fontWeight: FontWeight.w600)),
                  Text('${seeker['residenceCity'] ?? 'Remote'}, ${seeker['residenceCountry'] ?? 'Global'}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                  
                  const SizedBox(height: 20),
                  // Decision Buttons
                  const Text('Final Decision Actions:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _updateStatus(app['id'], 'SHORTLISTED');
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                        child: const Text('⭐ Shortlist', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showScheduleDialog(app['id']);
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                        child: const Text('📅 Schedule Interview', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _updateStatus(app['id'], 'HIRED');
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                        child: const Text('🎉 Hire', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _updateStatus(app['id'], 'REJECTED');
                        },
                        style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                        child: const Text('Reject', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                      ),
                    ],
                  ),

                  if (coverLetter != null && coverLetter.toString().isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text('Submitted Cover Letter', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.04), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white10)),
                      child: Text(coverLetter.toString(), style: const TextStyle(color: Colors.white70, height: 1.5, fontSize: 13)),
                    ),
                  ],

                  const SizedBox(height: 24),
                  const Text('Resume & Qualifications', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const Divider(color: Colors.white12, height: 20),

                  if (summary.toString().isNotEmpty) ...[
                    const Text('Professional Summary', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(summary.toString(), style: const TextStyle(color: Colors.white70, height: 1.5, fontSize: 13)),
                    const SizedBox(height: 16),
                  ],

                  if (skills.isNotEmpty) ...[
                    const Text('Skills', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: skills.map((s) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.2), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.5))),
                        child: Text(s.toString(), style: const TextStyle(color: Colors.white, fontSize: 11)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  if (experience.isNotEmpty) ...[
                    const Text('Experience', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...experience.map((exp) => Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(8), border: const Border(left: BorderSide(color: Color(0xFF00F0FF), width: 3))),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(exp['role'] ?? exp['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('${exp['company'] ?? ''} • ${exp['dates'] ?? ''}', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 11)),
                          if (exp['responsibilities'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(exp['responsibilities'].toString(), style: const TextStyle(color: Colors.white60, fontSize: 11, height: 1.4)),
                            ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 16),
                  ],

                  if (education.isNotEmpty) ...[
                    const Text('Education', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...education.map((ed) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(8)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(ed['school'] ?? ed['institution'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('${ed['course'] ?? ed['degree'] ?? ''} (${ed['dates'] ?? ed['yearGraduated'] ?? ''})', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                        ],
                      ),
                    )),
                  ],
                ],
              ),
            );
          },
        );
      },
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

                                    if (app['aiMatchScore'] != null) ...[
                                      const SizedBox(height: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                                        child: Text('⭐ ${app['aiMatchScore']}% Match', style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ],

                                    const SizedBox(height: 10),
                                    SizedBox(
                                      width: double.infinity,
                                      child: OutlinedButton.icon(
                                        onPressed: () => _showReviewApplicantSheet(app),
                                        icon: const Icon(Icons.description, size: 16, color: Color(0xFF00F0FF)),
                                        label: const Text('View & Review Resume', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 12, fontWeight: FontWeight.bold)),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFF00F0FF)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(vertical: 6),
                                        ),
                                      ),
                                    ),
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
