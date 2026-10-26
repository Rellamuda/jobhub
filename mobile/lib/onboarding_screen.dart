import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
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

  // Seeker Category: Professional vs Skilled Trade / Artisan
  String _seekerCategory = 'PROFESSIONAL'; // 'PROFESSIONAL' | 'SKILLED_TRADE'
  String _tradeSpecialization = skilledTradesList[0];
  final _customTrade = TextEditingController();

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
  bool _isOpenToRemote = true;

  final _desiredJobTitle = TextEditingController();
  final _preferredIndustry = TextEditingController();
  String _employmentType = 'Full-time';
  String _workArrangement = 'Hybrid';
  final _expectedSalary = TextEditingController();
  final _salaryAmount = TextEditingController();
  String _salaryFrequency = 'Monthly'; // Hourly, Daily, Monthly, Annually
  String _salaryCurrency = '\$';
  final _availability = TextEditingController(text: 'Immediately');
  String _phoneCode = '+1';
  String _hrPhoneCode = '+1';
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
  String _businessType = 'DIRECT_EMPLOYER';
  final _companyName = TextEditingController();

  // Agency Specifics with "Others"
  String _agencyFocusOption = agencyFocusOptions[0];
  final _agencyFocusCustom = TextEditingController();
  String _clientIndustriesOption = clientIndustriesOptions[0];
  final _clientIndustriesCustom = TextEditingController();
  String _agencyPrimaryIndustryOption = primaryIndustryOptions[0];
  final _agencyPrimaryIndustryCustom = TextEditingController();

  final _empWebsite = TextEditingController();
  final _description = TextEditingController();
  final _industry = TextEditingController();
  String _companySizeOption = teamSizeOptions[0];
  String _foundedYearOption = '2020';
  bool _employerRemoteFriendly = true;

  final _locationCountry = TextEditingController();
  final _locationState = TextEditingController();
  final _locationCity = TextEditingController();

  final _hrContactName = TextEditingController();
  final _hrEmail = TextEditingController();
  final _hrPhone = TextEditingController();

  String? _profilePicUrl;

  final List<String> _foundedYearsList = List.generate(70, (i) => (DateTime.now().year - i).toString());
  final List<String> _currencySymbols = [
    '\$', '₦', '£', '€', 'C\$', 'R', 'KSh', 'GH₵', 'A\$', 'AED', '₹', 'CHF'
  ];

  Future<void> _selectDateOfBirth(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF00F0FF),
              onPrimary: Colors.black,
              surface: Color(0xFF16122E),
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF16122E),
          ),
          child: child!,
        );
      },
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
        });

        // Try to fetch existing profile to prepopulate
        final endpoint = userData['role'] == 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
        try {
          final profRes = await http.get(
            Uri.parse('${ApiConfig.baseUrl}$endpoint'),
            headers: {'Authorization': 'Bearer $token'},
          );
          if (profRes.statusCode == 200) {
            final prof = jsonDecode(profRes.body);
            if (prof != null) {
              setState(() {
                if (userData['role'] == 'JOB_SEEKER') {
                  _firstName.text = prof['firstName'] ?? '';
                  _lastName.text = prof['lastName'] ?? '';
                  _otherNames.text = prof['otherNames'] ?? '';
                  _gender = prof['gender'] ?? '';
                  if (prof['dateOfBirth'] != null) {
                    _dateOfBirth.text = prof['dateOfBirth'].toString().split('T')[0];
                  }
                  
                  final rawPhone = prof['phone'] ?? '';
                  PhoneCode? matched;
                  for (final pc in phoneCodes) {
                    if (rawPhone.startsWith(pc.code)) {
                      matched = pc;
                      break;
                    }
                  }
                  if (matched != null) {
                    _phoneCode = matched.code;
                    _phone.text = rawPhone.substring(matched.code.length);
                  } else {
                    _phone.text = rawPhone;
                  }

                  _nationality.text = prof['nationality'] ?? '';
                  _maritalStatus = prof['maritalStatus'] ?? '';
                  _headline.text = prof['headline'] ?? '';
                  _profession.text = prof['profession'] ?? '';

                  if (prof['isSkilledProfessional'] == true) {
                    _seekerCategory = 'SKILLED_TRADE';
                    _isSkilledProfessional = true;
                    final trade = prof['skilledProfession'] ?? prof['profession'] ?? '';
                    if (skilledTradesList.contains(trade)) {
                      _tradeSpecialization = trade;
                    } else if (trade.isNotEmpty) {
                      _tradeSpecialization = 'Other Skilled Trade / Artisan';
                      _customTrade.text = trade;
                    }
                  } else {
                    _seekerCategory = 'PROFESSIONAL';
                    _isSkilledProfessional = false;
                  }

                  _summary.text = prof['summary'] ?? '';
                  _residenceCountry.text = prof['residenceCountry'] ?? '';
                  _residenceState.text = prof['residenceState'] ?? '';
                  _residenceCity.text = prof['residenceCity'] ?? '';
                  _citizenshipCountry.text = prof['citizenshipCountry'] ?? prof['nationality'] ?? '';
                  _willingToRelocate = prof['willingToRelocate'] == true;
                  _isOpenToRemote = prof['remotePreference'] == 'REMOTE_ONLY' || prof['workArrangement'] == 'Remote';

                  _desiredJobTitle.text = prof['desiredJobTitle'] ?? '';
                  _preferredIndustry.text = prof['preferredIndustry'] ?? '';
                  _employmentType = prof['employmentType'] ?? 'Full-time';
                  _workArrangement = prof['workArrangement'] ?? 'Hybrid';

                  final rawSal = prof['expectedSalary'] ?? '';
                  _expectedSalary.text = rawSal;
                  if (rawSal.isNotEmpty) {
                    final parts = rawSal.split(' ');
                    if (parts.length >= 2) {
                      _salaryCurrency = parts[0];
                      _salaryAmount.text = parts[1];
                      if (rawSal.toLowerCase().contains('/ hour') || rawSal.toLowerCase().contains('/ hr')) {
                        _salaryFrequency = 'Hourly';
                      } else if (rawSal.toLowerCase().contains('/ day') || rawSal.toLowerCase().contains('/ daily')) {
                        _salaryFrequency = 'Daily';
                      } else if (rawSal.toLowerCase().contains('/ year') || rawSal.toLowerCase().contains('/ annual')) {
                        _salaryFrequency = 'Annually';
                      } else {
                        _salaryFrequency = 'Monthly';
                      }
                    } else {
                      _salaryAmount.text = rawSal;
                    }
                  }

                  _availability.text = prof['availability'] ?? 'Immediately';
                  if (prof['preferredLocations'] != null) {
                    if (prof['preferredLocations'] is List && prof['preferredLocations'].isNotEmpty) {
                      _preferredWorkCountry = prof['preferredLocations'][0];
                    } else if (prof['preferredLocations'] is String) {
                      _preferredWorkCountry = prof['preferredLocations'];
                    }
                  }
                  if (_preferredWorkCountry.isNotEmpty) {
                    _salaryCurrency = _getCurrencySymbol(_preferredWorkCountry);
                  }
                  _education = List<Map<String, dynamic>>.from(prof['education'] ?? []);
                  _experience = List<Map<String, dynamic>>.from(prof['experience'] ?? []);
                  _certificates = List<Map<String, dynamic>>.from(prof['certificates'] ?? []);
                  _projects = List<Map<String, dynamic>>.from(prof['projects'] ?? []);
                  _profilePicUrl = prof['profilePicture'] ?? '';
                } else {
                  _companyName.text = prof['companyName'] ?? '';
                  _businessType = prof['businessType'] ?? 'DIRECT_EMPLOYER';
                  _description.text = prof['description'] ?? '';
                  _industry.text = prof['industry'] ?? '';
                  _empWebsite.text = prof['website'] ?? '';
                  if (prof['companySize'] != null && teamSizeOptions.contains(prof['companySize'])) {
                    _companySizeOption = prof['companySize'];
                  }
                  if (prof['foundedYear'] != null) {
                    _foundedYearOption = prof['foundedYear'].toString();
                  }
                  _locationCountry.text = prof['locationCountry'] ?? '';
                  _locationState.text = prof['locationState'] ?? '';
                  _locationCity.text = prof['locationCity'] ?? '';
                  _hrContactName.text = prof['hrContactName'] ?? '';
                  _hrEmail.text = prof['hrEmail'] ?? '';
                  
                  final rawHrPhone = prof['hrPhone'] ?? '';
                  PhoneCode? matchedHr;
                  for (final pc in phoneCodes) {
                    if (rawHrPhone.startsWith(pc.code)) {
                      matchedHr = pc;
                      break;
                    }
                  }
                  if (matchedHr != null) {
                    _hrPhoneCode = matchedHr.code;
                    _hrPhone.text = rawHrPhone.substring(matchedHr.code.length);
                  } else {
                    _hrPhone.text = rawHrPhone;
                  }

                  _profilePicUrl = prof['profilePicture'] ?? '';
                }
              });
            }
          }
        } catch (_) {}

        setState(() {
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

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Uploading picture...')),
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
            const SnackBar(content: Text('Picture uploaded successfully!')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload picture.')),
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

  Future<String?> _showSearchableCountryPicker(
    BuildContext context, {
    String title = 'Select Country',
    bool includeGlobal = false,
  }) async {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = [
              if (includeGlobal && ('any country global'.contains(query.toLowerCase()) || query.isEmpty))
                'Any Country (Global)',
              ...countriesList.where((c) => c.toLowerCase().contains(query.toLowerCase().trim())),
            ];

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              padding: EdgeInsets.only(
                top: 16,
                left: 16,
                right: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              decoration: const BoxDecoration(
                color: Color(0xFF16122E),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: Color(0xFF00F0FF), width: 1.5)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Text(
                    title,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    autofocus: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Type to search country...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF00F0FF)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.06),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onChanged: (val) {
                      setModalState(() {
                        query = val;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: filtered.isEmpty
                        ? Center(
                            child: Text(
                              'No country found matching "$query"',
                              style: TextStyle(color: Colors.white.withOpacity(0.4)),
                            ),
                          )
                        : ListView.separated(
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => Divider(color: Colors.white.withOpacity(0.05), height: 1),
                            itemBuilder: (context, index) {
                              final country = filtered[index];
                              return ListTile(
                                title: Text(country, style: const TextStyle(color: Colors.white, fontSize: 15)),
                                trailing: const Icon(Icons.chevron_right, color: Colors.white24, size: 18),
                                onTap: () => Navigator.pop(context, country),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<PhoneCode?> _showSearchablePhoneCodePicker(BuildContext context) async {
    return showModalBottomSheet<PhoneCode>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = phoneCodes.where((pc) {
              final q = query.toLowerCase().trim();
              return pc.name.toLowerCase().contains(q) || pc.code.toLowerCase().contains(q);
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              padding: EdgeInsets.only(
                top: 16,
                left: 16,
                right: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              decoration: const BoxDecoration(
                color: Color(0xFF16122E),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: Color(0xFF00F0FF), width: 1.5)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const Text(
                    'Select Country Dial Code',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    autofocus: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search country name or code...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF00F0FF)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.06),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onChanged: (val) {
                      setModalState(() {
                        query = val;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: filtered.isEmpty
                        ? Center(
                            child: Text(
                              'No code found matching "$query"',
                              style: TextStyle(color: Colors.white.withOpacity(0.4)),
                            ),
                          )
                        : ListView.separated(
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => Divider(color: Colors.white.withOpacity(0.05), height: 1),
                            itemBuilder: (context, index) {
                              final pc = filtered[index];
                              return ListTile(
                                title: Text(pc.name, style: const TextStyle(color: Colors.white, fontSize: 15)),
                                trailing: Text(
                                  pc.code,
                                  style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                onTap: () => Navigator.pop(context, pc),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildPickerButton({
    required String label,
    required String value,
    required String placeholder,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      value.isNotEmpty ? value : placeholder,
                      style: TextStyle(
                        color: value.isNotEmpty ? Colors.white : Colors.white38,
                        fontSize: 15,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: Color(0xFF00F0FF)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, {int maxLines = 1, TextInputType? keyboardType}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
          filled: true,
          fillColor: Colors.white.withOpacity(0.05),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF00F0FF))),
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    final token = await ApiConfig.getToken();
    if (token == null) return;

    final String endpoint = _user!['role'] == 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
    Map<String, dynamic> payload = {};

    if (_user!['role'] == 'JOB_SEEKER') {
      final isSkilled = _seekerCategory == 'SKILLED_TRADE';
      final resolvedTrade = _tradeSpecialization == 'Other Skilled Trade / Artisan' ? _customTrade.text.trim() : _tradeSpecialization;
      final finalProfession = isSkilled ? resolvedTrade : _profession.text.trim();
      final finalSalary = _salaryAmount.text.trim().isNotEmpty
          ? '$_salaryCurrency ${_salaryAmount.text.trim()} / ${_salaryFrequency.toLowerCase()}'
          : _expectedSalary.text.trim();

      payload = {
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'otherNames': _otherNames.text.trim(),
        'dateOfBirth': _dateOfBirth.text.isNotEmpty ? '${_dateOfBirth.text}T00:00:00Z' : null,
        'gender': _gender,
        'phone': '$_phoneCode${_phone.text.trim()}',
        'nationality': _citizenshipCountry.text.isNotEmpty ? _citizenshipCountry.text : _nationality.text,
        'maritalStatus': _maritalStatus,
        'headline': _headline.text.trim(),
        'profession': finalProfession,
        'isSkilledProfessional': isSkilled,
        'skilledProfession': isSkilled ? resolvedTrade : null,
        'summary': _summary.text.trim(),
        'residenceCountry': _residenceCountry.text,
        'residenceState': _residenceState.text,
        'residenceCity': _residenceCity.text,
        'citizenshipCountry': _citizenshipCountry.text,
        'willingToRelocate': _willingToRelocate,
        'remotePreference': _isOpenToRemote ? 'REMOTE_ONLY' : 'FLEXIBLE',
        'desiredJobTitle': _desiredJobTitle.text.trim(),
        'preferredIndustry': _preferredIndustry.text.trim(),
        'employmentType': _employmentType,
        'workArrangement': _isOpenToRemote ? 'Remote' : _workArrangement,
        'expectedSalary': finalSalary,
        'availability': _availability.text,
        'preferredLocations': _preferredWorkCountry,
        'education': _education,
        'experience': _experience,
        'certificates': _certificates,
        'achievements': _achievements,
        'projects': _projects,
        'socialLinks': {
          'linkedin': _linkedin.text.trim(),
          'github': _github.text.trim(),
          'website': _website.text.trim(),
        },
        'profilePicture': _profilePicUrl ?? '',
        'skills': [],
      };
    } else {
      final finalAgencyFocus = _agencyFocusOption == 'Others' ? _agencyFocusCustom.text.trim() : _agencyFocusOption;
      final finalClientIndustries = _clientIndustriesOption == 'Others' ? _clientIndustriesCustom.text.trim() : _clientIndustriesOption;
      final finalIndustry = _businessType == 'RECRUITING_AGENCY'
          ? (_agencyPrimaryIndustryOption == 'Others' ? _agencyPrimaryIndustryCustom.text.trim() : _agencyPrimaryIndustryOption)
          : _industry.text.trim();

      final formattedDesc = _businessType == 'RECRUITING_AGENCY'
          ? '[Recruiting Agency | Focus: $finalAgencyFocus | Clients: $finalClientIndustries | Remote Friendly: ${_employerRemoteFriendly ? 'Yes' : 'No'}] ${_description.text.trim()}'
          : '[Remote Friendly: ${_employerRemoteFriendly ? 'Yes' : 'No'}] ${_description.text.trim()}';

      payload = {
        'companyName': _companyName.text.trim(),
        'businessType': _businessType,
        'website': _empWebsite.text.trim().isNotEmpty ? _empWebsite.text.trim() : null,
        'description': formattedDesc,
        'industry': finalIndustry,
        'companySize': _companySizeOption,
        'foundedYear': int.tryParse(_foundedYearOption),
        'locationCountry': _locationCountry.text,
        'locationState': _locationState.text,
        'locationCity': _locationCity.text,
        'hrContactName': _hrContactName.text.trim(),
        'hrEmail': _hrEmail.text.trim(),
        'hrPhone': '$_hrPhoneCode${_hrPhone.text.trim()}',
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Onboarding completed! Welcome to JobHub 🎉'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        if (_user?['role'] == 'EMPLOYER') {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const EmployerDashboard()),
            (route) => false,
          );
        } else {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const SeekerDashboard()),
            (route) => false,
          );
        }
      } else {
        final err = jsonDecode(res.body);
        _showError(err['message'] ?? 'Failed to save profile');
      }
    } catch (e) {
      _showError('Connection error: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  bool _validateCurrentStep() {
    if (_user == null) return true;
    final isSeeker = _user!['role'] == 'JOB_SEEKER';

    if (isSeeker) {
      switch (_currentStep) {
        case 1:
          if (_firstName.text.trim().isEmpty) {
            _showError('First Name is required');
            return false;
          }
          if (_lastName.text.trim().isEmpty) {
            _showError('Last Name is required');
            return false;
          }
          if (_phone.text.trim().isEmpty || _phone.text.trim().replaceAll(RegExp(r'\D'), '').length < 6) {
            _showError('Please enter a valid Phone Number (minimum 6 digits)');
            return false;
          }
          if (_dateOfBirth.text.trim().isEmpty) {
            _showError('Date of Birth is required');
            return false;
          }
          return true;
        case 2:
          if (_headline.text.trim().isEmpty) {
            _showError('Professional / Trade Headline is required');
            return false;
          }
          if (_seekerCategory == 'SKILLED_TRADE') {
            if (_tradeSpecialization == 'Other Skilled Trade / Artisan' && _customTrade.text.trim().isEmpty) {
              _showError('Please specify your Trade / Craft specialization');
              return false;
            }
          } else {
            if (_profession.text.trim().isEmpty) {
              _showError('Primary Profession is required');
              return false;
            }
          }
          return true;
        case 3:
          if (_residenceCountry.text.trim().isEmpty) {
            _showError('Resident Country is required');
            return false;
          }
          if (_citizenshipCountry.text.trim().isEmpty) {
            _showError('Citizenship Country / Nationality is required');
            return false;
          }
          if (_residenceState.text.trim().isEmpty) {
            _showError('State / Province / Region is required');
            return false;
          }
          if (_residenceCity.text.trim().isEmpty) {
            _showError('City / Town is required');
            return false;
          }
          return true;
        case 4:
          if (_desiredJobTitle.text.trim().isEmpty) {
            _showError('Desired Job Title is required');
            return false;
          }
          if (_preferredWorkCountry.trim().isEmpty) {
            _showError('Preferred Work Country is required (choose Any Country if flexible)');
            return false;
          }
          if (_salaryAmount.text.trim().isEmpty && _expectedSalary.text.trim().isEmpty) {
            _showError('Please enter your Desired / Expected Compensation amount');
            return false;
          }
          return true;
        default:
          return true;
      }
    } else {
      switch (_currentStep) {
        case 1:
          if (_companyName.text.trim().isEmpty) {
            _showError('Company or Agency Name is required');
            return false;
          }
          if (_businessType == 'RECRUITING_AGENCY') {
            if (_agencyFocusOption == 'Others' && _agencyFocusCustom.text.trim().isEmpty) {
              _showError('Please specify your Agency Focus');
              return false;
            }
            if (_clientIndustriesOption == 'Others' && _clientIndustriesCustom.text.trim().isEmpty) {
              _showError('Please specify Client Companies / Industries Served');
              return false;
            }
            if (_agencyPrimaryIndustryOption == 'Others' && _agencyPrimaryIndustryCustom.text.trim().isEmpty) {
              _showError('Please specify your Primary Industry / Sector');
              return false;
            }
          } else {
            if (_industry.text.trim().isEmpty) {
              _showError('Industry is required');
              return false;
            }
          }
          if (_description.text.trim().isEmpty) {
            _showError('Company / Agency Description is required');
            return false;
          }
          return true;
        case 2:
          if (_locationCountry.text.trim().isEmpty) {
            _showError('Country is required');
            return false;
          }
          if (_locationState.text.trim().isEmpty) {
            _showError('State / Province is required');
            return false;
          }
          if (_locationCity.text.trim().isEmpty) {
            _showError('City is required');
            return false;
          }
          if (_hrContactName.text.trim().isEmpty) {
            _showError('HR Contact Name is required');
            return false;
          }
          final emailPattern = RegExp(r'^[\w\.\-]+@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)+$');
          if (_hrEmail.text.trim().isEmpty || !emailPattern.hasMatch(_hrEmail.text.trim())) {
            _showError('Please enter a valid HR Email address');
            return false;
          }
          if (_hrPhone.text.trim().isEmpty || _hrPhone.text.trim().replaceAll(RegExp(r'\D'), '').length < 6) {
            _showError('Please enter a valid HR Phone Number');
            return false;
          }
          return true;
        default:
          return true;
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
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
            const SizedBox(height: 6),
            Text('Enter your basic contact and demographic details.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 20),
            _buildTextField(_firstName, 'First Name *'),
            _buildTextField(_lastName, 'Last Name *'),
            _buildTextField(_otherNames, 'Other Names (Optional)'),
            
            // Searchable Country Phone Code Row
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InkWell(
                    onTap: () async {
                      final selected = await _showSearchablePhoneCodePicker(context);
                      if (selected != null) {
                        setState(() {
                          _phoneCode = selected.code;
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 58,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.12)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_phoneCode, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, color: Color(0xFF00F0FF), size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Phone Number *',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF00F0FF))),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: DropdownButtonFormField<String>(
                      value: _gender.isNotEmpty ? _gender : null,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Gender',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Male', child: Text('Male')),
                        DropdownMenuItem(value: 'Female', child: Text('Female')),
                        DropdownMenuItem(value: 'Other', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _gender = v ?? ''),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: DropdownButtonFormField<String>(
                      value: _maritalStatus.isNotEmpty ? _maritalStatus : null,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Marital Status',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Single', child: Text('Single')),
                        DropdownMenuItem(value: 'Married', child: Text('Married')),
                        DropdownMenuItem(value: 'Other', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _maritalStatus = v ?? ''),
                    ),
                  ),
                ),
              ],
            ),

            GestureDetector(
              onTap: () => _selectDateOfBirth(context),
              child: AbsorbPointer(
                child: _buildTextField(_dateOfBirth, 'Date of Birth (YYYY-MM-DD) *'),
              ),
            ),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Career Track & Expertise', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Select whether your background is in corporate/professional work or specialized crafts & trades.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 16),

            // Category Selector Cards
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _seekerCategory = 'PROFESSIONAL';
                        _isSkilledProfessional = false;
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _seekerCategory == 'PROFESSIONAL' ? const Color(0xFF00F0FF).withOpacity(0.15) : Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _seekerCategory == 'PROFESSIONAL' ? const Color(0xFF00F0FF) : Colors.white12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.business_center, color: _seekerCategory == 'PROFESSIONAL' ? const Color(0xFF00F0FF) : Colors.white70, size: 18),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Corporate',
                                  style: TextStyle(
                                    color: _seekerCategory == 'PROFESSIONAL' ? const Color(0xFF00F0FF) : Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Software, Finance, Medical, Office & Management',
                            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _seekerCategory = 'SKILLED_TRADE';
                        _isSkilledProfessional = true;
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _seekerCategory == 'SKILLED_TRADE' ? const Color(0xFF00F0FF).withOpacity(0.15) : Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _seekerCategory == 'SKILLED_TRADE' ? const Color(0xFF00F0FF) : Colors.white12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.build, color: _seekerCategory == 'SKILLED_TRADE' ? const Color(0xFF00F0FF) : Colors.white70, size: 18),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Skilled Trade',
                                  style: TextStyle(
                                    color: _seekerCategory == 'SKILLED_TRADE' ? const Color(0xFF00F0FF) : Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Electricians, Plumbers, Welders, Mechanics & Chefs',
                            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Skilled Trade Specifics
            if (_seekerCategory == 'SKILLED_TRADE') ...[
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00F0FF).withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Trade / Craft Specialization *', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _tradeSpecialization,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: skilledTradesList.map((trade) {
                        return DropdownMenuItem<String>(
                          value: trade,
                          child: Text(trade, overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _tradeSpecialization = val;
                          });
                        }
                      },
                    ),
                    if (_tradeSpecialization == 'Other Skilled Trade / Artisan') ...[
                      const SizedBox(height: 10),
                      _buildTextField(_customTrade, 'Specify Your Skilled Trade / Craft *'),
                    ],
                  ],
                ),
              ),
            ],

            _buildTextField(
              _headline,
              _seekerCategory == 'SKILLED_TRADE'
                  ? 'Trade Headline (e.g. Master Industrial Electrician | 10 Yrs) *'
                  : 'Professional Headline (e.g. Senior Software Architect) *',
            ),

            if (_seekerCategory == 'PROFESSIONAL') ...[
              _buildTextField(_profession, 'Primary Profession (e.g. Software Engineer, Doctor) *'),
            ],

            _buildTextField(
              _summary,
              _seekerCategory == 'SKILLED_TRADE'
                  ? 'Trade Profile (hands-on tools, apprenticeships & specialties)'
                  : 'Professional Summary (About Me)',
              maxLines: 4,
            ),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Location & Residency', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Where do you currently reside and hold citizenship?', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 20),

            // Resident Country (Searchable Picker)
            _buildPickerButton(
              label: 'Resident Country *',
              value: _residenceCountry.text,
              placeholder: 'Tap to search & select resident country',
              onTap: () async {
                final selected = await _showSearchableCountryPicker(context, title: 'Select Resident Country');
                if (selected != null) {
                  setState(() {
                    _residenceCountry.text = selected;
                    _residenceState.clear();
                    if (_preferredWorkCountry.isEmpty) {
                      _salaryCurrency = _getCurrencySymbol(selected);
                    }
                  });
                }
              },
            ),

            // Citizenship Country / Nationality (Searchable Picker)
            _buildPickerButton(
              label: 'Citizenship Country / Nationality *',
              value: _citizenshipCountry.text,
              placeholder: 'Tap to search & select citizenship / passport country',
              onTap: () async {
                final selected = await _showSearchableCountryPicker(context, title: 'Select Citizenship / Nationality');
                if (selected != null) {
                  setState(() {
                    _citizenshipCountry.text = selected;
                    _nationality.text = selected;
                  });
                }
              },
            ),

            // Resident State / Province auto-populated from countryStates
            if (_residenceCountry.text.isNotEmpty && countryStates.containsKey(_residenceCountry.text)) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Resident State / Province / Region *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: countryStates[_residenceCountry.text]!.contains(_residenceState.text) ? _residenceState.text : null,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Select State / Region',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: [
                        ...countryStates[_residenceCountry.text]!.map((s) {
                          return DropdownMenuItem<String>(
                            value: s,
                            child: Text(s),
                          );
                        }),
                        const DropdownMenuItem<String>(
                          value: '__MANUAL__',
                          child: Text('Other / Enter Manually', style: TextStyle(color: Color(0xFF00F0FF))),
                        ),
                      ],
                      onChanged: (val) {
                        if (val == '__MANUAL__') {
                          setState(() {
                            _residenceState.clear();
                          });
                        } else if (val != null) {
                          setState(() {
                            _residenceState.text = val;
                          });
                        }
                      },
                    ),
                    if (_residenceState.text.isEmpty || !countryStates[_residenceCountry.text]!.contains(_residenceState.text)) ...[
                      const SizedBox(height: 8),
                      _buildTextField(_residenceState, 'Enter State / Region Manually *'),
                    ],
                  ],
                ),
              ),
            ] else ...[
              _buildTextField(_residenceState, 'Resident State / Province / Region *'),
            ],

            _buildTextField(_residenceCity, 'City / Town (Manual Entry) *'),

            // Remote Job Preferences Provision
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Checkbox(
                        value: _isOpenToRemote,
                        activeColor: const Color(0xFF00F0FF),
                        onChanged: (v) => setState(() => _isOpenToRemote = v ?? false),
                      ),
                      const Expanded(
                        child: Text(
                          '🌐 Open to Remote Work / Seeking Remote Roles',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Checkbox(
                        value: _willingToRelocate,
                        activeColor: const Color(0xFF00F0FF),
                        onChanged: (v) => setState(() => _willingToRelocate = v ?? false),
                      ),
                      const Expanded(
                        child: Text(
                          '✈️ Willing to relocate for the right role',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );
      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Job Preferences & Pay', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Specify your target role, work country, and expected compensation.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 20),

            _buildTextField(_desiredJobTitle, 'Desired Job Title *'),
            _buildTextField(_preferredIndustry, 'Preferred Industry (Optional)'),

            Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: DropdownButtonFormField<String>(
                      value: _employmentType,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Employment Type',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Full-time', child: Text('Full-time')),
                        DropdownMenuItem(value: 'Part-time', child: Text('Part-time')),
                        DropdownMenuItem(value: 'Contract', child: Text('Contract')),
                        DropdownMenuItem(value: 'Temporary', child: Text('Temporary / Daily')),
                      ],
                      onChanged: (v) => setState(() => _employmentType = v ?? 'Full-time'),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: DropdownButtonFormField<String>(
                      value: _workArrangement,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Work Arrangement',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Remote', child: Text('Remote')),
                        DropdownMenuItem(value: 'Hybrid', child: Text('Hybrid')),
                        DropdownMenuItem(value: 'On-site', child: Text('On-site')),
                      ],
                      onChanged: (v) => setState(() => _workArrangement = v ?? 'Hybrid'),
                    ),
                  ),
                ),
              ],
            ),

            // Preferred Work Country (Searchable Picker)
            _buildPickerButton(
              label: 'Preferred Work Country *',
              value: _preferredWorkCountry,
              placeholder: 'Select country to work in (or Any Country)',
              onTap: () async {
                final selected = await _showSearchableCountryPicker(context, title: 'Preferred Work Country', includeGlobal: true);
                if (selected != null) {
                  setState(() {
                    _preferredWorkCountry = selected;
                    if (selected.contains('Any Country')) {
                      _salaryCurrency = '\$';
                    } else {
                      _salaryCurrency = _getCurrencySymbol(selected);
                    }
                  });
                }
              },
            ),

            // Flexible Compensation: Amount, Currency, and Frequency (Hourly, Daily, Monthly, Annually)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Expected / Desired Compensation *', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(
                    'Specify rate per hour, daily, monthly or annually. Global roles default to USD.',
                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Currency Selector
                      SizedBox(
                        width: 75,
                        child: DropdownButtonFormField<String>(
                          value: _currencySymbols.contains(_salaryCurrency) ? _salaryCurrency : '\$',
                          dropdownColor: const Color(0xFF16122E),
                          style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          ),
                          items: _currencySymbols.map((curr) {
                            return DropdownMenuItem<String>(value: curr, child: Text(curr));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _salaryCurrency = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Amount
                      Expanded(
                        child: TextField(
                          controller: _salaryAmount,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'e.g. 50 or 5,000',
                            hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Frequency
                      SizedBox(
                        width: 100,
                        child: DropdownButtonFormField<String>(
                          value: _salaryFrequency,
                          dropdownColor: const Color(0xFF16122E),
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'Hourly', child: Text('/ hour')),
                            DropdownMenuItem(value: 'Daily', child: Text('/ day')),
                            DropdownMenuItem(value: 'Monthly', child: Text('/ month')),
                            DropdownMenuItem(value: 'Annually', child: Text('/ year')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _salaryFrequency = val);
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: DropdownButtonFormField<String>(
                value: _availability.text.isNotEmpty ? _availability.text : 'Immediately',
                dropdownColor: const Color(0xFF16122E),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Availability',
                  labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                ),
                items: const [
                  DropdownMenuItem(value: 'Immediately', child: Text('Immediately')),
                  DropdownMenuItem(value: '1 week', child: Text('Within 1 week')),
                  DropdownMenuItem(value: '2 weeks', child: Text('Within 2 weeks')),
                  DropdownMenuItem(value: '1 month', child: Text('Within 1 month')),
                  DropdownMenuItem(value: '3 months', child: Text('Within 3 months')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _availability.text = val);
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
                        decoration: const InputDecoration(labelText: 'Institution / School / Trade Academy', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _education[index]['school'] = val,
                      ),
                      TextFormField(
                        initialValue: _education[index]['course'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Course of Study / Trade Certification', labelStyle: TextStyle(color: Colors.white70)),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Work Experience', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _experience.add({'company': '', 'role': '', 'dates': '', 'responsibilities': ''});
                    });
                  },
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Role'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_experience.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.work_outline, size: 40, color: Colors.white38),
                    const SizedBox(height: 8),
                    const Text('No work experience records added yet.', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    const Text('Tap "Add Role" above to enter your career or trade experience.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white38, fontSize: 12)),
                  ],
                ),
              )
            else
              ...List.generate(_experience.length, (index) {
                return Card(
                  color: Colors.white.withOpacity(0.05),
                  margin: const EdgeInsets.only(bottom: 16.0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.white.withOpacity(0.1))),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Experience #${index + 1}', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent, size: 20),
                              onPressed: () {
                                setState(() {
                                  _experience.removeAt(index);
                                });
                              },
                            ),
                          ],
                        ),
                        TextFormField(
                          initialValue: _experience[index]['company'] ?? '',
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Company / Contractor / Self-Employed', labelStyle: TextStyle(color: Colors.white70)),
                          onChanged: (val) => _experience[index]['company'] = val,
                        ),
                        TextFormField(
                          initialValue: _experience[index]['role'] ?? '',
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Job Title / Trade Role', labelStyle: TextStyle(color: Colors.white70)),
                          onChanged: (val) => _experience[index]['role'] = val,
                        ),
                        TextFormField(
                          initialValue: _experience[index]['dates'] ?? '',
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Dates (e.g. Jan 2021 - Present)', labelStyle: TextStyle(color: Colors.white70)),
                          onChanged: (val) => _experience[index]['dates'] = val,
                        ),
                        TextFormField(
                          initialValue: _experience[index]['responsibilities'] ?? '',
                          maxLines: 3,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Responsibilities, Tools & Achievements', labelStyle: TextStyle(color: Colors.white70)),
                          onChanged: (val) => _experience[index]['responsibilities'] = val,
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        );
      case 7:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Certifications & Projects', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _certificates.add({'name': '', 'date': ''});
                });
              },
              child: const Text('Add Certification / License'),
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
                        decoration: const InputDecoration(labelText: 'License / Certification Name', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _certificates[index]['name'] = val,
                      ),
                      TextFormField(
                        initialValue: _certificates[index]['date'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Date Obtained or Issuing Body', labelStyle: TextStyle(color: Colors.white70)),
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
            const Text('Projects / Completed Contracts', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
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
                        decoration: const InputDecoration(labelText: 'Project / Job Title', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _projects[index]['title'] = val,
                      ),
                      TextFormField(
                        initialValue: _projects[index]['description'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Description & Scope', labelStyle: TextStyle(color: Colors.white70)),
                        onChanged: (val) => _projects[index]['description'] = val,
                      ),
                      TextFormField(
                        initialValue: _projects[index]['liveLink'] ?? '',
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Live Link or Evidence (Optional)', labelStyle: TextStyle(color: Colors.white70)),
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
            _buildTextField(_github, 'GitHub / Portfolio URL'),
            _buildTextField(_website, 'Personal Website'),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _pickImage,
              child: CircleAvatar(
                radius: 50,
                backgroundColor: Colors.white.withOpacity(0.1),
                backgroundImage: _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                    ? NetworkImage(_profilePicUrl!)
                    : null,
                child: _profilePicUrl == null || _profilePicUrl!.isEmpty
                    ? const Icon(Icons.camera_alt, size: 40, color: Colors.white)
                    : null,
              ),
            ),
            const SizedBox(height: 16),
            const Text('Tap to upload photo', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
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
            const Text('Organization & Hiring Model', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Define your company structure, recruiting model, and remote hiring policy.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 16),

            // Organization Type Switcher
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select Organization Type:', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _businessType = 'DIRECT_EMPLOYER'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                            decoration: BoxDecoration(
                              color: _businessType == 'DIRECT_EMPLOYER' ? const Color(0xFF00F0FF).withOpacity(0.2) : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: _businessType == 'DIRECT_EMPLOYER' ? const Color(0xFF00F0FF) : Colors.white24),
                            ),
                            child: Center(
                              child: Text('🏢 Direct Company', style: TextStyle(color: _businessType == 'DIRECT_EMPLOYER' ? const Color(0xFF00F0FF) : Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _businessType = 'RECRUITING_AGENCY'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                            decoration: BoxDecoration(
                              color: _businessType == 'RECRUITING_AGENCY' ? const Color(0xFF00F0FF).withOpacity(0.2) : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: _businessType == 'RECRUITING_AGENCY' ? const Color(0xFF00F0FF) : Colors.white24),
                            ),
                            child: Center(
                              child: Text('🤝 Recruiting Agency', style: TextStyle(color: _businessType == 'RECRUITING_AGENCY' ? const Color(0xFF00F0FF) : Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            _buildTextField(_companyName, _businessType == 'RECRUITING_AGENCY' ? 'Agency / Firm Name *' : 'Company Name *'),

            // Recruiting Agency Overhaul
            if (_businessType == 'RECRUITING_AGENCY') ...[
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00F0FF).withOpacity(0.04),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recruiting Agency Parameters', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 10),

                    // Agency Focus Dropdown + "Others"
                    Text('Agency Focus *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _agencyFocusOption,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: agencyFocusOptions.map((opt) {
                        return DropdownMenuItem<String>(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _agencyFocusOption = val);
                      },
                    ),
                    if (_agencyFocusOption == 'Others') ...[
                      const SizedBox(height: 8),
                      _buildTextField(_agencyFocusCustom, 'Specify Agency Focus *'),
                    ],
                    const SizedBox(height: 12),

                    // Client Industries Dropdown + "Others"
                    Text('Client Companies / Industry Served *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _clientIndustriesOption,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: clientIndustriesOptions.map((opt) {
                        return DropdownMenuItem<String>(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _clientIndustriesOption = val);
                      },
                    ),
                    if (_clientIndustriesOption == 'Others') ...[
                      const SizedBox(height: 8),
                      _buildTextField(_clientIndustriesCustom, 'Specify Client Industries Served *'),
                    ],
                    const SizedBox(height: 12),

                    // Primary Industry / Sector Dropdown + "Others"
                    Text('Primary Industry / Sector *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _agencyPrimaryIndustryOption,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: primaryIndustryOptions.map((opt) {
                        return DropdownMenuItem<String>(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _agencyPrimaryIndustryOption = val);
                      },
                    ),
                    if (_agencyPrimaryIndustryOption == 'Others') ...[
                      const SizedBox(height: 8),
                      _buildTextField(_agencyPrimaryIndustryCustom, 'Specify Primary Industry / Sector *'),
                    ],
                  ],
                ),
              ),
            ] else ...[
              _buildTextField(_industry, 'Primary Industry / Sector *'),
            ],

            // Team Size and Founded Year Dropdowns
            Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Team Size *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: _companySizeOption,
                          dropdownColor: const Color(0xFF16122E),
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                          ),
                          items: teamSizeOptions.map((sz) {
                            return DropdownMenuItem(value: sz, child: Text(sz, overflow: TextOverflow.ellipsis));
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => _companySizeOption = v);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Founded Year *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: _foundedYearOption,
                          dropdownColor: const Color(0xFF16122E),
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                          ),
                          items: _foundedYearsList.map((yr) {
                            return DropdownMenuItem(value: yr, child: Text(yr));
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => _foundedYearOption = v);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Website is Optional; Registration Number removed
            _buildTextField(_empWebsite, 'Official Website URL (Optional)'),
            _buildTextField(
              _description,
              _businessType == 'RECRUITING_AGENCY' ? 'Agency Description & Placement Record *' : 'Company Description *',
              maxLines: 3,
            ),

            // Remote Employer Provision
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  Checkbox(
                    value: _employerRemoteFriendly,
                    activeColor: const Color(0xFF00F0FF),
                    onChanged: (v) => setState(() => _employerRemoteFriendly = v ?? false),
                  ),
                  const Expanded(
                    child: Text(
                      '🌐 Remote Friendly: Our organization is hiring remote / distributed workers',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Location & Contact Details', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Provide your organization headquarters and primary HR contact person.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 20),

            // Location Country (Searchable Picker)
            _buildPickerButton(
              label: 'Country *',
              value: _locationCountry.text,
              placeholder: 'Tap to search & select country',
              onTap: () async {
                final selected = await _showSearchableCountryPicker(context, title: 'Select Organization Country');
                if (selected != null) {
                  setState(() {
                    _locationCountry.text = selected;
                    _locationState.clear();
                  });
                }
              },
            ),

            // Location State / Province auto populated
            if (_locationCountry.text.isNotEmpty && countryStates.containsKey(_locationCountry.text)) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('State / Province / Region *', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: countryStates[_locationCountry.text]!.contains(_locationState.text) ? _locationState.text : null,
                      dropdownColor: const Color(0xFF16122E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Select State',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                      ),
                      items: [
                        ...countryStates[_locationCountry.text]!.map((s) {
                          return DropdownMenuItem<String>(value: s, child: Text(s));
                        }),
                        const DropdownMenuItem<String>(
                          value: '__MANUAL__',
                          child: Text('Other / Enter Manually', style: TextStyle(color: Color(0xFF00F0FF))),
                        ),
                      ],
                      onChanged: (val) {
                        if (val == '__MANUAL__') {
                          setState(() {
                            _locationState.clear();
                          });
                        } else if (val != null) {
                          setState(() {
                            _locationState.text = val;
                          });
                        }
                      },
                    ),
                    if (_locationState.text.isEmpty || !countryStates[_locationCountry.text]!.contains(_locationState.text)) ...[
                      const SizedBox(height: 8),
                      _buildTextField(_locationState, 'Enter State / Region Manually *'),
                    ],
                  ],
                ),
              ),
            ] else ...[
              _buildTextField(_locationState, 'State / Province / Region *'),
            ],

            _buildTextField(_locationCity, 'City / Town *'),

            const SizedBox(height: 8),
            const Divider(color: Colors.white24, height: 24),
            const Text('HR & Primary Contact Person', style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 14),

            _buildTextField(_hrContactName, 'HR Contact Name *'),
            _buildTextField(_hrEmail, 'HR Contact Email *', keyboardType: TextInputType.emailAddress),

            // HR Phone with Searchable Dial Code Picker
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InkWell(
                    onTap: () async {
                      final selected = await _showSearchablePhoneCodePicker(context);
                      if (selected != null) {
                        setState(() {
                          _hrPhoneCode = selected.code;
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 58,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.12)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_hrPhoneCode, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, color: Color(0xFF00F0FF), size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _hrPhone,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'HR Phone Number *',
                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF00F0FF))),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Company / Agency Logo', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Upload your logo to appear on job postings and candidate correspondence.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _pickImage,
              child: CircleAvatar(
                radius: 60,
                backgroundColor: Colors.white.withOpacity(0.1),
                backgroundImage: _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                    ? NetworkImage(_profilePicUrl!)
                    : null,
                child: _profilePicUrl == null || _profilePicUrl!.isEmpty
                    ? const Icon(Icons.camera_alt, size: 44, color: Colors.white)
                    : null,
              ),
            ),
            const SizedBox(height: 16),
            const Text('Tap to upload logo', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
          ],
        );
      default:
        return Container();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(backgroundColor: Color(0xFF120B1C), body: Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF))));
    }

    final int maxSteps = _user?['role'] == 'JOB_SEEKER' ? 8 : 3;

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Step $_currentStep of $maxSteps', style: TextStyle(color: Colors.white.withOpacity(0.6), fontWeight: FontWeight.w600)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00F0FF).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3)),
                    ),
                    child: Text(
                      _user?['role'] == 'JOB_SEEKER' ? 'Job Seeker Profile' : 'Employer Profile',
                      style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  child: _user?['role'] == 'JOB_SEEKER' ? _buildSeekerSteps() : _buildEmployerSteps(),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 1)
                    TextButton(
                      onPressed: () => setState(() => _currentStep--),
                      child: const Text('Back', style: TextStyle(color: Colors.white70, fontSize: 15)),
                    )
                  else
                    const SizedBox.shrink(),
                  
                  if (_currentStep < maxSteps)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00F0FF),
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        if (_validateCurrentStep()) {
                          setState(() => _currentStep++);
                        }
                      },
                      child: const Text('Next', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 15)),
                    )
                  else
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _isSaving ? null : () {
                        if (_validateCurrentStep()) {
                          _saveProfile();
                        }
                      },
                      child: _isSaving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Complete & Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
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
