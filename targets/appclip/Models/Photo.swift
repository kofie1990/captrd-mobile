import Foundation

struct Photo: Codable, Identifiable {
    let id: String
    let created_at: String
    let event_id: String
    let storage_path: String
    let guest_name: String
    let user_id: String?
    let media_type: String
}
