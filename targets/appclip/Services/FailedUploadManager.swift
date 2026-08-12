import Foundation

struct FailedUpload: Codable, Identifiable {
    let id: String // The generated fileName or unique ID
    let uri: String // Local file path URI
    let fileName: String
    let eventId: String
    let guestName: String
    let timestamp: TimeInterval
}

class FailedUploadManager {
    static let shared = FailedUploadManager()
    private let defaults: UserDefaults
    private let key = "captrd_failed_uploads"
    
    private init() {
        self.defaults = UserDefaults(suiteName: Config.appGroup) ?? UserDefaults.standard
    }
    
    func getFailedUploads() -> [FailedUpload] {
        guard let data = defaults.data(forKey: key) else { return [] }
        do {
            return try JSONDecoder().decode([FailedUpload].self, from: data)
        } catch {
            print("Failed to decode uploads: \(error)")
            return []
        }
    }
    
    func getFailedUploads(for eventId: String) -> [FailedUpload] {
        return getFailedUploads().filter { $0.eventId == eventId }
    }
    
    func saveFailedUpload(image: Data, eventId: String, guestName: String) {
        let fileName = "\(eventId)/\(Int(Date().timeIntervalSince1970))_\(UUID().uuidString.prefix(6)).jpg"
        let tempDir = FileManager.default.temporaryDirectory
        let safeName = fileName.replacingOccurrences(of: "/", with: "_")
        let fileURL = tempDir.appendingPathComponent(safeName)
        
        do {
            try image.write(to: fileURL)
            
            let upload = FailedUpload(
                id: fileName,
                uri: fileURL.path,
                fileName: fileName,
                eventId: eventId,
                guestName: guestName,
                timestamp: Date().timeIntervalSince1970
            )
            
            var uploads = getFailedUploads()
            uploads.append(upload)
            
            let data = try JSONEncoder().encode(uploads)
            defaults.set(data, forKey: key)
        } catch {
            print("Failed to save upload image or metadata: \(error)")
        }
    }
    
    func deleteFailedUpload(id: String) {
        var uploads = getFailedUploads()
        
        if let index = uploads.firstIndex(where: { $0.id == id }) {
            let target = uploads[index]
            
            // Delete the local file
            if FileManager.default.fileExists(atPath: target.uri) {
                try? FileManager.default.removeItem(atPath: target.uri)
            }
            
            uploads.remove(at: index)
            
            if let data = try? JSONEncoder().encode(uploads) {
                defaults.set(data, forKey: key)
            }
        }
    }
}
