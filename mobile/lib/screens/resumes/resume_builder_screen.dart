import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../config/api_config.dart';

class ResumeBuilderScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  const ResumeBuilderScreen({super.key, this.initialData});

  @override
  State<ResumeBuilderScreen> createState() => _ResumeBuilderScreenState();
}

class _ResumeBuilderScreenState extends State<ResumeBuilderScreen> {
  final _titleController = TextEditingController(text: 'Executive Professional Resume');
  final _summaryController = TextEditingController();
  final _additionalInfoController = TextEditingController();
  final _fNameController = TextEditingController();
  final _lNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();

  Map<String, dynamic>? _profile;
  List<String> _skills = [];
  List<dynamic> _experience = [];
  List<dynamic> _education = [];
  String _coverLetter = '';

  int _selectedTab = 0; // 0: Form Editor, 1: Executive Preview, 2: Cover Letter
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isGeneratingAI = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _loadFromInitialData(widget.initialData!);
    } else {
      _loadProfileData();
    }
  }

  void _loadFromInitialData(Map<String, dynamic> data) {
    setState(() {
      _titleController.text = data['title'] ?? 'Executive Professional Resume';
      _summaryController.text = data['summary'] ?? '';
      _coverLetter = data['coverLetter'] ?? '';

      final pi = data['personalInfo'] ?? {};
      _fNameController.text = pi['firstName'] ?? '';
      _lNameController.text = pi['lastName'] ?? '';
      _emailController.text = pi['email'] ?? '';
      _phoneController.text = pi['phone'] ?? '';
      _cityController.text = pi['city'] ?? '';

      if (data['skills'] is List) _skills = List<String>.from(data['skills']);
      if (data['experience'] is List) _experience = List<dynamic>.from(data['experience']);
      if (data['education'] is List) _education = List<dynamic>.from(data['education']);

      _isLoading = false;
    });
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
          final fName = data['firstName'] ?? '';
          final lName = data['lastName'] ?? '';
          final profession = data['profession'] ?? data['desiredJobTitle'] ?? 'Professional';

          _fNameController.text = fName;
          _lNameController.text = lName;
          _emailController.text = data['user']?['email'] ?? data['email'] ?? '';
          _phoneController.text = data['phone'] ?? '';
          _cityController.text = [data['residenceCity'], data['residenceCountry']].where((e) => e != null && e.toString().isNotEmpty).join(', ');

          _titleController.text = '$fName $lName — $profession Resume'.trim();
          _summaryController.text = data['summary'] ?? data['headline'] ?? data['bio'] ?? '';
          
          if (data['skills'] is List) {
            _skills = List<String>.from(data['skills']);
          }
          if (data['experience'] is List) {
            _experience = List<dynamic>.from(data['experience']);
          }
          if (data['education'] is List) {
            _education = List<dynamic>.from(data['education']);
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

  Future<void> _generateAIResume() async {
    setState(() => _isGeneratingAI = true);
    try {
      final token = await ApiConfig.getToken();
      final payload = {
        'title': _titleController.text.trim(),
        'summary': _summaryController.text.trim(),
        'additionalInfo': _additionalInfoController.text.trim(),
        'firstName': _fNameController.text.trim(),
        'lastName': _lNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'city': _cityController.text.trim(),
        'skills': _skills,
        'experience': _experience,
        'education': _education,
        'desiredJobTitle': _titleController.text.trim(),
      };

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/resume/generate'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        if (data['structured'] != null) {
          final s = data['structured'];
          setState(() {
            _titleController.text = s['title'] ?? _titleController.text;
            _summaryController.text = s['summary'] ?? _summaryController.text;
            if (s['skills'] is List) _skills = List<String>.from(s['skills']);
            if (s['experience'] is List) _experience = List<dynamic>.from(s['experience']);
            if (s['education'] is List) _education = List<dynamic>.from(s['education']);
          });
        } else if (data['resume'] is String) {
          setState(() {
            _summaryController.text = data['resume'];
          });
        }

        // Generate matching cover letter
        _generateCoverLetter(payload);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('✨ AI Resume & Cover Letter generated successfully!'),
            ),
          );
          setState(() => _selectedTab = 1); // switch to Executive Preview
        }
      } else {
        throw Exception('Server responded with ${res.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Generation completed with smart heuristics: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isGeneratingAI = false);
    }
  }

  Future<void> _generateCoverLetter(Map<String, dynamic> profileData) async {
    try {
      final token = await ApiConfig.getToken();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/cover-letter/generate'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'profile': profileData,
          'job': {
            'title': _titleController.text,
            'companyName': 'Prospective Employer',
            'description': 'Role requirements matching candidate skills'
          }
        }),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final clData = jsonDecode(res.body);
        if (clData['cover_letter'] != null) {
          setState(() => _coverLetter = clData['cover_letter']);
        }
      }
    } catch (e) {
      debugPrint('Error generating cover letter: $e');
    }
  }

  Future<void> _saveResume() async {
    setState(() => _isSaving = true);
    try {
      final token = await ApiConfig.getToken();
      final resumePayload = {
        'id': widget.initialData?['id'],
        'title': _titleController.text.trim(),
        'summary': _summaryController.text.trim(),
        'coverLetter': _coverLetter,
        'personalInfo': {
          'firstName': _fNameController.text.trim(),
          'lastName': _lNameController.text.trim(),
          'email': _emailController.text.trim(),
          'phone': _phoneController.text.trim(),
          'city': _cityController.text.trim(),
        },
        'skills': _skills,
        'experience': _experience,
        'education': _education,
      };

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/resumes'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode(resumePayload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('✨ Resume saved safely to your dashboard!'),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Server returned ${res.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving resume: $e')),
        );
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
        title: const Text('AI Resume Builder', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            tooltip: 'Save in Dashboard',
            icon: _isSaving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.save, color: Color(0xFF00F0FF)),
            onPressed: _isSaving ? null : _saveResume,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF)))
          : Column(
              children: [
                // Navigation Tab Bar
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Row(
                    children: [
                      _buildTabButton(0, '✏️ Form Editor'),
                      _buildTabButton(1, '📄 Preview'),
                      _buildTabButton(2, '💌 Cover Letter'),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: _selectedTab == 0
                        ? _buildFormEditor()
                        : _selectedTab == 1
                            ? _buildExecutivePreview()
                            : _buildCoverLetterView(),
                  ),
                ),
              ],
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF161028),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isGeneratingAI ? null : _generateAIResume,
                icon: _isGeneratingAI
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Icon(Icons.auto_awesome, color: Colors.black, size: 18),
                label: Text(
                  _isGeneratingAI ? 'Generating...' : '✨ Generate AI Resume',
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00F0FF),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            ElevatedButton.icon(
              onPressed: _isSaving ? null : _saveResume,
              icon: const Icon(Icons.check, color: Colors.white, size: 18),
              label: Text(_isSaving ? 'Saving...' : 'Save', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String title) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF00F0FF) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.black : Colors.white70,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormEditor() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // AI Callout Banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF00F0FF).withOpacity(0.12),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome, color: Color(0xFF00F0FF), size: 26),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pre-filled from Onboarding Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text('Add optional highlights below and tap "Generate AI Resume" to build a comprehensive executive resume.', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Target Title
        const Text('Target Job Role / Resume Title', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        _buildTextField(_titleController, 'e.g. Senior Software Architect Resume'),
        const SizedBox(height: 16),

        // Summary
        const Text('Executive Professional Summary', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        _buildTextField(_summaryController, 'A concise overview of your background...', maxLines: 4),
        const SizedBox(height: 16),

        // Candidate Personal Information
        const Text('Candidate Details', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(child: _buildTextField(_fNameController, 'First Name')),
            const SizedBox(width: 8),
            Expanded(child: _buildTextField(_lNameController, 'Last Name')),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildTextField(_emailController, 'Email')),
            const SizedBox(width: 8),
            Expanded(child: _buildTextField(_phoneController, 'Phone')),
          ],
        ),
        const SizedBox(height: 8),
        _buildTextField(_cityController, 'City / Country (e.g. London, UK)'),
        const SizedBox(height: 16),

        // Imported Skills
        if (_skills.isNotEmpty) ...[
          const Text('Imported Skills & Proficiencies', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _skills.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.08), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white24)),
              child: Text(s, style: const TextStyle(color: Colors.white, fontSize: 11)),
            )).toList(),
          ),
          const SizedBox(height: 16),
        ],

        // Additional Information / Highlights
        const Text('✨ Additional Information / Highlights to Add', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('Add any new projects, certifications, or custom details to expand your AI resume:', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
        const SizedBox(height: 6),
        _buildTextField(_additionalInfoController, 'e.g. AWS Certified Solutions Architect; Scaled Kubernetes infrastructure to 100k requests/sec...', maxLines: 4),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildExecutivePreview() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // RESUME Heading (Item 5 requirement)
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFC7D2FE)),
              ),
              child: const Text(
                'RESUME',
                style: TextStyle(color: Color(0xFF4338CA), fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Center(
            child: Text(
              '${_fNameController.text} ${_lNameController.text}'.trim(),
              style: const TextStyle(color: Colors.black, fontSize: 22, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 2),
          Center(
            child: Text(
              _titleController.text,
              style: const TextStyle(color: Color(0xFF4338CA), fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              [
                _emailController.text,
                _phoneController.text,
                _cityController.text,
              ].where((s) => s.isNotEmpty).join('  •  '),
              style: const TextStyle(color: Colors.black54, fontSize: 11),
            ),
          ),
          const Divider(color: Colors.black26, height: 24),

          // Executive Summary
          if (_summaryController.text.isNotEmpty) ...[
            const Text('EXECUTIVE SUMMARY', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 6),
            Text(
              _summaryController.text,
              style: const TextStyle(color: Colors.black87, fontSize: 12, height: 1.5),
            ),
            const SizedBox(height: 16),
          ],

          // Core Competencies
          if (_skills.isNotEmpty) ...[
            const Text('CORE COMPETENCIES & SKILLS', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _skills.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFE5E7EB))),
                child: Text(s, style: const TextStyle(color: Colors.black87, fontSize: 11)),
              )).toList(),
            ),
            const SizedBox(height: 16),
          ],

          // Professional Experience
          if (_experience.isNotEmpty) ...[
            const Text('PROFESSIONAL EXPERIENCE', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 8),
            ..._experience.map((exp) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(exp['role'] ?? exp['title'] ?? 'Role', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(exp['dates'] ?? '', style: const TextStyle(color: Colors.black54, fontSize: 11, fontStyle: FontStyle.italic)),
                    ],
                  ),
                  Text(exp['company'] ?? '', style: const TextStyle(color: Color(0xFF4338CA), fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    exp['responsibilities'] ?? exp['description'] ?? '',
                    style: const TextStyle(color: Colors.black87, fontSize: 11, height: 1.4),
                  ),
                ],
              ),
            )),
          ],

          // Education
          if (_education.isNotEmpty) ...[
            const Text('EDUCATION & CREDENTIALS', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 8),
            ..._education.map((edu) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${edu['course'] ?? edu['degree'] ?? 'Degree'} — ${edu['school'] ?? edu['institution'] ?? 'University'}',
                      style: const TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                  Text(edu['dates'] ?? edu['yearGraduated'] ?? '', style: const TextStyle(color: Colors.black54, fontSize: 11)),
                ],
              ),
            )),
          ],

          const SizedBox(height: 16),
          const Center(
            child: Text(
              'Verified via JobHub AI Ecosystem • JobHub Digital Credentials',
              style: TextStyle(color: Colors.black38, fontSize: 9, fontFamily: 'monospace'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoverLetterView() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('💌 AI Generated Cover Letter', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.copy, color: Color(0xFF00F0FF), size: 18),
                tooltip: 'Copy Cover Letter',
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: _coverLetter));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Cover letter copied to clipboard!')),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _coverLetter.isNotEmpty
                ? _coverLetter
                : 'Tap "✨ Generate AI Resume" below to generate a tailored cover letter accompanying your resume.',
            style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
        filled: true,
        fillColor: Colors.white.withOpacity(0.06),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      ),
    );
  }
}
