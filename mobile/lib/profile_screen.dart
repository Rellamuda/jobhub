import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'config/api_config.dart';
import 'config/theme_manager.dart';
import 'widgets/glass_card.dart';
import 'login_screen.dart';
import 'onboarding_screen.dart';
import 'employer_crm_screen.dart';
import 'subscription_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/resumes/resumes_list_screen.dart';
import 'employer_dashboard.dart';
import 'seeker_dashboard.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _resolvePicUrl(String? path) {
    if (path == null || path.trim().isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '${ApiConfig.baseUrl}$path';
  }
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _profile;
  int _completion = 0;
  
  bool _isAiLoading = false;
  Map<String, dynamic>? _aiScore;
  Map<String, dynamic>? _aiSalary;
  List<dynamic>? _aiSuggestions;
  List<dynamic> _myApplications = [];
  
  bool _isVerifying = false;
  bool _isUploadingPhoto = false;
  bool _isSavingAutoApply = false;
  bool _isSwitchingRole = false;
  final _keywordController = TextEditingController();

  Future<void> _switchRole() async {
    final currentRole = _user?['role'] ?? 'JOB_SEEKER';
    final targetMode = currentRole == 'JOB_SEEKER' ? 'Employer / Hiring Mode' : 'Contractor / Job Mode';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E142B),
        title: Row(
          children: [
            const Icon(Icons.swap_horiz, color: Color(0xFF00F0FF)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Switch to $targetMode',
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Text(
          currentRole == 'JOB_SEEKER'
              ? 'Switching into Employer Mode allows you to post jobs and hire workers for your crew or organization.\n\nYou can switch back to Contractor/Job Seeker mode anytime.'
              : 'Switching into Contractor Mode allows you to bid on commercial contracts and projects for your company or trade.\n\nYou can switch back to Employer mode anytime.',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
            child: const Text('Confirm Switch', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSwitchingRole = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/switch-role'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        final newRole = data['role'];
        final newToken = data['access_token'];

        final prefs = await SharedPreferences.getInstance();
        if (newToken != null) {
          await prefs.setString('token', newToken);
        }
        await prefs.setString('user_role', newRole);

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(data['message'] ?? 'Mode switched successfully!'),
          ),
        );

        if (newRole == 'EMPLOYER') {
          Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
            MaterialPageRoute(builder: (c) => const EmployerDashboard()),
            (r) => false,
          );
        } else {
          Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
            MaterialPageRoute(builder: (c) => const SeekerDashboard()),
            (r) => false,
          );
        }
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Failed to switch mode: ${res.body}'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Network error switching mode: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSwitchingRole = false);
    }
  }

  Widget _buildDualModeSwitcherCard() {
    final isContractor = _profile?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _profile?['isDualCapacity'] == true ||
        _user?['jobSeekerProfile']?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
        ((_profile?['companyName'] != null && (_profile?['companyName'] as String).trim().isNotEmpty) &&
            (_profile?['isDualCapacity'] == true ||
             _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
             _profile?['businessType']?.toString().contains('Contractor') == true));
    if (!isContractor) {
      return const SizedBox.shrink();
    }
    final currentRole = _user?['role'] ?? 'JOB_SEEKER';
    final isSeeker = currentRole == 'JOB_SEEKER';
    final companyName = (_profile?['companyName'] ?? _user?['jobSeekerProfile']?['companyName'] ?? '').toString().trim();
    final crewSize = _profile?['crewSize'] ?? _user?['jobSeekerProfile']?['crewSize'] ?? 1;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isSeeker
              ? [const Color(0xFF1E1435), const Color(0xFF2C194D)]
              : [const Color(0xFF142435), const Color(0xFF1A384D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSeeker ? const Color(0xFFA855F7).withOpacity(0.5) : const Color(0xFF00F0FF).withOpacity(0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isSeeker ? const Color(0xFFA855F7) : const Color(0xFF00F0FF)).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isSeeker ? Icons.handyman : Icons.business,
                  color: isSeeker ? const Color(0xFFC084FC) : const Color(0xFF00F0FF),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isSeeker ? 'Contractor & Job Mode Active' : 'Employer / Hiring Mode Active',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isSeeker
                          ? 'Bidding on commercial contracts & jobs'
                          : 'Posting vacancies & hiring crew',
                      style: const TextStyle(color: Colors.white60, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('Dual Account', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          if (companyName.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified, color: Color(0xFF00F0FF), size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Registered Contractor: $companyName (Crew: $crewSize)',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSwitchingRole ? null : _switchRole,
              icon: _isSwitchingRole
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Icon(Icons.swap_horiz, color: Colors.black, size: 20),
              label: Text(
                _isSwitchingRole
                    ? 'Switching Mode...'
                    : (isSeeker ? 'Switch to Employer Mode (Hire Staff)' : 'Switch to Contractor Mode (Bid on Jobs)'),
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: isSeeker ? const Color(0xFFC084FC) : const Color(0xFF00F0FF),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _keywordController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final userRes = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (userRes.statusCode == 200) {
        final userData = jsonDecode(userRes.body);
        
        final role = userData['role'];
        final endpoint = role == 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
        
        final profRes = await http.get(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: {'Authorization': 'Bearer $token'},
        );

        if (profRes.statusCode == 200) {
          final pJson = jsonDecode(profRes.body);
          final pPic = pJson['profilePicture'];
          if (pPic != null && pPic.isNotEmpty) {
            final sp = await SharedPreferences.getInstance();
            await sp.setString('cached_profile_picture', pPic);
          }
          setState(() {
            _user = userData;
            _profile = pJson;
          });
        }
        
        if (role == 'JOB_SEEKER') {
          final compRes = await http.get(
            Uri.parse('${ApiConfig.baseUrl}/profiles/job-seeker/completion'),
            headers: {'Authorization': 'Bearer $token'},
          );
          if (compRes.statusCode == 200) {
            setState(() {
              _completion = jsonDecode(compRes.body)['completion'] ?? 0;
            });
          }

          final appRes = await http.get(
            Uri.parse('${ApiConfig.baseUrl}/applications/my-applications'),
            headers: {'Authorization': 'Bearer $token'},
          );
          if (appRes.statusCode == 200) {
            setState(() {
              _myApplications = jsonDecode(appRes.body);
            });
          }
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, maxHeight: 800, imageQuality: 85);
      if (picked == null) return;

      setState(() => _isUploadingPhoto = true);
      final token = await ApiConfig.getToken();
      if (token == null) return;

      var request = http.MultipartRequest('POST', Uri.parse('${ApiConfig.baseUrl}/uploads/profile-picture'));
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', picked.path));

      var streamed = await request.send();
      var response = await http.Response.fromStream(streamed);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final sp = await SharedPreferences.getInstance();
        await sp.setString('cached_profile_picture', data['url']);
        setState(() {
          _profile?['profilePicture'] = data['url'];
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile picture updated successfully! ')));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to upload picture.')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  Future<void> _updateAutoApplySettings({bool? enabled, List<String>? keywords, String? mode}) async {
    setState(() => _isSavingAutoApply = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final newEnabled = enabled ?? (_profile?['autoApplyEnabled'] ?? false);
      final newKeywords = keywords ?? List<String>.from(_profile?['autoApplyKeywords'] ?? []);
      final newMode = mode ?? (_profile?['autonomousMode'] ?? 'PARTIAL');

      final endpoint = _user?['role'] == 'JOB_SEEKER' ? '/profiles/job-seeker/auto-apply' : '/profiles/employer';
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'autoApplyEnabled': newEnabled,
          'autoApplyKeywords': newKeywords,
          'autonomousMode': newMode,
          'enabled': newEnabled,
          'keywords': newKeywords,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _profile?['autoApplyEnabled'] = newEnabled;
          _profile?['autoApplyKeywords'] = newKeywords;
          _profile?['autonomousMode'] = newMode;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Autonomous settings saved!')));
        }
      }
    } catch (e) {
      // error
    } finally {
      if (mounted) setState(() => _isSavingAutoApply = false);
    }
  }

  Future<void> _generateAiInsights() async {
    if (_profile == null) {
      if (_user?['jobSeekerProfile'] != null) {
        _profile = _user!['jobSeekerProfile'];
      } else if (_user?['employer'] != null) {
        _profile = _user!['employer'];
      }
    }

    if (_profile == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please complete your profile details first.')),
        );
      }
      return;
    }

    setState(() => _isAiLoading = true);
    
    try {
      final token = await ApiConfig.getToken();
      
      // Fetch Score
      final scoreRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/profile/score'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode(_profile),
      );
      
      // Fetch Salary
      final salaryRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/salary/estimate'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'job_title': _profile?['profession'] ?? _profile?['desiredJobTitle'] ?? 'Job Seeker',
          'location': _profile?['residenceCity'] ?? _profile?['residenceCountry'] ?? 'Global',
          'experience_years': 3,
        }),
      );
      
      // Fetch Suggestions
      final suggsRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/career/suggestions'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode(_profile),
      );

      bool anySuccess = false;
      setState(() {
        if (scoreRes.statusCode == 200) {
          _aiScore = jsonDecode(scoreRes.body);
          anySuccess = true;
        }
        if (salaryRes.statusCode == 200) {
          _aiSalary = jsonDecode(salaryRes.body);
          anySuccess = true;
        }
        if (suggsRes.statusCode == 200) {
          final sData = jsonDecode(suggsRes.body);
          if (sData is Map && sData['suggestions'] is List) {
            _aiSuggestions = sData['suggestions'];
          } else if (sData is List) {
            _aiSuggestions = sData;
          }
          anySuccess = true;
        }
      });

      if (mounted) {
        if (anySuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('AI Career Insights generated successfully!'),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.redAccent,
              content: Text('Could not generate insights (Status: ${scoreRes.statusCode}). Please try again.'),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('AI Insights generation error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Error generating AI insights: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isAiLoading = false);
    }
  }

  Future<void> _showAiCompanyProfileDialog() async {
    String orgType = 'COMPANY';
    final notesController = TextEditingController();
    bool isGenerating = false;
    String? generatedDesc;
    String? generatedMission;
    String? generatedCulture;
    String? generatedWhyWorkWithUs;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF120B1C),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome, color: Color(0xFF00F0FF), size: 24),
                        SizedBox(width: 8),
                        Text('AI Company Profile Builder', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text('Generate high-impact executive description, mission, values, and workplace culture for your dashboard.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 16),

                    // Organization Type Selector
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => orgType = 'COMPANY'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: orgType == 'COMPANY' ? const Color(0xFF00F0FF).withOpacity(0.2) : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: orgType == 'COMPANY' ? const Color(0xFF00F0FF) : Colors.white24),
                              ),
                              child: Center(
                                child: Text('Corporate / Direct', style: TextStyle(color: orgType == 'COMPANY' ? const Color(0xFF00F0FF) : Colors.white70, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => orgType = 'AGENCY'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: orgType == 'AGENCY' ? const Color(0xFF6366F1).withOpacity(0.2) : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: orgType == 'AGENCY' ? const Color(0xFF6366F1) : Colors.white24),
                              ),
                              child: Center(
                                child: Text('Staffing Agency', style: TextStyle(color: orgType == 'AGENCY' ? const Color(0xFF818CF8) : Colors.white70, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    TextField(
                      controller: notesController,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Key Highlights or Notes (Optional)',
                        labelStyle: TextStyle(color: Colors.white70),
                        hintText: 'e.g. Fintech leader, flexible remote perks, fast hiring',
                        hintStyle: TextStyle(color: Colors.white30, fontSize: 12),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (isGenerating)
                      const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(color: Color(0xFF00F0FF))))
                    else
                      ElevatedButton.icon(
                        onPressed: () async {
                          setModalState(() => isGenerating = true);
                          try {
                            final token = await ApiConfig.getToken();
                            final res = await http.post(
                              Uri.parse('${ApiConfig.baseUrl}/ai/company-profile/generate'),
                              headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
                              body: jsonEncode({
                                'companyName': _profile?['companyName'] ?? 'Our Organization',
                                'industry': _profile?['industry'] ?? 'Technology',
                                'organizationType': orgType,
                                'companySize': _profile?['companySize'],
                                'location': '${_profile?['locationCity'] ?? ''} ${_profile?['locationCountry'] ?? ''}'.trim(),
                                'notes': notesController.text,
                                'autoSave': true,
                              }),
                            );
                            if (res.statusCode == 200 || res.statusCode == 201) {
                              final data = jsonDecode(res.body);
                              final p = data['profile'] ?? {};
                              setModalState(() {
                                isGenerating = false;
                                generatedDesc = p['description'];
                                generatedMission = p['mission'];
                                generatedCulture = p['culture'];
                                generatedWhyWorkWithUs = p['whyWorkWithUs'];
                              });
                              _fetchData(); // Refresh main profile
                            } else {
                              setModalState(() => isGenerating = false);
                            }
                          } catch (e) {
                            setModalState(() => isGenerating = false);
                          }
                        },
                        icon: const Icon(Icons.bolt, color: Colors.black),
                        label: const Text(' Generate & Save AI Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF), padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),

                    if (generatedDesc != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Active AI Profile Saved to Dashboard!', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 8),
                            Text(generatedDesc!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                            if (generatedMission != null) ...[
                              const SizedBox(height: 6),
                              Text(' Mission: $generatedMission', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                            ],
                            if (generatedCulture != null) ...[
                              const SizedBox(height: 4),
                              Text('Ÿ Culture: $generatedCulture', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                            ],
                            const SizedBox(height: 10),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.pop(context);
                                  _downloadOrShareCompanyProfile();
                                },
                                icon: const Icon(Icons.download, size: 16, color: Color(0xFF00F0FF)),
                                label: const Text('Download / Share AI Company Profile', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 12, fontWeight: FontWeight.bold)),
                                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF00F0FF))),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _downloadOrShareCompanyProfile() {
    final companyName = _profile?['companyName'] ?? 'Employer Organization';
    final industry = _profile?['industry'] ?? 'Industry';
    final orgType = _profile?['organizationType'] ?? 'COMPANY';
    final size = _profile?['companySize'] ?? 'N/A';
    final loc = '${_profile?['locationCity'] ?? ''} ${_profile?['locationCountry'] ?? ''}'.trim();
    final desc = _profile?['description'] ?? 'Verified Employer on JobHub Global Talent Ecosystem.';
    final mission = _profile?['mission'] ?? '';
    final culture = _profile?['culture'] ?? '';
    final whyWorkWithUs = _profile?['whyWorkWithUs'] ?? '';
    final website = _profile?['website'] ?? '';

    final profileDoc = '''====================================================
AI-BUILT COMPANY / AGENCY PROFILE
====================================================
Organization Name: $companyName
Organization Type: $orgType
Industry: $industry
Company Size: $size
Headquarters: ${loc.isNotEmpty ? loc : 'Global'}
${website.toString().isNotEmpty ? 'Website: $website\n' : ''}
EXECUTIVE OVERVIEW
------------------
$desc
${mission.toString().isNotEmpty ? '\nOUR MISSION\n-----------\n$mission\n' : ''}${culture.toString().isNotEmpty ? '\nWORK CULTURE\n------------\n$culture\n' : ''}${whyWorkWithUs.toString().isNotEmpty ? '\nWHY WORK WITH US\n----------------\n$whyWorkWithUs\n' : ''}
====================================================
Generated via JobHub Global Talent Platform''';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E142B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    ' AI Company / Agency Profile',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white54),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 260),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: SingleChildScrollView(
                child: Text(
                  profileDoc,
                  style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.5, fontFamily: 'monospace'),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: profileDoc));
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Active AI Company Profile saved to clipboard!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('Save / Copy Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00F0FF),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      Clipboard.setData(ClipboardData(text: profileDoc));
                      final uri = Uri.parse(
                        'mailto:?subject=${Uri.encodeComponent('$companyName - Official Company Profile')}&body=${Uri.encodeComponent(profileDoc)}',
                      );
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(uri);
                      }
                    },
                    icon: const Icon(Icons.share, size: 18, color: Colors.purpleAccent),
                    label: const Text('Share Profile', style: TextStyle(color: Colors.purpleAccent, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.purpleAccent),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showEmployerVerifyDialog() async {
    final regController = TextEditingController(text: _profile?['registrationNumber'] ?? '');
    final webController = TextEditingController(text: _profile?['website'] ?? '');
    final taxController = TextEditingController(text: _profile?['taxId'] ?? '');

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E142B),
        title: const Text('Verify Company Credentials', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Provide your legal business registration number and active website to receive the Verified Company trust badge.', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: regController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Registration No. (RC / EIN / CRN)',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: webController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Active Website (e.g. company.com)',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: taxController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Tax ID / VAT (Optional)',
                  labelStyle: TextStyle(color: Color(0xFF00F0FF)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                ),
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
            onPressed: () async {
              Navigator.pop(ctx);
              await _verifyEmployerCompany(regController.text, webController.text, taxController.text);
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
            child: const Text('Verify Company', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _verifyEmployerCompany(String regNum, String website, String taxId) async {
    setState(() => _isVerifying = true);
    try {
      final token = await ApiConfig.getToken();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/profiles/employer/verify'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'registrationNumber': regNum,
          'website': website,
          'taxId': taxId,
        }),
      );

      final data = jsonDecode(res.body);
      if (data['verified'] == true) {
        setState(() {
          _profile?['verificationStatus'] = 'VERIFIED';
          _profile?['registrationNumber'] = regNum;
          _profile?['website'] = website;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${data['message'] ?? 'Company Verified!'}')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(' ${data['message'] ?? 'Verification failed'}')),
          );
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verification error: $e')));
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _requestVerification() async {
    setState(() => _isVerifying = true);
    try {
      final token = await ApiConfig.getToken();
      
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/profiles/verify/request'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'docs': {'type': 'ID_CARD'}}),
      );
      
      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _profile?['verificationStatus'] = 'PENDING';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Verification requested successfully!')),
          );
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isVerifying = false);
    }
  }

  Future<void> _openWebUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open: $url')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error opening link: $e')),
        );
      }
    }
  }

  void _showSupportInquiryDialog() {
    final nameController = TextEditingController(
      text: _user?['jobSeekerProfile'] != null
          ? '${_user!['jobSeekerProfile']['firstName'] ?? ''} ${_user!['jobSeekerProfile']['lastName'] ?? ''}'.trim()
          : (_user?['employer']?['companyName'] ?? _user?['email'] ?? ''),
    );
    final emailController = TextEditingController(text: _user?['email'] ?? '');
    final subjectController = TextEditingController();
    final messageController = TextEditingController();
    String selectedCategory = 'General Inquiry';
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF1E1E2C),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.white12)),
            title: const Row(
              children: [
                Icon(Icons.support_agent, color: Color(0xFF00F0FF)),
                SizedBox(width: 8),
                Text('Support & Inquiry', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Category', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedCategory,
                        dropdownColor: const Color(0xFF1E1E2C),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        items: const [
                          DropdownMenuItem(value: 'General Inquiry', child: Text('General Inquiry')),
                          DropdownMenuItem(value: 'Account & Verification', child: Text('Account & Verification')),
                          DropdownMenuItem(value: 'Billing & Subscriptions', child: Text('Billing & Subscriptions')),
                          DropdownMenuItem(value: 'Job Match & AI Resume', child: Text('Job Match & AI Resume')),
                          DropdownMenuItem(value: 'Technical Issue / Bug', child: Text('Technical Issue / Bug')),
                          DropdownMenuItem(value: 'Contractor & Dual Mode', child: Text('Contractor & Dual Mode')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() => selectedCategory = val);
                          }
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Subject', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: subjectController,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Brief summary of your inquiry...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.white24)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.white24)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF00F0FF))),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Message', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: messageController,
                    maxLines: 4,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Describe your question, issue, or feedback in detail...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.white24)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.white24)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF00F0FF))),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.of(ctx).pop(),
                child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00F0FF),
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        final subject = subjectController.text.trim();
                        final message = messageController.text.trim();
                        if (subject.isEmpty || message.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please enter both subject and message.')),
                          );
                          return;
                        }

                        setDialogState(() => isSubmitting = true);
                        try {
                          final prefs = await SharedPreferences.getInstance();
                          final token = prefs.getString('token');
                          final headers = <String, String>{
                            'Content-Type': 'application/json',
                          };
                          if (token != null) headers['Authorization'] = 'Bearer $token';

                          final res = await http.post(
                            Uri.parse('${ApiConfig.baseUrl}/admin/support-inquiry'),
                            headers: headers,
                            body: jsonEncode({
                              'userId': _user?['id'],
                              'name': nameController.text.trim().isNotEmpty ? nameController.text.trim() : 'JobHub User',
                              'email': emailController.text.trim().isNotEmpty ? emailController.text.trim() : 'user@jobhubai.com',
                              'category': selectedCategory,
                              'subject': subject,
                              'message': message,
                            }),
                          );

                          if (ctx.mounted) Navigator.of(ctx).pop();

                          if (mounted) {
                            if (res.statusCode == 200 || res.statusCode == 201) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: Color(0xFF10B981),
                                  content: Text('Your inquiry has been submitted to JobHub Support & Admin team.'),
                                ),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Submission received. (Status: ${res.statusCode})')),
                              );
                            }
                          }
                        } catch (e) {
                          if (ctx.mounted) Navigator.of(ctx).pop();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error sending inquiry: $e')),
                            );
                          }
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Text('Send Inquiry', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E142B),
        title: const Text(' Delete Account & Data', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to permanently delete your JobHub account?\n\nThis will permanently erase all your profile data, uploaded resumes, applications, messages, and saved jobs. This action CANNOT be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Permanently Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/profiles/account'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your account and all associated data have been permanently deleted.')),
      );

      Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Error deleting account: $e')),
        );
      }
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  Widget _buildSeekerProfile() {
    final isCompanyOrDual = _profile?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _profile?['isDualCapacity'] == true ||
        (_profile?['companyName'] != null && (_profile?['companyName'] as String).trim().isNotEmpty);
    final companyName = (_profile?['companyName'] ?? '').toString().trim();
    final repName = '${_profile?['firstName'] ?? ''} ${_profile?['lastName'] ?? ''}'.trim();
    final name = (isCompanyOrDual && companyName.isNotEmpty) ? companyName : repName;
    final location = '${_profile?['residenceCity'] ?? ''} ${_profile?['residenceCountry'] ?? ''}'.trim();
    final profession = _profile?['headline'] ?? _profile?['profession'] ?? (isCompanyOrDual ? 'Registered Contracting Company' : 'Job Seeker');
    final picUrl = _profile?['profilePicture'];
    final isVerified = _profile?['verificationStatus'] == 'VERIFIED';
    
    final education = _profile?['education'] as List<dynamic>? ?? [];
    final experience = _profile?['experience'] as List<dynamic>? ?? [];
    final projects = _profile?['projects'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Stack(
            children: [
              CircleAvatar(
                radius: 60,
                backgroundColor: Colors.white.withOpacity(0.1),
                backgroundImage: _resolvePicUrl(picUrl) != null ? NetworkImage(_resolvePicUrl(picUrl)!) : null,
                child: (picUrl == null || picUrl.isEmpty) ? Icon(isCompanyOrDual ? Icons.business : Icons.person, size: 60, color: Colors.white) : null,
              ),
              Positioned(
                bottom: 0,
                left: 0,
                child: InkWell(
                  onTap: _isUploadingPhoto ? null : _pickAndUploadPhoto,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF6366F1)),
                    child: _isUploadingPhoto
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                  ),
                ),
              ),
              if (isVerified)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF120B1C)),
                    child: const Icon(Icons.verified, color: Color(0xFF00F0FF), size: 30),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(name, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white), textAlign: TextAlign.center),
        if (isCompanyOrDual && companyName.isNotEmpty && repName.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 2.0, bottom: 4.0),
            child: Text(
              '👤 Representative: $repName',
              style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.75)),
              textAlign: TextAlign.center,
            ),
          ),
        Text(profession, style: const TextStyle(fontSize: 18, color: Color(0xFF00F0FF)), textAlign: TextAlign.center),
        if (location.isNotEmpty)
          Text(location, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7)), textAlign: TextAlign.center),
        
        if (_profile?['verificationStatus'] == 'UNVERIFIED')
          Center(
            child: TextButton(
              onPressed: _isVerifying ? null : _requestVerification,
              child: Text(_isVerifying ? 'Requesting...' : 'Request Verification', style: const TextStyle(color: Color(0xFF00F0FF))),
            ),
          )
        else if (_profile?['verificationStatus'] == 'PENDING')
          const Center(
            child: Padding(
              padding: EdgeInsets.only(top: 8.0),
              child: Text('Verification Pending...', style: TextStyle(color: Colors.amber)),
            ),
          ),
          
        const SizedBox(height: 16),
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFF00F0FF).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.star_rounded, color: Color(0xFF00F0FF), size: 18),
                const SizedBox(width: 6),
                Text('Profile Strength ($_completion%)', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EditProfileScreen(initialProfile: _profile),
                    ),
                  ).then((updated) {
                    if (updated == true) _fetchData();
                  });
                },
                icon: const Icon(Icons.edit, color: Colors.black),
                label: const Text('Edit Profile', style: TextStyle(color: Colors.black)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00F0FF),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ResumesListScreen()),
                  );
                },
                icon: const Icon(Icons.download, color: Colors.white),
                label: const Text('CV & Letters', style: TextStyle(color: Colors.white)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: Colors.white),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => SubscriptionScreen(
                  initialRole: _user?['role'] ?? 'JOB_SEEKER',
                ),
              ),
            );
          },
          icon: const Icon(Icons.star, color: Colors.black),
          label: const Text('Upgrade to Premium', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00F0FF),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _isAiLoading ? null : _generateAiInsights,
          icon: const Icon(Icons.auto_awesome, color: Colors.white),
          label: Text(_isAiLoading ? 'Generating AI Insights...' : 'Generate AI Career Insights', style: const TextStyle(color: Colors.white)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.indigoAccent,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),

        if (_aiScore != null || _aiSalary != null || _aiSuggestions != null) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFF00F0FF), size: 20),
                    const SizedBox(width: 8),
                    const Text('AI Career Insights', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                
                if (_aiSalary != null) ...[
                  const Text('Estimated Market Salary', style: TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text('${_aiSalary!['currency']} ${_aiSalary!['min']} - ${_aiSalary!['max']}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(_aiSalary!['reasoning'] ?? '', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                  const SizedBox(height: 16),
                ],

                if (_aiScore != null) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Resume Score', style: TextStyle(color: Colors.white70, fontSize: 14)),
                      Text('${_aiScore!['score']}/100', style: TextStyle(color: _aiScore!['score'] > 80 ? Colors.greenAccent : Colors.orangeAccent, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_aiScore!['suggestions'] != null)
                    ...(_aiScore!['suggestions'] as List<dynamic>).map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 4.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(color: Colors.white54)),
                          Expanded(child: Text(s.toString(), style: const TextStyle(color: Colors.white54, fontSize: 12))),
                        ],
                      ),
                    )),
                  const SizedBox(height: 16),
                ],

                if (_aiSuggestions != null) ...[
                  const Text('Career Path Suggestions', style: TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _aiSuggestions!.map((s) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                      child: Text(s.toString(), style: const TextStyle(color: Colors.white, fontSize: 12)),
                    )).toList(),
                  ),
                ],
              ],
            ),
          ),
        ],



        if (_myApplications.where((a) => a['status'] == 'INVITED').isNotEmpty) ...[
          const SizedBox(height: 32),
          _buildSectionTitle('Upcoming Interviews'),
          ..._myApplications.where((a) => a['status'] == 'INVITED').map((app) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF00F0FF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: const Border(left: BorderSide(color: Color(0xFF00F0FF), width: 4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(app['job']?['title'] ?? 'Job', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(app['job']?['employer']?['companyName'] ?? 'Company', style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                Text('${app['interviewDate'] != null ? DateTime.parse(app['interviewDate']).toLocal() : 'TBD'}', style: const TextStyle(color: Color(0xFF00F0FF))),
                if (app['interviewLink'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text('${app['interviewLink']}', style: const TextStyle(color: Color(0xFF00F0FF))),
                  ),
              ],
            ),
          )),
        ],

        if (_profile?['summary'] != null && _profile!['summary'].toString().isNotEmpty) ...[
          const SizedBox(height: 32),
          _buildSectionTitle('About Me'),
          Text(_profile!['summary'], style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.5)),
        ],

        const SizedBox(height: 32),
        _buildSectionTitle('Job Preferences'),
        _buildInfoRow('Desired Title', _profile?['desiredJobTitle'] ?? 'Any'),
        _buildInfoRow('Employment Type', _profile?['employmentType'] ?? 'Any'),
        _buildInfoRow('Work Setup', _profile?['workArrangement'] ?? 'Any'),
        _buildInfoRow('Salary', _profile?['expectedSalary'] ?? 'Negotiable'),

        const SizedBox(height: 28),
        _buildSectionTitle(' Autonomous Application Mode'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Enable Autonomous Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  Switch(
                    value: _profile?['autoApplyEnabled'] == true,
                    activeColor: const Color(0xFF00F0FF),
                    onChanged: (val) {
                      _updateAutoApplySettings(enabled: val);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text('Select your preferred system trigger style:', style: TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 12),
              
              // Full Autonomous Option Card
              InkWell(
                onTap: () {
                  _updateAutoApplySettings(mode: 'FULL');
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (_profile?['autonomousMode'] == 'FULL') ? const Color(0xFF00F0FF).withOpacity(0.15) : Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: (_profile?['autonomousMode'] == 'FULL') ? const Color(0xFF00F0FF) : Colors.white24,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        (_profile?['autonomousMode'] == 'FULL') ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: (_profile?['autonomousMode'] == 'FULL') ? const Color(0xFF00F0FF) : Colors.white54,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Full Autonomous (Zero Notification)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            SizedBox(height: 2),
                            Text('System applies directly without prompting or sending prior consent notifications.', style: TextStyle(color: Colors.white54, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Partial Autonomous Option Card
              InkWell(
                onTap: () {
                  _updateAutoApplySettings(mode: 'PARTIAL');
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (_profile?['autonomousMode'] != 'FULL') ? const Color(0xFF6366F1).withOpacity(0.15) : Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: (_profile?['autonomousMode'] != 'FULL') ? const Color(0xFF6366F1) : Colors.white24,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        (_profile?['autonomousMode'] != 'FULL') ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: (_profile?['autonomousMode'] != 'FULL') ? const Color(0xFF818CF8) : Colors.white54,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Partial Autonomous (Consent First)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            SizedBox(height: 2),
                            Text('System notifies you to seek consent before submitting the application on your behalf.', style: TextStyle(color: Colors.white54, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        if (experience.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionTitle('Experience'),
          ...experience.map((e) => _buildCardItem(e['role'], e['company'], 'Dates: ${e['dates']}')),
        ],

        if (!isCompanyOrDual && education.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionTitle('Education'),
          ...education.map((e) => _buildCardItem(e['school'], e['course'], 'Dates: ${e['dates'] ?? e['yearGraduated']}')),
        ],

        if (projects.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionTitle('Projects'),
          ...projects.map((e) => _buildCardItem(e['title'], e['description'], e['liveLink'])),
        ],
      ],
    );
  }

  Widget _buildCardItem(String? title, String? subtitle1, String? subtitle2) {
    return Card(
      color: Colors.white.withOpacity(0.05),
      margin: const EdgeInsets.only(bottom: 8.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.white.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null) Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            if (subtitle1 != null && subtitle1.isNotEmpty) ...[const SizedBox(height: 4), Text(subtitle1, style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 14))],
            if (subtitle2 != null && subtitle2.isNotEmpty) ...[const SizedBox(height: 8), Text(subtitle2, style: const TextStyle(color: Colors.white70, fontSize: 14))],
          ],
        ),
      ),
    );
  }

  Widget _buildEmployerProfile() {
    final isCompanyOrDual = _profile?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _profile?['isDualCapacity'] == true ||
        _user?['jobSeekerProfile']?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
        ((_profile?['companyName'] != null && (_profile?['companyName'] as String).trim().isNotEmpty) &&
            (_profile?['isDualCapacity'] == true ||
             _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
             _profile?['businessType']?.toString().contains('Contractor') == true));

    final name = (_profile?['companyName'] ?? _user?['jobSeekerProfile']?['companyName'] ?? 'Employer Organization').toString().trim();
    final repName = (_profile?['representativeName'] ??
            '${_user?['jobSeekerProfile']?['firstName'] ?? ''} ${_user?['jobSeekerProfile']?['lastName'] ?? ''}')
        .toString()
        .trim();

    final city = (_profile?['locationCity'] ?? _user?['jobSeekerProfile']?['residenceCity'] ?? '').toString().trim();
    final state = (_profile?['locationState'] ?? _user?['jobSeekerProfile']?['residenceState'] ?? '').toString().trim();
    final country = (_profile?['locationCountry'] ?? _user?['jobSeekerProfile']?['residenceCountry'] ?? '').toString().trim();
    final location = '$city${state.isNotEmpty ? ', $state' : ''}${country.isNotEmpty ? ' - $country' : ''}'.trim();

    final picUrl = _profile?['profilePicture'] ?? _user?['jobSeekerProfile']?['profilePicture'];
    final isVerified = _profile?['verificationStatus'] == 'VERIFIED' || _user?['jobSeekerProfile']?['verificationStatus'] == 'VERIFIED';

    final desc = (_profile?['description'] != null && (_profile?['description'] as String).trim().isNotEmpty)
        ? _profile!['description']
        : ((_user?['jobSeekerProfile']?['summary'] ?? _user?['jobSeekerProfile']?['bio'] ?? _user?['jobSeekerProfile']?['headline'] ?? 'Verified corporate partner and commercial contractor on JobHub Global.').toString());

    final industry = (_profile?['industry'] ?? _user?['jobSeekerProfile']?['preferredIndustry'] ?? 'Commercial Services & Contracting').toString();
    final crewSize = _profile?['crewSize'] ?? _user?['jobSeekerProfile']?['crewSize'] ?? 1;
    final companySize = _profile?['companySize'] ?? '$crewSize Staff / Crew';
    final regNo = (_profile?['registrationNumber'] ?? _user?['jobSeekerProfile']?['businessRegNumber'] ?? 'N/A').toString();

    final skills = (_profile?['contractorSkills'] as List<dynamic>?) ?? (_user?['jobSeekerProfile']?['skills'] as List<dynamic>?) ?? [];
    final experience = (_profile?['contractorExperience'] as List<dynamic>?) ?? (_user?['jobSeekerProfile']?['experience'] as List<dynamic>?) ?? [];
    final projects = (_profile?['contractorProjects'] as List<dynamic>?) ?? (_user?['jobSeekerProfile']?['projects'] as List<dynamic>?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Stack(
            children: [
              CircleAvatar(
                radius: 60,
                backgroundColor: Colors.white.withOpacity(0.1),
                backgroundImage: _resolvePicUrl(picUrl) != null ? NetworkImage(_resolvePicUrl(picUrl)!) : null,
                child: (picUrl == null || picUrl.isEmpty) ? const Icon(Icons.business, size: 60, color: Colors.white) : null,
              ),
              Positioned(
                bottom: 0,
                left: 0,
                child: InkWell(
                  onTap: _isUploadingPhoto ? null : _pickAndUploadPhoto,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF6366F1)),
                    child: _isUploadingPhoto
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                  ),
                ),
              ),
              if (isVerified)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF120B1C)),
                    child: const Icon(Icons.verified, color: Color(0xFF00F0FF), size: 30),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(name, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white), textAlign: TextAlign.center),
        if (isCompanyOrDual && repName.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 2.0, bottom: 4.0),
            child: Text(
              '👤 Representative: $repName',
              style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.75)),
              textAlign: TextAlign.center,
            ),
          ),
        if (location.isNotEmpty)
          Text(location, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7)), textAlign: TextAlign.center),
        
        if (isVerified)
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF00F0FF).withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.5)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified, color: Color(0xFF00F0FF), size: 18),
                  SizedBox(width: 6),
                  Text('Verified Company (Registration & Web Active)', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
            ),
          )
        else if (_profile?['verificationStatus'] == 'PENDING')
          const Center(
            child: Padding(
              padding: EdgeInsets.only(top: 8.0),
              child: Text('Verification Pending...', style: TextStyle(color: Colors.amber)),
            ),
          )
        else
          Center(
            child: TextButton.icon(
              onPressed: _isVerifying ? null : _showEmployerVerifyDialog,
              icon: const Icon(Icons.shield_outlined, color: Color(0xFF00F0FF), size: 18),
              label: Text(_isVerifying ? 'Verifying...' : 'Verify Company & Get Badge', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
            ),
          ),
          
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => SubscriptionScreen(
                  initialRole: _user?['role'] ?? 'EMPLOYER',
                ),
              ),
            );
          },
          icon: const Icon(Icons.star, color: Colors.white),
          label: const Text('Upgrade Plan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),

        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _showAiCompanyProfileDialog,
          icon: const Icon(Icons.auto_awesome, color: Colors.black),
          label: const Text(' Build AI Company/Agency Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00F0FF),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),

        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: _downloadOrShareCompanyProfile,
          icon: const Icon(Icons.download, color: Color(0xFF00F0FF)),
          label: const Text(' Download / Share AI Company Profile', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFF00F0FF)),
            padding: const EdgeInsets.symmetric(vertical: 13),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),

        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const OnboardingScreen())).then((_) => _fetchData());
          },
          icon: const Icon(Icons.edit, color: Colors.white),
          label: const Text('Edit Company Profile Details', style: TextStyle(color: Colors.white)),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Colors.white38),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        
        const SizedBox(height: 32),
        _buildSectionTitle('About the Company'),
        Text(desc, style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.5)),

        const SizedBox(height: 32),
        _buildSectionTitle('Company Details'),
        _buildInfoRow('Industry', industry),
        _buildInfoRow('Company Size / Crew', companySize),
        _buildInfoRow('Registration No.', regNo),
        if (location.isNotEmpty) _buildInfoRow('Operating Location', location),
        if (_profile?['foundedYear'] != null)
          _buildInfoRow('Founded Year', _profile!['foundedYear'].toString()),

        if (skills.isNotEmpty) ...[
          const SizedBox(height: 28),
          _buildSectionTitle('Services & Trade Capabilities'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: skills.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFA855F7).withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFA855F7).withOpacity(0.4)),
              ),
              child: Text(s.toString(), style: const TextStyle(color: Color(0xFFC084FC), fontSize: 12, fontWeight: FontWeight.bold)),
            )).toList(),
          ),
        ],

        if (experience.isNotEmpty) ...[
          const SizedBox(height: 28),
          _buildSectionTitle('Commercial Experience & Past Contracts'),
          ...experience.map((e) => _buildCardItem(e['role'], e['company'], 'Dates: ${e['dates']}')),
        ],

        if (projects.isNotEmpty) ...[
          const SizedBox(height: 28),
          _buildSectionTitle('Portfolio & Projects'),
          ...projects.map((e) => _buildCardItem(e['title'], e['description'], e['liveLink'])),
        ],

        const SizedBox(height: 32),
        _buildSectionTitle('Active Jobs & Applicants'),
        if (_profile?['jobs'] != null && (_profile!['jobs'] as List).isNotEmpty)
          ...(_profile!['jobs'] as List).map((job) => Card(
            color: Colors.white.withOpacity(0.05),
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              title: Text(job['title'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Text(job['location'] ?? 'Remote', style: const TextStyle(color: Colors.white70)),
              trailing: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => EmployerCrmScreen(jobId: job['id'], jobTitle: job['title'])),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  side: const BorderSide(color: Color(0xFF00F0FF)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text('View CRM', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 12)),
              ),
            ),
          )).toList()
        else
          const Text('No active job postings.', style: TextStyle(color: Colors.white54)),

        const SizedBox(height: 32),
        _buildSectionTitle('Contact HR & Leadership'),
        _buildInfoRow('Name', _profile?['hrContactName'] ?? (repName.isNotEmpty ? repName : 'Principal Representative')),
        _buildInfoRow('Email', _profile?['hrEmail'] ?? _user?['email'] ?? 'N/A'),
        _buildInfoRow('Phone', _profile?['hrPhone'] ?? _user?['jobSeekerProfile']?['phone'] ?? 'N/A'),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 16)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF120B1C),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_user == null || _profile == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF120B1C),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Profile incomplete', style: TextStyle(color: Colors.white, fontSize: 18)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => const OnboardingScreen())),
                child: const Text('Complete Profile'),
              ),
              const SizedBox(height: 16),
              TextButton(onPressed: _logout, child: const Text('Logout', style: TextStyle(color: Colors.redAccent))),
            ],
          ),
        ),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    final isContractor = _profile?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _profile?['isDualCapacity'] == true ||
        _user?['jobSeekerProfile']?['seekerType'] == 'COMPANY_CONTRACTOR' ||
        _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
        ((_profile?['companyName'] != null && (_profile?['companyName'] as String).trim().isNotEmpty) &&
            (_profile?['isDualCapacity'] == true ||
             _user?['jobSeekerProfile']?['isDualCapacity'] == true ||
             _profile?['businessType']?.toString().contains('Contractor') == true));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'My Profile',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              if (isContractor) ...[
                _buildDualModeSwitcherCard(),
              ],
              if (_user!['role'] == 'JOB_SEEKER') _buildSeekerProfile() else _buildEmployerProfile(),
              const SizedBox(height: 24),
              // Legal & Google Play Compliance Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.08)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.gavel, color: Color(0xFF00F0FF), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Legal & Account Settings',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // ONLY display the mode switcher here if the account is a registered contractor/dual account
                    if (isContractor) ...[
                      ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.swap_horiz, color: Color(0xFF00F0FF)),
                        title: Text(
                          _user?['role'] == 'JOB_SEEKER' ? 'Switch to Employer Mode' : 'Switch to Contractor Mode',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          _user?['role'] == 'JOB_SEEKER' ? 'Post jobs and recruit workforce crew' : 'Bid on commercial jobs and service contracts',
                          style: const TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios, color: Color(0xFF00F0FF), size: 14),
                        onTap: _switchRole,
                      ),
                      const Divider(color: Colors.white12),
                    ],
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.privacy_tip_outlined, color: Colors.white70),
                      title: const Text('Privacy Policy', style: TextStyle(color: Colors.white)),
                      subtitle: const Text('Data collection & user rights', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: const Icon(Icons.open_in_new, color: Color(0xFF00F0FF), size: 18),
                      onTap: () => _openWebUrl('${ApiConfig.webUrl}/privacy'),
                    ),
                    const Divider(color: Colors.white12),
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.description_outlined, color: Colors.white70),
                      title: const Text('Terms of Service', style: TextStyle(color: Colors.white)),
                      subtitle: const Text('Platform guidelines & terms', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: const Icon(Icons.open_in_new, color: Color(0xFF00F0FF), size: 18),
                      onTap: () => _openWebUrl('${ApiConfig.webUrl}/terms'),
                    ),
                    const Divider(color: Colors.white12),
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.support_agent, color: Colors.white70),
                      title: const Text('Support & Inquiries', style: TextStyle(color: Colors.white)),
                      subtitle: const Text('Submit questions or issues to support team', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: const Icon(Icons.arrow_forward_ios, color: Color(0xFF00F0FF), size: 14),
                      onTap: _showSupportInquiryDialog,
                    ),
                    const Divider(color: Colors.white12),
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.delete_forever_outlined, color: Colors.redAccent),
                      title: const Text('Delete Account & Data', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Permanently erase account & all data', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: const Icon(Icons.arrow_forward_ios, color: Colors.redAccent, size: 14),
                      onTap: _deleteAccount,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout, color: Colors.redAccent),
                label: const Text('Logout', style: TextStyle(color: Colors.redAccent)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Colors.redAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
