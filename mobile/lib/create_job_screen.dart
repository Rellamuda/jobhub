import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class CreateJobScreen extends StatefulWidget {
  const CreateJobScreen({super.key});

  @override
  State<CreateJobScreen> createState() => _CreateJobScreenState();
}

class _CreateJobScreenState extends State<CreateJobScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Single job state
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _salaryController = TextEditingController();
  bool _isRemote = false;
  bool _isLoading = false;
  bool _isGeneratingAi = false;
  String? _errorMessage;

  // Bulk vacancies state
  final _bulkTextController = TextEditingController();
  List<Map<String, dynamic>> _parsedBulkJobs = [];
  bool _isBulkLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _salaryController.dispose();
    _bulkTextController.dispose();
    super.dispose();
  }

  Future<void> _generateAiDescription() async {
    if (_titleController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a Job Title first to generate a description.';
      });
      return;
    }

    setState(() {
      _isGeneratingAi = true;
      _errorMessage = null;
    });

    try {
      final token = await ApiConfig.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/job-description/generate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': _titleController.text,
          'location': _locationController.text,
          'salary': _salaryController.text,
          'isRemote': _isRemote,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _descriptionController.text = data['description'] ?? '';
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to generate description with AI.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingAi = false;
        });
      }
    }
  }

  Future<void> _createJob() async {
    if (_titleController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Job Title is required.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = await ApiConfig.getToken();

      if (token == null) {
        setState(() {
          _errorMessage = 'You must be logged in as an Employer.';
          _isLoading = false;
        });
        return;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/jobs'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': _titleController.text.trim(),
          'description': _descriptionController.text.trim(),
          'location': _locationController.text.trim(),
          'salary': _salaryController.text.trim(),
          'isRemote': _isRemote,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job vacancy posted successfully! 🎉'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        setState(() {
          _errorMessage = 'Failed to post job. Please check your inputs.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _parseBulkText(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      setState(() => _parsedBulkJobs = []);
      return;
    }

    // Try parsing as JSON first
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        final decoded = jsonDecode(trimmed);
        if (decoded is List) {
          final list = decoded.map<Map<String, dynamic>>((item) {
            return {
              'title': (item['title'] ?? item['role'] ?? '').toString(),
              'location': (item['location'] ?? 'Remote').toString(),
              'salary': (item['salary'] ?? 'Competitive').toString(),
              'isRemote': item['isRemote'] == true,
              'description': (item['description'] ?? 'Open vacancy role.').toString(),
            };
          }).where((j) => (j['title'] as String).trim().isNotEmpty).toList();

          setState(() => _parsedBulkJobs = list);
          return;
        }
      } catch (_) {}
    }

    // Parse CSV lines
    final lines = trimmed.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
    int startIndex = 0;
    if (lines.isNotEmpty && (lines[0].toLowerCase().contains('title') || lines[0].toLowerCase().contains('role'))) {
      startIndex = 1;
    }

    final List<Map<String, dynamic>> parsed = [];
    for (int i = startIndex; i < lines.length; i++) {
      final parts = lines[i].split(',').map((p) => p.trim().replaceAll(RegExp(r'^["\x27]|["\x27]$'), '')).toList();
      if (parts.isNotEmpty && parts[0].isNotEmpty) {
        final title = parts[0];
        final loc = parts.length > 1 && parts[1].isNotEmpty ? parts[1] : 'Remote';
        final sal = parts.length > 2 && parts[2].isNotEmpty ? parts[2] : 'Competitive';
        final remote = parts.length > 3 ? (parts[3].toLowerCase().contains('true') || parts[3].toLowerCase().contains('yes') || loc.toLowerCase().contains('remote')) : loc.toLowerCase().contains('remote');
        final desc = parts.length > 4 && parts[4].isNotEmpty ? parts[4] : 'Responsibilities for $title role.';

        parsed.add({
          'title': title,
          'location': loc,
          'salary': sal,
          'isRemote': remote,
          'description': desc,
        });
      }
    }

    setState(() => _parsedBulkJobs = parsed);
  }

  void _loadSampleBulk() {
    const sample = '''Title,Location,Salary,Remote,Description
Senior Mobile Developer,Remote,\$110k - \$140k,Yes,Build flutter mobile applications for global customers.
AI Workflow Engineer,San Francisco CA,\$130k - \$170k,Yes,Design generative AI pipelines and vector search workflows.
HR Talent Specialist,London UK,\$75k - \$90k,No,Manage end-to-end recruitment lifecycle for engineering teams.''';

    _bulkTextController.text = sample;
    _parseBulkText(sample);
  }

  Future<void> _submitBulkJobs() async {
    if (_parsedBulkJobs.isEmpty) {
      setState(() => _errorMessage = 'Please enter or parse at least one vacancy role.');
      return;
    }

    setState(() {
      _isBulkLoading = true;
      _errorMessage = null;
    });

    try {
      final token = await ApiConfig.getToken();
      if (token == null) {
        setState(() {
          _errorMessage = 'Please log in first.';
          _isBulkLoading = false;
        });
        return;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/jobs/bulk'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'jobs': _parsedBulkJobs,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final resData = jsonDecode(response.body);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 Posted ${resData['count']} vacancies successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        final err = jsonDecode(response.body);
        setState(() {
          _errorMessage = err['message'] ?? 'Failed to bulk import jobs.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error: $e';
      });
    } finally {
      if (mounted) {
        setState(() => _isBulkLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Post Job Vacancies'),
        backgroundColor: const Color(0xFF120B1C),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00F0FF),
          labelColor: const Color(0xFF00F0FF),
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(icon: Icon(Icons.edit_note), text: 'Single Job'),
            Tab(icon: Icon(Icons.playlist_add), text: 'Bulk Import'),
          ],
        ),
      ),
      body: Container(
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.5,
            colors: [Color(0xFF120B1C), Color(0xFF0A0A0A)],
          ),
        ),
        child: SafeArea(
          child: TabBarView(
            controller: _tabController,
            children: [
              // Tab 1: Single Job
              _buildSingleJobForm(),
              // Tab 2: Bulk Import
              _buildBulkImportForm(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSingleJobForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withOpacity(0.5)),
              ),
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.redAccent),
                textAlign: TextAlign.center,
              ),
            ),
          
          TextField(
            controller: _titleController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Job Title',
              labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Job Description', style: TextStyle(color: Colors.white.withOpacity(0.5))),
              TextButton.icon(
                onPressed: _isGeneratingAi ? null : _generateAiDescription,
                icon: const Icon(Icons.auto_awesome, size: 16),
                label: Text(_isGeneratingAi ? 'Generating...' : 'Generate with AI'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF00F0FF),
                  padding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          TextField(
            controller: _descriptionController,
            style: const TextStyle(color: Colors.white),
            maxLines: 5,
            decoration: InputDecoration(
              hintText: 'Enter Job Description...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _locationController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Location',
                    labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _salaryController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Salary Range',
                    labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          CheckboxListTile(
            title: const Text('This is a remote position', style: TextStyle(color: Colors.white)),
            value: _isRemote,
            onChanged: (val) {
              setState(() {
                _isRemote = val ?? false;
              });
            },
            activeColor: const Color(0xFF6366F1),
            checkColor: Colors.white,
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
          ),
          const SizedBox(height: 32),
          
          ElevatedButton(
            onPressed: _isLoading ? null : _createJob,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Post Job', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildBulkImportForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Import Vacancies', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              OutlinedButton.icon(
                onPressed: _loadSampleBulk,
                icon: const Icon(Icons.file_copy, size: 14),
                label: const Text('Sample Template', style: TextStyle(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF00F0FF),
                  side: const BorderSide(color: Color(0xFF00F0FF)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Paste CSV or JSON list of vacancies:\nFormat: Title, Location, Salary, Remote, Description',
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 12),
          
          TextField(
            controller: _bulkTextController,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
            maxLines: 7,
            onChanged: _parseBulkText,
            decoration: InputDecoration(
              hintText: 'Enter vacancies (one per line)...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),

          if (_parsedBulkJobs.isNotEmpty) ...[
            Text('Parsed Roles (${_parsedBulkJobs.length} detected):', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...List.generate(_parsedBulkJobs.length, (idx) {
              final job = _parsedBulkJobs[idx];
              return Card(
                color: Colors.white.withOpacity(0.04),
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: Colors.white.withOpacity(0.08))),
                child: ListTile(
                  dense: true,
                  title: Text(job['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('${job['location']} • ${job['salary']} • ${job['isRemote'] ? "Remote" : "On-site"}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.redAccent, size: 18),
                    onPressed: () {
                      setState(() {
                        _parsedBulkJobs.removeAt(idx);
                      });
                    },
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isBulkLoading ? null : _submitBulkJobs,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF00F0FF),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isBulkLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : Text('🚀 Post All ${_parsedBulkJobs.length} Vacancies', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ],
      ),
    );
  }
}
