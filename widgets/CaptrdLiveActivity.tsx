import { Text, VStack, HStack, Spacer, Image } from '@expo/ui/swift-ui';
import { createLiveActivity } from 'expo-widgets';
import { background, cornerRadius, padding, foregroundStyle, font } from '@expo/ui/swift-ui/modifiers';

type LiveActivityProps = {
  eventName: string;
  picturesLeft: number;
  lastImageUrl?: string;
};

const CaptrdLiveActivity = (props: LiveActivityProps) => {
  'widget';

  return {
    banner: (
      <VStack
        modifiers={[
          padding({ all: 16 }),
          background('#000000'),
          cornerRadius(24)
        ]}
      >
        <HStack alignment="center">
          {/* App Icon placeholder (SF Symbol for camera/aperture) */}
          <Image
            systemName="camera.aperture"
            size={24}
            color="#FFFFFF"
          />
          
          <Spacer minLength={8} />
          
          <VStack alignment="leading">
            <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', size: 16 })]}>
              {props.eventName || 'Captrd Roll'}
            </Text>
            <Text modifiers={[foregroundStyle('#AAAAAA'), font({ size: 14 })]}>
              {String(props.picturesLeft)} pictures left
            </Text>
          </VStack>

          <Spacer />

          <VStack alignment="trailing" spacing={4}>
            <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', size: 14 })]}>
              Tap to capture
            </Text>
            <Image
              systemName="chevron.right.circle.fill"
              size={20}
              color="#FFFFFF"
            />
          </VStack>
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="camera.aperture" color="#FFFFFF" />,
    compactTrailing: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{String(props.picturesLeft)} left</Text>,
    minimal: <Image systemName="camera.aperture" color="#FFFFFF" />,
    expandedLeading: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{props.eventName || 'Captrd'}</Text>,
    expandedTrailing: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{String(props.picturesLeft)} left</Text>,
    expandedBottom: (
      <Text modifiers={[foregroundStyle('#FFFFFF')]}>Tap to capture</Text>
    )
  };
};

export default createLiveActivity('CaptrdLiveActivity', CaptrdLiveActivity);
