import Foundation

class SupabaseClient {
    static let shared = SupabaseClient()
    
    private let session = URLSession.shared
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    private init() {
        decoder = JSONDecoder()
        
        // Supabase returns timestamps with timezone
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            if let date = formatter.date(from: dateString) {
                return date
            }
            // Fallback for missing fractional seconds
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
            if let date = formatter.date(from: dateString) {
                return date
            }
            // If it's completely missing, or we can't parse it, return current date or throw
            return Date()
        }
        
        encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
    }
    
    private func makeRequest(endpoint: String, method: String = "GET", body: Data? = nil) -> URLRequest {
        let url = URL(string: "\(Config.supabaseUrl)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(Config.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        if let _ = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        request.httpBody = body
        return request
    }
    
    func fetchEvent(by code: String, completion: @escaping (Result<Event, Error>) -> Void) {
        let endpoint = "/rest/v1/events?short_code=eq.\(code)&select=*"
        let request = makeRequest(endpoint: endpoint)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "SupabaseClient", code: 0, userInfo: [NSLocalizedDescriptionKey: "No data"])))
                return
            }
            
            do {
                let events = try self.decoder.decode([Event].self, from: data)
                if let event = events.first {
                    completion(.success(event))
                } else {
                    completion(.failure(NSError(domain: "SupabaseClient", code: 404, userInfo: [NSLocalizedDescriptionKey: "Event not found"])))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Additional methods for fetching photos, uploading photos, joining event
}
