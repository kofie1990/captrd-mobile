import Foundation
import ActivityKit

struct CaptrdLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var eventName: String
        var picturesLeft: Int
        var lastImageUrl: String?
    }
}

class LiveActivityManager {
    static let shared = LiveActivityManager()
    
    private var currentActivity: Activity<CaptrdLiveActivityAttributes>?
    
    private init() {}
    
    func startActivity(eventName: String, picturesLeft: Int) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        
        let attributes = CaptrdLiveActivityAttributes()
        let initialContentState = CaptrdLiveActivityAttributes.ContentState(
            eventName: eventName,
            picturesLeft: picturesLeft,
            lastImageUrl: nil
        )
        
        do {
            if #available(iOS 16.2, *) {
                let activityContent = ActivityContent(state: initialContentState, staleDate: nil)
                currentActivity = try Activity.request(attributes: attributes, content: activityContent)
            } else {
                currentActivity = try Activity.request(attributes: attributes, contentState: initialContentState, pushType: nil)
            }
        } catch {
            print("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    func updateActivity(eventName: String, picturesLeft: Int, lastImageUrl: String? = nil) {
        guard let activity = currentActivity else {
            // Start it if it wasn't started yet
            startActivity(eventName: eventName, picturesLeft: picturesLeft)
            return
        }
        
        let updatedContentState = CaptrdLiveActivityAttributes.ContentState(
            eventName: eventName,
            picturesLeft: picturesLeft,
            lastImageUrl: lastImageUrl
        )
        
        Task {
            if #available(iOS 16.2, *) {
                let activityContent = ActivityContent(state: updatedContentState, staleDate: nil)
                await activity.update(activityContent)
            } else {
                await activity.update(using: updatedContentState)
            }
            
            if picturesLeft <= 0 {
                endActivity(eventName: eventName, picturesLeft: 0, lastImageUrl: lastImageUrl)
            }
        }
    }
    
    func endActivity(eventName: String, picturesLeft: Int, lastImageUrl: String? = nil) {
        guard let activity = currentActivity else { return }
        
        let finalContentState = CaptrdLiveActivityAttributes.ContentState(
            eventName: eventName,
            picturesLeft: picturesLeft,
            lastImageUrl: lastImageUrl
        )
        
        Task {
            if #available(iOS 16.2, *) {
                let activityContent = ActivityContent(state: finalContentState, staleDate: nil)
                await activity.end(activityContent, dismissalPolicy: .default)
            } else {
                await activity.end(using: finalContentState, dismissalPolicy: .default)
            }
            currentActivity = nil
        }
    }
}
