import { Text, VStack, HStack, Spacer, Image } from '@expo/ui/swift-ui';
import { createLiveActivity } from 'expo-widgets';
import { background, cornerRadius, padding, foregroundStyle, font, widgetURL } from '@expo/ui/swift-ui/modifiers';

type LiveActivityProps = {
  eventName: string;
  picturesLeft: number;
  lastImageUrl?: string;
  eventId?: string;
};

const CaptrdLiveActivity = (props: LiveActivityProps) => {
  'widget';

  return {
    banner: (
      <VStack
        modifiers={[
          padding({ all: 16 }),
          background('#000000'),
          cornerRadius(32),
          widgetURL(`captrd://event/${props.eventId || 'current'}`)
        ]}
      >
        <HStack alignment="center" spacing={16}>
          {/* Main Logo & Event Info */}
          <HStack alignment="center" spacing={16}>
            <Image
              assetName="logo"
              size={24}
              color="#FFFFFF"
            />
            
            <VStack alignment="leading" spacing={2}>
              <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', size: 18, design: 'serif' })]}>
                {props.eventName || 'Captrd'}
              </Text>
              <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'regular', size: 14, design: 'serif' })]}>
                {String(props.picturesLeft)} photos left
              </Text>
            </VStack>
          </HStack>

          <Spacer />

          {/* Minimalist Shutter Button */}
          <VStack
             alignment="center"
             modifiers={[
               padding({ all: 10 }),
               background('#FFFFFF'),
               cornerRadius(32)
             ]}
          >
             <Image
               systemName="camera.fill"
               size={20}
               color="#000000"
             />
          </VStack>
        </HStack>
      </VStack>
    ),
    compactLeading: <Image assetName="logo" color="#FFFFFF" />,
    compactTrailing: <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', design: 'serif' })]}>{String(props.picturesLeft)}</Text>,
    minimal: <Image assetName="logo" color="#FFFFFF" />,
    expandedLeading: (
      <HStack alignment="center" spacing={6}>
        <Image assetName="logo" color="#FFFFFF" size={16} />
        <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'bold', design: 'serif' })]}>{props.eventName || 'Captrd'}</Text>
      </HStack>
    ),
    expandedTrailing: <Text modifiers={[foregroundStyle('#FFFFFF'), font({ weight: 'regular', design: 'serif' })]}>{String(props.picturesLeft)} left</Text>,
    expandedBottom: (
      <HStack alignment="center" modifiers={[padding({ top: 12 }), widgetURL(`captrd://event/${props.eventId || 'current'}`)]}>
        <Spacer />
        <VStack
           alignment="center"
           modifiers={[
             padding({ horizontal: 32, vertical: 14 }),
             background('#FFFFFF'),
             cornerRadius(40)
           ]}
        >
          <HStack alignment="center" spacing={10}>
             <Image systemName="camera.fill" size={20} color="#000000" />
             <Text modifiers={[foregroundStyle('#000000'), font({ weight: 'bold', size: 16, design: 'serif' })]}>Capture</Text>
          </HStack>
        </VStack>
        <Spacer />
      </HStack>
    )
  };
};

export default createLiveActivity('CaptrdLiveActivity', CaptrdLiveActivity);
