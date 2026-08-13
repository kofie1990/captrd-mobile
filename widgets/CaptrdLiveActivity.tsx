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
        spacing={12}
      >
        <HStack alignment="center">
          <Image
            assetName="logo"
            size={18}
            color="#FFFFFF"
          />
          <Spacer minLength={6} />
          <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', size: 14 })]}>
            Captrd
          </Text>
          <Spacer />
        </HStack>
        <HStack alignment="center">
          <VStack alignment="leading">
            <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', size: 18 })]}>
              {props.eventName || 'Captrd Roll'}
            </Text>
            <Text modifiers={[foregroundStyle('#AAAAAA'), font({ size: 14 })]}>
              {String(props.picturesLeft)} pictures left
            </Text>
          </VStack>

          <Spacer />

          <Image
            systemName="camera.circle.fill"
            size={36}
            color="#FFFFFF"
          />
        </HStack>
      </VStack>
    ),
    compactLeading: <Image assetName="logo" color="#FFFFFF" />,
    compactTrailing: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{String(props.picturesLeft)} left</Text>,
    minimal: <Image assetName="logo" color="#FFFFFF" />,
    expandedLeading: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{props.eventName || 'Captrd'}</Text>,
    expandedTrailing: <Text modifiers={[foregroundStyle('#FFFFFF')]}>{String(props.picturesLeft)} left</Text>,
    expandedBottom: (
      <HStack alignment="center">
        <Spacer />
        <Image systemName="camera.circle.fill" size={32} color="#FFFFFF" />
        <Spacer />
      </HStack>
    )
  };
};

export default createLiveActivity('CaptrdLiveActivity', CaptrdLiveActivity);
