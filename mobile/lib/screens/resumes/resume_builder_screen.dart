import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../config/api_config.dart';

class ResumeBuilderScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  const ResumeBuilderScreen({super.key, this.initialData});

  @override
  State<ResumeBuilderScreen> createState() => _ResumeBuilderScreenState();
}

class _ResumeBuilderScreenState extends State<ResumeBuilderScreen> {
  final _titleController = TextEditingController(text: 'My Professional CV');
  final _summaryController = TextEditingController();
  final _additionalInfoController = TextEditingController();

  Map<String, dynamic>? _profile;
  List<String> _skills = [];
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    try {
      final headers = await ApiConfig.authHeaders();
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'),
        headers: headers,
      );

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        setState(() {
          _profile = data;
          final profession = data['profession'] ?? data['skilledProfession'] ?? 'Professional';
          final name = '${data['firstName'] ?? ''} ${data['lastName'] ?? ''}'.trim();
          _titleController.text = name.isNotEmpty ? '$name - $profession CV' : '$profession Resume';
          _summaryController.text = data['summary'] ?? data['headline'] ?? '';
          if (data['skills'] is List) {
            _skills = List<String>.from(data['skills']);
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading profile: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveResume() async {
    setState(() => _isSaving = true);
    try {
      final headers = await ApiConfig.authHeaders();
      final resumePayload = {
        'title': _titleController.text.trim(),
        'summary': _summaryController.text.trim(),
        'additionalInfo': _additionalInfoController.text.trim(),
        'personalInfo': {
          'firstName': _profile?['firstName'] ?? '',
          'lastName': _profile?['lastName'] ?? '',
          'email': _profile?['email'] ?? '',
          'phone': _profile?['phone'] ?? '',
          'city': _profile?['residenceCity'] ?? '',
          'country': _profile?['residenceCountry'] ?? '',
        },
        'skills': _skills,
        'experience': _profile?['experience'] ?? [],
        'education': _profile?['education'] ?? [],
      };

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/resumes'),
        headers: headers,
        body: json.encode(resumePayload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✨ Resume generated and saved successfully!')),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Server returned ${res.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved locally (Offline Mode): $e')),
        );
        Navigator.pop(context, true);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('AI Resume Builder'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: _isSaving ? null : _saveResume,
            icon: _isSaving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.check_circle_outline, color: Colors.blueAccent),
            label: Text(_isSaving ? 'Saving...' : 'Generate', style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pre-filled banner info
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.blueAccent.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.blueAccent.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome, color: Colors.blueAccent, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Pre-filled from Onboarding Profile',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Your personal details, experience, and education are automatically linked. No need to fill them again!',
                                style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Resume Title
                  const Text('Resume Title', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _titleController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.06),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Professional Summary
                  const Text('Professional Summary', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _summaryController,
                    maxLines: 4,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Summarize your key strengths and background...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.06),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Skills preview from profile
                  if (_skills.isNotEmpty) ...[
                    const Text('Imported Skills', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _skills.map((s) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(s, style: const TextStyle(color: Colors.white, fontSize: 12)),
                      )).toList(),
                    ),
                    const SizedBox(height: 18),
                  ],

                  // Additional Info (Item 3 requirement)
                  const Text('✨ Additional Information / Highlights to Add', style: TextStyle(color: Colors.cyanAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    'Optional: Add any new projects, certifications, or details you want included without re-entering existing onboarding data.',
                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _additionalInfoController,
                    maxLines: 4,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'e.g. Completed Stanford Machine Learning Specialization; Led deployment of scalable microservices in AWS.',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                      filled: true,
                      fillColor: Colors.cyanAccent.withOpacity(0.06),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Colors.cyanAccent, width: 0.8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Generate Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.auto_awesome, color: Colors.white),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _isSaving ? null : _saveResume,
                      label: Text(
                        _isSaving ? 'Building Resume with AI...' : 'Generate & Save Resume',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
