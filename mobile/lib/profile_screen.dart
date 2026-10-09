import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'config/api_config.dart';
import 'config/theme_manager.dart';
import 'widgets/glass_card.dart';
import 'login_screen.dart';
import 'onboarding_screen.dart';
import 'employer_crm_screen.dart';
import 'subscription_screen.dart';

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
  final _keywordController = TextEditingController();

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
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile picture updated successfully! 🎉')));
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

  Future<void> _updateAutoApplySettings({bool? enabled, List<String>? keywords}) async {
    setState(() => _isSavingAutoApply = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final newEnabled = enabled ?? (_profile?['autoApplyEnabled'] ?? false);
      final newKeywords = keywords ?? List<String>.from(_profile?['autoApplyKeywords'] ?? []);

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
          'enabled': newEnabled,
          'keywords': newKeywords,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _profile?['autoApplyEnabled'] = newEnabled;
          _profile?['autoApplyKeywords'] = newKeywords;
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
    if (_profile == null) return;
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
          'job_title': _profile?['profession'] ?? 'Job Seeker',
          'location': _profile?['residenceCity'] ?? 'Unknown',
          'experience_years': 3,
        }),
      );
      
      // Fetch Suggestions
      final suggsRes = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/career/suggestions'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode(_profile),
      );

      setState(() {
        if (scoreRes.statusCode == 200) _aiScore = jsonDecode(scoreRes.body);
        if (salaryRes.statusCode == 200) _aiSalary = jsonDecode(salaryRes.body);
        if (suggsRes.statusCode == 200) _aiSuggestions = jsonDecode(suggsRes.body)['suggestions'];
      });
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isAiLoading = false);
    }
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
            SnackBar(content: Text('🎉 ${data['message'] ?? 'Company Verified!'}')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('⚠️ ${data['message'] ?? 'Verification failed'}')),
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

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  Widget _buildSeekerProfile() {
    final name = '${_profile?['firstName'] ?? ''} ${_profile?['lastName'] ?? ''}'.trim();
    final location = '${_profile?['residenceCity'] ?? ''} ${_profile?['residenceCountry'] ?? ''}'.trim();
    final profession = _profile?['headline'] ?? _profile?['profession'] ?? 'Job Seeker';
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
                child: (picUrl == null || picUrl.isEmpty) ? const Icon(Icons.person, size: 60, color: Colors.white) : null,
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
            child: Text('★★★★☆ Profile Strength ($_completion%)', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
          ),
        ),
        
        const SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const OnboardingScreen())).then((_) => _fetchData());
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
                onPressed: () {},
                icon: const Icon(Icons.download, color: Colors.white),
                label: const Text('CV', style: TextStyle(color: Colors.white)),
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

        if (_aiScore != null || _aiSalary != null) ...[
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

        const SizedBox(height: 24),
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.smart_toy, color: Color(0xFF00F0FF)),
                      const SizedBox(width: 8),
                      Text(
                        'Autonomous AI Apply',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: _profile?['autoApplyEnabled'] ?? false,
                    activeColor: const Color(0xFF00F0FF),
                    onChanged: (val) => _updateAutoApplySettings(enabled: val),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Let JobHub AI automatically match and apply to jobs matching your keywords every midnight.',
                style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black54,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ...(_profile?['autoApplyKeywords'] as List<dynamic>? ?? []).map((k) => Chip(
                    label: Text(k.toString(), style: const TextStyle(fontSize: 12)),
                    backgroundColor: const Color(0xFF6366F1).withOpacity(0.2),
                    deleteIcon: const Icon(Icons.close, size: 14),
                    onDeleted: () {
                      final kws = List<String>.from(_profile?['autoApplyKeywords'] ?? []);
                      kws.remove(k.toString());
                      _updateAutoApplySettings(keywords: kws);
                    },
                  )),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _keywordController,
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Add keyword (e.g. Flutter, React)',
                        hintStyle: TextStyle(
                          color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.black38,
                          fontSize: 13,
                        ),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      final kw = _keywordController.text.trim();
                      if (kw.isNotEmpty) {
                        final kws = List<String>.from(_profile?['autoApplyKeywords'] ?? []);
                        if (!kws.contains(kw)) {
                          kws.add(kw);
                          _updateAutoApplySettings(keywords: kws);
                        }
                        _keywordController.clear();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Add'),
                  ),
                ],
              ),
            ],
          ),
        ),

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
                Text('📅 ${app['interviewDate'] != null ? DateTime.parse(app['interviewDate']).toLocal() : 'TBD'}', style: const TextStyle(color: Color(0xFF00F0FF))),
                if (app['interviewLink'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text('🔗 ${app['interviewLink']}', style: const TextStyle(color: Color(0xFF00F0FF))),
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

        if (experience.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionTitle('Experience'),
          ...experience.map((e) => _buildCardItem(e['role'], e['company'], 'Dates: ${e['dates']}')),
        ],

        if (education.isNotEmpty) ...[
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
    final name = _profile?['companyName'] ?? 'Employer';
    final location = '${_profile?['locationCity'] ?? ''} ${_profile?['locationCountry'] ?? ''}'.trim();
    final picUrl = _profile?['profilePicture'];
    final isVerified = _profile?['verificationStatus'] == 'VERIFIED';

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
        if (location.isNotEmpty)
          Text(location, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7)), textAlign: TextAlign.center),
        
        if (_profile?['verificationStatus'] == 'VERIFIED')
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
          label: const Text('Upgrade to Premium', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),

        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const OnboardingScreen())).then((_) => _fetchData());
          },
          icon: const Icon(Icons.edit, color: Colors.black),
          label: const Text('Edit Company Profile', style: TextStyle(color: Colors.black)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00F0FF),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        
        const SizedBox(height: 32),
        _buildSectionTitle('About the Company'),
        Text(_profile?['description'] ?? 'No description provided.', style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.5)),

        const SizedBox(height: 32),
        _buildSectionTitle('Company Details'),
        _buildInfoRow('Industry', _profile?['industry'] ?? 'N/A'),
        _buildInfoRow('Company Size', _profile?['companySize'] ?? 'N/A'),
        _buildInfoRow('Founded Year', _profile?['foundedYear']?.toString() ?? 'N/A'),

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
        _buildSectionTitle('Contact HR'),
        _buildInfoRow('Name', _profile?['hrContactName'] ?? 'N/A'),
        _buildInfoRow('Email', _profile?['hrEmail'] ?? 'N/A'),
        _buildInfoRow('Phone', _profile?['hrPhone'] ?? 'N/A'),
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
              const SizedBox(height: 16),
              if (_user!['role'] == 'JOB_SEEKER') _buildSeekerProfile() else _buildEmployerProfile(),
              const SizedBox(height: 48),
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
