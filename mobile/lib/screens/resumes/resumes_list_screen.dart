import 'package:flutter/material.dart';
import '../services/resume_service.dart';
import 'resume_builder_screen.dart';

class ResumesListScreen extends StatefulWidget {
  @override
  _ResumesListScreenState createState() => _ResumesListScreenState();
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
      setState(() {
        _resumes = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Handle error visually in a real app
    }
  }

  void _exportPdf(String id) async {
    try {
      await _resumeService.exportPdf(id);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('PDF Exported successfully!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to export PDF')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Resumes'),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator())
        : _resumes.isEmpty
          ? Center(child: Text('No resumes found. Create one!'))
          : ListView.builder(
              itemCount: _resumes.length,
              itemBuilder: (context, index) {
                final resume = _resumes[index];
                return ListTile(
                  leading: Icon(Icons.description),
                  title: Text(resume['title'] ?? 'Untitled'),
                  subtitle: Text(resume['summary'] ?? ''),
                  trailing: IconButton(
                    icon: Icon(Icons.picture_as_pdf),
                    onPressed: () => _exportPdf(resume['id']),
                  ),
                  onTap: () {
                    // Navigate to builder (not implemented here)
                  },
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // In a real app, show bottom sheet with options: Upload PDF or Create Blank
          Navigator.push(context, MaterialPageRoute(builder: (_) => ResumeBuilderScreen()));
        },
        child: Icon(Icons.add),
      ),
    );
  }
}
