import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../config/api_config.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  _MarketplaceScreenState createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  List<dynamic> _jobs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadGigs();
  }

  Future<void> _loadGigs() async {
    try {
      final token = await ApiConfig.getToken();
      
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/jobs/marketplace'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        setState(() {
          _jobs = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _oneTapApply(String jobId) async {
    try {
      final token = await ApiConfig.getToken();
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/applications/$jobId/apply'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({'coverLetter': 'One-Tap Marketplace Application via JobHub AI.'})
      );
      
      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('⚡ One-Tap Application Sent!')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to apply or already applied.')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error applying.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.bolt, color: Colors.yellowAccent),
            SizedBox(width: 8),
            Text('Gig Marketplace'),
          ],
        ),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator())
        : _jobs.isEmpty 
          ? Center(child: Text('No gigs available currently.'))
          : ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: _jobs.length,
              itemBuilder: (context, index) {
                final job = _jobs[index];
                return Card(
                  margin: EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: Colors.blueAccent, width: 2),
                    borderRadius: BorderRadius.circular(12)
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Chip(
                          label: Text(job['employmentType'] ?? 'FREELANCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                          backgroundColor: Colors.blue.shade100,
                        ),
                        SizedBox(height: 8),
                        Text(job['title'] ?? '', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(job['employer']?['companyName'] ?? 'Independent', style: TextStyle(color: Colors.grey)),
                        SizedBox(height: 12),
                        Text(job['description'] ?? '', maxLines: 3, overflow: TextOverflow.ellipsis),
                        SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: Icon(Icons.bolt),
                            label: Text('One-Tap Apply'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blueAccent,
                              foregroundColor: Colors.white,
                              padding: EdgeInsets.symmetric(vertical: 12)
                            ),
                            onPressed: () => _oneTapApply(job['id']),
                          ),
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
