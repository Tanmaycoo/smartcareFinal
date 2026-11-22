import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  final StorageService _storage;
  final http.Client _httpClient;

  ApiClient(this._storage, [http.Client? client])
      : _httpClient = client ?? http.Client();

  String get _baseUrl {
    final custom = _storage.getCustomApiHost();
    if (custom != null && custom.isNotEmpty) {
      return custom.endsWith('/api') ? custom : '$custom/api';
    }
    return AppConfig.baseUrl;
  }

  Map<String, String> _buildHeaders({bool requiresAuth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      final token = _storage.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<dynamic> get(
    String endpoint, {
    Map<String, String>? queryParams,
    bool requiresAuth = false,
  }) async {
    try {
      var uri = Uri.parse('$_baseUrl$endpoint');
      if (queryParams != null && queryParams.isNotEmpty) {
        // filter out null values
        final cleanedParams = Map<String, String>.fromEntries(
          queryParams.entries.where((e) => e.value.isNotEmpty),
        );
        uri = uri.replace(queryParameters: cleanedParams);
      }

      final response = await _httpClient
          .get(uri, headers: _buildHeaders(requiresAuth: requiresAuth))
          .timeout(AppConfig.connectTimeout);

      return _handleResponse(response);
    } on SocketException catch (_) {
      throw ApiException(
        'Unable to connect to SmartCare server. Please check your network connection.',
      );
    } on TimeoutException catch (_) {
      throw ApiException('Connection timed out. The server is not responding.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Unexpected network error: $e');
    }
  }

  Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final response = await _httpClient
          .post(
            uri,
            headers: _buildHeaders(requiresAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConfig.connectTimeout);

      return _handleResponse(response);
    } on SocketException catch (_) {
      throw ApiException(
        'Unable to connect to SmartCare server. Please check your Wi-Fi or network.',
      );
    } on TimeoutException catch (_) {
      throw ApiException('Connection timed out. The server took too long to respond.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Unexpected network error: $e');
    }
  }

  Future<dynamic> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final response = await _httpClient
          .patch(
            uri,
            headers: _buildHeaders(requiresAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConfig.connectTimeout);

      return _handleResponse(response);
    } on SocketException catch (_) {
      throw ApiException(
        'Unable to connect to SmartCare server. Please check your Wi-Fi or network.',
      );
    } on TimeoutException catch (_) {
      throw ApiException('Connection timed out. The server took too long to respond.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Unexpected network error: $e');
    }
  }

  Future<dynamic> delete(
    String endpoint, {
    bool requiresAuth = false,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final response = await _httpClient
          .delete(
            uri,
            headers: _buildHeaders(requiresAuth: requiresAuth),
          )
          .timeout(AppConfig.connectTimeout);

      return _handleResponse(response);
    } on SocketException catch (_) {
      throw ApiException('Unable to connect to server.');
    } on TimeoutException catch (_) {
      throw ApiException('Connection timed out.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  dynamic _handleResponse(http.Response response) {
    dynamic jsonBody;
    try {
      if (response.body.isNotEmpty) {
        jsonBody = jsonDecode(response.body);
      }
    } catch (_) {
      jsonBody = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonBody;
    }

    String errorMessage = 'Request failed with status: ${response.statusCode}';
    if (jsonBody is Map<String, dynamic>) {
      if (jsonBody['detail'] != null) {
        if (jsonBody['detail'] is String) {
          errorMessage = jsonBody['detail'];
        } else if (jsonBody['detail'] is List) {
          final list = jsonBody['detail'] as List;
          if (list.isNotEmpty && list.first is Map && list.first['msg'] != null) {
            errorMessage = list.first['msg'].toString();
          } else {
            errorMessage = list.toString();
          }
        }
      } else if (jsonBody['message'] != null) {
        errorMessage = jsonBody['message'].toString();
      }
    }

    throw ApiException(errorMessage, statusCode: response.statusCode);
  }
}
