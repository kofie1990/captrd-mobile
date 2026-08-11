import Foundation

class LocalStorage {
    static let shared = LocalStorage()
    
    private let defaults: UserDefaults
    
    private init() {
        self.defaults = UserDefaults(suiteName: Config.appGroup) ?? UserDefaults.standard
    }
    
    func saveGuestName(_ name: String, for eventId: String) {
        defaults.set(name, forKey: "captrd_guest_\(eventId)")
    }
    
    func getGuestName(for eventId: String) -> String? {
        return defaults.string(forKey: "captrd_guest_\(eventId)")
    }
    
    // In SwiftUI App Clip, we don't have the user's Supabase auth session,
    // but the React Native app might have saved an anonymous guest session token
    // in the app group if they installed the app later. 
    // For the clip, we rely solely on the guest name for now.
}
