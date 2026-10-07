import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';

class CompanyProfileScreen extends StatefulWidget {
  final String employerId;

  const CompanyProfileScreen({super.key, required this.employerId});

  @override
  _CompanyProfileScreenState createState() => _CompanyProfileScreenState();
}

class _CompanyProfileScreenState extends State<CompanyProfileScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _company;
  List<dynamic> _jobs = [];

  @override
  void initState() {
    super.initState();
    _fetchCompanyData();
  }

  Future<void> _fetchCompanyData() async {
    final token = await ApiConfig.getToken();

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/employer/${widget.employerId}/public'),
        headers: token != null ? {'Authorization': 'Bearer $token'} : {},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _company = data['employer'];
          _jobs = data['jobs'];
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load company profile');
      }
    } catch (e) {
      print('Error: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Company Profile')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_company == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Company Profile')),
        body: const Center(child: Text('Company not found')),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _company!['bannerImage'] != null
                  ? Image.network(_company!['bannerImage'], fit: BoxFit.cover)
                  : Container(color: Colors.grey[800]),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: _company!['profilePicture'] != null
                            ? NetworkImage(_company!['profilePicture'])
                            : null,
                        child: _company!['profilePicture'] == null
                            ? const Icon(Icons.business, size: 40)
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _company!['companyName'] ?? 'Unknown Company',
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                            ),
                            if (_company!['verificationStatus'] == 'VERIFIED')
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.verified, color: Colors.blue, size: 16),
                                    SizedBox(width: 4),
                                    Text('Verified Employer', style: TextStyle(color: Colors.blue, fontSize: 12)),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text('About the Company', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(_company!['companyDescription'] ?? 'No description provided.', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 24),
                  
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      if (_company!['industry'] != null)
                        _buildInfoChip(Icons.domain, _company!['industry']),
                      if (_company!['companySize'] != null)
                        _buildInfoChip(Icons.people, '${_company!['companySize']} employees'),
                      if (_company!['foundedYear'] != null)
                        _buildInfoChip(Icons.calendar_today, 'Founded ${_company!['foundedYear']}'),
                      if (_company!['headquarters'] != null)
                        _buildInfoChip(Icons.location_city, _company!['headquarters']),
                    ],
                  ),
                  
                  if (_company!['responseTimeRating'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: _buildInfoChip(Icons.timer, 'Avg Response Time: ${_company!['responseTimeRating']} hrs'),
                    ),

                  if (_company!['companyVideos'] != null && (_company!['companyVideos'] as List).isNotEmpty) ...[
                    const SizedBox(height: 32),
                    const Text('Office Tour', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.grey[900],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(child: Icon(Icons.play_circle_fill, size: 64, color: Colors.blue)),
                    ),
                  ],

                  if (_company!['testimonials'] != null && (_company!['testimonials'] as List).isNotEmpty) ...[
                    const SizedBox(height: 32),
                    const Text('Employee Testimonials', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    ...(_company!['testimonials'] as List).map((t) => Card(
                      color: Colors.grey[900],
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('"${t['content']}"', style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.grey)),
                            const SizedBox(height: 8),
                            Text('- ${t['author']}, ${t['role']}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                          ],
                        ),
                      ),
                    )).toList(),
                  ],
                  
                  const SizedBox(height: 32),
                  const Text('Open Positions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  
                  if (_jobs.isEmpty)
                    const Text('No open positions right now.', style: TextStyle(color: Colors.grey))
                  else
                    ..._jobs.map((job) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: Colors.grey[900],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job['title'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 16, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(job['location'] ?? 'Anywhere', style: const TextStyle(color: Colors.grey)),
                                if (job['isRemote'] == true) ...[
                                  const SizedBox(width: 8),
                                  const Text('(Remote)', style: TextStyle(color: Colors.blue)),
                                ]
                              ],
                            ),
                          ],
                        ),
                      ),
                    )).toList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.grey),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }
}
