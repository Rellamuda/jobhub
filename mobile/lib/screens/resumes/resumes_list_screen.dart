import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/resume_service.dart';
import '../../config/api_config.dart';
import 'resume_builder_screen.dart';

class ResumesListScreen extends StatefulWidget {
  const ResumesListScreen({super.key});

  @override
  State<ResumesListScreen> createState() => _ResumesListScreenState();
}

class _ResumesListScreenState extends State<ResumesListScreen> {
  final ResumeService _resumeService = ResumeService();
  List<dynamic> _resumes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadResumes();
  }

  Future<void> _loadResumes() async {
    try {
      final data = await _resumeService.getResumes();
      if (mounted) {
        setState(() {
          _resumes = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _download(String id, String format) async {
    try {
      final token = await ApiConfig.getToken();
      final url = '${ApiConfig.baseUrl}/resumes/$id/export/$format${token != null ? '?token=$token' : ''}';
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not launch downloader');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  void _share(Map<String, dynamic> resume) async {
    try {
      final id = resume['id'];
      final title = resume['title'] ?? 'Resume';
      final token = await ApiConfig.getToken();
      final link = '${ApiConfig.baseUrl}/resumes/$id/export/pdf${token != null ? '?token=$token' : ''}';
      final text = 'View & Download verified Resume / Capability Profile ($title) on JobHub:\n$link';
      final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(text)}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        Clipboard.setData(ClipboardData(text: text));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Resume download link copied to clipboard!')),
          );
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Saved Resumes & Documents', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00F0FF)))
          : _resumes.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.description_outlined, size: 64, color: Colors.white30),
                        const SizedBox(height: 16),
                        const Text(
                          'No saved resumes found yet',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Tap below to automatically generate an executive resume from your profile!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white60, fontSize: 13),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () async {
                            final res = await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ResumeBuilderScreen()),
                            );
                            if (res == true) _loadResumes();
                          },
                          icon: const Icon(Icons.auto_awesome, color: Colors.black, size: 18),
                          label: const Text('Build My AI Resume', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00F0FF),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _resumes.length,
                  itemBuilder: (context, index) {
                    final resume = _resumes[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6366F1).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.description, color: Color(0xFF00F0FF), size: 24),
                        ),
                        title: Text(
                          resume['title'] ?? 'Executive Resume',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(
                            resume['summary'] ?? 'Prepared with JobHub Global verified skills',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white60, fontSize: 12),
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.picture_as_pdf, color: Color(0xFF00F0FF), size: 20),
                              tooltip: 'Download PDF',
                              onPressed: () => _download(resume['id'], 'pdf'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.description, color: Color(0xFFC084FC), size: 20),
                              tooltip: 'Download DOC',
                              onPressed: () => _download(resume['id'], 'word'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.share, color: Colors.white70, size: 20),
                              tooltip: 'Share Resume',
                              onPressed: () => _share(resume),
                            ),
                          ],
                        ),
                        onTap: () async {
                          final res = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ResumeBuilderScreen(initialData: resume),
                            ),
                          );
                          if (res == true) _loadResumes();
                        },
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF00F0FF),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('Create New', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () async {
          final res = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ResumeBuilderScreen()),
          );
          if (res == true) _loadResumes();
        },
      ),
    );
  }
}
