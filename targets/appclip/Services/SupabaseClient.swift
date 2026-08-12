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
        let isUUID = code.count == 36
        let endpoint = isUUID ? "/rest/v1/events?id=eq.\(code)&select=*" : "/rest/v1/events?short_code=eq.\(code.lowercased())&select=*"
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
    
    func fetchPhotos(for eventId: String, completion: @escaping (Result<[Photo], Error>) -> Void) {
        let endpoint = "/rest/v1/photos?event_id=eq.\(eventId)&order=created_at.desc"
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
                let photos = try self.decoder.decode([Photo].self, from: data)
                completion(.success(photos))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func uploadPhoto(data: Data, eventId: String, guestName: String, completion: @escaping (Result<String, Error>) -> Void) {
        let fileName = "\(eventId)/\(Int(Date().timeIntervalSince1970))_\(UUID().uuidString.prefix(6)).jpg"
        let endpoint = "/storage/v1/object/event-photos/\(fileName)"
        
        var request = makeRequest(endpoint: endpoint, method: "POST", body: data)
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        
        session.dataTask(with: request) { responseData, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                completion(.failure(NSError(domain: "SupabaseClient", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Upload failed"])))
                return
            }
            
            // Construct the public URL
            let publicUrl = "\(Config.supabaseUrl)/storage/v1/object/public/event-photos/\(fileName)"
            
            // Insert into the database
            self.insertPhotoRecord(eventId: eventId, guestName: guestName, storagePath: publicUrl) { result in
                switch result {
                case .success():
                    completion(.success(publicUrl))
                case .failure(let error):
                    completion(.failure(error))
                }
            }
        }.resume()
    }
    
    private func insertPhotoRecord(eventId: String, guestName: String, storagePath: String, completion: @escaping (Result<Void, Error>) -> Void) {
        let endpoint = "/rest/v1/photos"
        let bodyDict: [String: Any] = [
            "event_id": eventId,
            "guest_name": guestName,
            "storage_path": storagePath,
            "media_type": "image"
        ]
        
        do {
            let bodyData = try JSONSerialization.data(withJSONObject: bodyDict, options: [])
            let request = makeRequest(endpoint: endpoint, method: "POST", body: bodyData)
            
            session.dataTask(with: request) { data, response, error in
                if let error = error {
                    completion(.failure(error))
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                    completion(.failure(NSError(domain: "SupabaseClient", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Database insert failed"])))
                    return
                }
                
                completion(.success(()))
            }.resume()
        } catch {
            completion(.failure(error))
        }
    }
}
