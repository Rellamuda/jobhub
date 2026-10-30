import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic>? initialProfile;

  const EditProfileScreen({super.key, this.initialProfile});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isSaving = false;

  // Controllers: Location
  final _residenceCountryController = TextEditingController();
  final _residenceStateController = TextEditingController();
  final _residenceCityController = TextEditingController();
  bool _willingToRelocate = false;
  bool _openToRemote = true;
  final _preferredLocationsController = TextEditingController();

  // Controllers: Job Preferences
  final _desiredJobTitleController = TextEditingController();
  String _preferredIndustry = 'Information Technology & Software';
  String _employmentType = 'Full-time';
  String _workArrangement = 'Remote';
  final _salaryAmountController = TextEditingController();
  String _salaryCurrency = '\$';
  String _salaryFrequency = 'Monthly';

  // Controllers: Skills
  final _skillInputController = TextEditingController();
  List<String> _skills = [];

  // Controllers: Education
  List<Map<String, String>> _educationList = [];

  // Controllers: Bio & Experience
  final _headlineController = TextEditingController();
  final _summaryController = TextEditingController();

  // Controllers: Contact & Personal
  final _phoneController = TextEditingController();
  String _maritalStatus = 'Single';
  final _nationalityController = TextEditingController();

  // Dual-Capacity Contractor Profile
  String _seekerType = 'INDIVIDUAL';
  final _companyNameController = TextEditingController();
  final _businessRegNumberController = TextEditingController();
  final _crewSizeController = TextEditingController(text: '1');
  bool _isDualCapacity = false;

  final List<String> _industryOptions = [
    'Information Technology & Software',
    'Financial Services & Fintech',
    'Healthcare & Pharmaceuticals',
    'Engineering & Construction',
    'E-commerce & Retail',
    'Education & EdTech',
    'Media & Entertainment',
    'Energy & CleanTech',
    'Consulting & Professional Services',
    'Manufacturing & Logistics',
    'Artisan & Skilled Trades',
    'Other Industry',
  ];

  final List<String> _employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract / Freelance',
    'Internship',
  ];

  final List<String> _workArrangements = [
    'Remote',
    'Hybrid',
    'On-site',
  ];

  final List<String> _currencies = ['\$', '₦', '£', '€', 'C\$', 'R', 'KSh', 'GH₵', 'A\$', 'AED', '₹', 'CHF'];
  final List<String> _frequencies = ['Monthly', 'Annually', 'Hourly', 'Daily'];
  final List<String> _maritalOptions = ['Single', 'Married', 'Divorced', 'Prefer not to say'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _populateExistingData();
  }

  void _populateExistingData() {
    final p = widget.initialProfile;
    if (p == null) return;

    // Location
    _residenceCountryController.text = p['residenceCountry'] ?? '';
    _residenceStateController.text = p['residenceState'] ?? '';
    _residenceCityController.text = p['residenceCity'] ?? '';
    _willingToRelocate = p['willingToRelocate'] == true;
    _openToRemote = p['remotePreference'] == 'REMOTE_ONLY' || p['workArrangement'] == 'Remote' || p['remotePreference'] == 'OPEN_TO_REMOTE';
    if (p['preferredLocations'] is List) {
      _preferredLocationsController.text = (p['preferredLocations'] as List).join(', ');
    } else if (p['preferredLocations'] is String) {
      _preferredLocationsController.text = p['preferredLocations'];
    }

    // Preferences
    _desiredJobTitleController.text = p['desiredJobTitle'] ?? '';
    if (p['preferredIndustry'] != null && _industryOptions.contains(p['preferredIndustry'])) {
      _preferredIndustry = p['preferredIndustry'];
    }
    if (p['employmentType'] != null && _employmentTypes.contains(p['employmentType'])) {
      _employmentType = p['employmentType'];
    }
    if (p['workArrangement'] != null && _workArrangements.contains(p['workArrangement'])) {
      _workArrangement = p['workArrangement'];
    }

    // Salary parsing
    final rawSalary = p['expectedSalary'] ?? '';
    if (rawSalary.isNotEmpty) {
      final parts = rawSalary.split(' ');
      if (parts.isNotEmpty) {
        if (_currencies.contains(parts[0])) {
          _salaryCurrency = parts[0];
          if (parts.length > 1) _salaryAmountController.text = parts[1];
        } else {
          _salaryAmountController.text = rawSalary;
        }
      }
      if (rawSalary.toLowerCase().contains('hour')) _salaryFrequency = 'Hourly';
      else if (rawSalary.toLowerCase().contains('year') || rawSalary.toLowerCase().contains('annual')) _salaryFrequency = 'Annually';
      else if (rawSalary.toLowerCase().contains('day')) _salaryFrequency = 'Daily';
      else _salaryFrequency = 'Monthly';
    }

    // Skills
    if (p['skills'] is List) {
      _skills = List<String>.from(p['skills']);
    }

    // Education
    if (p['education'] is List) {
      _educationList = (p['education'] as List).map<Map<String, String>>((e) {
        if (e is Map) {
          return {
            'degree': e['degree']?.toString() ?? '',
            'institution': e['institution']?.toString() ?? e['school']?.toString() ?? '',
            'year': e['year']?.toString() ?? e['graduationYear']?.toString() ?? '',
          };
        }
        return {'degree': e.toString(), 'institution': '', 'year': ''};
      }).toList();
    }

    // Headline & Summary
    _headlineController.text = p['headline'] ?? p['profession'] ?? '';
    _summaryController.text = p['summary'] ?? p['bio'] ?? '';

    // Contact
    _phoneController.text = p['phone'] ?? '';
    if (p['maritalStatus'] != null && _maritalOptions.contains(p['maritalStatus'])) {
      _maritalStatus = p['maritalStatus'];
    }
    _nationalityController.text = p['citizenshipCountry'] ?? p['nationality'] ?? '';

    // Contractor / Dual Capacity
    _seekerType = p['seekerType'] ?? (p['isDualCapacity'] == true ? 'COMPANY_CONTRACTOR' : 'INDIVIDUAL');
    _companyNameController.text = p['companyName'] ?? '';
    _businessRegNumberController.text = p['businessRegNumber'] ?? '';
    _crewSizeController.text = (p['crewSize'] ?? 1).toString();
    _isDualCapacity = p['isDualCapacity'] == true || _seekerType == 'COMPANY_CONTRACTOR';
  }

  @override
  void dispose() {
    _tabController.dispose();
    _residenceCountryController.dispose();
    _residenceStateController.dispose();
    _residenceCityController.dispose();
    _preferredLocationsController.dispose();
    _desiredJobTitleController.dispose();
    _salaryAmountController.dispose();
    _skillInputController.dispose();
    _headlineController.dispose();
    _summaryController.dispose();
    _phoneController.dispose();
    _nationalityController.dispose();
    _companyNameController.dispose();
    _businessRegNumberController.dispose();
    _crewSizeController.dispose();
    super.dispose();
  }

  void _addSkill(String skill) {
    final clean = skill.trim();
    if (clean.isNotEmpty && !_skills.contains(clean)) {
      setState(() {
        _skills.add(clean);
        _skillInputController.clear();
      });
    }
  }

  void _removeSkill(String skill) {
    setState(() {
      _skills.remove(skill);
    });
  }

  void _showAddEducationDialog() {
    final degreeCtrl = TextEditingController();
    final institutionCtrl = TextEditingController();
    final yearCtrl = TextEditingController(text: DateTime.now().year.toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF16122E),
        title: const Text('Add Qualification / Degree', style: TextStyle(color: Colors.white, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: degreeCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Degree / Certificate Title *',
                  hintText: 'e.g. B.Sc Computer Science',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: institutionCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'School / University / College *',
                  hintText: 'e.g. Stanford University',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: yearCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Year of Graduation',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
            onPressed: () {
              if (degreeCtrl.text.trim().isNotEmpty) {
                setState(() {
                  _educationList.add({
                    'degree': degreeCtrl.text.trim(),
                    'institution': institutionCtrl.text.trim(),
                    'year': yearCtrl.text.trim(),
                  });
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text('Add', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    final token = await ApiConfig.getToken();
    if (token == null) {
      setState(() => _isSaving = false);
      return;
    }

    final formattedSalary = _salaryAmountController.text.trim().isNotEmpty
        ? '$_salaryCurrency ${_salaryAmountController.text.trim()} / $_salaryFrequency'
        : '';

    final preferredLocationsList = _preferredLocationsController.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    final payload = {
      'residenceCountry': _residenceCountryController.text.trim(),
      'residenceState': _residenceStateController.text.trim(),
      'residenceCity': _residenceCityController.text.trim(),
      'willingToRelocate': _willingToRelocate,
      'remotePreference': _openToRemote ? 'REMOTE_ONLY' : 'ONSITE_ONLY',
      'preferredLocations': preferredLocationsList,

      'desiredJobTitle': _desiredJobTitleController.text.trim(),
      'preferredIndustry': _preferredIndustry,
      'employmentType': _employmentType,
      'workArrangement': _workArrangement,
      'expectedSalary': formattedSalary,

      'skills': _skills,
      'education': _educationList,

      'headline': _headlineController.text.trim(),
      'summary': _summaryController.text.trim(),
      'bio': _summaryController.text.trim(),

      'phone': _phoneController.text.trim(),
      'maritalStatus': _maritalStatus,
      'citizenshipCountry': _nationalityController.text.trim(),
      'nationality': _nationalityController.text.trim(),

      'seekerType': _seekerType,
      'companyName': _seekerType == 'COMPANY_CONTRACTOR' ? _companyNameController.text.trim() : null,
      'businessRegNumber': _seekerType == 'COMPANY_CONTRACTOR' ? _businessRegNumberController.text.trim() : null,
      'crewSize': _seekerType == 'COMPANY_CONTRACTOR' ? (int.tryParse(_crewSizeController.text.trim()) ?? 1) : 1,
      'isDualCapacity': _seekerType == 'COMPANY_CONTRACTOR' || _isDualCapacity,
    };

    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('🎉 Profile updated successfully! All information saved.'),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.redAccent,
              content: Text('Failed to update profile (${res.statusCode}): ${res.body}'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Network error saving profile: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120B1C),
        elevation: 0,
        title: const Text('Edit Profile & Preferences', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: TextButton.icon(
              onPressed: _isSaving ? null : _saveProfile,
              icon: _isSaving
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Icon(Icons.check, color: Colors.black, size: 18),
              label: Text(_isSaving ? 'Saving' : 'Save', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(
                backgroundColor: const Color(0xFF00F0FF),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFF00F0FF),
          labelColor: const Color(0xFF00F0FF),
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(icon: Icon(Icons.location_on, size: 18), text: 'Location'),
            Tab(icon: Icon(Icons.work, size: 18), text: 'Job Targets'),
            Tab(icon: Icon(Icons.bolt, size: 18), text: 'Skills'),
            Tab(icon: Icon(Icons.school, size: 18), text: 'Education'),
            Tab(icon: Icon(Icons.person, size: 18), text: 'Bio & Contact'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLocationTab(),
          _buildJobTargetsTab(),
          _buildSkillsTab(),
          _buildEducationTab(),
          _buildBioContactTab(),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF120B1C),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
        ),
        child: SafeArea(
          child: ElevatedButton.icon(
            onPressed: _isSaving ? null : _saveProfile,
            icon: _isSaving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                : const Icon(Icons.save, color: Colors.black),
            label: Text(
              _isSaving ? 'Saving Changes...' : 'Save All Profile Changes',
              style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00F0FF),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ),
    );
  }

  // TAB 1: Location & Relocation
  Widget _buildLocationTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionHeader('📍 Residence Location', 'Update where you currently live and work from.'),
        const SizedBox(height: 16),
        _buildTextField(_residenceCountryController, 'Country of Residence', hint: 'e.g. United States, Nigeria, Germany'),
        const SizedBox(height: 16),
        _buildTextField(_residenceStateController, 'State / Province / Region', hint: 'e.g. California, Lagos, Bavaria'),
        const SizedBox(height: 16),
        _buildTextField(_residenceCityController, 'City / Town', hint: 'e.g. San Francisco, Lagos, Munich'),
        const SizedBox(height: 24),

        _buildSectionHeader('✈️ Relocation & Remote Preferences', 'Define your mobility for career opportunities.'),
        const SizedBox(height: 12),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          activeColor: const Color(0xFF00F0FF),
          title: const Text('Open to Relocation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: const Text('Allow employers with relocation packages to discover your profile', style: TextStyle(color: Colors.white54, fontSize: 13)),
          value: _willingToRelocate,
          onChanged: (val) => setState(() => _willingToRelocate = val),
        ),
        const Divider(color: Colors.white10),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          activeColor: const Color(0xFF00F0FF),
          title: const Text('Open to 100% Remote Work', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: const Text('Prioritize global distributed roles for your profile', style: TextStyle(color: Colors.white54, fontSize: 13)),
          value: _openToRemote,
          onChanged: (val) => setState(() => _openToRemote = val),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          _preferredLocationsController,
          'Preferred Job Locations (comma-separated)',
          hint: 'e.g. London, Remote, New York, Berlin',
        ),
      ],
    );
  }

  // TAB 2: Job Targets & Preferences
  Widget _buildJobTargetsTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionHeader('💼 Desired Job Role', 'Positions you are actively targeting.'),
        const SizedBox(height: 16),
        _buildTextField(_desiredJobTitleController, 'Target Job Title', hint: 'e.g. Senior Mobile Engineer, Product Manager'),
        const SizedBox(height: 16),

        const Text('Target Industry', style: TextStyle(color: Colors.white70, fontSize: 13)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _preferredIndustry,
              dropdownColor: const Color(0xFF16122E),
              isExpanded: true,
              style: const TextStyle(color: Colors.white, fontSize: 15),
              items: _industryOptions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _preferredIndustry = val);
              },
            ),
          ),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Employment Type', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _employmentType,
                        dropdownColor: const Color(0xFF16122E),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        items: _employmentTypes.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _employmentType = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Work Arrangement', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _workArrangement,
                        dropdownColor: const Color(0xFF16122E),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        items: _workArrangements.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _workArrangement = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        _buildSectionHeader('💰 Expected Compensation', 'Specify your minimum salary expectations.'),
        const SizedBox(height: 12),
        Row(
          children: [
            Container(
              width: 80,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _salaryCurrency,
                  dropdownColor: const Color(0xFF16122E),
                  style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 16, fontWeight: FontWeight.bold),
                  items: _currencies.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _salaryCurrency = val);
                  },
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildTextField(_salaryAmountController, 'Amount', hint: 'e.g. 5,000', keyboardType: TextInputType.number),
            ),
            const SizedBox(width: 12),
            Container(
              width: 110,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _salaryFrequency,
                  dropdownColor: const Color(0xFF16122E),
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  items: _frequencies.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _salaryFrequency = val);
                  },
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // TAB 3: Skills
  Widget _buildSkillsTab() {
    final suggestedSkills = [
      'Flutter', 'React', 'Node.js', 'Python', 'TypeScript',
      'AWS', 'Docker', 'UI/UX Design', 'Project Management',
      'PostgreSQL', 'FastAPI', 'GraphQL', 'DevOps', 'Mobile Architecture'
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionHeader('⚡ Skills & Expertise', 'Add all your core technical and professional competencies.'),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _skillInputController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Add a new skill',
                  hintText: 'e.g. Flutter, Golang, Project Management',
                  hintStyle: const TextStyle(color: Colors.white24),
                  labelStyle: const TextStyle(color: Color(0xFF00F0FF)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.06),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                onSubmitted: _addSkill,
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () => _addSkill(_skillInputController.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00F0FF),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Icon(Icons.add, color: Colors.black),
            ),
          ],
        ),
        const SizedBox(height: 20),

        if (_skills.isNotEmpty) ...[
          const Text('Your Active Skills (tap ✕ to remove):', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _skills.map((skill) {
              return Chip(
                backgroundColor: const Color(0xFF00F0FF).withOpacity(0.15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Color(0xFF00F0FF)),
                ),
                label: Text(skill, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                deleteIcon: const Icon(Icons.close, size: 16, color: Color(0xFF00F0FF)),
                onDeleted: () => _removeSkill(skill),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],

        const Text('Quick Add Suggested Skills:', style: TextStyle(color: Colors.white54, fontSize: 13)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: suggestedSkills
              .where((s) => !_skills.contains(s))
              .map((s) => ActionChip(
                    backgroundColor: Colors.white.withOpacity(0.06),
                    label: Text('+ $s', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    onPressed: () => _addSkill(s),
                  ))
              .toList(),
        ),
      ],
    );
  }

  // TAB 4: Education & Qualifications
  Widget _buildEducationTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionHeader('🎓 Qualifications & Degrees', 'Manage your educational background.'),
            TextButton.icon(
              onPressed: _showAddEducationDialog,
              icon: const Icon(Icons.add, color: Color(0xFF00F0FF), size: 18),
              label: const Text('Add Degree', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (_educationList.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              children: [
                const Icon(Icons.school_outlined, size: 48, color: Colors.white30),
                const SizedBox(height: 12),
                const Text('No qualifications listed yet', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Add your university degrees, diplomas, or certificates.', style: TextStyle(color: Colors.white38, fontSize: 12)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _showAddEducationDialog,
                  icon: const Icon(Icons.add, color: Colors.black),
                  label: const Text('Add Qualification Now', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
                ),
              ],
            ),
          )
        else
          ..._educationList.asMap().entries.map((entry) {
            final idx = entry.key;
            final edu = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.school, color: Color(0xFF00F0FF)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(edu['degree'] ?? 'Degree', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        if ((edu['institution'] ?? '').isNotEmpty)
                          Text(edu['institution']!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        if ((edu['year'] ?? '').isNotEmpty)
                          Text('Class of ${edu['year']}', style: TextStyle(color: const Color(0xFF00F0FF).withOpacity(0.8), fontSize: 12)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                    onPressed: () {
                      setState(() {
                        _educationList.removeAt(idx);
                      });
                    },
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  // TAB 5: Bio, Headline & Contact Details
  Widget _buildBioContactTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionHeader('🛡️ Account Type & Dual Capacity', 'Operate as an individual professional or a registered service company.'),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _seekerType = 'INDIVIDUAL'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                  decoration: BoxDecoration(
                    color: _seekerType == 'INDIVIDUAL' ? const Color(0xFF6366F1).withOpacity(0.2) : Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _seekerType == 'INDIVIDUAL' ? const Color(0xFF6366F1) : Colors.white12,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.person, color: _seekerType == 'INDIVIDUAL' ? const Color(0xFF6366F1) : Colors.white60),
                      const SizedBox(height: 6),
                      Text(
                        'Individual',
                        style: TextStyle(
                          color: _seekerType == 'INDIVIDUAL' ? Colors.white : Colors.white60,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() {
                  _seekerType = 'COMPANY_CONTRACTOR';
                  _isDualCapacity = true;
                }),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                  decoration: BoxDecoration(
                    color: _seekerType == 'COMPANY_CONTRACTOR' ? const Color(0xFF00F0FF).withOpacity(0.15) : Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _seekerType == 'COMPANY_CONTRACTOR' ? const Color(0xFF00F0FF) : Colors.white12,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.business_center, color: _seekerType == 'COMPANY_CONTRACTOR' ? const Color(0xFF00F0FF) : Colors.white60),
                      const SizedBox(height: 6),
                      Text(
                        'Corporate / Contractor',
                        style: TextStyle(
                          color: _seekerType == 'COMPANY_CONTRACTOR' ? Colors.white : Colors.white60,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_seekerType == 'COMPANY_CONTRACTOR') ...[
          const SizedBox(height: 16),
          _buildTextField(_companyNameController, 'Company / Agency Name *', hint: 'e.g. Apex Cleaning Services, Swift Logistics'),
          const SizedBox(height: 16),
          _buildTextField(_businessRegNumberController, 'Business Registration Number (RC/CRN/EIN)', hint: 'e.g. RC 1234567'),
          const SizedBox(height: 16),
          _buildTextField(_crewSizeController, 'Fleet / Crew Size (Total workforce)', hint: 'e.g. 5', keyboardType: TextInputType.number),
        ],
        const SizedBox(height: 24),

        _buildSectionHeader('🏢 Professional Headline & Bio', 'Summarize your career impact.'),
        const SizedBox(height: 16),
        _buildTextField(_headlineController, 'Headline', hint: 'e.g. Senior Mobile & Cloud Architect | 7+ Yrs Exp'),
        const SizedBox(height: 16),
        _buildTextField(_summaryController, 'Professional Summary / Bio', hint: 'Highlight your track record, key achievements, and what drives you...', maxLines: 5),
        const SizedBox(height: 24),

        _buildSectionHeader('📞 Contact & Personal Details', 'Essential information for identity & outreach.'),
        const SizedBox(height: 16),
        _buildTextField(_phoneController, 'Phone Number', hint: 'e.g. +1 415 555 2671', keyboardType: TextInputType.phone),
        const SizedBox(height: 16),
        _buildTextField(_nationalityController, 'Citizenship / Nationality', hint: 'e.g. United States, German, Nigerian'),
        const SizedBox(height: 16),

        const Text('Marital Status', style: TextStyle(color: Colors.white70, fontSize: 13)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _maritalStatus,
              dropdownColor: const Color(0xFF16122E),
              isExpanded: true,
              style: const TextStyle(color: Colors.white, fontSize: 15),
              items: _maritalOptions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _maritalStatus = val);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      ],
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    String? hint,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
        labelStyle: const TextStyle(color: Color(0xFF00F0FF)),
        filled: true,
        fillColor: Colors.white.withOpacity(0.06),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF00F0FF), width: 1.5)),
      ),
    );
  }
}
