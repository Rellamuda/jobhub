import 'package:flutter/material.dart';
import '../../services/resume_service.dart';
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

  void _exportPdf(String id) async {
    try {
      await _resumeService.exportPdf(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('📄 PDF Exported and saved successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to export PDF.')),
        );
      }
    }
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
                            resume['summary'] ?? 'Prepared with JobHub AI verified skills',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white60, fontSize: 12),
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.picture_as_pdf, color: Color(0xFF00F0FF)),
                              tooltip: 'Download PDF',
                              onPressed: () => _exportPdf(resume['id']),
                            ),
                            const Icon(Icons.chevron_right, color: Colors.white30),
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
