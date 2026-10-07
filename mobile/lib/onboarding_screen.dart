import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'seeker_dashboard.dart';
import 'employer_dashboard.dart';
import 'package:image_picker/image_picker.dart';
import 'countries_data.dart';

import 'config/api_config.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _currentStep = 1;
  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, dynamic>? _user;
  final ImagePicker _picker = ImagePicker();

  // Seeker State
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _otherNames = TextEditingController();
  final _dateOfBirth = TextEditingController();
  String _gender = '';
  final _phone = TextEditingController();
  final _nationality = TextEditingController();
  String _maritalStatus = '';

  final _headline = TextEditingController();
  final _profession = TextEditingController();
  bool _isSkilledProfessional = false;
  final _skilledProfession = TextEditingController();
  final _summary = TextEditingController();

  final _residenceCountry = TextEditingController();
  final _residenceState = TextEditingController();
  final _residenceCity = TextEditingController();
  final _citizenshipCountry = TextEditingController();
  bool _willingToRelocate = false;

  final _desiredJobTitle = TextEditingController();
  final _preferredIndustry = TextEditingController();
  String _employmentType = '';
  String _workArrangement = '';
  final _expectedSalary = TextEditingController();
  final _availability = TextEditingController();
  String _phoneCode = '+1';
  String _preferredWorkCountry = '';

  // Lists for arrays
  List<Map<String, dynamic>> _education = [];
  List<Map<String, dynamic>> _experience = [];
  List<Map<String, dynamic>> _certificates = [];
  List<Map<String, dynamic>> _achievements = [];
  List<Map<String, dynamic>> _projects = [];

  final _linkedin = TextEditingController();
  final _github = TextEditingController();
  final _website = TextEditingController();

  // Employer State
  final _companyName = TextEditingController();
  final _description = TextEditingController();
  final _industry = TextEditingController();
  final _companySize = TextEditingController();
  final _foundedYear = TextEditingController();

  final _locationCountry = TextEditingController();
  final _locationState = TextEditingController();
  final _locationCity = TextEditingController();

  final _hrContactName = TextEditingController();
  final _hrEmail = TextEditingController();
  final _hrPhone = TextEditingController();

  String? _profilePicUrl;

  Future<void> _selectDateOfBirth(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dateOfBirth.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  String _getCurrencySymbol(String country) {
    const currencyMapping = {
      "United States": "\$",
      "Canada": "C\$",
      "United Kingdom": "£",
      "Nigeria": "₦",
      "India": "₹",
      "Ghana": "GH₵",
      "Kenya": "KSh",
      "South Africa": "R",
      "Australia": "A\$",
      "Germany": "€",
      "France": "€",
      "Italy": "€",
      "Spain": "€",
      "Netherlands": "€",
      "Belgium": "€",
      "Switzerland": "CHF",
      "China": "¥",
      "Japan": "¥",
      "Brazil": "R\$",
      "Egypt": "EGP",
      "Saudi Arabia": "SR",
      "United Arab Emirates": "AED"
    };
    return currencyMapping[country] ?? "\$";
  }

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final token = await ApiConfig.getToken();
      if (token == null) {
        Navigator.pop(context);
        return;
      }
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final userData = jsonDecode(res.body);
        setState(() {
          _user = userData;
          _isLoading = false;
        });
      } else {
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (image == null) return;

      final token = await ApiConfig.getToken();
      if (token == null) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Uploading profile picture...')),
      );

      final uri = Uri.parse('${ApiConfig.baseUrl}/uploads/profile-picture');
      final request = http.MultipartRequest('POST', uri);
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', image.path));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final url = data['url'];
        setState(() {
          _profilePicUrl = url;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile picture uploaded successfully!')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload profile picture.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload error: $e')),
        );
      }
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    final token = await ApiConfig.getToken();
    if (token == null) return;

    String endpoint = _user!['role'] == 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
    Map<String, dynamic> payload = {};

    if (_user!['role'] == 'JOB_SEEKER') {
      payload = {
        'firstName': _firstName.text,
        'lastName': _lastName.text,
        'otherNames': _otherNames.text,
        'dateOfBirth': _dateOfBirth.text.isNotEmpty ? '${_dateOfBirth.text}T00:00:00Z' : null,
        'gender': _gender,
        'phone': '$_phoneCode${_phone.text}',
        'nationality': _nationality.text,
        'maritalStatus': _maritalStatus,
        'headline': _headline.text,
        'profession': _profession.text,
        'isSkilledProfessional': _isSkilledProfessional,
        'skilledProfession': _skilledProfession.text,
        'summary': _summary.text,
        'residenceCountry': _residenceCountry.text,
        'residenceState': _residenceState.text,
        'residenceCity': _residenceCity.text,
        'citizenshipCountry': _citizenshipCountry.text,
        'willingToRelocate': _willingToRelocate,
        'desiredJobTitle': _desiredJobTitle.text,
        'preferredIndustry': _preferredIndustry.text,
        'employmentType': _employmentType,
        'workArrangement': _workArrangement,
        'expectedSalary': _expectedSalary.text,
        'availability': _availability.text,
        'preferredLocations': _preferredWorkCountry,
        'education': _education,
        'experience': _experience,
        'certificates': _certificates,
        'achievements': _achievements,
        'projects': _projects,
        'socialLinks': {
          'linkedin': _linkedin.text,
          'github': _github.text,
          'website': _website.text,
        },
        'profilePicture': _profilePicUrl ?? '',
        'skills': [],
      };
    } else {
      payload = {
        'companyName': _companyName.text,
        'description': _description.text,
        'industry': _industry.text,
        'companySize': _companySize.text,
        'foundedYear': int.tryParse(_foundedYear.text),
        'locationCountry': _locationCountry.text,
        'locationState': _locationState.text,
        'locationCity': _locationCity.text,
        'hrContactName': _hrContactName.text,
        'hrEmail': _hrEmail.text,
        'hrPhone': _hrPhone.text,
        'profilePicture': _profilePicUrl ?? '',
      };
    }

    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: jsonEncode(payload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        Navigator.pop(context); // Go back after onboarding
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save profile')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Widget _buildTextField(TextEditingController ctrl, String label, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
          filled: true,
          fillColor: Colors.white.withOpacity(0.05),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
        ),
      ),
    );
  }

  Widget _buildSeekerSteps() {
    switch (_currentStep) {
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Personal Information', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_firstName, 'First Name'),
            _buildTextField(_lastName, 'Last Name'),
            _buildTextField(_otherNames, 'Other Names (Optional)'),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 4,
                    child: DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _phoneCode,
                      dropdownColor: const Color(0xFF120B1C),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: 'Code',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: phoneCodes.map((pc) {
                        return DropdownMenuItem<String>(
                          value: pc.code,
                          child: Text('${pc.code} (${pc.name})', overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _phoneCode = val);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 6,
                    child: TextField(
                      controller: _phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => _selectDateOfBirth(context),
              child: AbsorbPointer(
                child: _buildTextField(_dateOfBirth, 'Date of Birth (YYYY-MM-DD)'),
              ),
            ),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Professional Details', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_headline, 'Professional Headline (e.g. Senior Software Engineer)'),
            _buildTextField(_profession, 'Primary Profession'),
            _buildTextField(_summary, 'Professional Summary', maxLines: 4),
            Row(
              children: [
                Checkbox(value: _isSkilledProfessional, onChanged: (v) => setState(() => _isSkilledProfessional = v ?? false)),
                const Expanded(child: Text('I am a skilled/trade professional (e.g. Baker, Plumber)', style: TextStyle(color: Colors.white))),
              ],
            ),
            if (_isSkilledProfessional) _buildTextField(_skilledProfession, 'Specify Skill/Trade'),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Location & Preferences', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: DropdownButtonFormField<String>(
                value: _residenceCountry.text.isEmpty ? null : _residenceCountry.text,
                dropdownColor: const Color(0xFF120B1C),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Resident Country',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
                items: countriesList.map((c) {
                  return DropdownMenuItem<String>(
                    value: c,
                    child: Text(c),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _residenceCountry.text = val;
                      _residenceState.clear();
                    });
                  }
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: DropdownButtonFormField<String>(
                value: _citizenshipCountry.text.isEmpty ? null : _citizenshipCountry.text,
                dropdownColor: const Color(0xFF120B1C),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Citizenship Country / Nationality',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
                items: countriesList.map((c) {
                  return DropdownMenuItem<String>(
                    value: c,
                    child: Text(c),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _citizenshipCountry.text = val;
                      _nationality.text = val;
                    });
                  }
                },
              ),
            ),
            if (_residenceCountry.text.isNotEmpty && countryStates.containsKey(_residenceCountry.text)) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: DropdownButtonFormField<String>(
                  value: countryStates[_residenceCountry.text]!.contains(_residenceState.text) ? _residenceState.text : null,
                  dropdownColor: const Color(0xFF120B1C),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'State / Province',
                    labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  ),
                  items: countryStates[_residenceCountry.text]!.map((s) {
                    return DropdownMenuItem<String>(
                      value: s,
                      child: Text(s),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _residenceState.text = val;
                      });
                    }
                  },
                ),
              ),
            ] else ...[
              _buildTextField(_residenceState, 'Residence State / Province'),
            ],
            _buildTextField(_residenceCity, 'City / Town (Manual Entry)'),
            Row(
              children: [
                Checkbox(value: _willingToRelocate, onChanged: (v) => setState(() => _willingToRelocate = v ?? false)),
                const Expanded(child: Text('Willing to relocate', style: TextStyle(color: Colors.white))),
              ],
            ),
          ],
        );
      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Job Preferences', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_desiredJobTitle, 'Desired Job Title'),
            _buildTextField(_preferredIndustry, 'Preferred Industry'),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: DropdownButtonFormField<String>(
                value: _preferredWorkCountry.isEmpty ? null : _preferredWorkCountry,
                dropdownColor: const Color(0xFF120B1C),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Preferred Work Country',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
                items: countriesList.map((c) {
                  return DropdownMenuItem<String>(
                    value: c,
                    child: Text(c),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _preferredWorkCountry = val;
                    });
                  }
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: TextField(
                controller: _expectedSalary,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  prefixText: '${_getCurrencySymbol(_preferredWorkCountry)} ',
                  prefixStyle: const TextStyle(color: Colors.white70),
                  labelText: 'Expected Salary',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: DropdownButtonFormField<String>(
                value: _availability.text.isEmpty ? null : _availability.text,
                dropdownColor: const Color(0xFF120B1C),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Availability',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
                items: const [
                  DropdownMenuItem<String>(value: 'Immediately', child: Text('Immediately')),
                  DropdownMenuItem<String>(value: '1 week', child: Text('1 week')),
                  DropdownMenuItem<String>(value: '2 weeks', child: Text('2 weeks')),
                  DropdownMenuItem<String>(value: '1 month', child: Text('1 month')),
                  DropdownMenuItem<String>(value: '3 months', child: Text('3 months')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _availability.text = val;
                    });
                  }
                },
              ),
            ),
          ],
        );
      case 5:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Education', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _education.add({'school': '', 'course': '', 'dates': ''});
                });
              },
              child: const Text('Add Education'),
            ),
            const SizedBox(height: 16),
            ...List.generate(_education.length, (index) {
              return Card(
                color: Colors.white.withOpacity(0.05),
                margin: const EdgeInsets.only(bottom: 16.0),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      TextFormField(
                        initialValue: _education[index]['school'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Institution / School', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _education[index]['school'] = val,
                      ),
                      TextFormField(
                        initialValue: _education[index]['course'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Course of Study', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _education[index]['course'] = val,
                      ),
                      TextFormField(
                        initialValue: _education[index]['dates'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Dates (e.g. 2018-2022)', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _education[index]['dates'] = val,
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.redAccent),
                        onPressed: () {
                          setState(() {
                            _education.removeAt(index);
                          });
                        },
                      )
                    ],
                  ),
                ),
              );
            })
          ],
        );
      case 6:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Experience', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),
            const Text('Please add these details on the Web platform for now.', style: TextStyle(color: Colors.white70)),
          ],
        );
      case 7:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Certifications', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _certificates.add({'name': '', 'date': ''});
                });
              },
              child: const Text('Add Certification'),
            ),
            const SizedBox(height: 16),
            ...List.generate(_certificates.length, (index) {
              return Card(
                color: Colors.white.withOpacity(0.05),
                margin: const EdgeInsets.only(bottom: 16.0),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      TextFormField(
                        initialValue: _certificates[index]['name'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Certification Name', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _certificates[index]['name'] = val,
                      ),
                      TextFormField(
                        initialValue: _certificates[index]['date'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Date Obtained', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _certificates[index]['date'] = val,
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.redAccent),
                        onPressed: () {
                          setState(() {
                            _certificates.removeAt(index);
                          });
                        },
                      )
                    ],
                  ),
                ),
              );
            }),
            const Divider(color: Colors.white24, height: 32),
            const Text('Projects', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _projects.add({'title': '', 'description': '', 'liveLink': ''});
                });
              },
              child: const Text('Add Project'),
            ),
            const SizedBox(height: 16),
            ...List.generate(_projects.length, (index) {
              return Card(
                color: Colors.white.withOpacity(0.05),
                margin: const EdgeInsets.only(bottom: 16.0),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      TextFormField(
                        initialValue: _projects[index]['title'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Project Title', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _projects[index]['title'] = val,
                      ),
                      TextFormField(
                        initialValue: _projects[index]['description'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Description', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _projects[index]['description'] = val,
                      ),
                      TextFormField(
                        initialValue: _projects[index]['liveLink'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Live Link (Optional)', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _projects[index]['liveLink'] = val,
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.redAccent),
                        onPressed: () {
                          setState(() {
                            _projects.removeAt(index);
                          });
                        },
                      )
                    ],
                  ),
                ),
              );
            }),
          ],
        );
      case 8:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Social Links & Photo', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_linkedin, 'LinkedIn URL'),
            _buildTextField(_github, 'GitHub URL'),
            _buildTextField(_website, 'Personal Website'),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _pickImage,
              child: CircleAvatar(
                radius: 50,
                backgroundColor: Colors.white.withOpacity(0.1),
                child: const Icon(Icons.camera_alt, size: 40, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Tap to upload', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
          ],
        );
      default:
        return Container();
    }
  }

  Widget _buildEmployerSteps() {
    switch (_currentStep) {
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Company Details', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_companyName, 'Company Name'),
            _buildTextField(_description, 'Description', maxLines: 4),
            _buildTextField(_industry, 'Industry'),
            _buildTextField(_companySize, 'Company Size (e.g. 10-50)'),
            _buildTextField(_foundedYear, 'Founded Year'),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Location & Contact', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            _buildTextField(_locationCity, 'City / Town'),
            _buildTextField(_locationState, 'State'),
            _buildTextField(_locationCountry, 'Country'),
            const SizedBox(height: 16),
            _buildTextField(_hrContactName, 'HR Contact Name'),
            _buildTextField(_hrEmail, 'HR Email'),
            _buildTextField(_hrPhone, 'HR Phone'),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Company Logo', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _pickImage,
              child: CircleAvatar(
                radius: 50,
                backgroundColor: Colors.white.withOpacity(0.1),
                child: const Icon(Icons.camera_alt, size: 40, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Tap to upload', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
          ],
        );
      default:
        return Container();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(backgroundColor: Color(0xFF120B1C), body: Center(child: CircularProgressIndicator()));
    }

    int maxSteps = _user!['role'] == 'JOB_SEEKER' ? 8 : 3;

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Step $_currentStep of $maxSteps', style: TextStyle(color: Colors.white.withOpacity(0.5))),
              const SizedBox(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  child: _user!['role'] == 'JOB_SEEKER' ? _buildSeekerSteps() : _buildEmployerSteps(),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 1)
                    TextButton(
                      onPressed: () => setState(() => _currentStep--),
                      child: const Text('Back', style: TextStyle(color: Colors.white)),
                    )
                  else
                    const SizedBox.shrink(),
                  
                  if (_currentStep < maxSteps)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
                      onPressed: () => setState(() => _currentStep++),
                      child: const Text('Next', style: TextStyle(color: Colors.black)),
                    )
                  else
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
                      onPressed: _isSaving ? null : _saveProfile,
                      child: _isSaving ? const CircularProgressIndicator(color: Colors.white) : const Text('Complete', style: TextStyle(color: Colors.white)),
                    ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
