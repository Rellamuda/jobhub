import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'create_job_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import 'company_profile_screen.dart';
import 'config/api_config.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _jobs = [];
  bool _isLoading = true;
  String? _applyingJobId;
  final _coverLetterController = TextEditingController();
  bool _isGeneratingCoverLetter = false;
  final Map<String, dynamic> _matchScores = {};

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    try {
      final token = await ApiConfig.getToken();
      
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/jobs'),
        headers: token != null ? {'Authorization': 'Bearer $token'} : {},
      );
      if (response.statusCode == 200) {
        setState(() {
          _jobs = jsonDecode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // Handle error
    }
  }

  Future<void> _apply(String jobId) async {
    try {
      final token = await ApiConfig.getToken();

      if (token == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You must be logged in as a Job Seeker to apply.')),
        );
        return;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/applications/$jobId/apply'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'coverLetter': _coverLetterController.text.isNotEmpty ? _coverLetterController.text : null,
        }),
      );

      if (!mounted) return;
      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted successfully!')),
        );
        setState(() {
          _applyingJobId = null;
          _coverLetterController.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application failed. You might have already applied or you are not a Job Seeker.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connection error.')),
      );
    }
  }

  Future<void> _generateCoverLetter(dynamic job) async {
    setState(() {
      _isGeneratingCoverLetter = true;
    });
    
    try {
      final token = await ApiConfig.getToken();

      // 1. Fetch user profile
      final profileResponse = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (profileResponse.statusCode == 200) {
        final profileData = jsonDecode(profileResponse.body);
        
        // 2. Generate cover letter
        final generateResponse = await http.post(
          Uri.parse('${ApiConfig.baseUrl}/ai/cover-letter/generate'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'profile': profileData,
            'job': job,
          }),
        );
        
        if (generateResponse.statusCode == 200 || generateResponse.statusCode == 201) {
          final data = jsonDecode(generateResponse.body);
          setState(() {
            _coverLetterController.text = data['cover_letter'];
          });
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to generate cover letter.')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingCoverLetter = false;
        });
      }
    }
  }

  Future<void> _calculateMatchScore(dynamic job) async {
    final jobId = job['id']?.toString();
    if (jobId == null) return;

    setState(() {
      _matchScores[jobId] = {'loading': true};
    });

    try {
      final token = await ApiConfig.getToken();

      // Fetch user profile first
      final profileResponse = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker'),
        headers: {'Authorization': 'Bearer $token'},
      );
      final profileData = jsonDecode(profileResponse.body);
      final profileText = jsonEncode(profileData);

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/match/score'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'profile_text': profileText,
          'job_description_text': job['description'] ?? job['title'],
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _matchScores[jobId] = {'loading': false, 'score': data['match_score']};
        });
      } else {
        setState(() {
          _matchScores[jobId] = {'loading': false};
        });
      }
    } catch (e) {
      setState(() {
        _matchScores[jobId] = {'loading': false};
      });
    }
  }

  void _showJobDetails(dynamic job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF161028),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final employer = job['employer'] ?? {};
        final isVerified = employer['verificationStatus'] == 'VERIFIED';
        final score = _matchScores[job['id']]?['score'];

        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, controller) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: ListView(
                controller: controller,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    job['title'] ?? 'Job Title',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        employer['companyName'] ?? 'Company',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Color(0xFF00F0FF),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (isVerified) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF00F0FF).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.5)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, color: Color(0xFF00F0FF), size: 14),
                              SizedBox(width: 4),
                              Text('Verified Employer', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      _buildBadge(Icons.location_on, '${job['location'] ?? 'Anywhere'} ${(job['isRemote'] ?? false) ? '(Remote)' : ''}'),
                      _buildBadge(Icons.attach_money, job['salary'] ?? 'Competitive'),
                      if (score != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                          child: Text('$score% Match', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                    ],
                  ),
                  const Divider(color: Colors.white12, height: 32),
                  const Text('Job Description', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Text(
                    job['description'] ?? 'No description provided.',
                    style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  if (job['requirements'] != null) ...[
                    const Text('Requirements', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(
                      job['requirements'].toString(),
                      style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                  ],
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {
                        _applyingJobId = job['id'];
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Apply for this Job', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _coverLetterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredJobs = _jobs.where((job) {
      final query = _searchController.text.toLowerCase();
      final title = (job['title'] ?? '').toString().toLowerCase();
      final company = (job['employer']?['companyName'] ?? '').toString().toLowerCase();
      return title.contains(query) || company.contains(query);
    }).toList();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.5,
            colors: [Color(0xFF120B1C), Color(0xFF0A0A0A)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Job Board',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        foreground: Paint()
                          ..shader = const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF00F0FF)],
                          ).createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 50.0)),
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.person, color: Colors.white70),
                          tooltip: 'Profile',
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const ProfileScreen()),
                            );
                          },
                        ),
                        // Post Job button removed as requested
                        IconButton(
                          icon: const Icon(Icons.logout, color: Colors.redAccent),
                          tooltip: 'Logout',
                          onPressed: () async {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.remove('token');
                            if (!context.mounted) return;
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (context) => const LoginScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Search Bar
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search jobs by title or company...',
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFF6366F1)),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Job List
                Expanded(
                  child: _isLoading 
                    ? const Center(child: CircularProgressIndicator()) 
                    : filteredJobs.isEmpty 
                      ? const Center(child: Text('No jobs found.', style: TextStyle(color: Colors.white)))
                      : ListView.separated(
                    itemCount: filteredJobs.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final job = filteredJobs[index];
                      final isApplying = _applyingJobId == job['id'];
                      
                      return Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            InkWell(
                              onTap: () => _showJobDetails(job),
                              borderRadius: BorderRadius.circular(8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      job['title'] ?? 'Untitled',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF6366F1).withOpacity(0.25),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.5)),
                                    ),
                                    child: const Text(
                                      'View Details',
                                      style: TextStyle(color: Color(0xFF00F0FF), fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 12,
                              runSpacing: 8,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    if (job['employerId'] != null) {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => CompanyProfileScreen(employerId: job['employerId']),
                                        ),
                                      );
                                    }
                                  },
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildBadge(Icons.business, job['employer']?['companyName'] ?? 'Unknown', isLink: true),
                                      if (job['employer']?['verificationStatus'] == 'VERIFIED') ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF00F0FF).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.5)),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.verified, color: Color(0xFF00F0FF), size: 13),
                                              SizedBox(width: 4),
                                              Text('Verified', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 11, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                _buildBadge(Icons.location_on, '${job['location'] ?? 'Anywhere'} ${(job['isRemote'] ?? false) ? '(Remote)' : ''}'),
                                _buildBadge(Icons.attach_money, job['salary'] ?? 'Competitive'),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                if (_matchScores[job['id']]?['score'] != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                                    child: Text('${_matchScores[job['id']]!['score']}% Match', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
                                  )
                                else
                                  TextButton.icon(
                                    onPressed: _matchScores[job['id']]?['loading'] == true ? null : () => _calculateMatchScore(job),
                                    icon: const Icon(Icons.auto_awesome, size: 16),
                                    label: Text(_matchScores[job['id']]?['loading'] == true ? '...' : 'Predict Match', style: const TextStyle(fontSize: 12)),
                                    style: TextButton.styleFrom(foregroundColor: const Color(0xFF00F0FF), padding: EdgeInsets.zero),
                                  ),
                                ElevatedButton(
                                  onPressed: () {
                                    setState(() {
                                      _applyingJobId = isApplying ? null : job['id'];
                                    });
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isApplying ? Colors.grey[700] : const Color(0xFF6366F1),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: Text(isApplying ? 'Cancel' : 'Apply Now'),
                                ),
                              ],
                            ),
                            if (isApplying) ...[
                              const SizedBox(height: 16),
                              TextField(
                                controller: _coverLetterController,
                                style: const TextStyle(color: Colors.white),
                                maxLines: 3,
                                decoration: InputDecoration(
                                  hintText: 'Write a brief cover letter (optional)...',
                                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                                  filled: true,
                                  fillColor: Colors.white.withOpacity(0.05),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: _isGeneratingCoverLetter ? null : () => _generateCoverLetter(job),
                                    icon: const Icon(Icons.auto_awesome, size: 18),
                                    label: Text(_isGeneratingCoverLetter ? 'Generating...' : 'AI Cover Letter'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigoAccent,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: () => _apply(job['id']),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF00F0FF),
                                      foregroundColor: Colors.black,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    child: const Text('Confirm Application', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(IconData icon, String text, {bool isLink = false}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: isLink ? Colors.blueAccent : Colors.white.withOpacity(0.5)),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 14,
            color: isLink ? Colors.blueAccent : Colors.white.withOpacity(0.7),
            decoration: isLink ? TextDecoration.underline : TextDecoration.none,
          ),
        ),
      ],
    );
  }
}
