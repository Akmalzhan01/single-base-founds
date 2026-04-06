import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { C } from '../../config/colors';

export default function Spinner({ size = 'large', style }) {
  return (
    <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, style]}>
      <ActivityIndicator size={size} color={C.primary} />
    </View>
  );
}
