import Foundation

struct Event: Codable, Identifiable {
    let id: String
    let created_at: String
    let title: String
    let cover_photo_url: String?
    let invite_details: String?
    let end_at: Date?
    let reveal_at: Date?
    let admin_id: String
    let short_code: String
    let aesthetic_filter: String?
    let max_guests: Int?
    let max_photos_per_user: Int?
}
