import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../widgets/glass_card.dart';
import '../config/api_config.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  List<Map<String, dynamic>> credentials = [
    {
      'type': 'DEGREE',
      'name': 'B.Sc. Computer Science',
      'issuer': 'Stanford University',
      'status': 'VERIFIED',
      'icon': Icons.school,
      'date': '2020-05-15'
    },
    {
      'type': 'CERTIFICATE',
      'name': 'AWS Solutions Architect',
      'issuer': 'Amazon Web Services',
      'status': 'VERIFIED',
      'icon': Icons.cloud_done,
      'date': '2023-08-10'
    },
    {
      'type': 'ID',
      'name': 'National Passport',
      'issuer': 'Govt. Issued',
      'status': 'PENDING',
      'icon': Icons.badge,
      'date': '2024-01-20'
    },
  ];

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchCredentials();
  }

  Future<void> _fetchCredentials() async {
    try {
      final headers = await ApiConfig.authHeaders();
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profiles/credentials'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        if (data.isNotEmpty) {
          setState(() {
            credentials = data.map((item) {
              return {
                'id': item['id'],
                'type': item['type'] ?? 'CERTIFICATE',
                'name': item['name'] ?? 'Credential',
                'issuer': item['issuer'] ?? 'Institution',
                'status': item['verificationStatus'] ?? 'PENDING',
                'date': item['issueDate'] != null ? item['issueDate'].toString().split('T')[0] : 'Recent',
                'icon': _getIconForType(item['type'] ?? 'CERTIFICATE'),
              };
            }).toList();
          });
        }
      }
    } catch (e) {
      // Keep initial fallback credentials
      debugPrint('Error fetching credentials: $e');
    }
  }

  IconData _getIconForType(String type) {
    switch (type.toUpperCase()) {
      case 'DEGREE':
        return Icons.school;
      case 'CERTIFICATE':
        return Icons.cloud_done;
      case 'LICENSE':
        return Icons.verified_user;
      default:
        return Icons.badge;
    }
  }

  void _showAddCredentialModal() {
    final nameController = TextEditingController();
    final issuerController = TextEditingController();
    final urlController = TextEditingController();
    String selectedType = 'CERTIFICATE';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1430),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Add Digital Credential',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text('Credential Type', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedType,
                          dropdownColor: const Color(0xFF251A3E),
                          isExpanded: true,
                          style: const TextStyle(color: Colors.white),
                          items: const [
                            DropdownMenuItem(value: 'CERTIFICATE', child: Text('Professional Certificate')),
                            DropdownMenuItem(value: 'DEGREE', child: Text('Degree / Diploma')),
                            DropdownMenuItem(value: 'LICENSE', child: Text('Professional License')),
                            DropdownMenuItem(value: 'ID', child: Text('National / Govt ID')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() => selectedType = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Credential Name / Title', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'e.g. AWS Solutions Architect Associate',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Issuing Organization', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: issuerController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'e.g. Amazon Web Services, MIT',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Verification Link or ID (Optional)', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: urlController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'https://credly.com/...',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: () async {
                          if (nameController.text.trim().isEmpty || issuerController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please fill name and issuer')),
                            );
                            return;
                          }

                          final newCred = {
                            'type': selectedType,
                            'name': nameController.text.trim(),
                            'issuer': issuerController.text.trim(),
                            'status': 'PENDING',
                            'date': DateTime.now().toString().split(' ')[0],
                            'icon': _getIconForType(selectedType),
                          };

                          setState(() {
                            credentials.insert(0, newCred);
                          });

                          Navigator.pop(context);

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Credential added! Verification requested.')),
                          );

                          // Attempt server sync
                          try {
                            final headers = await ApiConfig.authHeaders();
                            await http.post(
                              Uri.parse('${ApiConfig.baseUrl}/profiles/credentials'),
                              headers: headers,
                              body: json.encode({
                                'type': selectedType,
                                'name': nameController.text.trim(),
                                'issuer': issuerController.text.trim(),
                                'documentUrl': urlController.text.trim(),
                              }),
                            );
                          } catch (e) {
                            debugPrint('Server sync failed: $e');
                          }
                        },
                        child: const Text(
                          'Submit Credential',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Digital Credential Wallet'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddCredentialModal,
        icon: const Icon(Icons.upload_file),
        label: const Text('Add Credential'),
        backgroundColor: Colors.blueAccent,
      ),
      body: credentials.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.account_balance_wallet_outlined, size: 64, color: Colors.white.withOpacity(0.4)),
                  const SizedBox(height: 16),
                  const Text('No credentials yet', style: TextStyle(color: Colors.white70, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text('Add your certificates & degrees to stand out', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: credentials.length,
              itemBuilder: (context, index) {
                final cred = credentials[index];
                final isVerified = cred['status'] == 'VERIFIED';
                
                return GlassCard(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: EdgeInsets.zero,
                  color: isVerified ? Colors.green : Colors.yellow,
                  opacity: 0.05,
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: CircleAvatar(
                      backgroundColor: Colors.blueAccent.withOpacity(0.2),
                      radius: 28,
                      child: Icon(cred['icon'] as IconData, color: Colors.blueAccent, size: 28),
                    ),
                    title: Text(
                      cred['name'] as String,
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(cred['issuer'] as String, style: TextStyle(color: Colors.white.withOpacity(0.7))),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isVerified ? Colors.green.withOpacity(0.2) : Colors.yellow.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(isVerified ? Icons.verified : Icons.hourglass_empty, 
                                   color: isVerified ? Colors.greenAccent : Colors.yellowAccent, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                cred['status'] as String,
                                style: TextStyle(
                                  color: isVerified ? Colors.greenAccent : Colors.yellowAccent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
