import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ResumeService {
  String get baseUrl => ApiConfig.baseUrl;

  Future<String?> _getToken() async {
    return ApiConfig.getToken();
  }

  Future<List<dynamic>> getResumes() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/resumes'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load resumes');
  }

  Future<Map<String, dynamic>> parseResume(String filePath) async {
    final token = await _getToken();
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/resumes/parse'));
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.files.add(await http.MultipartFile.fromPath('file', filePath));
    
    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode == 201 || response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to parse resume');
  }

  Future<void> exportPdf(String id) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/resumes/$id/export/pdf'),
      headers: {
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      // PDF Buffer received successfully
      print("PDF Exported successfully. Size: ${response.bodyBytes.length} bytes.");
    } else {
      throw Exception('Failed to export PDF');
    }
  }
}
