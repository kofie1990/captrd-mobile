import Foundation

struct Photo: Codable, Identifiable {
    let id: String
    let created_at: String
    let event_id: String
    let file_url: String
    let guest_name: String
    let uploader_id: String
    let is_video: Bool
}
